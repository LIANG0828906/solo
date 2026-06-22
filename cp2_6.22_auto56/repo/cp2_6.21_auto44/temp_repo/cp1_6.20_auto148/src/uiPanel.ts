const PANEL_WIDTH = 280;

export interface UIPanelCallbacks {
  onWallTypeChange: (type: string) => void;
  onWindPressureChange: (pressure: number) => void;
  onWindDirectionChange: (direction: number) => void;
}

export class UIPanel {
  private callbacks: UIPanelCallbacks;
  private panel: HTMLDivElement;
  private toggleBtn: HTMLButtonElement | null = null;
  private pressureLabel: HTMLSpanElement | null = null;
  private directionLabel: HTMLSpanElement | null = null;
  private panelVisible: boolean = true;

  constructor(callbacks: UIPanelCallbacks) {
    this.callbacks = callbacks;
    this.injectStyles();
    this.panel = this.createPanel();
    this.createToggle();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #control-panel {
        width: ${PANEL_WIDTH}px;
        min-width: ${PANEL_WIDTH}px;
        height: 100vh;
        background: rgba(26, 26, 46, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 0 12px 12px 0;
        padding: 24px 20px;
        color: #e0e0e0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        overflow-y: auto;
        z-index: 100;
        transition: transform 0.3s ease;
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
      }
      #control-panel.hidden {
        transform: translateX(-100%);
      }
      .panel-title {
        font-size: 18px;
        font-weight: 600;
        color: #81d4fa;
        margin-bottom: 28px;
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(79, 195, 247, 0.2);
        padding-bottom: 14px;
      }
      .control-group {
        margin-bottom: 24px;
      }
      .control-label {
        display: block;
        font-size: 13px;
        color: #9e9e9e;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .control-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .control-row select,
      .control-row input[type="range"] {
        flex: 1;
      }
      .value-label {
        font-size: 14px;
        color: #81d4fa;
        min-width: 58px;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      select {
        width: 100%;
        padding: 10px 14px;
        background: linear-gradient(135deg, #2d2d44, #3d3d5c);
        color: #e0e0e0;
        border: 1px solid rgba(79, 195, 247, 0.2);
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2381d4fa' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        transition: border-color 0.2s;
      }
      select:hover, select:focus {
        border-color: rgba(79, 195, 247, 0.5);
      }
      select option {
        background: #2d2d44;
        color: #e0e0e0;
      }
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        background: rgba(79, 195, 247, 0.15);
        border-radius: 3px;
        outline: none;
        cursor: pointer;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #4fc3f7;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(79, 195, 247, 0.4);
        transition: box-shadow 0.2s, transform 0.15s;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        box-shadow: 0 0 14px rgba(79, 195, 247, 0.6);
        transform: scale(1.1);
      }
      input[type="range"]::-webkit-slider-thumb:active {
        box-shadow: 0 0 0 6px rgba(79, 195, 247, 0.2);
        transform: scale(1.0);
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #4fc3f7;
        border: none;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(79, 195, 247, 0.4);
      }
      input[type="range"]::-moz-range-track {
        height: 6px;
        background: rgba(79, 195, 247, 0.15);
        border-radius: 3px;
        border: none;
      }
      #panel-toggle {
        display: none;
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 200;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(26, 26, 46, 0.9);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(79, 195, 247, 0.3);
        color: #4fc3f7;
        font-size: 22px;
        cursor: pointer;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      #panel-toggle:hover {
        background: rgba(45, 45, 68, 0.95);
      }
      .info-block {
        margin-top: 20px;
        padding: 14px;
        background: rgba(79, 195, 247, 0.06);
        border-radius: 8px;
        border: 1px solid rgba(79, 195, 247, 0.1);
        font-size: 12px;
        color: #9e9e9e;
        line-height: 1.7;
      }
      .info-block strong {
        color: #81d4fa;
      }
      @media (max-width: 767px) {
        #control-panel {
          position: fixed;
          left: 0;
          top: 0;
          border-radius: 0 12px 12px 0;
          box-shadow: 4px 0 32px rgba(0, 0, 0, 0.5);
        }
        #panel-toggle {
          display: flex;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'control-panel';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '幕墙参数控制';
    panel.appendChild(title);

    const typeGroup = this.createControlGroup('幕墙类型', () => {
      const select = document.createElement('select');
      const options = [
        { value: 'point-supported', text: '点支式' },
        { value: 'frame-supported', text: '框架式' },
        { value: 'unit-type', text: '单元式' },
      ];
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
      });
      select.addEventListener('change', () => {
        this.callbacks.onWallTypeChange(select.value);
      });
      return select;
    });
    panel.appendChild(typeGroup);

    const pressureGroup = this.createSliderGroup(
      '风压等级',
      0, 8, 0, 0.1,
      (val) => { this.pressureLabel!.textContent = `${val.toFixed(1)} 级`; },
      (val) => { this.callbacks.onWindPressureChange(val); }
    );
    this.pressureLabel = pressureGroup.querySelector('.value-label');
    panel.appendChild(pressureGroup);

    const dirGroup = this.createSliderGroup(
      '风方向',
      0, 360, 0, 1,
      (val) => { this.directionLabel!.textContent = `${Math.round(val)}°`; },
      (val) => { this.callbacks.onWindDirectionChange(val); }
    );
    this.directionLabel = dirGroup.querySelector('.value-label');
    panel.appendChild(dirGroup);

    const info = document.createElement('div');
    info.className = 'info-block';
    info.innerHTML = '<strong>操作提示</strong><br>鼠标左键拖拽旋转<br>滚轮缩放视角<br>右键平移场景';
    panel.appendChild(info);

    const app = document.getElementById('app')!;
    app.insertBefore(panel, app.firstChild);

    return panel;
  }

  private createControlGroup(labelText: string, controlFactory: () => HTMLElement): HTMLDivElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('label');
    label.className = 'control-label';
    label.textContent = labelText;
    group.appendChild(label);

    const row = document.createElement('div');
    row.className = 'control-row';
    row.appendChild(controlFactory());
    group.appendChild(row);

    return group;
  }

  private createSliderGroup(
    labelText: string,
    min: number, max: number, value: number, step: number,
    onInput: (val: number) => void,
    onChange: (val: number) => void
  ): HTMLDivElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('label');
    label.className = 'control-label';
    label.textContent = labelText;
    group.appendChild(label);

    const row = document.createElement('div');
    row.className = 'control-row';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(value);
    slider.step = String(step);

    const valueLabel = document.createElement('span');
    valueLabel.className = 'value-label';
    valueLabel.textContent = `${Number(value).toFixed(1)} 级`;

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      onInput(val);
      onChange(val);
    });

    row.appendChild(slider);
    row.appendChild(valueLabel);
    group.appendChild(row);

    return group;
  }

  private createToggle(): void {
    const btn = document.createElement('button');
    btn.id = 'panel-toggle';
    btn.textContent = '☰';
    btn.addEventListener('click', () => {
      this.panelVisible = !this.panelVisible;
      if (this.panelVisible) {
        this.panel.classList.remove('hidden');
        btn.textContent = '✕';
      } else {
        this.panel.classList.add('hidden');
        btn.textContent = '☰';
      }
    });
    document.body.appendChild(btn);
    this.toggleBtn = btn;
  }

  private handleResize(): void {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      this.panel.classList.remove('hidden');
      this.panelVisible = true;
    }
  }
}
