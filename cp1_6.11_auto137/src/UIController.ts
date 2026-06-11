export interface UICallbacks {
  onFireflyCountChange: (count: number) => void;
  onSpeedChange: (speed: number) => void;
  onIntensityChange: (intensity: number) => void;
  onMoonlightChange: (intensity: number) => void;
}

export class UIController {
  private container!: HTMLDivElement;
  private fpsElement!: HTMLDivElement;
  private fireflyCountValue!: HTMLSpanElement;
  private speedValue!: HTMLSpanElement;
  private intensityValue!: HTMLSpanElement;
  private moonlightValue!: HTMLSpanElement;

  private callbacks: UICallbacks;

  private fpsFrames: number = 0;
  private fpsLastTime: number = 0;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.fpsElement = document.createElement('div');
    this.fireflyCountValue = document.createElement('span');
    this.speedValue = document.createElement('span');
    this.intensityValue = document.createElement('span');
    this.moonlightValue = document.createElement('span');

    this.createFPSElement();
    this.createPanel();
    this.attachStyles();
  }

  private createFPSElement(): void {
    this.fpsElement.id = 'fps-counter';
    this.fpsElement.textContent = 'FPS: 0';
    this.applyFPStyle();
    document.body.appendChild(this.fpsElement);
  }

  private applyFPStyle(): void {
    const s = this.fpsElement.style;
    s.position = 'fixed';
    s.top = '12px';
    s.left = '12px';
    s.padding = '6px 12px';
    s.backgroundColor = 'rgba(26, 26, 46, 0.7)';
    s.color = '#FFFFFF';
    s.fontFamily = 'monospace, Consolas, "Courier New"';
    s.fontSize = '14px';
    s.borderRadius = '4px';
    s.zIndex = '1000';
    s.pointerEvents = 'none';
    s.userSelect = 'none';
    s.backdropFilter = 'blur(4px)';
    (s as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = 'blur(4px)';
  }

  private createPanel(): void {
    this.container.id = 'control-panel';
    this.applyPanelStyle();

    const title = document.createElement('div');
    title.textContent = '参数控制面板';
    this.applyTitleStyle(title);
    this.container.appendChild(title);

    this.createSlider(
      '萤火虫数量',
      50, 500, 1, 200,
      this.fireflyCountValue,
      (val) => {
        this.fireflyCountValue.textContent = String(val);
        this.callbacks.onFireflyCountChange(val);
      }
    );

    this.createSlider(
      '飘动速度',
      0.05, 0.5, 0.01, 0.2,
      this.speedValue,
      (val) => {
        this.speedValue.textContent = val.toFixed(2);
        this.callbacks.onSpeedChange(val);
      }
    );

    this.createSlider(
      '闪光强度',
      1, 5, 0.1, 2,
      this.intensityValue,
      (val) => {
        this.intensityValue.textContent = val.toFixed(1);
        this.callbacks.onIntensityChange(val);
      }
    );

    this.createSlider(
      '月光亮度',
      0.1, 1, 0.01, 0.5,
      this.moonlightValue,
      (val) => {
        this.moonlightValue.textContent = val.toFixed(2);
        this.callbacks.onMoonlightChange(val);
      }
    );

    document.body.appendChild(this.container);
  }

  private applyPanelStyle(): void {
    const s = this.container.style;
    s.position = 'fixed';
    s.bottom = '20px';
    s.left = '20px';
    s.padding = '16px 18px';
    s.backgroundColor = 'rgba(42, 42, 62, 0.55)';
    s.borderRadius = '6px';
    s.zIndex = '1000';
    s.minWidth = '240px';
    s.backdropFilter = 'blur(8px)';
    (s as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = 'blur(8px)';
    s.border = '1px solid rgba(204, 255, 102, 0.12)';
    s.color = '#e0e0e0';
    s.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }

  private applyTitleStyle(el: HTMLDivElement): void {
    const s = el.style;
    s.fontSize = '14px';
    s.fontWeight = '600';
    s.marginBottom = '14px';
    s.color = '#CCFF66';
    s.letterSpacing = '0.5px';
  }

  private createSlider(
    label: string,
    min: number,
    max: number,
    step: number,
    defaultValue: number,
    valueSpan: HTMLSpanElement,
    onChange: (value: number) => void
  ): HTMLInputElement {
    const row = document.createElement('div');
    this.applyRowStyle(row);

    const labelRow = document.createElement('div');
    this.applyLabelRowStyle(labelRow);

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    this.applyLabelStyle(labelEl);

    valueSpan.textContent = step < 1 ? defaultValue.toFixed(2) : String(defaultValue);
    this.applyValueStyle(valueSpan);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valueSpan);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(defaultValue);
    this.applySliderStyle(slider);

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      onChange(val);
    });

    row.appendChild(labelRow);
    row.appendChild(slider);
    this.container.appendChild(row);

    return slider;
  }

  private applyRowStyle(el: HTMLDivElement): void {
    const s = el.style;
    s.marginBottom = '14px';
  }

  private applyLabelRowStyle(el: HTMLDivElement): void {
    const s = el.style;
    s.display = 'flex';
    s.justifyContent = 'space-between';
    s.alignItems = 'center';
    s.marginBottom = '6px';
  }

  private applyLabelStyle(el: HTMLSpanElement): void {
    const s = el.style;
    s.fontSize = '12px';
    s.color = '#cccccc';
  }

  private applyValueStyle(el: HTMLSpanElement): void {
    const s = el.style;
    s.fontSize = '12px';
    s.fontWeight = '600';
    s.color = '#CCFF66';
    s.fontFamily = 'monospace, Consolas, "Courier New"';
  }

  private applySliderStyle(slider: HTMLInputElement): void {
    const s = slider.style;
    s.width = '100%';
    s.height = '4px';
    s.appearance = 'none';
    (s as CSSStyleDeclaration & { webkitAppearance?: string }).webkitAppearance = 'none';
    s.outline = 'none';
    s.borderRadius = '6px';
    s.background = 'rgba(255, 255, 255, 0.1)';
    s.cursor = 'pointer';
  }

  private attachStyles(): void {
    const styleId = 'firefly-ui-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #CCFF66;
        cursor: pointer;
        box-shadow: 0 0 6px rgba(204, 255, 102, 0.5);
        transition: transform 0.1s ease, box-shadow 0.1s ease;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 10px rgba(204, 255, 102, 0.8);
      }
      input[type="range"]::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #CCFF66;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 6px rgba(204, 255, 102, 0.5);
      }
      input[type="range"]::-moz-range-track {
        height: 4px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
      }
    `;
    document.head.appendChild(style);
  }

  updateFPS(currentTime: number): void {
    this.fpsFrames++;
    if (this.fpsLastTime === 0) {
      this.fpsLastTime = currentTime;
    }
    const elapsed = currentTime - this.fpsLastTime;
    if (elapsed >= 500) {
      const fps = Math.round((this.fpsFrames * 1000) / elapsed);
      this.fpsElement.textContent = `FPS: ${fps}`;
      this.fpsFrames = 0;
      this.fpsLastTime = currentTime;
    }
  }

  dispose(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.fpsElement.parentNode) {
      this.fpsElement.parentNode.removeChild(this.fpsElement);
    }
    const style = document.getElementById('firefly-ui-styles');
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }
}
