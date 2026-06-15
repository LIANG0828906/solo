import type { RoomParams, WindowParams, LightParams, ViewMode } from './renderer';
import { WALL_COLORS, WALL_COLOR_NAMES } from './renderer';

export interface UIState {
  room: RoomParams;
  light: LightParams;
  viewMode: ViewMode;
}

export type OnChangeCallback = (state: UIState) => void;

const FLOOR_MATERIAL_LABELS: Record<string, string> = {
  wood: '木地板',
  tile: '瓷砖',
  carpet: '地毯',
};

const ORIENTATION_LABELS: Record<string, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
};

export class UIPanel {
  private container: HTMLElement;
  private panel: HTMLElement;
  private contentArea: HTMLElement;
  private toggleBtn: HTMLElement;
  private onChange: OnChangeCallback;
  private state: UIState;
  private collapsed = false;
  private sliderBubbles: Map<string, HTMLElement> = new Map();
  private windowContainers: Map<string, HTMLElement> = new Map();

  constructor(parent: HTMLElement, onChange: OnChangeCallback) {
    this.onChange = onChange;
    this.state = {
      room: {
        length: 6,
        width: 4,
        wallColorIndex: 0,
        floorMaterial: 'wood',
      },
      light: {
        timeHour: 12,
        timeMinute: 0,
        windows: [this.createDefaultWindow('south')],
      },
      viewMode: 'perspective',
    };

    this.container = document.createElement('div');
    this.container.className = 'config-panel-container';

    this.panel = document.createElement('div');
    this.panel.className = 'config-panel';

    this.toggleBtn = document.createElement('button');
    this.toggleBtn.className = 'panel-toggle';
    this.toggleBtn.innerHTML = '◀';
    this.toggleBtn.addEventListener('click', () => this.togglePanel());

    this.contentArea = document.createElement('div');
    this.contentArea.className = 'panel-content';

    this.buildContent();

    this.panel.appendChild(this.contentArea);
    this.container.appendChild(this.panel);
    this.container.appendChild(this.toggleBtn);
    parent.appendChild(this.container);
  }

  private createDefaultWindow(orientation: 'east' | 'south' | 'west' | 'north'): WindowParams {
    return {
      id: 'w' + Date.now() + Math.random().toString(36).slice(2, 6),
      orientation,
      width: 1.5,
      height: 1.8,
      sillHeight: 0.8,
      transmittance: 0.8,
    };
  }

  private buildContent(): void {
    this.contentArea.innerHTML = '';

    this.addSectionTitle('房间参数');
    this.addSlider('roomLength', '长度', this.state.room.length, 3, 12, 0.5, 'm', (v) => {
      this.state.room.length = v;
      this.notify();
    });
    this.addSlider('roomWidth', '宽度', this.state.room.width, 3, 12, 0.5, 'm', (v) => {
      this.state.room.width = v;
      this.notify();
    });

    this.addSectionTitle('墙面颜色');
    this.addColorSelector();

    this.addSectionTitle('地板材质');
    this.addFloorMaterialSelector();

    this.addSectionTitle('光源设置');
    this.addWindowControls();

    this.addSectionTitle('时间设置');
    this.addTimeControls();

    this.addSectionTitle('视图模式');
    this.addViewModeControls();
  }

  private addSectionTitle(title: string): void {
    const el = document.createElement('div');
    el.className = 'section-title';
    el.textContent = title;
    this.contentArea.appendChild(el);
  }

  private addSlider(
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    unit: string,
    onChange: (v: number) => void,
  ): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'slider-group';

    const header = document.createElement('div');
    header.className = 'slider-header';

    const labelEl = document.createElement('span');
    labelEl.className = 'slider-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'slider-value';
    valueEl.textContent = `${value}${unit}`;

    header.appendChild(labelEl);
    header.appendChild(valueEl);

    const trackWrapper = document.createElement('div');
    trackWrapper.className = 'slider-track-wrapper';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    slider.className = 'slider-input';

    const bubble = document.createElement('div');
    bubble.className = 'slider-bubble';
    bubble.textContent = `${value}${unit}`;
    this.sliderBubbles.set(id, bubble);

    const tickContainer = document.createElement('div');
    tickContainer.className = 'slider-ticks';
    const tickCount = Math.floor((max - min) / step);
    for (let i = 0; i <= tickCount; i++) {
      const tick = document.createElement('div');
      tick.className = 'slider-tick';
      tickContainer.appendChild(tick);
    }

    const updateBubblePos = () => {
      const ratio = (parseFloat(slider.value) - min) / (max - min);
      const trackWidth = slider.offsetWidth || 240;
      bubble.style.left = `${ratio * trackWidth - 20}px`;
      bubble.textContent = `${slider.value}${unit}`;
    };

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      valueEl.textContent = `${v}${unit}`;
      updateBubblePos();
      onChange(v);
    });

    slider.addEventListener('mousedown', () => {
      bubble.classList.add('visible');
    });
    slider.addEventListener('touchstart', () => {
      bubble.classList.add('visible');
    });
    slider.addEventListener('mouseup', () => {
      bubble.classList.remove('visible');
    });
    slider.addEventListener('touchend', () => {
      bubble.classList.remove('visible');
    });

    trackWrapper.appendChild(tickContainer);
    trackWrapper.appendChild(slider);
    trackWrapper.appendChild(bubble);

    wrapper.appendChild(header);
    wrapper.appendChild(trackWrapper);
    this.contentArea.appendChild(wrapper);
  }

  private addColorSelector(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'color-selector';

    for (let i = 0; i < WALL_COLORS.length; i++) {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch' + (i === this.state.room.wallColorIndex ? ' active' : '');
      swatch.style.backgroundColor = WALL_COLORS[i];
      swatch.title = WALL_COLOR_NAMES[i];
      swatch.dataset.index = String(i);

      swatch.addEventListener('click', () => {
        this.state.room.wallColorIndex = i;
        wrapper.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.notify();
      });

      wrapper.appendChild(swatch);
    }

    this.contentArea.appendChild(wrapper);
  }

  private addFloorMaterialSelector(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'material-selector';

    const materials: Array<'wood' | 'tile' | 'carpet'> = ['wood', 'tile', 'carpet'];
    for (const mat of materials) {
      const btn = document.createElement('button');
      btn.className = 'material-btn' + (mat === this.state.room.floorMaterial ? ' active' : '');
      btn.textContent = FLOOR_MATERIAL_LABELS[mat];
      btn.dataset.material = mat;

      btn.addEventListener('click', () => {
        this.state.room.floorMaterial = mat;
        wrapper.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.notify();
      });

      wrapper.appendChild(btn);
    }

    this.contentArea.appendChild(wrapper);
  }

  private addWindowControls(): void {
    const container = document.createElement('div');
    container.className = 'window-controls';

    const addButton = document.createElement('button');
    addButton.className = 'btn btn-primary btn-sm';
    addButton.textContent = '+ 添加窗户';
    addButton.addEventListener('click', () => {
      if (this.state.light.windows.length >= 3) return;
      const orientations: Array<'east' | 'south' | 'west' | 'north'> = ['east', 'south', 'west', 'north'];
      const used = new Set(this.state.light.windows.map(w => w.orientation));
      const avail = orientations.find(o => !used.has(o)) || 'south';
      this.state.light.windows.push(this.createDefaultWindow(avail));
      this.rebuildWindowList(container);
      this.notify();
    });
    container.appendChild(addButton);

    const winList = document.createElement('div');
    winList.className = 'window-list';
    container.appendChild(winList);

    this.contentArea.appendChild(container);
    this.rebuildWindowList(container);
  }

  private rebuildWindowList(container: HTMLElement): void {
    const winList = container.querySelector('.window-list') as HTMLElement;
    if (!winList) return;
    winList.innerHTML = '';

    this.state.light.windows.forEach((win, idx) => {
      const winEl = document.createElement('div');
      winEl.className = 'window-item';
      winEl.dataset.windowId = win.id;

      const header = document.createElement('div');
      header.className = 'window-item-header';

      const title = document.createElement('span');
      title.textContent = `窗户 ${idx + 1}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-icon btn-remove';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', () => {
        if (this.state.light.windows.length <= 1) return;
        this.state.light.windows = this.state.light.windows.filter(w => w.id !== win.id);
        this.rebuildWindowList(container);
        this.notify();
      });

      header.appendChild(title);
      header.appendChild(removeBtn);
      winEl.appendChild(header);

      const orientRow = document.createElement('div');
      orientRow.className = 'window-orientation';
      const orients: Array<'east' | 'south' | 'west' | 'north'> = ['east', 'south', 'west', 'north'];
      for (const o of orients) {
        const ob = document.createElement('button');
        ob.className = 'orient-btn' + (win.orientation === o ? ' active' : '');
        ob.textContent = ORIENTATION_LABELS[o];
        ob.addEventListener('click', () => {
          win.orientation = o;
          orientRow.querySelectorAll('.orient-btn').forEach(b => b.classList.remove('active'));
          ob.classList.add('active');
          this.notify();
        });
        orientRow.appendChild(ob);
      }
      winEl.appendChild(orientRow);

      this.addSliderInWindow(winEl, 'ww' + win.id, '宽度', win.width, 0.5, 2.5, 0.1, 'm', (v) => {
        win.width = v;
        this.notify();
      });
      this.addSliderInWindow(winEl, 'wh' + win.id, '高度', win.height, 0.5, 2.5, 0.1, 'm', (v) => {
        win.height = v;
        this.notify();
      });
      this.addSliderInWindow(winEl, 'wsh' + win.id, '窗台高度', win.sillHeight, 0.3, 1.0, 0.1, 'm', (v) => {
        win.sillHeight = v;
        this.notify();
      });
      this.addSliderInWindow(winEl, 'wt' + win.id, '透光率', win.transmittance, 0.6, 0.9, 0.05, '', (v) => {
        win.transmittance = v;
        this.notify();
      });

      winList.appendChild(winEl);
    });
  }

  private addSliderInWindow(
    parent: HTMLElement,
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    unit: string,
    onChange: (v: number) => void,
  ): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'slider-group compact';

    const header = document.createElement('div');
    header.className = 'slider-header';

    const labelEl = document.createElement('span');
    labelEl.className = 'slider-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'slider-value';
    valueEl.textContent = unit ? `${value}${unit}` : value.toFixed(2);

    header.appendChild(labelEl);
    header.appendChild(valueEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    slider.className = 'slider-input';

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      valueEl.textContent = unit ? `${v}${unit}` : v.toFixed(2);
      onChange(v);
    });

    wrapper.appendChild(header);
    wrapper.appendChild(slider);
    parent.appendChild(wrapper);
  }

  private addTimeControls(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'time-controls';

    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'time-display';
    timeDisplay.textContent = this.formatTime(this.state.light.timeHour, this.state.light.timeMinute);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '95';
    slider.step = '1';
    slider.value = String(this.state.light.timeHour * 4 + this.state.light.timeMinute / 15);
    slider.className = 'slider-input time-slider';

    slider.addEventListener('input', () => {
      const totalSlots = parseInt(slider.value);
      this.state.light.timeHour = Math.floor(totalSlots / 4);
      this.state.light.timeMinute = (totalSlots % 4) * 15;
      timeDisplay.textContent = this.formatTime(this.state.light.timeHour, this.state.light.timeMinute);
      this.notify();
    });

    const timeLabels = document.createElement('div');
    timeLabels.className = 'time-labels';
    ['0:00', '6:00', '12:00', '18:00', '24:00'].forEach(t => {
      const lbl = document.createElement('span');
      lbl.textContent = t;
      timeLabels.appendChild(lbl);
    });

    wrapper.appendChild(timeDisplay);
    wrapper.appendChild(slider);
    wrapper.appendChild(timeLabels);

    this.contentArea.appendChild(wrapper);
  }

  private addViewModeControls(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'view-mode-controls';

    const modes: Array<{ mode: ViewMode; label: string }> = [
      { mode: 'top', label: '俯视图' },
      { mode: 'perspective', label: '透视图' },
    ];

    for (const { mode, label } of modes) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary view-btn' + (mode === this.state.viewMode ? ' active' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => {
        this.state.viewMode = mode;
        wrapper.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.notify();
      });
      wrapper.appendChild(btn);
    }

    this.contentArea.appendChild(wrapper);
  }

  private formatTime(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private togglePanel(): void {
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.panel.classList.add('collapsed');
      this.toggleBtn.classList.add('collapsed');
      this.toggleBtn.innerHTML = '▶';
    } else {
      this.panel.classList.remove('collapsed');
      this.toggleBtn.classList.remove('collapsed');
      this.toggleBtn.innerHTML = '◀';
    }
  }

  private notify(): void {
    this.onChange({ ...this.state });
  }

  getState(): UIState {
    return { ...this.state };
  }

  setState(state: UIState): void {
    this.state = { ...state, light: { ...state.light, windows: [...state.light.windows] } };
    this.buildContent();
  }
}

export function createSchemeControls(
  parent: HTMLElement,
  state: UIState,
  onSave: (state: UIState) => void,
  onCompare: () => void,
  onExport: () => void,
): void {
  const bar = document.createElement('div');
  bar.className = 'scheme-bar';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = '保存方案';
  saveBtn.addEventListener('click', () => onSave(state));

  const compareBtn = document.createElement('button');
  compareBtn.className = 'btn btn-secondary';
  compareBtn.textContent = '方案对比';
  compareBtn.addEventListener('click', () => onCompare());

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-secondary';
  exportBtn.textContent = '导出PNG';
  exportBtn.addEventListener('click', () => onExport());

  bar.appendChild(saveBtn);
  bar.appendChild(compareBtn);
  bar.appendChild(exportBtn);
  parent.appendChild(bar);
}

export function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .config-panel-container {
      position: relative;
      z-index: 10;
      flex-shrink: 0;
    }

    .config-panel {
      width: 320px;
      height: 100vh;
      background: #2D2D2D;
      overflow-y: auto;
      overflow-x: hidden;
      transition: transform 0.3s ease, width 0.3s ease;
      border-right: 1px solid #3A3A3A;
    }
    .config-panel.collapsed {
      transform: translateX(-320px);
      width: 0;
      overflow: hidden;
    }
    .config-panel::-webkit-scrollbar {
      width: 6px;
    }
    .config-panel::-webkit-scrollbar-track {
      background: #2D2D2D;
    }
    .config-panel::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 3px;
    }

    .panel-toggle {
      position: absolute;
      top: 12px;
      right: -36px;
      width: 32px;
      height: 32px;
      background: #2D2D2D;
      border: 1px solid #3A3A3A;
      border-left: none;
      color: #4A90D9;
      font-size: 14px;
      cursor: pointer;
      border-radius: 0 6px 6px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
      z-index: 11;
    }
    .panel-toggle.collapsed {
      transform: rotate(180deg);
    }
    .panel-toggle:hover {
      background: #363636;
      color: #5BA3EC;
    }

    .panel-content {
      padding: 16px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #4A90D9;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 18px 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #3A3A3A;
    }
    .section-title:first-child {
      margin-top: 0;
    }

    .slider-group {
      margin: 8px 0;
    }
    .slider-group.compact {
      margin: 6px 0;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .slider-label {
      font-size: 12px;
      color: #BBB;
    }

    .slider-value {
      font-size: 12px;
      color: #4A90D9;
      font-weight: 600;
      font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    }

    .slider-track-wrapper {
      position: relative;
      padding: 4px 0;
    }

    .slider-ticks {
      display: flex;
      justify-content: space-between;
      padding: 0 2px;
      margin-bottom: -4px;
    }
    .slider-tick {
      width: 1px;
      height: 4px;
      background: #555;
    }

    .slider-input {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #444;
      outline: none;
      cursor: pointer;
    }
    .slider-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4A90D9;
      cursor: pointer;
      border: 2px solid #2D2D2D;
      transition: background 0.2s;
    }
    .slider-input::-webkit-slider-thumb:hover {
      background: #5BA3EC;
    }
    .slider-input::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4A90D9;
      cursor: pointer;
      border: 2px solid #2D2D2D;
    }

    .slider-bubble {
      position: absolute;
      top: -24px;
      left: 0;
      background: #4A90D9;
      color: white;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      white-space: nowrap;
    }
    .slider-bubble.visible {
      opacity: 1;
    }

    .color-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0;
    }

    .color-swatch {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s, transform 0.15s;
    }
    .color-swatch:hover {
      transform: scale(1.15);
    }
    .color-swatch.active {
      border-color: #4A90D9;
      box-shadow: 0 0 0 1px #4A90D9;
    }

    .material-selector {
      display: flex;
      gap: 8px;
      margin: 8px 0;
    }

    .material-btn {
      flex: 1;
      padding: 8px 4px;
      background: #3A3A3A;
      color: #CCC;
      border: 1px solid #444;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .material-btn:hover {
      background: #444;
      color: #5BA3EC;
    }
    .material-btn.active {
      background: #4A90D9;
      color: white;
      border-color: #4A90D9;
    }

    .window-controls {
      margin: 8px 0;
    }

    .window-list {
      margin-top: 8px;
    }

    .window-item {
      background: #363636;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
      border: 1px solid #3A3A3A;
    }

    .window-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .window-item-header span {
      font-size: 12px;
      font-weight: 600;
      color: #DDD;
    }

    .btn-remove {
      background: none;
      border: none;
      color: #888;
      font-size: 14px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .btn-remove:hover {
      color: #E55;
      background: rgba(238,85,85,0.15);
    }

    .window-orientation {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
    }

    .orient-btn {
      flex: 1;
      padding: 4px;
      background: #2D2D2D;
      color: #AAA;
      border: 1px solid #444;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .orient-btn:hover {
      color: #5BA3EC;
      border-color: #5BA3EC;
    }
    .orient-btn.active {
      background: #4A90D9;
      color: white;
      border-color: #4A90D9;
    }

    .time-controls {
      margin: 8px 0;
    }

    .time-display {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      color: #4A90D9;
      font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
      margin-bottom: 8px;
    }

    .time-slider {
      margin-bottom: 4px;
    }

    .time-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }

    .view-mode-controls {
      display: flex;
      gap: 8px;
      margin: 8px 0;
    }

    .view-btn {
      flex: 1;
      padding: 8px;
      font-size: 12px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #4A90D9;
      color: white;
    }
    .btn-primary:hover {
      background: #5BA3EC;
    }
    .btn-secondary {
      background: #3A3A3A;
      color: #CCC;
      border: 1px solid #444;
    }
    .btn-secondary:hover {
      background: #444;
      color: #5BA3EC;
      border-color: #5BA3EC;
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .scheme-bar {
      position: absolute;
      bottom: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
      z-index: 20;
    }

    .compare-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      z-index: 100;
      display: flex;
      flex-direction: column;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    }
    .compare-overlay.closing {
      animation: fadeOut 0.3s ease forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    .compare-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .compare-header h2 {
      color: #E0E0E0;
      font-size: 18px;
      font-weight: 600;
    }

    .compare-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      overflow: hidden;
    }

    .compare-cell {
      background: #2D2D2D;
      border-radius: 8px;
      border: 1px solid #3A3A3A;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .compare-cell:hover {
      border-color: #4A90D9;
    }

    .compare-cell-header {
      padding: 8px 12px;
      background: #333;
      border-bottom: 1px solid #3A3A3A;
    }
    .compare-cell-label {
      font-size: 13px;
      font-weight: 600;
      color: #4A90D9;
    }
    .compare-cell-summary {
      font-size: 10px;
      color: #888;
      margin-top: 2px;
    }

    .compare-cell-canvas {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .compare-cell-canvas canvas {
      max-width: 100%;
      max-height: 100%;
    }

    .compare-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #555;
      font-size: 14px;
      grid-column: 1 / -1;
    }

    .fullscreen-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.95);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }
    .fullscreen-overlay canvas {
      max-width: 90vw;
      max-height: 90vh;
    }

    @media (max-width: 1440px) and (min-width: 769px) {
      .config-panel-container {
        width: 100%;
        position: relative;
      }
      .config-panel {
        width: 100%;
        height: auto;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
        border-right: none;
        border-bottom: 1px solid #3A3A3A;
      }
      .config-panel:not(.collapsed) {
        max-height: 60vh;
      }
      .panel-toggle {
        top: auto;
        bottom: -32px;
        right: 50%;
        transform: translateX(-50%) rotate(90deg);
        border-radius: 0 0 6px 6px;
      }
      .panel-toggle.collapsed {
        transform: translateX(-50%) rotate(-90deg);
      }
    }

    @media (max-width: 768px) {
      .config-panel {
        position: fixed;
        top: 0; left: 0; bottom: 0;
        z-index: 50;
      }
      .panel-toggle {
        position: fixed;
        top: 12px;
        left: 12px;
        right: auto;
        border-left: 1px solid #3A3A3A;
        border-radius: 6px;
        z-index: 51;
      }
    }
  `;
  document.head.appendChild(style);
}
