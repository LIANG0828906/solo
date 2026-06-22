import type { WindChangeCallback, SpeedChangeCallback, TurbChangeCallback, WindParams } from './types';
import { pollutionModule } from './pollutionModule';

export class UIModule {
  private container: HTMLDivElement | null = null;
  private toggleButton: HTMLButtonElement | null = null;
  private panel: HTMLDivElement | null = null;
  private panelVisible = true;

  private windDirDisk: HTMLDivElement | null = null;
  private windDirPointer: HTMLDivElement | null = null;
  private windDirValue: HTMLSpanElement | null = null;
  private windDirAngle = 45;
  private isDraggingDisk = false;

  private speedSlider: HTMLInputElement | null = null;
  private speedValue: HTMLSpanElement | null = null;

  private turbLow: HTMLButtonElement | null = null;
  private turbMedium: HTMLButtonElement | null = null;
  private turbHigh: HTMLButtonElement | null = null;

  private sourceContainer: HTMLDivElement | null = null;

  private onWindChange: WindChangeCallback = () => {};
  private onSpeedChange: SpeedChangeCallback = () => {};
  private onTurbChange: TurbChangeCallback = () => {};

  private readonly BREAKPOINT = 1440;

  initUI(
    onWindChange: WindChangeCallback,
    onSpeedChange: SpeedChangeCallback,
    onTurbChange: TurbChangeCallback
  ): void {
    this.onWindChange = onWindChange;
    this.onSpeedChange = onSpeedChange;
    this.onTurbChange = onTurbChange;

    this.createContainer();
    this.createToggleButton();
    this.createPanel();
    this.setupResponsive();
    this.updateSourceList();
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'ui-container';
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '100',
    });
    document.body.appendChild(this.container);

    const style = document.createElement('style');
    style.textContent = `
      #ui-container * {
        box-sizing: border-box;
      }
      .ui-panel {
        position: fixed;
        top: 50%;
        left: 24px;
        transform: translateY(-50%);
        width: 300px;
        max-height: calc(100vh - 48px);
        overflow-y: auto;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 20px;
        padding: 24px;
        pointer-events: auto;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        color: #e0edff;
      }
      .ui-panel.hidden-panel {
        transform: translateY(-50%) translateX(-360px);
        opacity: 0;
        pointer-events: none;
      }
      .ui-panel::-webkit-scrollbar {
        width: 6px;
      }
      .ui-panel::-webkit-scrollbar-track {
        background: transparent;
      }
      .ui-panel::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.15);
        border-radius: 3px;
      }
      .ui-toggle-btn {
        position: fixed;
        top: 50%;
        left: 24px;
        transform: translateY(-50%);
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #7dd3fc;
        cursor: pointer;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        z-index: 101;
      }
      .ui-toggle-btn:hover {
        transform: translateY(-50%) scale(1.08);
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
      }
      .panel-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
        color: #bae6fd;
        letter-spacing: 0.5px;
      }
      .panel-subtitle {
        font-size: 11px;
        color: rgba(186, 230, 253, 0.5);
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .section-title {
        font-size: 12px;
        font-weight: 600;
        color: #7dd3fc;
        margin: 0 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(125, 211, 252, 0.15);
        text-transform: uppercase;
        letter-spacing: 1.2px;
      }
      .control-group {
        margin-bottom: 22px;
      }
      .disk-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .wind-disk {
        position: relative;
        width: 160px;
        height: 160px;
        border-radius: 50%;
        background: radial-gradient(circle at center, rgba(125, 211, 252, 0.06) 0%, rgba(30, 58, 95, 0.2) 100%);
        border: 1px solid rgba(125, 211, 252, 0.25);
        cursor: grab;
        user-select: none;
        transition: box-shadow 0.3s ease;
      }
      .wind-disk:hover {
        box-shadow: 0 0 30px rgba(125, 211, 252, 0.15), inset 0 0 20px rgba(125, 211, 252, 0.08);
      }
      .wind-disk:active {
        cursor: grabbing;
      }
      .wind-disk.dragging {
        cursor: grabbing;
        box-shadow: 0 0 40px rgba(255, 152, 0, 0.3), inset 0 0 25px rgba(255, 152, 0, 0.1);
      }
      .disk-tick {
        position: absolute;
        width: 2px;
        height: 6px;
        background: rgba(125, 211, 252, 0.4);
        left: 50%;
        top: 4px;
        transform-origin: 50% 76px;
      }
      .disk-tick.major {
        width: 3px;
        height: 10px;
        background: #7dd3fc;
      }
      .disk-label {
        position: absolute;
        font-size: 9px;
        color: #7dd3fc;
        font-weight: 600;
        left: 50%;
        transform: translateX(-50%);
      }
      .disk-center {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #38bdf8;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
      }
      .wind-pointer {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 4px;
        height: 60px;
        transform-origin: 50% 100%;
        transform: translate(-50%, -100%);
        z-index: 2;
        pointer-events: none;
      }
      .wind-pointer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 14px solid #fb923c;
        filter: drop-shadow(0 0 6px rgba(251, 146, 60, 0.7));
      }
      .wind-pointer::after {
        content: '';
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        width: 3px;
        height: 50px;
        background: linear-gradient(to bottom, #fb923c, #f97316);
        border-radius: 2px;
      }
      .direction-value {
        font-family: 'Consolas', monospace;
        font-size: 13px;
        color: #bae6fd;
        background: rgba(125, 211, 252, 0.08);
        padding: 5px 14px;
        border-radius: 12px;
        border: 1px solid rgba(125, 211, 252, 0.15);
      }
      .slider-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .slider-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: rgba(186, 230, 253, 0.8);
      }
      .slider-value {
        font-family: 'Consolas', monospace;
        color: #7dd3fc;
        font-weight: 600;
      }
      .custom-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: rgba(125, 211, 252, 0.1);
        outline: none;
        cursor: pointer;
      }
      .custom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #7dd3fc, #0284c7);
        cursor: pointer;
        border: 2px solid rgba(186, 230, 253, 0.4);
        box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .custom-slider::-webkit-slider-thumb:hover {
        transform: scale(1.15);
        box-shadow: 0 3px 12px rgba(56, 189, 248, 0.6);
      }
      .custom-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #7dd3fc, #0284c7);
        cursor: pointer;
        border: 2px solid rgba(186, 230, 253, 0.4);
        box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4);
      }
      .turb-buttons {
        display: flex;
        gap: 8px;
      }
      .turb-btn {
        flex: 1;
        padding: 9px 6px;
        border-radius: 14px;
        border: 1px solid rgba(125, 211, 252, 0.2);
        background: rgba(255, 255, 255, 0.04);
        color: rgba(186, 230, 253, 0.7);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        letter-spacing: 0.5px;
      }
      .turb-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
        border-color: rgba(125, 211, 252, 0.4);
      }
      .turb-btn.active {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(99, 102, 241, 0.25));
        border-color: #38bdf8;
        color: #ffffff;
        box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
      }
      .source-item {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(251, 146, 60, 0.15);
        border-radius: 14px;
        padding: 12px;
        margin-bottom: 10px;
      }
      .source-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .source-name {
        font-size: 12px;
        font-weight: 600;
        color: #fb923c;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .source-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: radial-gradient(circle, #ff6b6b, #ef4444);
        box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
        animation: pulse 1.5s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.2); }
      }
      .remove-btn {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid rgba(239, 68, 68, 0.3);
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }
      .remove-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      }
      .empty-source {
        font-size: 11px;
        color: rgba(186, 230, 253, 0.4);
        text-align: center;
        padding: 16px 8px;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);
  }

  private createToggleButton(): void {
    if (!this.container) return;

    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'ui-toggle-btn';
    this.toggleButton.innerHTML = '⚙';
    this.toggleButton.title = '打开控制面板';
    this.toggleButton.addEventListener('click', () => this.togglePanel());
    this.container.appendChild(this.toggleButton);
  }

  private createPanel(): void {
    if (!this.container) return;

    this.panel = document.createElement('div');
    this.panel.className = 'ui-panel';
    this.panel.innerHTML = `
      <div class="panel-title">🌬 城市风环境模拟</div>
      <div class="panel-subtitle">Wind & Pollution Control</div>

      <div class="control-group">
        <div class="section-title">风向控制 · Wind Direction</div>
        <div class="disk-wrapper">
          <div class="wind-disk" id="windDisk"></div>
          <div class="direction-value">角度: <span id="windDirValue">45</span>°</div>
        </div>
      </div>

      <div class="control-group">
        <div class="section-title">风速 · Wind Speed</div>
        <div class="slider-container">
          <div class="slider-row">
            <span>风速</span>
            <span class="slider-value"><span id="speedValue">8</span> m/s</span>
          </div>
          <input type="range" class="custom-slider" id="speedSlider" min="0" max="20" step="0.5" value="8">
        </div>
      </div>

      <div class="control-group">
        <div class="section-title">湍流强度 · Turbulence</div>
        <div class="turb-buttons">
          <button class="turb-btn" data-turb="low">低</button>
          <button class="turb-btn active" data-turb="medium">中</button>
          <button class="turb-btn" data-turb="high">高</button>
        </div>
      </div>

      <div class="control-group">
        <div class="section-title">污染源 · Pollution Sources</div>
        <div id="sourceContainer">
          <div class="empty-source">点击场景放置污染源<br>（最多 3 个）</div>
        </div>
      </div>
    `;
    this.container.appendChild(this.panel);

    this.windDirDisk = this.panel.querySelector('#windDisk') as HTMLDivElement;
    this.windDirValue = this.panel.querySelector('#windDirValue') as HTMLSpanElement;
    this.buildDiskTicks();
    this.createPointer();
    this.attachDiskEvents();

    this.speedSlider = this.panel.querySelector('#speedSlider') as HTMLInputElement;
    this.speedValue = this.panel.querySelector('#speedValue') as HTMLSpanElement;
    this.speedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.speedValue.textContent = value.toString();
      this.onSpeedChange(value);
    });

    this.turbLow = this.panel.querySelector('[data-turb="low"]') as HTMLButtonElement;
    this.turbMedium = this.panel.querySelector('[data-turb="medium"]') as HTMLButtonElement;
    this.turbHigh = this.panel.querySelector('[data-turb="high"]') as HTMLButtonElement;

    [this.turbLow, this.turbMedium, this.turbHigh].forEach(btn => {
      btn.addEventListener('click', () => {
        [this.turbLow, this.turbMedium, this.turbHigh].forEach(b => b?.classList.remove('active'));
        btn.classList.add('active');
        this.onTurbChange(btn.dataset.turb as 'low' | 'medium' | 'high');
      });
    });

    this.sourceContainer = this.panel.querySelector('#sourceContainer') as HTMLDivElement;
  }

  private buildDiskTicks(): void {
    if (!this.windDirDisk) return;

    for (let angle = 0; angle < 360; angle += 10) {
      const tick = document.createElement('div');
      tick.className = 'disk-tick' + (angle % 90 === 0 ? ' major' : '');
      tick.style.transform = `translateX(-50%) rotate(${angle}deg)`;
      this.windDirDisk.appendChild(tick);
    }

    const labels: { angle: number; text: string; top: string; left: string; translateX: string }[] = [
      { angle: 0, text: 'N', top: '6px', left: '50%', translateX: '-50%' },
      { angle: 90, text: 'E', top: '50%', left: 'calc(100% - 6px)', translateX: '-100%' },
      { angle: 180, text: 'S', top: 'calc(100% - 6px)', left: '50%', translateX: '-50%' },
      { angle: 270, text: 'W', top: '50%', left: '6px', translateX: '0%' },
    ];

    labels.forEach(l => {
      const label = document.createElement('div');
      label.className = 'disk-label';
      label.textContent = l.text;
      label.style.top = l.top;
      label.style.left = l.left;
      label.style.transform = `translateX(${l.translateX}) translateY(-50%)`;
      if (l.angle === 0 || l.angle === 180) {
        label.style.transform = `translateX(${l.translateX})`;
      }
      this.windDirDisk!.appendChild(label);
    });

    const center = document.createElement('div');
    center.className = 'disk-center';
    this.windDirDisk.appendChild(center);
  }

  private createPointer(): void {
    if (!this.windDirDisk) return;

    this.windDirPointer = document.createElement('div');
    this.windDirPointer.className = 'wind-pointer';
    this.windDirDisk.appendChild(this.windDirPointer);
    this.updatePointer(this.windDirAngle);
  }

  private attachDiskEvents(): void {
    if (!this.windDirDisk) return;

    const onStart = (clientX: number, clientY: number) => {
      this.isDraggingDisk = true;
      this.windDirDisk!.classList.add('dragging');
      this.updateAngleFromPointer(clientX, clientY);
    };

    const onMove = (clientX: number, clientY: number) => {
      if (!this.isDraggingDisk) return;
      this.updateAngleFromPointer(clientX, clientY);
    };

    const onEnd = () => {
      this.isDraggingDisk = false;
      this.windDirDisk?.classList.remove('dragging');
    };

    this.windDirDisk.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onStart(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
      onMove(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', onEnd);

    this.windDirDisk.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    });

    document.addEventListener('touchend', onEnd);
  }

  private updateAngleFromPointer(clientX: number, clientY: number): void {
    if (!this.windDirDisk) return;

    const rect = this.windDirDisk.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    angle = Math.round(angle);
    this.windDirAngle = angle;
    this.updatePointer(angle);

    if (this.windDirValue) {
      this.windDirValue.textContent = angle.toString();
    }

    this.onWindChange({ direction: angle } as WindParams);
  }

  private updatePointer(angle: number): void {
    if (!this.windDirPointer) return;
    this.windDirPointer.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
  }

  setWindDirection(angle: number): void {
    this.windDirAngle = angle;
    this.updatePointer(angle);
    if (this.windDirValue) {
      this.windDirValue.textContent = Math.round(angle).toString();
    }
  }

  private setupResponsive(): void {
    const checkWidth = () => {
      const width = window.innerWidth;
      if (width < this.BREAKPOINT) {
        this.hidePanel();
      } else {
        this.showPanel();
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
  }

  private showPanel(): void {
    this.panel?.classList.remove('hidden-panel');
    if (this.toggleButton) {
      this.toggleButton.style.display = 'none';
    }
    this.panelVisible = true;
  }

  private hidePanel(): void {
    this.panel?.classList.add('hidden-panel');
    if (this.toggleButton) {
      this.toggleButton.style.display = 'flex';
      this.toggleButton.innerHTML = '⚙';
      this.toggleButton.title = '打开控制面板';
    }
    this.panelVisible = false;
  }

  private togglePanel(): void {
    if (this.panelVisible) {
      this.hidePanel();
    } else {
      this.panel?.classList.remove('hidden-panel');
      this.panelVisible = true;
      if (this.toggleButton) {
        this.toggleButton.innerHTML = '✕';
        this.toggleButton.title = '关闭控制面板';
      }
    }
  }

  updateSourceList(): void {
    if (!this.sourceContainer) return;

    const sources = pollutionModule.getSources();

    if (sources.length === 0) {
      this.sourceContainer.innerHTML = `<div class="empty-source">点击场景放置污染源<br>（最多 ${pollutionModule.getMaxSources()} 个）</div>`;
      return;
    }

    this.sourceContainer.innerHTML = '';

    sources.forEach((source, idx) => {
      const item = document.createElement('div');
      item.className = 'source-item';
      item.innerHTML = `
        <div class="source-header">
          <span class="source-name">
            <span class="source-dot"></span>
            污染源 #${idx + 1}
          </span>
          <button class="remove-btn" data-idx="${idx}" title="移除">✕</button>
        </div>
        <div class="slider-container">
          <div class="slider-row">
            <span style="font-size:11px;color:rgba(186,230,253,0.7)">释放速率</span>
            <span class="slider-value" style="font-size:11px"><span id="rateVal-${idx}">${source.rate}</span> /s</span>
          </div>
          <input type="range" class="custom-slider" id="rateSlider-${idx}" min="1" max="10" step="1" value="${source.rate}">
        </div>
      `;
      this.sourceContainer!.appendChild(item);

      const removeBtn = item.querySelector(`.remove-btn`) as HTMLButtonElement;
      removeBtn.addEventListener('click', () => {
        pollutionModule.removeSource(idx);
        this.updateSourceList();
      });

      const slider = item.querySelector(`#rateSlider-${idx}`) as HTMLInputElement;
      const rateVal = item.querySelector(`#rateVal-${idx}`) as HTMLSpanElement;
      slider.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        rateVal.textContent = val.toString();
        pollutionModule.setSourceRate(idx, val);
      });
    });
  }
}

export const uiModule = new UIModule();
