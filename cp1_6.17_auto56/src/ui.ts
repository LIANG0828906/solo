import { TerrainMode } from './terrain';

export interface UIParams {
  heightScale: number;
  noiseFrequency: number;
  resolution: number;
  mode: TerrainMode;
}

const DEFAULT_PARAMS: UIParams = {
  heightScale: 1.0,
  noiseFrequency: 0.03,
  resolution: 256,
  mode: 'noise',
};

export class UIManager {
  public container: HTMLElement;
  private fpsDisplay: HTMLElement;
  private heightScaleSlider: HTMLInputElement;
  private heightScaleValue: HTMLElement;
  private frequencySlider: HTMLInputElement;
  private frequencyValue: HTMLElement;
  private resolutionSlider: HTMLInputElement;
  private resolutionValue: HTMLElement;
  private modeSelect: HTMLSelectElement;
  private resetButton: HTMLButtonElement;

  private onHeightScaleChangeCallback: ((value: number) => void) | null = null;
  private onFrequencyChangeCallback: ((value: number) => void) | null = null;
  private onResolutionChangeCallback: ((value: number) => void) | null = null;
  private onModeChangeCallback: ((mode: TerrainMode) => void) | null = null;
  private onResetCallback: (() => void) | null = null;

  constructor() {
    this.container = this.createContainer();
    this.heightScaleSlider = this.createSlider('heightScale', 0.1, 5.0, 0.1, DEFAULT_PARAMS.heightScale);
    this.heightScaleValue = this.createValueDisplay(DEFAULT_PARAMS.heightScale.toFixed(1));
    this.frequencySlider = this.createSlider('frequency', 0.01, 0.1, 0.01, DEFAULT_PARAMS.noiseFrequency);
    this.frequencyValue = this.createValueDisplay(DEFAULT_PARAMS.noiseFrequency.toFixed(2));
    this.resolutionSlider = this.createSlider('resolution', 16, 512, 1, DEFAULT_PARAMS.resolution);
    this.resolutionValue = this.createValueDisplay(DEFAULT_PARAMS.resolution.toString());
    this.modeSelect = this.createModeSelect();
    this.resetButton = this.createResetButton();
    this.fpsDisplay = this.createFPSDisplay();
    this.buildPanel();
    this.bindEvents();
    document.body.appendChild(this.container);
  }

  private createContainer(): HTMLElement {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '20px';
    div.style.right = '20px';
    div.style.width = '280px';
    div.style.backgroundColor = '#1A1A2E';
    div.style.borderRadius = '10px';
    div.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    div.style.padding = '16px';
    div.style.color = '#FFFFFF';
    div.style.fontSize = '14px';
    div.style.zIndex = '1000';
    div.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    return div;
  }

  private createSlider(id: string, min: number, max: number, step: number, value: number): HTMLInputElement {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();
    slider.style.width = '100%';
    slider.style.height = '4px';
    slider.style.appearance = 'none';
    (slider.style as any).webkitAppearance = 'none';
    slider.style.backgroundColor = '#333';
    slider.style.borderRadius = '2px';
    slider.style.outline = 'none';
    slider.style.cursor = 'pointer';
    slider.style.marginTop = '8px';
    slider.style.marginBottom = '4px';
    const style = document.createElement('style');
    style.textContent = `
      #${id}::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #00BCD4;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 188, 212, 0.4);
      }
      #${id}::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #00BCD4;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 6px rgba(0, 188, 212, 0.4);
      }
    `;
    document.head.appendChild(style);
    return slider;
  }

  private createValueDisplay(initialValue: string): HTMLElement {
    const span = document.createElement('span');
    span.textContent = initialValue;
    span.style.float = 'right';
    span.style.color = '#00BCD4';
    span.style.fontWeight = '600';
    return span;
  }

  private createModeSelect(): HTMLSelectElement {
    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.padding = '8px 12px';
    select.style.backgroundColor = '#2A2A4A';
    select.style.color = '#FFFFFF';
    select.style.border = '1px solid #3A3A5A';
    select.style.borderRadius = '6px';
    select.style.fontSize = '14px';
    select.style.cursor = 'pointer';
    select.style.outline = 'none';
    select.style.marginTop = '8px';
    const options = [
      { value: 'noise', label: '噪点模式' },
      { value: 'ridge', label: '随机山脊模式' },
    ];
    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
    return select;
  }

  private createResetButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '重置参数';
    button.style.width = '100%';
    button.style.padding = '10px';
    button.style.backgroundColor = '#00BCD4';
    button.style.color = '#FFFFFF';
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.fontSize = '14px';
    button.style.fontWeight = '600';
    button.style.cursor = 'pointer';
    button.style.transition = 'background-color 0.2s';
    button.style.marginTop = '16px';
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#0097A7';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#00BCD4';
    });
    return button;
  }

  private createFPSDisplay(): HTMLElement {
    const div = document.createElement('div');
    div.style.marginTop = '16px';
    div.style.paddingTop = '12px';
    div.style.borderTop = '1px solid #3A3A5A';
    div.style.textAlign = 'center';
    div.style.color = '#4CAF50';
    div.style.fontWeight = '600';
    div.style.fontSize = '13px';
    div.textContent = 'FPS: --';
    return div;
  }

  private buildPanel(): void {
    const title = document.createElement('div');
    title.textContent = '地形控制面板';
    title.style.fontSize = '16px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '16px';
    title.style.textAlign = 'center';
    title.style.color = '#00BCD4';
    this.container.appendChild(title);

    this.addControlRow('地形高度缩放', this.heightScaleSlider, this.heightScaleValue);
    this.addControlRow('噪声频率', this.frequencySlider, this.frequencyValue);
    this.addControlRow('网格分辨率', this.resolutionSlider, this.resolutionValue);

    const modeLabel = document.createElement('div');
    modeLabel.textContent = '高度图模式';
    modeLabel.style.marginTop = '12px';
    modeLabel.style.fontWeight = '500';
    this.container.appendChild(modeLabel);
    this.container.appendChild(this.modeSelect);

    this.container.appendChild(this.resetButton);
    this.container.appendChild(this.fpsDisplay);
  }

  private addControlRow(label: string, slider: HTMLInputElement, valueDisplay: HTMLElement): void {
    const labelRow = document.createElement('div');
    labelRow.style.display = 'flex';
    labelRow.style.justifyContent = 'space-between';
    labelRow.style.alignItems = 'center';
    labelRow.style.marginTop = '12px';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.fontWeight = '500';
    labelRow.appendChild(labelSpan);
    labelRow.appendChild(valueDisplay);
    this.container.appendChild(labelRow);
    this.container.appendChild(slider);
  }

  private bindEvents(): void {
    this.heightScaleSlider.addEventListener('input', () => {
      const value = parseFloat(this.heightScaleSlider.value);
      this.heightScaleValue.textContent = value.toFixed(1);
      if (this.onHeightScaleChangeCallback) {
        this.onHeightScaleChangeCallback(value);
      }
    });

    this.frequencySlider.addEventListener('input', () => {
      const value = parseFloat(this.frequencySlider.value);
      this.frequencyValue.textContent = value.toFixed(2);
      if (this.onFrequencyChangeCallback) {
        this.onFrequencyChangeCallback(value);
      }
    });

    this.resolutionSlider.addEventListener('input', () => {
      const rawValue = parseFloat(this.resolutionSlider.value);
      const value = Math.pow(2, Math.round(Math.log2(rawValue)));
      this.resolutionValue.textContent = value.toString();
      if (this.onResolutionChangeCallback) {
        this.onResolutionChangeCallback(value);
      }
    });

    this.modeSelect.addEventListener('change', () => {
      const mode = this.modeSelect.value as TerrainMode;
      if (this.onModeChangeCallback) {
        this.onModeChangeCallback(mode);
      }
    });

    this.resetButton.addEventListener('click', () => {
      this.resetUI();
      if (this.onResetCallback) {
        this.onResetCallback();
      }
    });
  }

  private resetUI(): void {
    this.heightScaleSlider.value = DEFAULT_PARAMS.heightScale.toString();
    this.heightScaleValue.textContent = DEFAULT_PARAMS.heightScale.toFixed(1);
    this.frequencySlider.value = DEFAULT_PARAMS.noiseFrequency.toString();
    this.frequencyValue.textContent = DEFAULT_PARAMS.noiseFrequency.toFixed(2);
    this.resolutionSlider.value = DEFAULT_PARAMS.resolution.toString();
    this.resolutionValue.textContent = DEFAULT_PARAMS.resolution.toString();
    this.modeSelect.value = DEFAULT_PARAMS.mode;
  }

  public onHeightScaleChange(callback: (value: number) => void): void {
    this.onHeightScaleChangeCallback = callback;
  }

  public onFrequencyChange(callback: (value: number) => void): void {
    this.onFrequencyChangeCallback = callback;
  }

  public onResolutionChange(callback: (value: number) => void): void {
    this.onResolutionChangeCallback = callback;
  }

  public onModeChange(callback: (mode: TerrainMode) => void): void {
    this.onModeChangeCallback = callback;
  }

  public onReset(callback: () => void): void {
    this.onResetCallback = callback;
  }

  public updateFPS(fps: number): void {
    this.fpsDisplay.textContent = `FPS: ${fps.toFixed(0)}`;
  }
}
