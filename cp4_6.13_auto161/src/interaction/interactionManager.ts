import * as THREE from 'three';
import { Visualizer } from '../visual/visualizer';
import { AudioEngine } from '../audio/audioEngine';
import { getBuildingById, buildingData, BuildingFunction, BUILDING_COLORS } from '../data/buildingData';

type ViewMode = 'topdown' | 'firstperson';

const FUNCTION_LABELS: Record<BuildingFunction, string> = {
  residential: '居住区',
  commercial: '商业区',
  leisure: '休闲区',
  transport: '交通枢纽',
};

const FUNCTION_COLORS: Record<BuildingFunction, string> = {
  residential: '#e67e22',
  commercial: '#2980b9',
  leisure: '#27ae60',
  transport: '#8e44ad',
};

export class InteractionManager {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private visualizer: Visualizer;
  private audioEngine: AudioEngine;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private viewMode: ViewMode = 'topdown';
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private cameraTheta: number = 0.5;
  private cameraPhi: number = Math.PI / 4;
  private cameraRadius: number = 150;
  private targetTheta: number = 0.5;
  private targetPhi: number = Math.PI / 4;
  private targetRadius: number = 150;

  private firstPersonTarget: THREE.Vector3 | null = null;
  private firstPersonLookAt: THREE.Vector3 | null = null;
  private firstPersonProgress: number = 0;
  private transitioning: boolean = false;
  private transitionStartPos: THREE.Vector3 = new THREE.Vector3();
  private transitionStartLookAt: THREE.Vector3 = new THREE.Vector3();
  private transitionProgress: number = 0;
  private transitionDuration: number = 0.8;

  private lastClickTime: number = 0;
  private clickTimeout: number | null = null;
  private hoveredBuildingId: string | null = null;
  private activeBuildingId: string | null = null;
  private isMouseDown: boolean = false;
  private mouseDownBuildingId: string | null = null;

  private heatmapData: number[] = [];
  private heatmapTimer: number = 0;

  private container: HTMLElement;
  private infoPanel: HTMLElement;
  private buildingNameEl: HTMLElement;
  private buildingTypeEl: HTMLElement;
  private trackNameEl: HTMLElement;
  private volumeFillEl: HTMLElement;
  private heatmapEl: HTMLElement;

  private onBuildingSelectCallback: ((buildingId: string | null) => void) | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    visualizer: Visualizer,
    audioEngine: AudioEngine,
    container: HTMLElement
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.visualizer = visualizer;
    this.audioEngine = audioEngine;
    this.container = container;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.infoPanel = document.getElementById('info-panel')!;
    this.buildingNameEl = document.getElementById('panel-building-name')!;
    this.buildingTypeEl = document.getElementById('panel-building-type')!;
    this.trackNameEl = document.getElementById('panel-track-name')!;
    this.volumeFillEl = document.getElementById('panel-volume-fill')!;
    this.heatmapEl = document.getElementById('panel-heatmap')!;

    this.initHeatmap();
    this.bindEvents();
    this.updateCameraPosition();
  }

  private initHeatmap(): void {
    this.heatmapData = [];
    for (let i = 0; i < 24; i++) {
      const baseIntensity = this.getTimeIntensity(i);
      this.heatmapData.push(baseIntensity + (Math.random() - 0.5) * 0.2);
    }
    this.renderHeatmap();
  }

  private getTimeIntensity(hour: number): number {
    if (hour >= 7 && hour <= 9) return 0.8;
    if (hour >= 17 && hour <= 19) return 0.9;
    if (hour >= 11 && hour <= 14) return 0.7;
    if (hour >= 22 || hour <= 5) return 0.2;
    return 0.5;
  }

  private renderHeatmap(): void {
    this.heatmapEl.innerHTML = '';
    for (let i = 0; i < 24; i++) {
      const bar = document.createElement('div');
      bar.className = 'heatmap-bar';
      const height = Math.max(5, Math.min(100, this.heatmapData[i] * 100));
      bar.style.height = `${height}%`;
      bar.style.opacity = `${0.5 + this.heatmapData[i] * 0.5}`;
      this.heatmapEl.appendChild(bar);
    }
  }

  private bindEvents(): void {
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.domElement.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    this.renderer.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
    this.renderer.domElement.addEventListener('dblclick', this.onDoubleClick.bind(this));
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    const toggleBtn = document.getElementById('toggle-btn')!;
    const controlBar = document.getElementById('control-bar')!;
    toggleBtn.addEventListener('click', () => {
      controlBar.classList.toggle('expanded');
      toggleBtn.textContent = controlBar.classList.contains('expanded') ? '▲ 收起面板' : '▼ 控制面板';
    });

    const btnTopView = document.getElementById('btn-topview')!;
    const btnFirstPerson = document.getElementById('btn-firstperson')!;

    btnTopView.addEventListener('click', () => {
      this.switchViewMode('topdown');
      btnTopView.classList.add('active');
      btnFirstPerson.classList.remove('active');
    });

    btnFirstPerson.addEventListener('click', () => {
      this.switchViewMode('firstperson');
      btnFirstPerson.classList.add('active');
      btnTopView.classList.remove('active');
    });

    const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
    const volumeValue = document.getElementById('volume-value')!;
    volumeSlider.addEventListener('input', () => {
      const volume = parseInt(volumeSlider.value) / 100;
      this.audioEngine.setMasterVolume(volume);
      volumeValue.textContent = volumeSlider.value;
    });

    const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    const timeValue = document.getElementById('time-value')!;
    timeSlider.addEventListener('input', () => {
      const hour = parseFloat(timeSlider.value);
      this.visualizer.setTimeOfDay(hour);
      timeValue.textContent = `${Math.floor(hour).toString().padStart(2, '0')}:${Math.floor((hour % 1) * 60).toString().padStart(2, '0')}`;
    });

    setTimeout(() => {
      this.visualizer.setTimeOfDay(12);
    }, 100);
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    
    this.isMouseDown = true;
    this.isDragging = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    
    const buildingId = this.getBuildingUnderMouse(e);
    this.mouseDownBuildingId = buildingId;
  }

  private onMouseMove(e: MouseEvent): void {
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;

    if (this.isMouseDown && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      this.isDragging = true;
      this.mouseDownBuildingId = null;
      
      if (this.viewMode === 'topdown') {
        this.targetTheta -= dx * 0.005;
        this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.targetPhi - dy * 0.005));
      }
    }

    if (!this.isDragging && this.viewMode === 'topdown') {
      const buildingId = this.getBuildingUnderMouse(e);
      if (buildingId !== this.hoveredBuildingId) {
        if (this.hoveredBuildingId && this.hoveredBuildingId !== this.activeBuildingId) {
          this.visualizer.resetHighlight(this.hoveredBuildingId);
        }
        this.hoveredBuildingId = buildingId;
        if (buildingId && !this.isMouseDown) {
          this.visualizer.highlightBuilding(buildingId);
        }
      }
    }

    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button !== 0) return;
    
    if (this.isMouseDown && !this.isDragging && this.mouseDownBuildingId) {
    }
    
    this.isMouseDown = false;
    this.isDragging = false;
  }

  private onMouseLeave(): void {
    if (this.hoveredBuildingId && this.hoveredBuildingId !== this.activeBuildingId) {
      this.visualizer.resetHighlight(this.hoveredBuildingId);
    }
    this.hoveredBuildingId = null;
    this.isMouseDown = false;
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.viewMode === 'topdown') {
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      this.targetRadius = Math.max(50, Math.min(300, this.targetRadius * factor));
    }
  }

  private onClick(e: MouseEvent): void {
    if (this.isDragging) return;

    const now = performance.now();
    const timeSinceLastClick = now - this.lastClickTime;

    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }

    const buildingId = this.getBuildingUnderMouse(e);

    if (timeSinceLastClick < 300 && buildingId && buildingId === this.activeBuildingId) {
      return;
    }

    this.clickTimeout = window.setTimeout(() => {
      this.handleSingleClick(buildingId);
      this.clickTimeout = null;
    }, 250);

    this.lastClickTime = now;
  }

  private handleSingleClick(buildingId: string | null): void {
    if (!buildingId) {
      if (this.activeBuildingId) {
        this.visualizer.resetHighlight(this.activeBuildingId);
        this.audioEngine.stopSound(this.activeBuildingId);
        this.activeBuildingId = null;
        this.hideInfoPanel();
      }
      return;
    }

    if (buildingId === this.activeBuildingId) {
      this.visualizer.resetHighlight(buildingId);
      this.audioEngine.stopSound(buildingId);
      this.activeBuildingId = null;
      this.hideInfoPanel();
      return;
    }

    if (this.activeBuildingId) {
      this.visualizer.resetHighlight(this.activeBuildingId);
      this.audioEngine.stopSound(this.activeBuildingId);
    }

    this.activeBuildingId = buildingId;
    this.visualizer.highlightBuilding(buildingId);
    this.audioEngine.playSound(buildingId);
    this.showInfoPanel(buildingId);

    if (this.onBuildingSelectCallback) {
      this.onBuildingSelectCallback(buildingId);
    }
  }

  private onDoubleClick(e: MouseEvent): void {
    const buildingId = this.getBuildingUnderMouse(e);
    if (buildingId) {
      this.activeBuildingId = buildingId;
      this.visualizer.highlightBuilding(buildingId);
      this.audioEngine.playSound(buildingId);
      this.showInfoPanel(buildingId);
      this.enterFirstPerson(buildingId);
    }
  }

  private getBuildingUnderMouse(e: MouseEvent): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObjects(this.camera.children, true);
    
    for (const intersect of intersects) {
      let obj: THREE.Object3D | null = intersect.object;
      while (obj) {
        if ((obj as any).buildingId) {
          return (obj as any).buildingId;
        }
        obj = obj.parent;
      }
    }
    
    return null;
  }

  private showInfoPanel(buildingId: string): void {
    const building = getBuildingById(buildingId);
    if (!building) return;

    this.buildingNameEl.textContent = building.name;
    this.buildingTypeEl.textContent = FUNCTION_LABELS[building.function];
    this.buildingTypeEl.style.backgroundColor = FUNCTION_COLORS[building.function];
    this.trackNameEl.textContent = `🎵 ${building.audioFile}`;

    this.initHeatmap();
    this.infoPanel.classList.add('visible');
  }

  private hideInfoPanel(): void {
    this.infoPanel.classList.remove('visible');
  }

  switchViewMode(mode: ViewMode): void {
    if (mode === this.viewMode) return;

    if (mode === 'topdown') {
      this.exitFirstPerson();
    } else {
      const firstBuilding = buildingData[Math.floor(buildingData.length / 2)];
      if (firstBuilding) {
        this.enterFirstPerson(firstBuilding.id);
      }
    }
  }

  private enterFirstPerson(buildingId: string): void {
    const building = getBuildingById(buildingId);
    if (!building) return;

    this.transitionStartPos.copy(this.camera.position);
    
    const lookAt = new THREE.Vector3(0, 0, 0);
    if (this.viewMode === 'topdown') {
      lookAt.set(0, 30, 0);
    } else {
      lookAt.copy(this.firstPersonLookAt || new THREE.Vector3(0, 30, 0));
    }
    this.transitionStartLookAt.copy(lookAt);

    const distance = 30;
    const angle = this.cameraTheta;
    const targetPos = new THREE.Vector3(
      building.x + Math.cos(angle + Math.PI) * distance,
      building.height * 0.6,
      building.z + Math.sin(angle + Math.PI) * distance
    );

    this.firstPersonTarget = targetPos;
    this.firstPersonLookAt = new THREE.Vector3(building.x, building.height * 0.5, building.z);
    this.firstPersonProgress = 0;
    this.transitioning = true;
    this.transitionProgress = 0;
    this.viewMode = 'firstperson';
  }

  private exitFirstPerson(): void {
    this.transitionStartPos.copy(this.camera.position);
    
    const currentLookAt = this.firstPersonLookAt || new THREE.Vector3(0, 30, 0);
    this.transitionStartLookAt.copy(currentLookAt);

    this.viewMode = 'topdown';
    this.transitioning = true;
    this.transitionProgress = 0;
  }

  update(deltaTime: number): void {
    if (this.viewMode === 'topdown' && !this.transitioning) {
      this.cameraTheta += (this.targetTheta - this.cameraTheta) * 0.1;
      this.cameraPhi += (this.targetPhi - this.cameraPhi) * 0.1;
      this.cameraRadius += (this.targetRadius - this.cameraRadius) * 0.1;
      this.updateCameraPosition();
    }

    if (this.transitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      const t = Math.min(this.transitionProgress, 1);
      const eased = this.easeInOutCubic(t);

      if (this.viewMode === 'firstperson' && this.firstPersonTarget && this.firstPersonLookAt) {
        this.camera.position.lerpVectors(this.transitionStartPos, this.firstPersonTarget, eased);
        const lookAt = this.transitionStartLookAt.clone().lerp(this.firstPersonLookAt, eased);
        this.camera.lookAt(lookAt);
      } else if (this.viewMode === 'topdown') {
        const targetPos = this.getTopDownCameraPos();
        this.camera.position.lerpVectors(this.transitionStartPos, targetPos, eased);
        
        const targetLookAt = new THREE.Vector3(0, 30, 0);
        const lookAt = this.transitionStartLookAt.clone().lerp(targetLookAt, eased);
        this.camera.lookAt(lookAt);
        
        this.cameraTheta = this.targetTheta;
        this.cameraPhi = this.targetPhi;
        this.cameraRadius = this.targetRadius;
      }

      if (t >= 1) {
        this.transitioning = false;
      }
    }

    this.heatmapTimer += deltaTime;
    if (this.heatmapTimer > 2) {
      this.heatmapTimer = 0;
      this.updateHeatmap();
    }

    if (this.activeBuildingId) {
      const level = this.audioEngine.getSoundLevel(this.activeBuildingId);
      this.volumeFillEl.style.width = `${level * 100}%`;
    }
  }

  private updateHeatmap(): void {
    for (let i = 0; i < this.heatmapData.length; i++) {
      this.heatmapData[i] = Math.max(0.1, Math.min(1, 
        this.heatmapData[i] + (Math.random() - 0.5) * 0.15
      ));
    }
    const bars = this.heatmapEl.querySelectorAll('.heatmap-bar');
    bars.forEach((bar, i) => {
      const height = Math.max(5, Math.min(100, this.heatmapData[i] * 100));
      (bar as HTMLElement).style.height = `${height}%`;
    });
  }

  private getTopDownCameraPos(): THREE.Vector3 {
    const x = this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraRadius * Math.cos(this.cameraPhi);
    const z = this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    return new THREE.Vector3(x, y, z);
  }

  private updateCameraPosition(): void {
    const pos = this.getTopDownCameraPos();
    this.camera.position.copy(pos);
    this.camera.lookAt(0, 30, 0);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  setOnBuildingSelect(callback: (buildingId: string | null) => void): void {
    this.onBuildingSelectCallback = callback;
  }

  getViewMode(): ViewMode {
    return this.viewMode;
  }
}
