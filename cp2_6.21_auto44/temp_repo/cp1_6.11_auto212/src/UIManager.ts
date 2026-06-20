import { StarProperties } from './StarEngine';

export interface UICallbacks {
  onTimeProgressChange: (value: number) => void;
  onMassChange: (value: number) => void;
  onTimeSpeedChange: (value: number) => void;
  onViewDistanceChange: (value: number) => void;
  onNebulaDensityOffset: (value: number) => void;
  onResetView: () => void;
  onPauseToggle: () => void;
}

export class UIManager {
  private container: HTMLElement;
  private callbacks: UICallbacks;
  private paused: boolean = false;

  private timeSlider!: HTMLInputElement;
  private massSlider!: HTMLInputElement;
  private speedSlider!: HTMLInputElement;
  private distanceSlider!: HTMLInputElement;
  private nebulaSlider!: HTMLInputElement;

  private infoPanel!: HTMLDivElement;
  private stageLabel!: HTMLSpanElement;
  private radiusLabel!: HTMLSpanElement;
  private tempLabel!: HTMLSpanElement;
  private lumLabel!: HTMLSpanElement;
  private timeLabel!: HTMLSpanElement;

  private pauseBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;

  private timeSliderValue!: HTMLSpanElement;
  private massSliderValue!: HTMLSpanElement;
  private speedSliderValue!: HTMLSpanElement;
  private distanceSliderValue!: HTMLSpanElement;
  private nebulaSliderValue!: HTMLSpanElement;

  private lastInfoUpdate: number = 0;

  constructor(container: HTMLElement, callbacks: UICallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.buildUI();
  }

  private buildUI(): void {
    this.createStyles();

    const uiRoot = document.createElement('div');
    uiRoot.id = 'stellar-ui';
    uiRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
    this.container.appendChild(uiRoot);

    this.createInfoPanel(uiRoot);
    this.createTimeSlider(uiRoot);
    this.createPauseButton(uiRoot);
    this.createVerticalSliders(uiRoot);
    this.createResetButton(uiRoot);
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .stellar-slider {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        outline: none;
        pointer-events: auto;
        cursor: pointer;
      }
      .stellar-slider::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 2px;
        background: linear-gradient(90deg, #00FFAA, #FF4500);
      }
      .stellar-slider::-moz-range-track {
        height: 4px;
        border-radius: 2px;
        background: linear-gradient(90deg, #00FFAA, #FF4500);
      }
      .stellar-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #00FFAA;
        box-shadow: 0 0 8px #00FFAA, 0 0 16px rgba(0,255,170,0.4);
        margin-top: -6px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        cursor: grab;
      }
      .stellar-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #00FFAA;
        box-shadow: 0 0 8px #00FFAA, 0 0 16px rgba(0,255,170,0.4);
        border: none;
        cursor: grab;
      }
      .stellar-slider:hover::-webkit-slider-thumb {
        transform: scale(1.2);
        box-shadow: 0 0 12px #00FFAA, 0 0 24px rgba(0,255,170,0.6);
      }
      .stellar-slider:hover::-moz-range-thumb {
        transform: scale(1.2);
        box-shadow: 0 0 12px #00FFAA, 0 0 24px rgba(0,255,170,0.6);
      }
      .stellar-slider:active::-webkit-slider-thumb {
        transform: scale(1.2);
        border: 3px solid #00FFAA;
        cursor: grabbing;
      }
      .stellar-slider:active::-moz-range-thumb {
        transform: scale(1.2);
        border: 3px solid #00FFAA;
        cursor: grabbing;
      }
      .stellar-slider:focus-visible::-webkit-slider-thumb {
        outline: 2px solid #00FFAA;
        outline-offset: 2px;
      }
      .stellar-slider-value {
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: rgba(255, 255, 100, 0.85);
        background: rgba(15, 15, 26, 0.6);
        padding: 1px 5px;
        border-radius: 3px;
        margin-left: 6px;
        min-width: 40px;
        text-align: center;
        display: inline-block;
      }
      .stellar-slider-label {
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: #C0C0C0;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
      }
      .stellar-btn {
        pointer-events: auto;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        outline: none;
      }
      .stellar-btn:hover {
        filter: brightness(1.1);
        transform: scale(1.05);
      }
      .stellar-btn:active {
        transform: scale(0.97);
      }
      @media (max-width: 768px) {
        #stellar-time-slider-wrap {
          width: 90% !important;
        }
        #stellar-vertical-sliders {
          width: 150px !important;
        }
        #stellar-info-panel {
          top: 10px !important;
          right: auto !important;
          left: 10px !important;
          font-size: 12px !important;
        }
      }
      @media (max-width: 480px) {
        #stellar-vertical-sliders {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private createInfoPanel(parent: HTMLElement): void {
    this.infoPanel = document.createElement('div');
    this.infoPanel.id = 'stellar-info-panel';
    this.infoPanel.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(15, 15, 26, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 14px 18px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #ffffff;
      line-height: 1.8;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      pointer-events: auto;
      min-width: 200px;
    `;

    const rows = [
      { label: '阶段', id: 'stage' },
      { label: '半径', id: 'radius', suffix: ' R☉' },
      { label: '温度', id: 'temp', suffix: ' K' },
      { label: '光度', id: 'lum', suffix: ' L☉' },
      { label: '时间', id: 'time', suffix: '' },
    ];

    rows.forEach(row => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

      const label = document.createElement('span');
      label.style.cssText = 'color:#C0C0C0;margin-right:12px;';
      label.textContent = row.label;

      const value = document.createElement('span');
      value.style.cssText = 'color:#00FFAA;font-weight:bold;';
      value.textContent = '--';
      value.id = `stellar-info-${row.id}`;

      div.appendChild(label);
      div.appendChild(value);
      this.infoPanel.appendChild(div);
    });

    this.stageLabel = this.infoPanel.querySelector('#stellar-info-stage')!;
    this.radiusLabel = this.infoPanel.querySelector('#stellar-info-radius')!;
    this.tempLabel = this.infoPanel.querySelector('#stellar-info-temp')!;
    this.lumLabel = this.infoPanel.querySelector('#stellar-info-lum')!;
    this.timeLabel = this.infoPanel.querySelector('#stellar-info-time')!;

    parent.appendChild(this.infoPanel);
  }

  private createTimeSlider(parent: HTMLElement): void {
    const wrap = document.createElement('div');
    wrap.id = 'stellar-time-slider-wrap';
    wrap.style.cssText = `
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      pointer-events: auto;
    `;

    const labelRow = document.createElement('div');
    labelRow.className = 'stellar-slider-label';
    labelRow.style.cssText = 'justify-content:space-between;margin-bottom:6px;';

    const label = document.createElement('span');
    label.textContent = '演化时间';

    this.timeSliderValue = document.createElement('span');
    this.timeSliderValue.className = 'stellar-slider-value';
    this.timeSliderValue.textContent = '0%';

    labelRow.appendChild(label);
    labelRow.appendChild(this.timeSliderValue);
    wrap.appendChild(labelRow);

    this.timeSlider = document.createElement('input');
    this.timeSlider.type = 'range';
    this.timeSlider.min = '0';
    this.timeSlider.max = '100';
    this.timeSlider.value = '0';
    this.timeSlider.className = 'stellar-slider';
    this.timeSlider.style.cssText = 'width:100%;';
    this.timeSlider.setAttribute('aria-label', '演化时间进度');

    this.timeSlider.addEventListener('input', () => {
      const v = parseFloat(this.timeSlider.value) / 100;
      this.timeSliderValue.textContent = `${this.timeSlider.value}%`;
      this.callbacks.onTimeProgressChange(v);
    });

    wrap.appendChild(this.timeSlider);
    parent.appendChild(wrap);
  }

  private createPauseButton(parent: HTMLElement): void {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: auto;
    `;

    this.pauseBtn = document.createElement('button');
    this.pauseBtn.className = 'stellar-btn';
    this.pauseBtn.setAttribute('aria-label', '暂停/播放');
    this.pauseBtn.style.cssText = `
      width: 60px;
      height: 28px;
      background: #2A2A3E;
      color: #00FFAA;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    this.pauseBtn.innerHTML = '&#9654;';

    this.pauseBtn.addEventListener('click', () => {
      this.paused = !this.paused;
      this.pauseBtn.innerHTML = this.paused ? '&#9654;' : '&#9646;&#9646;';
      this.callbacks.onPauseToggle();
    });

    wrap.appendChild(this.pauseBtn);
    parent.appendChild(wrap);
  }

  private createVerticalSliders(parent: HTMLElement): void {
    const wrap = document.createElement('div');
    wrap.id = 'stellar-vertical-sliders';
    wrap.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      pointer-events: auto;
      width: 200px;
    `;

    const sliders = [
      {
        id: 'mass', label: '初始质量', min: 0.5, max: 30, step: 0.1, value: 1.0,
        suffix: ' M☉', callback: (v: number) => this.callbacks.onMassChange(v)
      },
      {
        id: 'speed', label: '时间倍速', min: 1, max: 100, step: 1, value: 1,
        suffix: 'x', callback: (v: number) => this.callbacks.onTimeSpeedChange(v)
      },
      {
        id: 'distance', label: '视角距离', min: 5, max: 30, step: 0.5, value: 10,
        suffix: '', callback: (v: number) => this.callbacks.onViewDistanceChange(v)
      },
      {
        id: 'nebula', label: '星云密度', min: 0, max: 2, step: 0.1, value: 1,
        suffix: '', callback: (v: number) => this.callbacks.onNebulaDensityOffset(v)
      },
    ];

    const valueEls: Record<string, HTMLSpanElement> = {};

    sliders.forEach(cfg => {
      const row = document.createElement('div');

      const labelRow = document.createElement('div');
      labelRow.className = 'stellar-slider-label';
      labelRow.style.cssText = 'justify-content:space-between;margin-bottom:2px;';

      const label = document.createElement('span');
      label.textContent = cfg.label;

      const valEl = document.createElement('span');
      valEl.className = 'stellar-slider-value';
      valEl.textContent = `${cfg.value}${cfg.suffix}`;
      valueEls[cfg.id] = valEl;

      labelRow.appendChild(label);
      labelRow.appendChild(valEl);
      row.appendChild(labelRow);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = String(cfg.min);
      slider.max = String(cfg.max);
      slider.step = String(cfg.step);
      slider.value = String(cfg.value);
      slider.className = 'stellar-slider';
      slider.style.cssText = 'width:100%;';
      slider.setAttribute('aria-label', cfg.label);

      slider.addEventListener('input', () => {
        const v = parseFloat(slider.value);
        valEl.textContent = `${v}${cfg.suffix}`;
        cfg.callback(v);
      });

      row.appendChild(slider);
      wrap.appendChild(row);

      if (cfg.id === 'mass') this.massSlider = slider;
      if (cfg.id === 'speed') this.speedSlider = slider;
      if (cfg.id === 'distance') this.distanceSlider = slider;
      if (cfg.id === 'nebula') this.nebulaSlider = slider;
    });

    this.massSliderValue = valueEls['mass'];
    this.speedSliderValue = valueEls['speed'];
    this.distanceSliderValue = valueEls['distance'];
    this.nebulaSliderValue = valueEls['nebula'];

    parent.appendChild(wrap);
  }

  private createResetButton(parent: HTMLElement): void {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      pointer-events: auto;
    `;

    this.resetBtn = document.createElement('button');
    this.resetBtn.className = 'stellar-btn';
    this.resetBtn.setAttribute('aria-label', '重置视角');
    this.resetBtn.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(26, 26, 46, 0.8);
      border: 1px solid rgba(255, 215, 0, 0.4);
      color: #FFD700;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    `;
    this.resetBtn.innerHTML = '&#10010;';
    this.resetBtn.title = '重置视角';

    this.resetBtn.addEventListener('mouseenter', () => {
      this.resetBtn.style.borderColor = '#FFFF00';
      this.resetBtn.style.boxShadow = '0 0 12px rgba(255,255,0,0.5)';
    });
    this.resetBtn.addEventListener('mouseleave', () => {
      this.resetBtn.style.borderColor = 'rgba(255, 215, 0, 0.4)';
      this.resetBtn.style.boxShadow = 'none';
    });

    this.resetBtn.addEventListener('click', () => {
      this.callbacks.onResetView();
    });

    wrap.appendChild(this.resetBtn);
    parent.appendChild(wrap);
  }

  updateInfo(props: StarProperties, now: number): void {
    if (now - this.lastInfoUpdate < 100) return;
    this.lastInfoUpdate = now;

    this.stageLabel.textContent = props.stageName;
    this.radiusLabel.textContent = props.radiusSolar < 0.001
      ? props.radiusSolar.toExponential(1) + ' R☉'
      : props.radiusSolar.toFixed(2) + ' R☉';
    this.tempLabel.textContent = Math.round(props.temperature) + ' K';
    this.lumLabel.textContent = props.luminosity.toFixed(1) + ' L☉';
    this.timeLabel.textContent = props.elapsedMyr < 1
      ? (props.elapsedMyr * 1000).toFixed(0) + ' kyr'
      : props.elapsedMyr.toFixed(1) + ' Myr';
  }

  isPaused(): boolean {
    return this.paused;
  }

  getTimeProgress(): number {
    return parseFloat(this.timeSlider.value) / 100;
  }

  getMass(): number {
    return parseFloat(this.massSlider.value);
  }

  getTimeSpeed(): number {
    return parseFloat(this.speedSlider.value);
  }

  getViewDistance(): number {
    return parseFloat(this.distanceSlider.value);
  }

  setTimeProgress(v: number): void {
    this.timeSlider.value = String(Math.round(v * 100));
    this.timeSliderValue.textContent = `${Math.round(v * 100)}%`;
  }

  setViewDistance(v: number): void {
    this.distanceSlider.value = String(v);
    this.distanceSliderValue.textContent = `${v}`;
  }
}
