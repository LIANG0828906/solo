import * as THREE from 'three';
import { BuildingManager, LayerMode } from './buildingManager';
import { WindParticles } from './windParticles';

export class UIControls {
  private buildingManager: BuildingManager;
  private windParticles: WindParticles;
  private camera: THREE.PerspectiveCamera;
  private targetCameraPosition: THREE.Vector3;
  private targetLookAt: THREE.Vector3;
  private isResetting: boolean = false;
  private resetStartTime: number = 0;
  private resetDuration: number = 500;
  private initialPosition: THREE.Vector3;
  private initialLookAt: THREE.Vector3;

  private layerSelect: HTMLSelectElement;
  private opacitySlider: HTMLInputElement;
  private opacityValue: HTMLElement;
  private resetBtn: HTMLButtonElement;
  private infoPanel: HTMLElement;
  private closePanelBtn: HTMLElement;
  private panelTitle: HTMLElement;
  private panelHeight: HTMLElement;
  private panelArea: HTMLElement;
  private panelBarrier: HTMLElement;
  private panelVentValue: HTMLElement;
  private panelVentBar: HTMLElement;

  constructor(
    buildingManager: BuildingManager,
    windParticles: WindParticles,
    camera: THREE.PerspectiveCamera
  ) {
    this.buildingManager = buildingManager;
    this.windParticles = windParticles;
    this.camera = camera;

    this.initialPosition = camera.position.clone();
    this.initialLookAt = new THREE.Vector3(0, 20, 0);
    this.targetCameraPosition = this.initialPosition.clone();
    this.targetLookAt = this.initialLookAt.clone();

    this.layerSelect = document.getElementById('layer-select') as HTMLSelectElement;
    this.opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
    this.opacityValue = document.getElementById('opacity-value') as HTMLElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.infoPanel = document.getElementById('info-panel') as HTMLElement;
    this.closePanelBtn = document.getElementById('close-panel') as HTMLElement;
    this.panelTitle = document.getElementById('panel-title') as HTMLElement;
    this.panelHeight = document.getElementById('panel-height') as HTMLElement;
    this.panelArea = document.getElementById('panel-area') as HTMLElement;
    this.panelBarrier = document.getElementById('panel-barrier') as HTMLElement;
    this.panelVentValue = document.getElementById('panel-vent-value') as HTMLElement;
    this.panelVentBar = document.getElementById('panel-vent-bar') as HTMLElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.layerSelect.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value as LayerMode;
      this.setLayerMode(value);
    });

    this.opacitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.opacityValue.textContent = value.toFixed(2);
      this.buildingManager.setOpacity(value);
    });

    this.resetBtn.addEventListener('click', () => {
      this.resetCamera();
    });

    this.closePanelBtn.addEventListener('click', () => {
      this.hideInfoPanel();
    });

    window.addEventListener('resize', () => {
      this.handleResize();
    });

    this.handleResize();
  }

  private setLayerMode(mode: LayerMode): void {
    switch (mode) {
      case 'both':
        this.windParticles.setVisible(true);
        this.buildingManager.setColorBlocksVisible(true);
        break;
      case 'particles':
        this.windParticles.setVisible(true);
        this.buildingManager.setColorBlocksVisible(false);
        break;
      case 'colors':
        this.windParticles.setVisible(false);
        this.buildingManager.setColorBlocksVisible(true);
        break;
    }
  }

  private handleResize(): void {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.windParticles.setParticleCount(100);
    } else {
      this.windParticles.setParticleCount(200);
    }
  }

  private resetCamera(): void {
    this.isResetting = true;
    this.resetStartTime = performance.now();
    this.targetCameraPosition.copy(this.initialPosition);
    this.targetLookAt.copy(this.initialLookAt);
  }

  public updateResetAnimation(currentLookAt: THREE.Vector3): boolean {
    if (!this.isResetting) return false;

    const elapsed = performance.now() - this.resetStartTime;
    const progress = Math.min(elapsed / this.resetDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    const currentPos = this.camera.position.clone();
    const currentTarget = currentLookAt.clone();

    this.camera.position.lerpVectors(currentPos, this.targetCameraPosition, eased);
    currentLookAt.lerpVectors(currentTarget, this.targetLookAt, eased);

    if (progress >= 1) {
      this.isResetting = false;
      this.camera.position.copy(this.targetCameraPosition);
      currentLookAt.copy(this.targetLookAt);
    }

    return true;
  }

  public showInfoPanel(mesh: THREE.Mesh): void {
    const data = this.buildingManager.getBuildingData(mesh);
    if (!data) return;

    this.buildingManager.showVentilationColor(mesh, 600);

    this.panelTitle.textContent = data.name;
    this.panelHeight.textContent = `${data.height} 米`;
    this.panelArea.textContent = `${data.area} m²`;

    let barrierLevel = '低';
    let barrierClass = 'level-low';
    if (data.barrierLevel >= 0.66) {
      barrierLevel = '高';
      barrierClass = 'level-high';
    } else if (data.barrierLevel >= 0.33) {
      barrierLevel = '中';
      barrierClass = 'level-mid';
    }

    this.panelBarrier.innerHTML = `<span class="level-badge ${barrierClass}">${barrierLevel}</span>`;

    const ventPercent = Math.round(data.ventilationValue * 100);
    this.panelVentValue.textContent = `${ventPercent}%`;

    let ventColor = '#ff6060';
    if (data.ventilationValue >= 0.66) {
      ventColor = '#60e8a0';
    } else if (data.ventilationValue >= 0.33) {
      ventColor = '#e8c870';
    }

    this.panelVentBar.style.background = ventColor;
    this.panelVentBar.style.width = '0%';

    requestAnimationFrame(() => {
      this.panelVentBar.style.width = `${ventPercent}%`;
    });

    this.infoPanel.classList.add('visible');
  }

  public hideInfoPanel(): void {
    this.infoPanel.classList.remove('visible');
  }
}
