import * as THREE from 'three';
import type { GroupInfo, ScreenshotItem } from './types';

export type GroupSelectionChangeHandler = (groupId: string, selected: boolean) => void;
export type DistanceChangeHandler = (distance: number) => void;
export type ExplodeHandler = () => void;
export type ResetHandler = () => void;
export type ScreenshotRequestHandler = () => string | null;
export type FileUploadHandler = (file: File) => void;

export class UIController {
  private uploadZone: HTMLElement;
  private fileInput: HTMLInputElement;
  private groupList: HTMLElement;
  private distanceSlider: HTMLInputElement;
  private distanceValue: HTMLElement;
  private explodeBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private screenshotBtn: HTMLButtonElement;
  private screenshotsGrid: HTMLElement;
  private loadingOverlay: HTMLElement;
  private panel: HTMLElement;
  private dragHandle: HTMLElement;

  private groups: GroupInfo[] = [];
  private screenshots: ScreenshotItem[] = [];
  private infoPopup: HTMLElement | null = null;
  private currentHighlightMesh: THREE.Mesh | null = null;
  private highlightTimeout: number | null = null;

  private onGroupSelectionChange?: GroupSelectionChangeHandler;
  private onDistanceChange?: DistanceChangeHandler;
  private onExplode?: ExplodeHandler;
  private onReset?: ResetHandler;
  private onScreenshotRequest?: ScreenshotRequestHandler;
  private onFileUpload?: FileUploadHandler;

  constructor() {
    this.uploadZone = document.getElementById('uploadZone') as HTMLElement;
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.groupList = document.getElementById('groupList') as HTMLElement;
    this.distanceSlider = document.getElementById('distanceSlider') as HTMLInputElement;
    this.distanceValue = document.getElementById('distanceValue') as HTMLElement;
    this.explodeBtn = document.getElementById('explodeBtn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
    this.screenshotBtn = document.getElementById('screenshotBtn') as HTMLButtonElement;
    this.screenshotsGrid = document.getElementById('screenshotsGrid') as HTMLElement;
    this.loadingOverlay = document.getElementById('loading') as HTMLElement;
    this.panel = document.getElementById('panel') as HTMLElement;
    this.dragHandle = document.getElementById('drag-handle') as HTMLElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.uploadZone.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && this.onFileUpload) {
        this.onFileUpload(file);
      }
      target.value = '';
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      this.uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.uploadZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      this.uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.uploadZone.classList.remove('drag-over');
      });
    });

    this.uploadZone.addEventListener('drop', (e) => {
      const files = (e as DragEvent).dataTransfer?.files;
      if (files && files.length > 0 && this.onFileUpload) {
        this.onFileUpload(files[0]);
      }
    });

    this.distanceSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.distanceValue.textContent = value.toFixed(1);
      if (this.onDistanceChange) {
        this.onDistanceChange(value);
      }
    });

    this.explodeBtn.addEventListener('click', () => {
      if (this.onExplode) this.onExplode();
    });

    this.resetBtn.addEventListener('click', () => {
      if (this.onReset) this.onReset();
    });

    this.screenshotBtn.addEventListener('click', () => this.takeScreenshot());

    this.dragHandle.addEventListener('click', () => {
      this.panel.classList.toggle('expanded');
    });

    document.addEventListener('click', (e) => {
      if (this.infoPopup && !this.infoPopup.contains(e.target as Node)) {
        this.hideInfoPopup();
      }
    });
  }

  setHandlers(handlers: {
    onGroupSelectionChange?: GroupSelectionChangeHandler;
    onDistanceChange?: DistanceChangeHandler;
    onExplode?: ExplodeHandler;
    onReset?: ResetHandler;
    onScreenshotRequest?: ScreenshotRequestHandler;
    onFileUpload?: FileUploadHandler;
  }): void {
    this.onGroupSelectionChange = handlers.onGroupSelectionChange;
    this.onDistanceChange = handlers.onDistanceChange;
    this.onExplode = handlers.onExplode;
    this.onReset = handlers.onReset;
    this.onScreenshotRequest = handlers.onScreenshotRequest;
    this.onFileUpload = handlers.onFileUpload;
  }

  showLoading(): void {
    this.loadingOverlay.classList.add('active');
  }

  hideLoading(): void {
    this.loadingOverlay.classList.remove('active');
  }

  setGroups(groups: GroupInfo[]): void {
    this.groups = groups;
    this.renderGroupList();
    this.explodeBtn.disabled = groups.length === 0;
    this.screenshotBtn.disabled = groups.length === 0;
    this.resetBtn.disabled = true;
  }

  private renderGroupList(): void {
    if (this.groups.length === 0) {
      this.groupList.innerHTML = '<div class="group-list-empty">请先加载模型文件</div>';
      return;
    }

    this.groupList.innerHTML = '';
    this.groups.forEach((group) => {
      const item = document.createElement('div');
      item.className = 'group-item';
      item.dataset.groupId = group.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'group-checkbox';
      checkbox.checked = group.selected;
      checkbox.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        group.selected = checked;
        if (this.onGroupSelectionChange) {
          this.onGroupSelectionChange(group.id, checked);
        }
      });

      const colorBox = document.createElement('div');
      colorBox.className = 'group-color';
      colorBox.style.backgroundColor = group.color;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'group-name';
      nameSpan.textContent = group.name;
      nameSpan.title = group.name;

      item.appendChild(checkbox);
      item.appendChild(colorBox);
      item.appendChild(nameSpan);
      this.groupList.appendChild(item);
    });
  }

  setExplodedState(exploded: boolean): void {
    this.explodeBtn.disabled = exploded;
    this.resetBtn.disabled = !exploded;
  }

  takeScreenshot(): void {
    if (!this.onScreenshotRequest) return;
    const dataUrl = this.onScreenshotRequest();
    if (!dataUrl) return;

    const screenshot: ScreenshotItem = {
      id: Math.random().toString(36).substring(2, 11),
      dataUrl,
      timestamp: Date.now()
    };

    this.screenshots.unshift(screenshot);
    if (this.screenshots.length > 3) {
      this.screenshots = this.screenshots.slice(0, 3);
    }

    this.renderScreenshots();
    this.downloadScreenshot(dataUrl);
  }

  private renderScreenshots(): void {
    this.screenshotsGrid.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const item = document.createElement('div');
      item.className = 'screenshot-item';

      if (this.screenshots[i]) {
        const img = document.createElement('img');
        img.src = this.screenshots[i].dataUrl;
        img.alt = `Screenshot ${i + 1}`;
        img.addEventListener('click', () => {
          this.downloadScreenshot(this.screenshots[i].dataUrl);
        });
        item.appendChild(img);
      } else {
        const empty = document.createElement('div');
        empty.className = 'screenshot-empty';
        empty.textContent = '+';
        item.appendChild(empty);
      }

      this.screenshotsGrid.appendChild(item);
    }
  }

  private downloadScreenshot(dataUrl: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `explosion-view-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  showInfoPopup(group: GroupInfo, screenX: number, screenY: number): void {
    this.hideInfoPopup();

    const popup = document.createElement('div');
    popup.className = 'info-popup';

    const title = document.createElement('div');
    title.className = 'info-popup-title';
    title.textContent = group.name;

    const verticesRow = document.createElement('div');
    verticesRow.className = 'info-popup-row';
    verticesRow.innerHTML = `<span>顶点数</span><span class="info-popup-value">${group.vertexCount.toLocaleString()}</span>`;

    const facesRow = document.createElement('div');
    facesRow.className = 'info-popup-row';
    facesRow.innerHTML = `<span>面数</span><span class="info-popup-value">${group.faceCount.toLocaleString()}</span>`;

    popup.appendChild(title);
    popup.appendChild(verticesRow);
    popup.appendChild(facesRow);

    document.body.appendChild(popup);

    const popupRect = popup.getBoundingClientRect();
    let left = screenX + 15;
    let top = screenY + 15;

    if (left + popupRect.width > window.innerWidth) {
      left = screenX - popupRect.width - 15;
    }
    if (top + popupRect.height > window.innerHeight) {
      top = screenY - popupRect.height - 15;
    }

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    this.infoPopup = popup;
  }

  hideInfoPopup(): void {
    if (this.infoPopup) {
      this.infoPopup.remove();
      this.infoPopup = null;
    }
  }

  highlightMesh(mesh: THREE.Mesh): void {
    if (this.highlightTimeout) {
      window.clearTimeout(this.highlightTimeout);
      this.restoreMeshMaterial();
    }

    const material = mesh.material;
    const materials: THREE.MeshStandardMaterial[] = [];

    if (Array.isArray(material)) {
      material.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshBasicMaterial || m instanceof THREE.MeshPhongMaterial) {
          materials.push(m as THREE.MeshStandardMaterial);
        }
      });
    } else if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshPhongMaterial) {
      materials.push(material as THREE.MeshStandardMaterial);
    }

    materials.forEach((mat) => {
      (mat as THREE.MeshStandardMaterial).userData._originalEmissive = mat.emissive?.clone() || new THREE.Color(0x000000);
      (mat as THREE.MeshStandardMaterial).userData._originalEmissiveIntensity = (mat as THREE.MeshStandardMaterial).emissiveIntensity || 0;
      if (mat.emissive) {
        mat.emissive.setHex(0xffd700);
      }
      (mat as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
      mat.needsUpdate = true;
    });

    this.currentHighlightMesh = mesh;

    this.highlightTimeout = window.setTimeout(() => {
      this.restoreMeshMaterial();
    }, 2000);
  }

  private restoreMeshMaterial(): void {
    if (!this.currentHighlightMesh) return;

    const material = this.currentHighlightMesh.material;
    const materials: THREE.MeshStandardMaterial[] = [];

    if (Array.isArray(material)) {
      material.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshBasicMaterial || m instanceof THREE.MeshPhongMaterial) {
          materials.push(m as THREE.MeshStandardMaterial);
        }
      });
    } else if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshPhongMaterial) {
      materials.push(material as THREE.MeshStandardMaterial);
    }

    materials.forEach((mat) => {
      if (mat.userData._originalEmissive !== undefined && mat.emissive) {
        mat.emissive.copy(mat.userData._originalEmissive);
        (mat as THREE.MeshStandardMaterial).emissiveIntensity = mat.userData._originalEmissiveIntensity || 0;
        delete mat.userData._originalEmissive;
        delete mat.userData._originalEmissiveIntensity;
        mat.needsUpdate = true;
      }
    });

    this.currentHighlightMesh = null;
    this.highlightTimeout = null;
  }

  getDistance(): number {
    return parseFloat(this.distanceSlider.value);
  }
}
