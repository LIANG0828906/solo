import { MoleculeRenderer } from './renderer';
import { MoleculeParser, MoleculeData, PRESET_MOLECULES } from './moleculeParser';

export interface ControlsOptions {
  renderer: MoleculeRenderer;
  parser: MoleculeParser;
  onMoleculeLoad: (data: MoleculeData) => void;
}

export class UIControls {
  private renderer: MoleculeRenderer;
  private parser: MoleculeParser;
  private onMoleculeLoad: (data: MoleculeData) => void;
  
  private controlPanel: HTMLElement;
  private resetBtn: HTMLElement;
  private themeBtn: HTMLElement;
  private moleculeSelect: HTMLSelectElement;
  private fileInput: HTMLInputElement;
  private uploadProgress: HTMLElement;
  private progressBar: HTMLElement;
  private loadingOverlay: HTMLElement;
  
  private isDraggingPanel: boolean = false;
  private panelOffset: { x: number; y: number } = { x: 0, y: 0 };
  private panelVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private currentInfoCard: HTMLElement | null = null;

  constructor(options: ControlsOptions) {
    this.renderer = options.renderer;
    this.parser = options.parser;
    this.onMoleculeLoad = options.onMoleculeLoad;

    this.controlPanel = document.getElementById('control-panel')!;
    this.resetBtn = document.getElementById('reset-btn')!;
    this.themeBtn = document.getElementById('theme-btn')!;
    this.moleculeSelect = document.getElementById('molecule-select') as HTMLSelectElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.uploadProgress = document.getElementById('upload-progress')!;
    this.progressBar = document.getElementById('progress-bar')!;
    this.loadingOverlay = document.getElementById('loading')!;

    this.setupEventListeners();
    this.setupPanelDragging();
  }

  private setupEventListeners(): void {
    this.resetBtn.addEventListener('click', () => {
      this.renderer.resetCamera();
    });

    this.themeBtn.addEventListener('click', () => {
      this.renderer.toggleTheme();
    });

    this.moleculeSelect.addEventListener('change', async (e) => {
      const value = (e.target as HTMLSelectElement).value;
      
      if (value === 'upload') {
        this.fileInput.click();
      } else {
        const data = this.parser.getPresetMolecule(value);
        this.showLoading();
        setTimeout(() => {
          this.onMoleculeLoad(data);
          this.hideLoading();
        }, 800);
      }
    });

    this.fileInput.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await this.uploadFile(file);
      }
      this.fileInput.value = '';
    });
  }

  private setupPanelDragging(): void {
    this.controlPanel.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.tagName === 'OPTION') {
        return;
      }
      
      this.isDraggingPanel = true;
      this.panelOffset = {
        x: e.clientX - this.controlPanel.getBoundingClientRect().left,
        y: e.clientY - this.controlPanel.getBoundingClientRect().top
      };
      this.panelVelocity = { x: 0, y: 0 };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingPanel) return;

      const newLeft = e.clientX - this.panelOffset.x;
      const newTop = e.clientY - this.panelOffset.y;

      const maxLeft = window.innerWidth - this.controlPanel.offsetWidth;
      const maxTop = window.innerHeight - this.controlPanel.offsetHeight;

      const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
      const clampedTop = Math.max(0, Math.min(newTop, maxTop));

      const currentLeft = parseFloat(this.controlPanel.style.left) || this.controlPanel.getBoundingClientRect().left;
      const currentTop = parseFloat(this.controlPanel.style.top) || this.controlPanel.getBoundingClientRect().top;

      this.panelVelocity = {
        x: clampedLeft - currentLeft,
        y: clampedTop - currentTop
      };

      this.controlPanel.style.left = `${clampedLeft}px`;
      this.controlPanel.style.top = `${clampedTop}px`;
      this.controlPanel.style.right = 'auto';
    });

    window.addEventListener('mouseup', () => {
      if (this.isDraggingPanel) {
        this.isDraggingPanel = false;
        this.animatePanelDeceleration();
      }
    });
  }

  private animatePanelDeceleration(): void {
    const decay = 0.92;
    const threshold = 0.5;

    const animate = () => {
      if (Math.abs(this.panelVelocity.x) < threshold && Math.abs(this.panelVelocity.y) < threshold) {
        return;
      }

      const currentLeft = parseFloat(this.controlPanel.style.left) || this.controlPanel.getBoundingClientRect().left;
      const currentTop = parseFloat(this.controlPanel.style.top) || this.controlPanel.getBoundingClientRect().top;

      const newLeft = currentLeft + this.panelVelocity.x;
      const newTop = currentTop + this.panelVelocity.y;

      const maxLeft = window.innerWidth - this.controlPanel.offsetWidth;
      const maxTop = window.innerHeight - this.controlPanel.offsetHeight;

      const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
      const clampedTop = Math.max(0, Math.min(newTop, maxTop));

      this.controlPanel.style.left = `${clampedLeft}px`;
      this.controlPanel.style.top = `${clampedTop}px`;

      this.panelVelocity.x *= decay;
      this.panelVelocity.y *= decay;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  private async uploadFile(file: File): Promise<void> {
    this.uploadProgress.classList.add('active');
    this.progressBar.style.width = '0%';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          this.progressBar.style.width = `${progress}%`;
        }
      });

      xhr.open('POST', '/api/upload');
      
      const response = await new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`上传失败: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.send(formData);
      });

      const result = JSON.parse(response);
      
      const moleculeData = await this.parser.loadFromFile(file);
      
      this.showLoading();
      setTimeout(() => {
        this.onMoleculeLoad(moleculeData);
        this.hideLoading();
        this.uploadProgress.classList.remove('active');
      }, 800);

    } catch (error) {
      console.error('上传失败，尝试本地解析:', error);
      
      try {
        const moleculeData = await this.parser.loadFromFile(file);
        this.showLoading();
        
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 5;
          this.progressBar.style.width = `${Math.min(progress, 100)}%`;
          if (progress >= 100) {
            clearInterval(progressInterval);
          }
        }, 50);

        setTimeout(() => {
          clearInterval(progressInterval);
          this.progressBar.style.width = '100%';
          this.onMoleculeLoad(moleculeData);
          this.hideLoading();
          setTimeout(() => {
            this.uploadProgress.classList.remove('active');
          }, 500);
        }, 800);
      } catch (parseError) {
        console.error('解析失败:', parseError);
        alert('文件解析失败，请检查JSON格式');
        this.uploadProgress.classList.remove('active');
      }
    }
  }

  public showLoading(): void {
    this.loadingOverlay.classList.remove('hidden');
  }

  public hideLoading(): void {
    this.loadingOverlay.classList.add('hidden');
  }

  public showAtomInfo(atomData: any, event: MouseEvent, allAtoms: any[]): void {
    this.closeInfoCard();

    const card = document.createElement('div');
    card.className = 'info-card';
    
    const cardWidth = 300;
    const cardHeight = 200;
    let left = event.clientX + 20;
    let top = event.clientY + 20;

    if (left + cardWidth > window.innerWidth) {
      left = event.clientX - cardWidth - 20;
    }
    if (top + cardHeight > window.innerHeight) {
      top = event.clientY - cardHeight - 20;
    }

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;

    const connectedAtomsList = atomData.connectedAtoms
      .map((idx: number) => allAtoms[idx]?.element || '?')
      .filter((el: string) => el !== '?')
      .map((el: string) => `<span class="atom-tag">${el}</span>`)
      .join('');

    card.innerHTML = `
      <button class="info-card-close">×</button>
      <div class="info-card-title">${this.getElementFullName(atomData.element)} (${atomData.element})</div>
      <div class="info-card-row">
        <span class="info-card-label">三维坐标</span>
        <span class="info-card-value">(${atomData.x.toFixed(3)}, ${atomData.y.toFixed(3)}, ${atomData.z.toFixed(3)})</span>
      </div>
      <div class="info-card-row">
        <span class="info-card-label">原子半径</span>
        <span class="info-card-value">${atomData.radius.toFixed(2)} Å</span>
      </div>
      <div class="info-card-row">
        <span class="info-card-label">杂化类型</span>
        <span class="info-card-value">${atomData.hybridization}</span>
      </div>
      <div class="info-card-connected">
        <div class="info-card-connected-title">连接的原子</div>
        <div class="info-card-connected-list">
          ${connectedAtomsList || '<span style="color: #999;">无</span>'}
        </div>
      </div>
    `;

    const closeBtn = card.querySelector('.info-card-close') as HTMLElement;
    closeBtn.addEventListener('click', () => this.closeInfoCard());

    document.body.appendChild(card);
    this.currentInfoCard = card;
  }

  private closeInfoCard(): void {
    if (this.currentInfoCard) {
      this.currentInfoCard.classList.add('closing');
      const card = this.currentInfoCard;
      setTimeout(() => {
        if (card.parentNode) {
          card.parentNode.removeChild(card);
        }
      }, 300);
      this.currentInfoCard = null;
    }
  }

  private getElementFullName(symbol: string): string {
    const names: { [key: string]: string } = {
      H: '氢', He: '氦', Li: '锂', Be: '铍', B: '硼',
      C: '碳', N: '氮', O: '氧', F: '氟', Ne: '氖',
      Na: '钠', Mg: '镁', Al: '铝', Si: '硅', P: '磷',
      S: '硫', Cl: '氯', Ar: '氩', K: '钾', Ca: '钙',
      Fe: '铁', Cu: '铜', Zn: '锌', Br: '溴', I: '碘'
    };
    return names[symbol] || symbol;
  }

  public setSelectedMolecule(key: string): void {
    this.moleculeSelect.value = key;
  }

  public dispose(): void {
    this.closeInfoCard();
  }
}
