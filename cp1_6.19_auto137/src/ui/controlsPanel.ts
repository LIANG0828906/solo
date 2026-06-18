import { NoiseSourceData } from '../domain/noiseSource';

type EventBusLike = { on(e: string, f: Function): void; emit(e: string, d?: any): void };

const CATEGORY_LABELS: Record<string, string> = {
  traffic: '交通路口',
  construction: '工地',
  nightmarket: '夜市',
  factory: '工厂',
  vehicle: '车辆',
  temporary: '临时源',
};

const CATEGORY_ICONS: Record<string, string> = {
  traffic: '🚦',
  construction: '🏗️',
  nightmarket: '🎪',
  factory: '🏭',
  vehicle: '🚗',
  temporary: '📌',
};

function injectStyles(): void {
  const id = 'noise-panel-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .noise-panel {
      position: absolute;
      left: 20px;
      bottom: 20px;
      width: 280px;
      background: rgba(26, 26, 46, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 12px;
      padding: 18px 20px;
      color: #EAEAEA;
      font-size: 13px;
      z-index: 1000;
      border: 1px solid rgba(108, 99, 255, 0.18);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(108, 99, 255, 0.08);
      transition: transform 0.3s ease, opacity 0.3s ease;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
    }
    .noise-panel.hidden {
      transform: translateX(-320px);
      opacity: 0;
      pointer-events: none;
    }
    .noise-panel::-webkit-scrollbar { width: 4px; }
    .noise-panel::-webkit-scrollbar-track { background: transparent; }
    .noise-panel::-webkit-scrollbar-thumb { background: #4D4D66; border-radius: 2px; }
    .noise-section {
      margin-bottom: 16px;
    }
    .noise-section:last-child { margin-bottom: 0; }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #8888aa;
      margin-bottom: 8px;
    }
    .time-display {
      font-size: 16px;
      color: #EAEAEA;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .time-display .hour-val { color: #6C63FF; font-size: 18px; }
    .noise-panel input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: linear-gradient(to right, #2D2D44, #4D4D66);
      outline: none;
      cursor: pointer;
    }
    .noise-panel input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #6C63FF;
      border: 2px solid #ffffff;
      cursor: pointer;
      transition: transform 0.15s ease;
      box-shadow: 0 0 8px rgba(108, 99, 255, 0.5);
    }
    .noise-panel input[type="range"]::-webkit-slider-thumb:active {
      transform: scale(1.25);
    }
    .noise-panel input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #6C63FF;
      border: 2px solid #ffffff;
      cursor: pointer;
    }
    .view-toggle {
      display: flex;
      gap: 8px;
    }
    .view-btn {
      flex: 1;
      background: rgba(45, 45, 68, 0.6);
      border: 1px solid rgba(108, 99, 255, 0.25);
      color: #8888aa;
      padding: 7px 0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .view-btn:hover {
      border-color: rgba(108, 99, 255, 0.5);
      color: #bbb;
    }
    .view-btn.active {
      background: #6C63FF;
      color: #ffffff;
      border-color: #6C63FF;
      box-shadow: 0 2px 12px rgba(108, 99, 255, 0.35);
    }
    .source-list {
      max-height: 180px;
      overflow-y: auto;
    }
    .source-list::-webkit-scrollbar { width: 3px; }
    .source-list::-webkit-scrollbar-thumb { background: #4D4D66; border-radius: 2px; }
    .source-item {
      display: flex;
      align-items: center;
      padding: 5px 0;
      gap: 8px;
      font-size: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s;
    }
    .source-item:last-child { border-bottom: none; }
    .source-item:hover { background: rgba(108, 99, 255, 0.08); }
    .source-item input[type="checkbox"] {
      accent-color: #6C63FF;
      width: 14px;
      height: 14px;
      cursor: pointer;
    }
    .source-item .src-icon { font-size: 14px; }
    .source-item .src-name { flex: 1; color: #ccccdd; }
    .source-item .src-db {
      font-size: 11px;
      color: #6C63FF;
      font-weight: 600;
      min-width: 40px;
      text-align: right;
    }
    .temp-hint {
      font-size: 11px;
      color: #6C63FF;
      opacity: 0.7;
      text-align: center;
      padding: 4px 0;
    }
    .collapse-btn {
      position: absolute;
      right: 20px;
      bottom: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(108, 99, 255, 0.85);
      border: 2px solid rgba(255,255,255,0.2);
      color: white;
      font-size: 20px;
      cursor: pointer;
      z-index: 1001;
      display: none;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(108, 99, 255, 0.4);
      transition: transform 0.15s ease;
      font-family: inherit;
    }
    .collapse-btn:hover { transform: scale(1.1); }
    .collapse-btn:active { transform: scale(0.95); }
    .collapse-btn.visible { display: flex; }
    .source-popup {
      position: absolute;
      z-index: 1002;
      background: rgba(26, 26, 46, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 10px;
      padding: 14px 16px;
      color: #EAEAEA;
      font-size: 12px;
      border: 1px solid rgba(108, 99, 255, 0.25);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
      min-width: 160px;
      pointer-events: auto;
      animation: popupIn 0.2s ease;
    }
    .source-popup .popup-header {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
      color: #6C63FF;
    }
    .source-popup .popup-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      color: #bbbbcc;
    }
    .source-popup .popup-row span:last-child {
      color: #EAEAEA;
      font-weight: 500;
    }
    .source-popup .popup-close {
      position: absolute;
      top: 6px;
      right: 10px;
      background: none;
      border: none;
      color: #888;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .source-popup .popup-close:hover { color: #fff; }
    @keyframes popupIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .anim-1 { animation: fadeInDown 0.3s ease forwards; animation-delay: 0.05s; opacity: 0; }
    .anim-2 { animation: fadeInDown 0.3s ease forwards; animation-delay: 0.12s; opacity: 0; }
    .anim-3 { animation: fadeInDown 0.3s ease forwards; animation-delay: 0.19s; opacity: 0; }
    .anim-4 { animation: fadeInDown 0.3s ease forwards; animation-delay: 0.26s; opacity: 0; }
    .anim-5 { animation: fadeInDown 0.3s ease forwards; animation-delay: 0.33s; opacity: 0; }
    .anim-6 { animation: fadeInDown 0.3s ease forwards; animation-delay: 0.40s; opacity: 0; }
  `;
  document.head.appendChild(style);
}

export class ControlsPanel {
  private eventBus: EventBusLike;
  private panel: HTMLDivElement;
  private collapseBtn: HTMLButtonElement;
  private timeSlider: HTMLInputElement;
  private timeDisplay: HTMLSpanElement;
  private sourceList: HTMLDivElement;
  private intensitySlider: HTMLInputElement;
  private intensityDisplay: HTMLSpanElement;
  private heatmapBtn: HTMLButtonElement;
  private elevationBtn: HTMLButtonElement;
  private currentView: 'heatmap' | 'elevation' = 'heatmap';
  private popup: HTMLDivElement | null = null;
  private container: HTMLElement;
  private isPanelVisible = true;
  private lastSliderEmit = 0;

  constructor(eventBus: EventBusLike, sources: NoiseSourceData[], container: HTMLElement) {
    this.eventBus = eventBus;
    this.container = container;
    injectStyles();
    this.panel = this.createPanel(sources);
    this.collapseBtn = this.createCollapseButton();
    container.appendChild(this.panel);
    container.appendChild(this.collapseBtn);
    this.checkResponsive();
    window.addEventListener('resize', () => this.checkResponsive());
  }

  private createPanel(sources: NoiseSourceData[]): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'noise-panel';

    const timeSection = document.createElement('div');
    timeSection.className = 'noise-section anim-1';
    timeSection.innerHTML = `
      <div class="section-title">⏰ 时间控制</div>
      <div class="time-display">
        <span>当前时段:</span>
        <span class="hour-val">12:00</span>
      </div>
      <input type="range" min="0" max="23" value="12" step="1" />
    `;
    this.timeDisplay = timeSection.querySelector('.hour-val')!;
    this.timeSlider = timeSection.querySelector('input[type="range"]')!;
    this.timeSlider.addEventListener('input', () => {
      const hour = parseInt(this.timeSlider.value);
      this.timeDisplay.textContent = `${String(hour).padStart(2, '0')}:00`;
      const now = performance.now();
      if (now - this.lastSliderEmit > 100) {
        this.lastSliderEmit = now;
        this.eventBus.emit('timeChanged', hour);
      }
    });
    panel.appendChild(timeSection);

    const viewSection = document.createElement('div');
    viewSection.className = 'noise-section anim-2';
    viewSection.innerHTML = `<div class="section-title">📊 视图模式</div>`;
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'view-toggle';
    this.heatmapBtn = document.createElement('button');
    this.heatmapBtn.className = 'view-btn active';
    this.heatmapBtn.textContent = '热力图';
    this.elevationBtn = document.createElement('button');
    this.elevationBtn.className = 'view-btn';
    this.elevationBtn.textContent = '高度图';
    this.heatmapBtn.addEventListener('click', () => this.switchView('heatmap'));
    this.elevationBtn.addEventListener('click', () => this.switchView('elevation'));
    toggleDiv.appendChild(this.heatmapBtn);
    toggleDiv.appendChild(this.elevationBtn);
    viewSection.appendChild(toggleDiv);
    panel.appendChild(viewSection);

    const intensitySection = document.createElement('div');
    intensitySection.className = 'noise-section anim-3';
    intensitySection.innerHTML = `
      <div class="section-title">🔊 临时源强度</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="range" min="30" max="100" value="60" step="5" style="flex:1;" />
        <span style="min-width:48px;text-align:right;color:#6C63FF;font-weight:600;">60 dB</span>
      </div>
    `;
    this.intensitySlider = intensitySection.querySelector('input[type="range"]')!;
    this.intensityDisplay = intensitySection.querySelector('span')!;
    this.intensitySlider.addEventListener('input', () => {
      this.intensityDisplay.textContent = `${this.intensitySlider.value} dB`;
    });
    panel.appendChild(intensitySection);

    const sourceSection = document.createElement('div');
    sourceSection.className = 'noise-section anim-4';
    sourceSection.innerHTML = `<div class="section-title">📍 噪音源列表</div>`;
    this.sourceList = document.createElement('div');
    this.sourceList.className = 'source-list';
    this.populateSourceList(sources);
    sourceSection.appendChild(this.sourceList);
    panel.appendChild(sourceSection);

    const hintSection = document.createElement('div');
    hintSection.className = 'noise-section anim-5';
    hintSection.innerHTML = `<div class="temp-hint">💡 点击地面添加临时噪音源<br>点击已有临时源可删除</div>`;
    panel.appendChild(hintSection);

    return panel;
  }

  private populateSourceList(sources: NoiseSourceData[]): void {
    this.sourceList.innerHTML = '';
    sources.forEach(src => {
      const item = document.createElement('div');
      item.className = 'source-item';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = src.active;
      cb.addEventListener('change', () => {
        this.eventBus.emit('sourceToggled', { id: src.id });
      });

      const icon = document.createElement('span');
      icon.className = 'src-icon';
      icon.textContent = CATEGORY_ICONS[src.category] || '🔊';

      const name = document.createElement('span');
      name.className = 'src-name';
      name.textContent = CATEGORY_LABELS[src.category] || src.category;

      const db = document.createElement('span');
      db.className = 'src-db';
      db.textContent = `${Math.round(src.intensity)} dB`;

      item.appendChild(cb);
      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(db);
      this.sourceList.appendChild(item);
    });
  }

  private createCollapseButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'collapse-btn';
    btn.textContent = '☰';
    btn.addEventListener('click', () => {
      this.isPanelVisible = !this.isPanelVisible;
      if (this.isPanelVisible) {
        this.panel.classList.remove('hidden');
      } else {
        this.panel.classList.add('hidden');
      }
    });
    return btn;
  }

  private checkResponsive(): void {
    const isSmall = window.innerWidth < 900;
    if (isSmall) {
      this.collapseBtn.classList.add('visible');
      if (this.isPanelVisible) {
        this.isPanelVisible = false;
        this.panel.classList.add('hidden');
      }
    } else {
      this.collapseBtn.classList.remove('visible');
      this.isPanelVisible = true;
      this.panel.classList.remove('hidden');
    }
  }

  private switchView(mode: 'heatmap' | 'elevation'): void {
    if (mode === this.currentView) return;
    this.currentView = mode;
    this.heatmapBtn.classList.toggle('active', mode === 'heatmap');
    this.elevationBtn.classList.toggle('active', mode === 'elevation');
    this.eventBus.emit('viewChanged', mode);
  }

  showSourcePopup(source: NoiseSourceData, screenX: number, screenY: number): void {
    this.hidePopup();
    const popup = document.createElement('div');
    popup.className = 'source-popup';

    const x = Math.min(screenX + 15, window.innerWidth - 200);
    const y = Math.min(screenY - 10, window.innerHeight - 150);
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    popup.innerHTML = `
      <button class="popup-close">&times;</button>
      <div class="popup-header">${CATEGORY_ICONS[source.category] || ''} ${CATEGORY_LABELS[source.category] || source.category}</div>
      <div class="popup-row"><span>强度</span><span>${Math.round(source.intensity)} dB</span></div>
      <div class="popup-row"><span>类型</span><span>${source.isMobile ? '移动源' : '固定源'}</span></div>
      <div class="popup-row"><span>状态</span><span style="color:${source.active ? '#44cc44' : '#cc4444'}">${source.active ? '活跃' : '静默'}</span></div>
      <div class="popup-row"><span>扩散半径</span><span>${source.diffusionRadius} 单位</span></div>
      <div class="popup-row"><span>位置</span><span>(${source.position.x.toFixed(1)}, ${source.position.z.toFixed(1)})</span></div>
    `;

    popup.querySelector('.popup-close')!.addEventListener('click', () => this.hidePopup());
    this.container.appendChild(popup);
    this.popup = popup;

    setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (!popup.contains(e.target as Node)) {
          this.hidePopup();
          document.removeEventListener('mousedown', handler);
        }
      };
      document.addEventListener('mousedown', handler);
    }, 50);
  }

  hidePopup(): void {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }

  updateSourceList(sources: NoiseSourceData[]): void {
    const items = this.sourceList.querySelectorAll('.source-item');
    sources.forEach((src, i) => {
      if (items[i]) {
        const dbSpan = items[i].querySelector('.src-db');
        if (dbSpan) dbSpan.textContent = `${Math.round(src.intensity)} dB`;
        const cb = items[i].querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (cb) cb.checked = src.active;
      }
    });
  }

  getTempIntensity(): number {
    return parseInt(this.intensitySlider.value);
  }

  setCurrentView(mode: 'heatmap' | 'elevation'): void {
    this.currentView = mode;
    this.heatmapBtn.classList.toggle('active', mode === 'heatmap');
    this.elevationBtn.classList.toggle('active', mode === 'elevation');
  }
}
