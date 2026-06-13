import { Simulator } from './simulator';

export class ControlPanel {
  container: HTMLDivElement;
  statsDisplay: HTMLDivElement;
  speedSlider: HTMLInputElement;
  speedLabel: HTMLSpanElement;
  addButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  simulator: Simulator;
  speedMultiplier: number;

  constructor(simulator: Simulator) {
    this.simulator = simulator;
    this.speedMultiplier = 1.0;
    this.container = document.createElement('div');
    this.statsDisplay = document.createElement('div');
    this.speedSlider = document.createElement('input');
    this.speedLabel = document.createElement('span');
    this.addButton = document.createElement('button');
    this.resetButton = document.createElement('button');

    this.createStyles();
    this.buildDOM();
    this.bindEvents();
    document.body.appendChild(this.container);
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .control-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
        padding: 14px 28px;
        background: rgba(15, 10, 35, 0.75);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-top: 1px solid rgba(120, 80, 200, 0.3);
        z-index: 100;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #c8b8e8;
        user-select: none;
      }
      .control-panel .stats {
        font-size: 14px;
        min-width: 200px;
        text-align: center;
      }
      .control-panel .stats span {
        color: #a0f0d0;
        font-weight: 600;
      }
      .control-panel .speed-control {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
      }
      .control-panel .speed-control label {
        color: #b0a0d0;
      }
      .control-panel input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 130px;
        height: 6px;
        border-radius: 3px;
        background: rgba(80, 50, 140, 0.5);
        outline: none;
        cursor: pointer;
      }
      .control-panel input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #a080e0;
        box-shadow: 0 0 8px rgba(160, 128, 224, 0.6);
        cursor: pointer;
        transition: box-shadow 0.3s, background 0.3s;
      }
      .control-panel input[type="range"]::-webkit-slider-thumb:hover {
        background: #c0a0ff;
        box-shadow: 0 0 14px rgba(192, 160, 255, 0.8);
      }
      .control-panel .speed-val {
        min-width: 36px;
        text-align: center;
        color: #d0c0f0;
        font-weight: 600;
      }
      .control-panel button {
        padding: 8px 18px;
        border: 1px solid rgba(120, 80, 200, 0.5);
        border-radius: 20px;
        background: rgba(60, 30, 120, 0.4);
        color: #c8b8e8;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
        font-family: inherit;
      }
      .control-panel button:hover {
        background: rgba(100, 60, 180, 0.5);
        border-color: rgba(160, 120, 240, 0.7);
        box-shadow: 0 0 12px rgba(140, 100, 220, 0.4);
      }
      .control-panel button:active {
        background: rgba(120, 80, 200, 0.6);
      }
    `;
    document.head.appendChild(style);
  }

  private buildDOM(): void {
    this.container.className = 'control-panel';

    this.statsDisplay.className = 'stats';
    this.updateStats();

    const speedControl = document.createElement('div');
    speedControl.className = 'speed-control';
    const label = document.createElement('label');
    label.textContent = '仿真速度';
    this.speedSlider.type = 'range';
    this.speedSlider.min = '0.5';
    this.speedSlider.max = '3.0';
    this.speedSlider.step = '0.1';
    this.speedSlider.value = '1.0';
    this.speedLabel.className = 'speed-val';
    this.speedLabel.textContent = '1.0x';
    speedControl.appendChild(label);
    speedControl.appendChild(this.speedSlider);
    speedControl.appendChild(this.speedLabel);

    this.addButton.textContent = '添加新生物';
    this.resetButton.textContent = '重置';

    this.container.appendChild(this.statsDisplay);
    this.container.appendChild(speedControl);
    this.container.appendChild(this.addButton);
    this.container.appendChild(this.resetButton);
  }

  private bindEvents(): void {
    this.speedSlider.addEventListener('input', () => {
      this.speedMultiplier = parseFloat(this.speedSlider.value);
      this.speedLabel.textContent = this.speedMultiplier.toFixed(1) + 'x';
    });

    this.addButton.addEventListener('click', () => {
      this.simulator.spawnRandomCreature();
    });

    this.resetButton.addEventListener('click', () => {
      this.simulator.reset();
    });
  }

  updateStats(): void {
    const stats = this.simulator.getStats();
    this.statsDisplay.innerHTML =
      `生物总数: <span>${stats.count}</span> | ` +
      `平均攻击性: <span>${stats.avgAggression.toFixed(3)}</span>`;
  }

  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }
}
