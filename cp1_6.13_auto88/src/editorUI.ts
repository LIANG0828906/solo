export interface UIConfig {
  frequency: number;
  amplitude: number;
  seed: number;
  waterLevel: number;
  brushSize: number;
  brushStrength: number;
}

export interface UIUpdateCallback {
  onParamChange: (config: UIConfig) => void;
  onStyleChange: (styleName: string) => void;
  onStatsUpdate: (stats: { min: number; max: number; avg: number }) => void;
}

export class EditorUI {
  private container: HTMLElement;
  private leftPanel: HTMLElement = document.createElement('div');
  private rightPanel: HTMLElement = document.createElement('div');
  private config: UIConfig;
  private callbacks: UIUpdateCallback;
  private isAnimating: boolean = false;
  private statsContainer: HTMLElement = document.createElement('div');

  constructor(callbacks: UIUpdateCallback) {
    this.config = {
      frequency: 2.0,
      amplitude: 1.0,
      seed: 42,
      waterLevel: 0.3,
      brushSize: 20,
      brushStrength: 0.5
    };
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    `;
    document.body.appendChild(this.container);
    this.createLeftPanel();
    this.createRightPanel();
  }

  private createLeftPanel(): void {
    this.leftPanel = document.createElement('div');
    this.leftPanel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      width: 280px;
      background: rgba(20, 20, 30, 0.85);
      backdrop-filter: blur(5px);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
    `;
    this.container.appendChild(this.leftPanel);

    const header = document.createElement('h2');
    header.textContent = 'TerraForge';
    header.style.cssText = `
      color: #00ffff;
      font-family: 'Segoe UI', sans-serif;
      font-size: 22px;
      margin: 0 0 20px 0;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(100, 100, 150, 0.3);
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    `;
    this.leftPanel.appendChild(header);

    this.createStyleButtons();
    this.createSlider('frequency', 'Frequency', 0.5, 5, 0.1);
    this.createSlider('amplitude', 'Amplitude', 0.2, 2, 0.05);
    this.createSlider('seed', 'Seed', 1, 999, 1);
    this.createSlider('waterLevel', 'Water Level', 0, 1, 0.01);
    this.createSlider('brushSize', 'Brush Size', 5, 50, 1);
    this.createSlider('brushStrength', 'Brush Strength', 0.1, 1, 0.05);
  }

  private createStyleButtons(): void {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 20px;
    `;

    const label = document.createElement('div');
    label.textContent = 'Terrain Style';
    label.style.cssText = `
      color: #8899aa;
      font-size: 12px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    container.appendChild(label);

    const buttons = ['mountains', 'basin', 'plateau', 'canyon'];
    const names = ['Mountains', 'Basin', 'Plateau', 'Canyon'];

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    `;

    buttons.forEach((style, index) => {
      const button = document.createElement('button');
      button.textContent = names[index];
      button.style.cssText = `
        padding: 10px 12px;
        background: rgba(60, 60, 80, 0.6);
        border: 1px solid rgba(100, 100, 150, 0.3);
        border-radius: 8px;
        color: #aaccdd;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      button.addEventListener('mouseenter', () => {
        button.style.cssText = `
          padding: 10px 12px;
          background: rgba(100, 80, 180, 0.6);
          border: 1px solid rgba(150, 100, 255, 0.5);
          border-radius: 8px;
          color: #ffffff;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 10px rgba(150, 100, 255, 0.3);
        `;
      });
      button.addEventListener('mouseleave', () => {
        button.style.cssText = `
          padding: 10px 12px;
          background: rgba(60, 60, 80, 0.6);
          border: 1px solid rgba(100, 100, 150, 0.3);
          border-radius: 8px;
          color: #aaccdd;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        `;
      });
      button.addEventListener('click', () => {
        if (!this.isAnimating) {
          this.isAnimating = true;
          this.callbacks.onStyleChange(style);
          setTimeout(() => { this.isAnimating = false; }, 500);
        }
      });
      buttonRow.appendChild(button);
    });

    container.appendChild(buttonRow);
    this.leftPanel.appendChild(container);
  }

  private createSlider(key: keyof UIConfig, label: string, min: number, max: number, step: number): void {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 18px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: #8899aa;
      font-size: 12px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    container.appendChild(labelEl);

    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = this.config[key].toString();
    slider.style.cssText = `
      flex: 1;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: linear-gradient(to right, #4a4a8a, #8a4a8a);
      border-radius: 3px;
      cursor: pointer;
      outline: none;
    `;

    slider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.config[key] = parseFloat(target.value);
      valueDisplay.textContent = this.config[key].toFixed(step < 1 ? 2 : 0);
      this.callbacks.onParamChange({ ...this.config });
    });

    slider.addEventListener('mousedown', () => {
      slider.style.cssText = `
        flex: 1;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to right, #6a6aca, #aa6aca);
        border-radius: 3px;
        cursor: pointer;
        outline: none;
        box-shadow: 0 0 10px rgba(100, 100, 200, 0.5);
      `;
    });

    slider.addEventListener('mouseup', () => {
      slider.style.cssText = `
        flex: 1;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to right, #4a4a8a, #8a4a8a);
        border-radius: 3px;
        cursor: pointer;
        outline: none;
      `;
    });

    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = this.config[key].toFixed(step < 1 ? 2 : 0);
    valueDisplay.style.cssText = `
      width: 50px;
      text-align: right;
      color: #00ffff;
      font-family: monospace;
      font-size: 14px;
      text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
    `;

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);
    container.appendChild(sliderContainer);
    this.leftPanel.appendChild(container);
  }

  private createRightPanel(): void {
    this.rightPanel = document.createElement('div');
    this.rightPanel.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 200px;
      background: rgba(20, 20, 30, 0.85);
      backdrop-filter: blur(5px);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
    `;
    this.container.appendChild(this.rightPanel);

    const header = document.createElement('h3');
    header.textContent = 'Terrain Stats';
    header.style.cssText = `
      color: #aa88ff;
      font-family: 'Segoe UI', sans-serif;
      font-size: 16px;
      margin: 0 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(100, 100, 150, 0.3);
    `;
    this.rightPanel.appendChild(header);

    this.statsContainer = document.createElement('div');
    this.statsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    this.rightPanel.appendChild(this.statsContainer);

    this.updateStats({ min: 0, max: 0, avg: 0 });
  }

  updateStats(stats: { min: number; max: number; avg: number }): void {
    this.statsContainer.innerHTML = '';

    const createStatRow = (label: string, value: number) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      const labelEl = document.createElement('span');
      labelEl.textContent = label;
      labelEl.style.cssText = `
        color: #8899aa;
        font-size: 12px;
      `;

      const valueEl = document.createElement('span');
      valueEl.textContent = value.toFixed(3);
      valueEl.style.cssText = `
        color: #aaccdd;
        font-family: monospace;
        font-size: 13px;
      `;

      row.appendChild(labelEl);
      row.appendChild(valueEl);
      return row;
    };

    this.statsContainer.appendChild(createStatRow('Min Height', stats.min));
    this.statsContainer.appendChild(createStatRow('Max Height', stats.max));
    this.statsContainer.appendChild(createStatRow('Avg Height', stats.avg));

    if (this.callbacks.onStatsUpdate) {
      this.callbacks.onStatsUpdate(stats);
    }
  }

  getConfig(): UIConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<UIConfig>): void {
    this.config = { ...this.config, ...config };
    this.leftPanel.innerHTML = '';
    this.createLeftPanel();
  }

  dispose(): void {
    this.container.remove();
  }
}
