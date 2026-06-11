import { ViewType } from './types';

export interface UICallbacks {
  onSpeedChange: (speed: number) => void;
  onViewChange: (view: ViewType) => void;
  onStartToggle: () => void;
}

export class UIManager {
  private container: HTMLElement;
  private callbacks: UICallbacks;
  private speedSlider: HTMLInputElement | null = null;
  private speedValue: HTMLElement | null = null;
  private infoPanel: HTMLElement | null = null;
  private startButton: HTMLButtonElement | null = null;
  private viewButtons: HTMLElement | null = null;
  private isPanelVisible: boolean = false;

  constructor(containerId: string, callbacks: UICallbacks) {
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.callbacks = callbacks;
    this.createUI();
  }

  private createUI(): void {
    this.createSpeedControl();
    this.createViewButtons();
    this.createInfoPanel();
    this.addStyles();
  }

  private createSpeedControl(): void {
    const speedControl = document.createElement('div');
    speedControl.className = 'speed-control';
    speedControl.innerHTML = `
      <div class="speed-label">速度控制</div>
      <div class="slider-container">
        <input type="range" min="0" max="5" step="0.1" value="0" class="speed-slider" id="speedSlider">
        <div class="speed-value">0.0</div>
      </div>
    `;
    this.container.appendChild(speedControl);

    this.speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
    this.speedValue = document.querySelector('.speed-value');

    if (this.speedSlider) {
      this.speedSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.updateSpeedDisplay(value);
        this.callbacks.onSpeedChange(value);
      });
    }
  }

  private createViewButtons(): void {
    const viewButtons = document.createElement('div');
    viewButtons.className = 'view-buttons';
    
    const views = [
      { id: 'top', icon: '⬆', label: '俯视图' },
      { id: 'side', icon: '➡', label: '侧视图' },
      { id: 'front', icon: '◀', label: '主视图' },
      { id: 'perspective', icon: '◆', label: '45°视角' }
    ];

    views.forEach(view => {
      const btn = document.createElement('button');
      btn.className = 'view-btn';
      btn.id = `view-${view.id}`;
      btn.innerHTML = `<span class="view-icon">${view.icon}</span>`;
      btn.title = view.label;
      btn.addEventListener('click', () => {
        this.callbacks.onViewChange(view.id as ViewType);
        this.updateActiveViewButton(view.id);
      });
      viewButtons.appendChild(btn);
    });

    this.container.appendChild(viewButtons);
    this.viewButtons = viewButtons;
  }

  private createInfoPanel(): void {
    const infoPanel = document.createElement('div');
    infoPanel.className = 'info-panel';
    infoPanel.id = 'infoPanel';
    infoPanel.innerHTML = `
      <div class="info-panel-content">
        <h3 class="info-title" id="infoTitle">部件信息</h3>
        <p class="info-description" id="infoDescription">点击火车部件查看详情</p>
      </div>
    `;
    this.container.appendChild(infoPanel);
    this.infoPanel = infoPanel;
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .speed-control {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(58, 47, 37, 0.9);
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        z-index: 100;
        min-width: 280px;
      }

      .speed-label {
        color: #FFE4B5;
        font-size: 14px;
        margin-bottom: 10px;
        text-align: center;
        font-weight: 500;
      }

      .slider-container {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .speed-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 8px;
        border-radius: 4px;
        background: linear-gradient(to right, #B87333, #8B5A2B);
        outline: none;
        cursor: pointer;
      }

      .speed-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #FFD700;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        transition: transform 0.1s ease;
      }

      .speed-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }

      .speed-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #FFD700;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
      }

      .speed-value {
        color: #FFE4B5;
        font-size: 16px;
        font-weight: bold;
        min-width: 40px;
        text-align: right;
      }

      .view-buttons {
        position: absolute;
        left: 30px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 100;
      }

      .view-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: #4A3728;
        color: #FFE4B5;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        transition: all 0.1s ease;
      }

      .view-btn:hover {
        background: #5C4033;
        transform: scale(1.05);
        filter: brightness(1.15);
      }

      .view-btn:active {
        transform: scale(0.95);
      }

      .view-btn.active {
        background: #B87333;
        box-shadow: 0 0 10px rgba(184, 115, 51, 0.6);
      }

      .view-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .info-panel {
        position: absolute;
        top: 30px;
        right: 30px;
        width: 200px;
        background: rgba(58, 47, 37, 0.8);
        border-radius: 8px;
        padding: 15px;
        z-index: 100;
        transform: translateX(120%);
        transition: transform 0.3s ease-out;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
      }

      .info-panel.visible {
        transform: translateX(0);
      }

      .info-title {
        color: #FFD700;
        font-size: 16px;
        margin-bottom: 8px;
        font-weight: 600;
      }

      .info-description {
        color: #FFE4B5;
        font-size: 13px;
        line-height: 1.5;
      }

      .info-panel-content {
        position: relative;
      }
    `;
    document.head.appendChild(style);
  }

  private updateSpeedDisplay(value: number): void {
    if (this.speedValue) {
      this.speedValue.textContent = value.toFixed(1);
    }
  }

  private updateActiveViewButton(viewId: string): void {
    const buttons = this.viewButtons?.querySelectorAll('.view-btn');
    buttons?.forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`view-${viewId}`);
    activeBtn?.classList.add('active');
  }

  public showInfoPanel(title: string, description: string): void {
    if (!this.infoPanel) return;

    const titleEl = document.getElementById('infoTitle');
    const descEl = document.getElementById('infoDescription');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;

    this.infoPanel.classList.add('visible');
    this.isPanelVisible = true;
  }

  public hideInfoPanel(): void {
    if (!this.infoPanel) return;
    this.infoPanel.classList.remove('visible');
    this.isPanelVisible = false;
  }

  public setSpeed(speed: number): void {
    if (this.speedSlider) {
      this.speedSlider.value = speed.toString();
      this.updateSpeedDisplay(speed);
    }
  }

  public getSpeed(): number {
    return this.speedSlider ? parseFloat(this.speedSlider.value) : 0;
  }
}
