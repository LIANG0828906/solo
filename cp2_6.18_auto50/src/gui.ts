import { PRESET_COLORS, GRID_SIZE } from './sceneManager';
import type { EditMode } from './interaction';

export interface GUIState {
  color: string;
  brushSize: number;
  mode: EditMode;
}

export interface GUIActions {
  onClearScene: () => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onModeChange: (mode: EditMode) => void;
}

const COLOR_NAMES: Record<string, string> = {
  '#FF3B30': '红色',
  '#FF9500': '橙色',
  '#FFCC00': '黄色',
  '#34C759': '绿色',
  '#5AC8FA': '青色',
  '#007AFF': '蓝色',
  '#AF52DE': '紫色',
  '#FF2D55': '粉色',
  '#A2845E': '棕色',
  '#FFFFFF': '白色'
};

export class GUIManager {
  private state: GUIState;
  private actions: GUIActions;
  private root: HTMLDivElement;
  private panelContent: HTMLDivElement;
  private isCollapsed: boolean = false;
  private colorSwatches: HTMLDivElement[] = [];
  private modeButtons: HTMLButtonElement[] = [];
  private brushDots: HTMLDivElement[] = [];
  private hoverCoordX?: HTMLElement;
  private hoverCoordY?: HTMLElement;
  private hoverCoordZ?: HTMLElement;
  private voxelCountEl?: HTMLElement;
  private previewColorBox?: HTMLDivElement;
  private brushValueEl?: HTMLElement;

  constructor(state: GUIState, actions: GUIActions) {
    this.state = state;
    this.actions = actions;
    this.root = document.createElement('div');
    this.panelContent = document.createElement('div');
    this.initStyles();
    this.buildPanel();
    document.body.appendChild(this.root);
  }

  private initStyles(): void {
    const styleId = 'voxelforge-custom-gui-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .vf-panel {
        position: absolute;
        top: 16px;
        left: 16px;
        width: 260px;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
        color: #E8E8E8;
        user-select: none;
      }
      .vf-panel * { box-sizing: border-box; }
      
      .vf-panel-card {
        background: linear-gradient(145deg, #1E1E24 0%, #18181C 100%);
        border-radius: 14px;
        box-shadow: 
          0 12px 40px rgba(0, 0, 0, 0.6),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
        overflow: hidden;
        backdrop-filter: blur(20px);
      }
      
      .vf-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: linear-gradient(90deg, rgba(0, 122, 255, 0.12), rgba(90, 200, 250, 0.06));
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .vf-header:hover {
        background: linear-gradient(90deg, rgba(0, 122, 255, 0.18), rgba(90, 200, 250, 0.10));
      }
      
      .vf-logo {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .vf-logo-icon {
        width: 26px;
        height: 26px;
        border-radius: 7px;
        background: linear-gradient(135deg, #007AFF 0%, #5AC8FA 50%, #34C759 100%);
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        padding: 3px;
        gap: 1px;
        box-shadow: 0 2px 8px rgba(0, 122, 255, 0.35);
      }
      .vf-logo-icon span {
        border-radius: 2px;
        background: rgba(255,255,255,0.55);
      }
      .vf-logo-icon span:nth-child(1) { opacity: 0.95; }
      .vf-logo-icon span:nth-child(2) { opacity: 0.75; }
      .vf-logo-icon span:nth-child(3) { opacity: 0.6; }
      .vf-logo-icon span:nth-child(4) { opacity: 0.4; }
      
      .vf-title {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.3px;
        background: linear-gradient(90deg, #FFFFFF 0%, #B4B4B8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .vf-subtitle {
        display: block;
        font-size: 10px;
        font-weight: 500;
        color: #88888C;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        margin-top: 1px;
      }
      
      .vf-collapse-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #88888C;
        transition: all 0.2s ease;
        font-size: 14px;
      }
      .vf-collapse-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #E8E8E8;
      }
      .vf-collapsed .vf-collapse-btn { transform: rotate(-90deg); }
      .vf-collapsed .vf-content { display: none; }
      
      .vf-content {
        padding: 4px 0;
      }
      
      .vf-section {
        padding: 12px 16px;
      }
      .vf-section + .vf-section {
        border-top: 1px solid rgba(255, 255, 255, 0.04);
      }
      
      .vf-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .vf-section-title {
        font-size: 11px;
        font-weight: 600;
        color: #88888C;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .vf-section-icon {
        width: 16px;
        height: 16px;
        opacity: 0.6;
      }
      
      .vf-color-picker {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        align-items: center;
      }
      .vf-preview-color {
        grid-column: span 5;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        margin-bottom: 4px;
      }
      .vf-preview-color-box {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        border: 2px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        position: relative;
        flex-shrink: 0;
        transition: transform 0.2s ease;
      }
      .vf-preview-color-box::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%);
      }
      .vf-preview-color-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
      .vf-preview-color-name { font-size: 13px; font-weight: 600; }
      .vf-preview-color-hex { font-size: 11px; color: #88888C; font-family: 'SF Mono', Consolas, monospace; }
      
      .vf-color-swatch {
        aspect-ratio: 1;
        border-radius: 8px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        min-height: 36px;
      }
      .vf-color-swatch::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: 6px;
        background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 45%);
        pointer-events: none;
      }
      .vf-color-swatch:hover {
        transform: translateY(-2px) scale(1.08);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        z-index: 5;
      }
      .vf-color-swatch.selected {
        border-color: #FFFFFF;
        box-shadow: 
          0 0 0 3px rgba(0, 122, 255, 0.35),
          0 4px 14px rgba(0, 122, 255, 0.35);
        transform: scale(1.05);
      }
      
      .vf-brush-control {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .vf-brush-dots {
        display: flex;
        gap: 5px;
        flex: 1;
        justify-content: space-between;
      }
      .vf-brush-dot {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.18s ease;
        position: relative;
      }
      .vf-brush-dot::before {
        content: '';
        border-radius: 50%;
        background: #6A6A6E;
        transition: all 0.18s ease;
      }
      .vf-brush-dot:nth-child(1)::before { width: 6px; height: 6px; }
      .vf-brush-dot:nth-child(2)::before { width: 9px; height: 9px; }
      .vf-brush-dot:nth-child(3)::before { width: 12px; height: 12px; }
      .vf-brush-dot:nth-child(4)::before { width: 15px; height: 15px; }
      .vf-brush-dot:nth-child(5)::before { width: 18px; height: 18px; }
      .vf-brush-dot:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.12);
      }
      .vf-brush-dot:hover::before { background: #9A9A9E; }
      .vf-brush-dot.active {
        background: linear-gradient(145deg, rgba(0, 122, 255, 0.22), rgba(0, 122, 255, 0.10));
        border-color: rgba(0, 122, 255, 0.5);
        box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
      }
      .vf-brush-dot.active::before { background: #007AFF; box-shadow: 0 0 6px rgba(0, 122, 255, 0.5); }
      .vf-brush-value {
        width: 40px;
        height: 36px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        color: #5AC8FA;
        font-family: 'SF Mono', Consolas, monospace;
      }
      
      .vf-mode-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .vf-mode-btn {
        padding: 10px 6px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.03);
        color: #88888C;
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        letter-spacing: 0.3px;
      }
      .vf-mode-btn svg { width: 18px; height: 18px; }
      .vf-mode-btn:hover {
        background: rgba(255, 255, 255, 0.07);
        color: #B8B8BC;
        border-color: rgba(255, 255, 255, 0.1);
      }
      .vf-mode-btn.active-place {
        background: linear-gradient(145deg, rgba(52, 199, 89, 0.22), rgba(52, 199, 89, 0.10));
        color: #34C759;
        border-color: rgba(52, 199, 89, 0.45);
        box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.12), inset 0 0 0 1px rgba(255,255,255,0.06);
      }
      .vf-mode-btn.active-remove {
        background: linear-gradient(145deg, rgba(255, 59, 48, 0.22), rgba(255, 59, 48, 0.10));
        color: #FF453A;
        border-color: rgba(255, 59, 48, 0.45);
        box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.12), inset 0 0 0 1px rgba(255,255,255,0.06);
      }
      .vf-mode-btn.active-view {
        background: linear-gradient(145deg, rgba(0, 122, 255, 0.22), rgba(0, 122, 255, 0.10));
        color: #0A84FF;
        border-color: rgba(0, 122, 255, 0.45);
        box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12), inset 0 0 0 1px rgba(255,255,255,0.06);
      }
      
      .vf-coords-display {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .vf-coord-item {
        padding: 8px 6px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 9px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        transition: all 0.2s ease;
      }
      .vf-coord-item.active {
        background: rgba(90, 200, 250, 0.10);
        border-color: rgba(90, 200, 250, 0.3);
      }
      .vf-coord-label {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.7;
      }
      .vf-coord-item:nth-child(1) .vf-coord-label { color: #FF453A; }
      .vf-coord-item:nth-child(2) .vf-coord-label { color: #34C759; }
      .vf-coord-item:nth-child(3) .vf-coord-label { color: #0A84FF; }
      .vf-coord-value {
        font-size: 15px;
        font-weight: 700;
        font-family: 'SF Mono', Consolas, monospace;
        color: #E8E8E8;
        transition: color 0.15s ease;
      }
      .vf-coord-item.active .vf-coord-value { color: #FFFFFF; }
      .vf-coord-item.invalid .vf-coord-value { color: #48484C; }
      
      .vf-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .vf-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
      .vf-stat + .vf-stat { border-left: 1px solid rgba(255, 255, 255, 0.06); }
      .vf-stat-label {
        font-size: 9px;
        font-weight: 600;
        color: #68686C;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      .vf-stat-value {
        font-size: 13px;
        font-weight: 700;
        color: #5AC8FA;
        font-family: 'SF Mono', Consolas, monospace;
      }
      .vf-stat-value .sub { color: #68686C; font-weight: 500; }
      
      .vf-clear-btn {
        width: 100%;
        padding: 12px;
        border: 1px solid rgba(255, 59, 48, 0.3);
        border-radius: 10px;
        background: linear-gradient(145deg, rgba(255, 59, 48, 0.18), rgba(255, 59, 48, 0.08));
        color: #FF6B60;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        letter-spacing: 0.2px;
      }
      .vf-clear-btn svg { width: 16px; height: 16px; }
      .vf-clear-btn:hover {
        background: linear-gradient(145deg, rgba(255, 59, 48, 0.28), rgba(255, 59, 48, 0.15));
        color: #FF8076;
        border-color: rgba(255, 59, 48, 0.5);
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(255, 59, 48, 0.20);
      }
      .vf-clear-btn:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  private buildPanel(): void {
    this.root.className = 'vf-panel';
    this.root.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'vf-panel-card';

    card.appendChild(this.buildHeader());
    this.panelContent.className = 'vf-content';
    this.panelContent.appendChild(this.buildColorSection());
    this.panelContent.appendChild(this.buildBrushSection());
    this.panelContent.appendChild(this.buildModeSection());
    this.panelContent.appendChild(this.buildCoordsSection());
    this.panelContent.appendChild(this.buildActionSection());
    card.appendChild(this.panelContent);

    this.root.appendChild(card);
  }

  private buildHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'vf-header';
    header.innerHTML = `
      <div class="vf-logo">
        <div class="vf-logo-icon">
          <span></span><span></span><span></span><span></span>
        </div>
        <div>
          <span class="vf-title">VoxelForge</span>
          <span class="vf-subtitle">3D Voxel Editor</span>
        </div>
      </div>
    `;

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'vf-collapse-btn';
    collapseBtn.innerHTML = '▾';
    collapseBtn.title = '折叠/展开';
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCollapse();
    });
    header.appendChild(collapseBtn);

    header.addEventListener('click', () => this.toggleCollapse());

    return header;
  }

  private buildColorSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'vf-section';

    section.appendChild(this.createSectionHeader('方块颜色', `
      <svg class="vf-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="13.5" cy="6.5" r="2.5"/>
        <circle cx="17.5" cy="10.5" r="2.5"/>
        <circle cx="8.5" cy="7.5" r="2.5"/>
        <circle cx="6.5" cy="12.5" r="2.5"/>
        <path d="M12 2a10 10 0 1 0 10 10 9.92 9.92 0 0 0-3-6.95"/>
      </svg>
    `));

    const picker = document.createElement('div');
    picker.className = 'vf-color-picker';

    const preview = document.createElement('div');
    preview.className = 'vf-preview-color';
    this.previewColorBox = document.createElement('div');
    this.previewColorBox.className = 'vf-preview-color-box';
    this.previewColorBox.style.background = this.state.color;

    const previewInfo = document.createElement('div');
    previewInfo.className = 'vf-preview-color-info';

    const colorName = document.createElement('span');
    colorName.className = 'vf-preview-color-name';
    colorName.textContent = COLOR_NAMES[this.state.color] || '自定义';

    const colorHex = document.createElement('span');
    colorHex.className = 'vf-preview-color-hex';
    colorHex.textContent = this.state.color;

    previewInfo.appendChild(colorName);
    previewInfo.appendChild(colorHex);
    preview.appendChild(this.previewColorBox);
    preview.appendChild(previewInfo);
    picker.appendChild(preview);

    this.colorSwatches = [];
    PRESET_COLORS.forEach((color) => {
      const swatch = document.createElement('div');
      swatch.className = 'vf-color-swatch';
      swatch.style.background = color;
      swatch.title = `${COLOR_NAMES[color] || color} - ${color}`;
      if (color === this.state.color) swatch.classList.add('selected');

      swatch.addEventListener('click', () => this.selectColor(color, swatch));

      this.colorSwatches.push(swatch);
      picker.appendChild(swatch);
    });

    section.appendChild(picker);
    return section;
  }

  private buildBrushSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'vf-section';

    section.appendChild(this.createSectionHeader('画刷大小', `
      <svg class="vf-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    `));

    const control = document.createElement('div');
    control.className = 'vf-brush-control';

    const dots = document.createElement('div');
    dots.className = 'vf-brush-dots';

    this.brushDots = [];
    for (let i = 1; i <= 5; i++) {
      const dot = document.createElement('div');
      dot.className = 'vf-brush-dot';
      if (i === this.state.brushSize) dot.classList.add('active');
      dot.title = `画刷大小 ${i}`;
      dot.addEventListener('click', () => this.selectBrushSize(i));
      this.brushDots.push(dot);
      dots.appendChild(dot);
    }

    const value = document.createElement('div');
    value.className = 'vf-brush-value';
    value.textContent = String(this.state.brushSize);
    this.brushValueEl = value;

    control.appendChild(dots);
    control.appendChild(value);
    section.appendChild(control);
    return section;
  }

  private buildModeSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'vf-section';

    section.appendChild(this.createSectionHeader('编辑模式', `
      <svg class="vf-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    `));

    const buttons = document.createElement('div');
    buttons.className = 'vf-mode-buttons';

    const modes: Array<{
      key: EditMode;
      label: string;
      activeClass: string;
      icon: string;
    }> = [
      {
        key: 'place', label: '放置', activeClass: 'active-place',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`
      },
      {
        key: 'remove', label: '移除', activeClass: 'active-remove',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`
      },
      {
        key: 'view', label: '查看', activeClass: 'active-view',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      }
    ];

    this.modeButtons = [];
    modes.forEach(({ key, label, activeClass, icon }) => {
      const btn = document.createElement('button');
      btn.className = `vf-mode-btn${this.state.mode === key ? ' ' + activeClass : ''}`;
      btn.innerHTML = `${icon}<span>${label}</span>`;
      btn.title = `${label}模式`;
      btn.dataset.mode = key;
      btn.dataset.activeClass = activeClass;

      btn.addEventListener('click', () => this.selectMode(key));

      this.modeButtons.push(btn);
      buttons.appendChild(btn);
    });

    section.appendChild(buttons);
    return section;
  }

  private buildCoordsSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'vf-section';

    section.appendChild(this.createSectionHeader('光标坐标', `
      <svg class="vf-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `));

    const coords = document.createElement('div');
    coords.className = 'vf-coords-display';

    const axes = ['X', 'Y', 'Z'];
    axes.forEach((axis) => {
      const item = document.createElement('div');
      item.className = 'vf-coord-item invalid';
      item.dataset.axis = axis;

      const label = document.createElement('span');
      label.className = 'vf-coord-label';
      label.textContent = axis;

      const value = document.createElement('span');
      value.className = 'vf-coord-value';
      value.textContent = '--';
      value.dataset.axis = axis.toLowerCase();

      if (axis === 'x') this.hoverCoordX = value;
      if (axis === 'y') this.hoverCoordY = value;
      if (axis === 'z') this.hoverCoordZ = value;

      item.appendChild(label);
      item.appendChild(value);
      coords.appendChild(item);
    });

    section.appendChild(coords);
    return section;
  }

  private buildActionSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'vf-section';

    section.appendChild(this.createSectionHeader('场景统计', `
      <svg class="vf-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    `));

    const stats = document.createElement('div');
    stats.className = 'vf-stats';
    stats.innerHTML = `
      <div class="vf-stat">
        <span class="vf-stat-label">网格</span>
        <span class="vf-stat-value">${GRID_SIZE}³</span>
      </div>
      <div class="vf-stat">
        <span class="vf-stat-label">方块</span>
        <span class="vf-stat-value"><span id="vf-voxel-count">${GRID_SIZE * GRID_SIZE}</span><span class="sub">/8000</span></span>
      </div>
    `;
    this.voxelCountEl = stats.querySelector('#vf-voxel-count') as HTMLElement;
    section.appendChild(stats);

    const spacer = document.createElement('div');
    spacer.style.height = '10px';
    section.appendChild(spacer);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'vf-clear-btn';
    clearBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M15 6V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2"/>
      </svg>
      <span>清空场景（保留地面）</span>
    `;
    clearBtn.addEventListener('click', () => {
      if (confirm('确定要清空所有已放置的方块吗？')) {
        this.actions.onClearScene();
      }
    });
    section.appendChild(clearBtn);

    return section;
  }

  private createSectionHeader(title: string, iconHtml: string): HTMLElement {
    const header = document.createElement('div');
    header.className = 'vf-section-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'vf-section-title';
    titleEl.textContent = title;

    const iconEl = document.createElement('div');
    iconEl.innerHTML = iconHtml;

    header.appendChild(titleEl);
    header.appendChild(iconEl);
    return header;
  }

  private selectColor(color: string, swatchEl: HTMLDivElement): void {
    this.state.color = color;
    this.colorSwatches.forEach(el => el.classList.remove('selected'));
    swatchEl.classList.add('selected');

    if (this.previewColorBox) {
      this.previewColorBox.style.background = color;
      const info = this.previewColorBox.parentElement?.querySelector('.vf-preview-color-info');
      if (info) {
        const name = info.querySelector('.vf-preview-color-name') as HTMLElement;
        const hex = info.querySelector('.vf-preview-color-hex') as HTMLElement;
        if (name) name.textContent = COLOR_NAMES[color] || '自定义';
        if (hex) hex.textContent = color;
      }
    }

    this.actions.onColorChange(color);
  }

  private selectBrushSize(size: number): void {
    this.state.brushSize = size;
    this.brushDots.forEach((el, i) => {
      el.classList.toggle('active', i + 1 === size);
    });
    if (this.brushValueEl) this.brushValueEl.textContent = String(size);
    this.actions.onBrushSizeChange(size);
  }

  private selectMode(mode: EditMode): void {
    this.state.mode = mode;
    this.modeButtons.forEach(btn => {
      const key = btn.dataset.mode as EditMode;
      const activeClass = btn.dataset.activeClass!;
      btn.classList.toggle(activeClass, key === mode);
    });
    this.actions.onModeChange(mode);
  }

  private toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.root.classList.toggle('vf-collapsed', this.isCollapsed);
  }

  public updateVoxelCount(count: number): void {
    if (this.voxelCountEl) this.voxelCountEl.textContent = String(count);
  }

  public updateHoverCoords(x: number | null, y: number | null, z: number | null): void {
    const updateAxis = (el: HTMLElement | undefined, value: number | null) => {
      if (!el) return;
      const parent = el.parentElement;
      if (value === null || value === undefined) {
        el.textContent = '--';
        parent?.classList.add('invalid');
        parent?.classList.remove('active');
      } else {
        el.textContent = String(value);
        parent?.classList.remove('invalid');
        parent?.classList.add('active');
      }
    };
    updateAxis(this.hoverCoordX, x);
    updateAxis(this.hoverCoordY, y);
    updateAxis(this.hoverCoordZ, z);
  }

  public dispose(): void {
    this.root.remove();
  }
}
