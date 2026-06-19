import * as THREE from 'three';
import { CityBuilder, Building } from './cityBuilder';
import { CATEGORY_COLORS } from './dataLoader';

export class InteractionManager {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cityBuilder: CityBuilder;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredBuilding: Building | null = null;
  private tooltip: HTMLElement;
  private sortSelect: HTMLSelectElement;
  private categoryFiltersContainer: HTMLElement;
  private toggleBtn: HTMLElement;
  private controlPanel: HTMLElement;
  private activeCategories: number[] = [0, 1, 2];
  private currentSortMode: 'valueAsc' | 'valueDesc' | 'category' = 'valueDesc';
  private onDataChange?: (sortMode: string, categories: number[]) => void;
  private audioContext: AudioContext | null = null;
  private autoRotatePaused: boolean = false;
  private autoRotateResumeTimer: number | null = null;
  public isUserInteracting: boolean = false;

  constructor(
    _scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    cityBuilder: CityBuilder
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.cityBuilder = cityBuilder;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.tooltip = document.getElementById('tooltip')!;
    this.sortSelect = document.getElementById('sortSelect') as HTMLSelectElement;
    this.categoryFiltersContainer = document.getElementById('categoryFilters')!;
    this.toggleBtn = document.getElementById('togglePanel')!;
    this.controlPanel = document.getElementById('control-panel')!;

    this.initCategoryFilters();
    this.bindEvents();
  }

  private initCategoryFilters(): void {
    this.categoryFiltersContainer.innerHTML = '';

    Object.entries(CATEGORY_COLORS).forEach(([key, value]) => {
      const catId = parseInt(key);

      const item = document.createElement('div');
      item.className = 'filter-item checked';
      item.style.setProperty('--cat-color', value.base);
      item.dataset.category = key;

      const checkbox = document.createElement('div');
      checkbox.className = 'filter-checkbox';

      const colorDot = document.createElement('div');
      colorDot.className = 'filter-color';
      colorDot.style.background = value.base;

      const label = document.createElement('div');
      label.className = 'filter-label';
      label.textContent = value.label;

      item.appendChild(checkbox);
      item.appendChild(colorDot);
      item.appendChild(label);

      item.addEventListener('click', () => {
        item.classList.toggle('checked');
        this.updateActiveCategories();
      });

      this.categoryFiltersContainer.appendChild(item);

      if (!this.activeCategories.includes(catId)) {
        this.activeCategories.push(catId);
      }
    });

    this.cityBuilder.updateCategoryVisibility([...this.activeCategories]);
  }

  private updateActiveCategories(): void {
    const items = this.categoryFiltersContainer.querySelectorAll<HTMLElement>('.filter-item');
    this.activeCategories = [];
    items.forEach(item => {
      if (item.classList.contains('checked')) {
        const cat = parseInt(item.dataset.category!);
        this.activeCategories.push(cat);
      }
    });
    this.cityBuilder.updateCategoryVisibility([...this.activeCategories]);
    this.notifyDataChange();
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    canvas.addEventListener('click', this.onClick.bind(this));

    canvas.addEventListener('pointerdown', () => {
      this.isUserInteracting = true;
      this.pauseAutoRotate();
    });
    canvas.addEventListener('pointerup', () => {
      this.isUserInteracting = false;
      this.scheduleAutoRotateResume();
    });

    this.sortSelect.addEventListener('change', (e) => {
      this.currentSortMode = (e.target as HTMLSelectElement).value as any;
      this.notifyDataChange();
    });

    this.toggleBtn.addEventListener('click', () => {
      this.controlPanel.classList.toggle('collapsed');
    });
  }

  private notifyDataChange(): void {
    if (this.onDataChange) {
      this.onDataChange(this.currentSortMode, [...this.activeCategories]);
    }
  }

  public setDataChangeHandler(handler: (sortMode: string, categories: number[]) => void): void {
    this.onDataChange = handler;
  }

  private pickBuilding(event: MouseEvent): Building | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cityBuilder.getBuildingMeshes());

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const building = this.cityBuilder.getBuildingByMesh(mesh);
      if (building && building.group.visible) {
        return building;
      }
    }
    return null;
  }

  private onMouseMove(event: MouseEvent): void {
    const building = this.pickBuilding(event);
    if (building) {
      this.setHoveredBuilding(building, event.clientX, event.clientY);
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.setHoveredBuilding(null);
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  private onMouseLeave(): void {
    this.setHoveredBuilding(null);
    this.renderer.domElement.style.cursor = 'default';
  }

  private onClick(event: MouseEvent): void {
    const building = this.pickBuilding(event);
    if (building) {
      this.cityBuilder.triggerBuildingClick(building);
      this.playClickSound();
    }
  }

  private setHoveredBuilding(building: Building | null, x?: number, y?: number): void {
    if (this.hoveredBuilding === building) {
      if (building && x !== undefined && y !== undefined) {
        this.updateTooltipPosition(x, y);
      }
      return;
    }

    if (this.hoveredBuilding) {
      this.cityBuilder.setBuildingHover(this.hoveredBuilding, false);
      this.hideTooltip();
    }

    this.hoveredBuilding = building;

    if (building && x !== undefined && y !== undefined) {
      this.cityBuilder.setBuildingHover(building, true);
      this.showTooltip(building, x, y);
    }
  }

  private showTooltip(building: Building, x: number, y: number): void {
    const catColors = CATEGORY_COLORS[building.data.category];
    const catLabel = catColors?.label || `类别 ${building.data.category}`;
    const catColor = catColors?.base || '#ffffff';

    this.tooltip.innerHTML = `
      <div class="tooltip-title">${building.data.name}</div>
      <div class="tooltip-row">
        <div class="icon-bar" style="--val: ${building.data.value}%"></div>
        <span class="tooltip-label">数值</span>
        <span class="tooltip-value">${building.data.value}</span>
      </div>
      <div class="tooltip-row">
        <div class="icon-category" style="background: ${catColor}"></div>
        <span class="tooltip-label">类别</span>
        <span class="tooltip-value">${catLabel}</span>
      </div>
    `;
    this.tooltip.style.display = 'block';
    this.updateTooltipPosition(x, y);
  }

  private updateTooltipPosition(x: number, y: number): void {
    const offset = 16;
    let posX = x + offset;
    let posY = y + offset;

    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    if (posX + tooltipRect.width > viewportW) {
      posX = x - tooltipRect.width - offset;
    }
    if (posY + tooltipRect.height > viewportH) {
      posY = y - tooltipRect.height - offset;
    }

    this.tooltip.style.left = `${posX}px`;
    this.tooltip.style.top = `${posY}px`;
  }

  private hideTooltip(): void {
    this.tooltip.style.display = 'none';
  }

  private playClickSound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  public pauseAutoRotate(): void {
    this.autoRotatePaused = true;
    if (this.autoRotateResumeTimer) {
      window.clearTimeout(this.autoRotateResumeTimer);
      this.autoRotateResumeTimer = null;
    }
  }

  public scheduleAutoRotateResume(): void {
    if (this.autoRotateResumeTimer) {
      window.clearTimeout(this.autoRotateResumeTimer);
    }
    this.autoRotateResumeTimer = window.setTimeout(() => {
      this.autoRotatePaused = false;
    }, 2000);
  }

  public shouldAutoRotate(): boolean {
    return !this.autoRotatePaused;
  }

  public getActiveCategories(): number[] {
    return [...this.activeCategories];
  }

  public getSortMode(): string {
    return this.currentSortMode;
  }
}
