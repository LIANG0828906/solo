import { BuildingType, BuildingParams, BUILDING_TYPE_INFO } from '@/types';
import { SceneManager } from './sceneManager';

type ExportCallback = () => void;

export class UIController {
  private sceneManager: SceneManager;
  private container: HTMLElement;
  private exportCallback: ExportCallback | null = null;

  private leftPanel: HTMLElement;
  private rightPanel: HTMLElement;
  private topBar: HTMLElement;
  private hamburgerBtn: HTMLElement;
  private mobileMenu: HTMLElement;

  private posXSlider: HTMLInputElement | null = null;
  private posYSlider: HTMLInputElement | null = null;
  private posZSlider: HTMLInputElement | null = null;
  private posXInput: HTMLInputElement | null = null;
  private posYInput: HTMLInputElement | null = null;
  private posZInput: HTMLInputElement | null = null;

  private sizeWSlider: HTMLInputElement | null = null;
  private sizeHSlider: HTMLInputElement | null = null;
  private sizeDSlider: HTMLInputElement | null = null;
  private sizeWInput: HTMLInputElement | null = null;
  private sizeHInput: HTMLInputElement | null = null;
  private sizeDInput: HTMLInputElement | null = null;

  private rotYSlider: HTMLInputElement | null = null;
  private rotYInput: HTMLInputElement | null = null;

  private timeSlider: HTMLInputElement | null = null;
  private timeDisplay: HTMLElement | null = null;
  private timeIcon: HTMLElement | null = null;

  private updateDebounceTimers: Map<string, number> = new Map();
  private pendingUpdates: Map<string, number> = new Map();

  constructor(sceneManager: SceneManager, container: HTMLElement) {
    this.sceneManager = sceneManager;
    this.container = container;

    this.createUI();
    this.setupBuildingCards();
    this.setupSliderBindings();
    this.setupResponsive();
    this.setupSceneCallbacks();
    this.updateTimeDisplay(this.sceneManager.getTimeOfDay());
  }

  private createUI(): void {
    this.container.innerHTML = `
      <canvas id="three-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;"></canvas>

      <button id="hamburger-btn" class="hamburger-btn" aria-label="菜单">
        <span></span><span></span><span></span>
      </button>

      <div id="mobile-menu" class="mobile-menu">
        <div class="mobile-menu-content"></div>
      </div>

      <aside id="left-panel" class="side-panel left-panel">
        <div class="panel-header">
          <h2>建筑类型库</h2>
          <span class="panel-subtitle">点击添加建筑</span>
        </div>
        <div id="building-grid" class="building-grid"></div>
        <div class="panel-hint">
          <div class="hint-item"><kbd>Ctrl+Z</kbd> 撤销</div>
          <div class="hint-item"><kbd>Ctrl+D</kbd> 复制</div>
          <div class="hint-item"><kbd>Delete</kbd> 删除</div>
          <div class="hint-item"><kbd>W/E/R</kbd> 变换模式</div>
        </div>
      </aside>

      <aside id="right-panel" class="side-panel right-panel">
        <div class="panel-header">
          <h2>属性面板</h2>
          <span id="selection-status" class="panel-subtitle">未选中建筑</span>
        </div>
        <div id="property-content" class="property-content">
          <div class="empty-state">
            <div class="empty-icon">🏗️</div>
            <p>点击场景中的建筑以编辑属性</p>
          </div>
        </div>
      </aside>

      <header id="top-bar" class="top-bar">
        <div class="time-control">
          <span id="time-icon" class="time-icon">☀️</span>
          <input type="range" id="time-slider" min="6" max="20" step="0.5" value="12">
          <span id="time-display" class="time-display">12:00</span>
        </div>
      </header>

      <button id="export-btn" class="export-btn" title="导出天际线剪影">
        <span class="export-icon">📷</span>
        <span>导出</span>
      </button>

      <div id="countdown-overlay" class="countdown-overlay hidden">
        <div class="countdown-number"></div>
      </div>

      <div id="success-overlay" class="success-overlay hidden">
        <div class="success-check">
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="25" fill="none"/>
            <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <div class="success-text">导出成功！</div>
        <a id="download-link" class="download-link" download="city-skyline.png">点击下载图片</a>
      </div>
    `;

    this.leftPanel = this.container.querySelector('#left-panel')!;
    this.rightPanel = this.container.querySelector('#right-panel')!;
    this.topBar = this.container.querySelector('#top-bar')!;
    this.hamburgerBtn = this.container.querySelector('#hamburger-btn')!;
    this.mobileMenu = this.container.querySelector('#mobile-menu')!;
  }

  private setupBuildingCards(): void {
    const grid = this.container.querySelector('#building-grid')!;
    BUILDING_TYPE_INFO.forEach((info) => {
      const card = document.createElement('div');
      card.className = 'building-card';
      card.dataset.type = info.type;
      card.innerHTML = `
        <div class="building-icon">${info.icon}</div>
        <div class="building-name">${info.name}</div>
      `;
      card.addEventListener('click', () => {
        this.sceneManager.addBuilding(info.type as BuildingType);
        if (window.innerWidth < 1200) {
          this.mobileMenu.classList.remove('active');
        }
      });
      grid.appendChild(card);
    });
  }

  private setupSliderBindings(): void {
    this.timeSlider = this.container.querySelector('#time-slider') as HTMLInputElement;
    this.timeDisplay = this.container.querySelector('#time-display');
    this.timeIcon = this.container.querySelector('#time-icon');

    if (this.timeSlider) {
      let timeRafId: number | null = null;
      this.timeSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        if (timeRafId) cancelAnimationFrame(timeRafId);
        timeRafId = requestAnimationFrame(() => {
          this.sceneManager.updateTimeOfDay(value);
        });
      });
    }

    const exportBtn = this.container.querySelector('#export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (this.exportCallback) {
          this.exportCallback();
        }
      });
    }
  }

  private setupSceneCallbacks(): void {
    this.sceneManager.setSelectionCallback((params) => {
      this.onSelectionChange(params);
    });
    this.sceneManager.setTimeChangeCallback((time) => {
      this.updateTimeDisplay(time);
    });
  }

  private onSelectionChange(params: BuildingParams | null): void {
    const content = this.container.querySelector('#property-content')!;
    const status = this.container.querySelector('#selection-status')!;

    if (!params) {
      status.textContent = '未选中建筑';
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏗️</div>
          <p>点击场景中的建筑以编辑属性</p>
        </div>
      `;
      this.clearSliderReferences();
      return;
    }

    const typeInfo = BUILDING_TYPE_INFO.find((t) => t.type === params.type);
    status.textContent = typeInfo?.name || '建筑';

    content.innerHTML = this.buildPropertyPanelHTML(params);
    this.bindPropertySliders(params);
  }

  private buildPropertyPanelHTML(params: BuildingParams): string {
    return `
      <div class="property-section">
        <h3>📍 位置</h3>
        ${this.buildSliderGroup('posX', 'X', params.position.x, -150, 150, 0.1)}
        ${this.buildSliderGroup('posY', 'Y', params.position.y, -10, 200, 0.1)}
        ${this.buildSliderGroup('posZ', 'Z', params.position.z, -150, 150, 0.1)}
      </div>
      <div class="property-section">
        <h3>📐 尺寸</h3>
        ${this.buildSliderGroup('sizeW', '宽度', params.size.w, 1, 50, 0.5)}
        ${this.buildSliderGroup('sizeH', '高度', params.size.h, 1, 200, 0.5)}
        ${this.buildSliderGroup('sizeD', '深度', params.size.d, 1, 50, 0.5)}
      </div>
      <div class="property-section">
        <h3>🔄 旋转</h3>
        ${this.buildSliderGroup('rotY', 'Y轴角度', (params.rotationY * 180) / Math.PI, -180, 180, 1)}
      </div>
    `;
  }

  private buildSliderGroup(id: string, label: string, value: number, min: number, max: number, step: number): string {
    const displayVal = Number.isInteger(step) ? Math.round(value) : value.toFixed(1);
    return `
      <div class="slider-group" data-id="${id}">
        <div class="slider-label">
          <span>${label}</span>
          <input type="number" class="slider-input" data-id="${id}" value="${displayVal}" step="${step}" min="${min}" max="${max}">
        </div>
        <input type="range" class="slider-range" data-id="${id}" value="${value}" min="${min}" max="${max}" step="${step}">
      </div>
    `;
  }

  private bindPropertySliders(params: BuildingParams): void {
    this.clearSliderReferences();

    const bindings: Array<{ sliderId: string; inputId: string; key: keyof UIController; inputKey: keyof UIController }> = [
      { sliderId: 'posX', inputId: 'posX', key: 'posXSlider', inputKey: 'posXInput' },
      { sliderId: 'posY', inputId: 'posY', key: 'posYSlider', inputKey: 'posYInput' },
      { sliderId: 'posZ', inputId: 'posZ', key: 'posZSlider', inputKey: 'posZInput' },
      { sliderId: 'sizeW', inputId: 'sizeW', key: 'sizeWSlider', inputKey: 'sizeWInput' },
      { sliderId: 'sizeH', inputId: 'sizeH', key: 'sizeHSlider', inputKey: 'sizeHInput' },
      { sliderId: 'sizeD', inputId: 'sizeD', key: 'sizeDSlider', inputKey: 'sizeDInput' },
      { sliderId: 'rotY', inputId: 'rotY', key: 'rotYSlider', inputKey: 'rotYInput' }
    ];

    bindings.forEach(({ sliderId, key, inputKey }) => {
      const slider = this.container.querySelector(`.slider-range[data-id="${sliderId}"]`) as HTMLInputElement;
      const input = this.container.querySelector(`.slider-input[data-id="${sliderId}"]`) as HTMLInputElement;

      (this as any)[key] = slider;
      (this as any)[inputKey] = input;

      if (slider) {
        slider.addEventListener('input', (e) => {
          const value = parseFloat((e.target as HTMLInputElement).value);
          if (input) input.value = this.formatSliderValue(sliderId, value);
          this.scheduleUpdate(sliderId, value, params.id);
        });
      }

      if (input) {
        input.addEventListener('change', (e) => {
          let value = parseFloat((e.target as HTMLInputElement).value);
          if (slider) {
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            value = Math.max(min, Math.min(max, value));
            slider.value = value.toString();
          }
          this.scheduleUpdate(sliderId, value, params.id);
        });
      }
    });
  }

  private formatSliderValue(id: string, value: number): string {
    if (id === 'rotY' || id === 'posX' || id === 'posY' || id === 'posZ') {
      return value.toFixed(1);
    }
    return value.toFixed(1);
  }

  private scheduleUpdate(fieldId: string, rawValue: number, buildingId: string): void {
    this.pendingUpdates.set(fieldId, rawValue);
    if (this.updateDebounceTimers.has(fieldId)) {
      clearTimeout(this.updateDebounceTimers.get(fieldId));
    }
    const timer = window.setTimeout(() => {
      this.applyPendingUpdate(fieldId, buildingId);
    }, 50);
    this.updateDebounceTimers.set(fieldId, timer);
  }

  private applyPendingUpdate(fieldId: string, buildingId: string): void {
    if (!this.pendingUpdates.has(fieldId)) return;
    const value = this.pendingUpdates.get(fieldId)!;
    this.pendingUpdates.delete(fieldId);
    this.updateDebounceTimers.delete(fieldId);

    const updates: Partial<BuildingParams> = {};

    switch (fieldId) {
      case 'posX':
        updates.position = { ...this.sceneManager.getBuildingParams(buildingId)!.position, x: value };
        break;
      case 'posY':
        updates.position = { ...this.sceneManager.getBuildingParams(buildingId)!.position, y: value };
        break;
      case 'posZ':
        updates.position = { ...this.sceneManager.getBuildingParams(buildingId)!.position, z: value };
        break;
      case 'sizeW':
        updates.size = { ...this.sceneManager.getBuildingParams(buildingId)!.size, w: value };
        break;
      case 'sizeH':
        updates.size = { ...this.sceneManager.getBuildingParams(buildingId)!.size, h: value };
        break;
      case 'sizeD':
        updates.size = { ...this.sceneManager.getBuildingParams(buildingId)!.size, d: value };
        break;
      case 'rotY':
        updates.rotationY = (value * Math.PI) / 180;
        break;
    }

    this.sceneManager.updateBuilding(buildingId, updates);
  }

  private clearSliderReferences(): void {
    this.updateDebounceTimers.forEach((t) => clearTimeout(t));
    this.updateDebounceTimers.clear();
    this.pendingUpdates.clear();
    this.posXSlider = this.posYSlider = this.posZSlider = null;
    this.posXInput = this.posYInput = this.posZInput = null;
    this.sizeWSlider = this.sizeHSlider = this.sizeDSlider = null;
    this.sizeWInput = this.sizeHInput = this.sizeDInput = null;
    this.rotYSlider = this.rotYInput = null;
  }

  private updateTimeDisplay(time: number): void {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    if (this.timeDisplay) this.timeDisplay.textContent = timeStr;
    if (this.timeSlider) this.timeSlider.value = time.toString();
    if (this.timeIcon) {
      this.timeIcon.textContent = time >= 6 && time < 18 ? '☀️' : '🌙';
    }
  }

  private setupResponsive(): void {
    const checkViewport = () => {
      if (window.innerWidth < 1200) {
        this.hamburgerBtn.classList.add('visible');
        this.leftPanel.classList.add('hidden-mobile');
        this.rightPanel.classList.add('hidden-mobile');
      } else {
        this.hamburgerBtn.classList.remove('visible');
        this.mobileMenu.classList.remove('active');
        this.leftPanel.classList.remove('hidden-mobile');
        this.rightPanel.classList.remove('hidden-mobile');
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);

    this.hamburgerBtn.addEventListener('click', () => {
      const isActive = this.mobileMenu.classList.toggle('active');
      if (isActive) {
        const content = this.mobileMenu.querySelector('.mobile-menu-content')!;
        content.innerHTML = '';
        content.appendChild(this.leftPanel.cloneNode(true));
        content.appendChild(this.rightPanel.cloneNode(true));

        content.querySelectorAll('.building-card').forEach((card) => {
          card.addEventListener('click', () => {
            const type = (card as HTMLElement).dataset.type as BuildingType;
            this.sceneManager.addBuilding(type);
            this.mobileMenu.classList.remove('active');
          });
        });
      }
    });
  }

  setExportCallback(callback: ExportCallback): void {
    this.exportCallback = callback;
  }

  showCountdown(number: number): void {
    const overlay = this.container.querySelector('#countdown-overlay')!;
    const numEl = overlay.querySelector('.countdown-number')!;
    overlay.classList.remove('hidden');
    numEl.textContent = number.toString();
    numEl.classList.remove('animate');
    void numEl.offsetWidth;
    numEl.classList.add('animate');
  }

  hideCountdown(): void {
    this.container.querySelector('#countdown-overlay')!.classList.add('hidden');
  }

  showSuccess(downloadUrl: string): void {
    const overlay = this.container.querySelector('#success-overlay')!;
    const link = overlay.querySelector('#download-link') as HTMLAnchorElement;
    link.href = downloadUrl;
    overlay.classList.remove('hidden');

    setTimeout(() => {
      overlay.classList.add('fade-in');
    }, 50);
  }

  hideSuccess(): void {
    const overlay = this.container.querySelector('#success-overlay')!;
    overlay.classList.remove('fade-in');
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 300);
  }
}
