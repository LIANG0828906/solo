import { eventBus } from '../utils/EventBus';
import { StyleType, GestureState } from '../types';

export class UIManager {
  private container: HTMLElement;
  private panel: HTMLElement | null = null;
  private fpsDisplay: HTMLElement | null = null;
  private styleButtons: HTMLButtonElement[] = [];
  private cameraButton: HTMLButtonElement | null = null;
  private cameraOn: boolean = false;
  private currentStyle: StyleType = 'neon';

  private styles: { type: StyleType; label: string; icon: string }[] = [
    { type: 'neon', label: '霓虹', icon: '✦' },
    { type: 'ink', label: '水墨', icon: '墨' },
    { type: 'pixel', label: '像素', icon: '▦' }
  ];

  constructor(container: HTMLElement) {
    this.container = container;
    this.createPanel();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  private createPanel(): void {
    this.panel = document.createElement('div');
    this.panel.className = 'control-panel';

    const fpsSection = document.createElement('div');
    fpsSection.className = 'fps-section';

    const fpsLabel = document.createElement('span');
    fpsLabel.className = 'fps-label';
    fpsLabel.textContent = 'FPS';

    this.fpsDisplay = document.createElement('span');
    this.fpsDisplay.className = 'fps-value';
    this.fpsDisplay.textContent = '--';

    fpsSection.appendChild(fpsLabel);
    fpsSection.appendChild(this.fpsDisplay);

    const styleSection = document.createElement('div');
    styleSection.className = 'style-section';

    this.styles.forEach((style) => {
      const button = document.createElement('button');
      button.className = 'style-btn';
      button.dataset.style = style.type;
      button.title = style.label;
      button.textContent = style.icon;

      if (style.type === this.currentStyle) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {
        this.setStyle(style.type);
      });

      this.styleButtons.push(button);
      styleSection.appendChild(button);
    });

    const cameraSection = document.createElement('div');
    cameraSection.className = 'camera-section';

    this.cameraButton = document.createElement('button');
    this.cameraButton.className = 'camera-btn';
    this.cameraButton.title = '摄像头开关';
    this.cameraButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 7l-7 5 7 5V7z"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    `;

    this.cameraButton.addEventListener('click', () => {
      this.toggleCamera();
    });

    cameraSection.appendChild(this.cameraButton);

    this.panel.appendChild(fpsSection);
    this.panel.appendChild(styleSection);
    this.panel.appendChild(cameraSection);

    this.container.appendChild(this.panel);

    this.injectStyles();
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .control-panel {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 240px;
        padding: 20px;
        background: rgba(20, 20, 40, 0.8);
        border: 1px solid #3A3A5E;
        border-radius: 16px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .fps-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .fps-label {
        color: #8A8AAA;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .fps-value {
        color: #4ECDC4;
        font-size: 24px;
        font-weight: 700;
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        text-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
      }

      .style-section {
        display: flex;
        gap: 10px;
        justify-content: center;
      }

      .style-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 8px;
        background: #2A2A4A;
        color: #8A8AAA;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .style-btn:hover {
        background: #4A4A6A;
        color: #FFFFFF;
        transform: translateY(-2px);
      }

      .style-btn.active {
        background: #4ECDC4;
        color: #0A0A0F;
        box-shadow: 0 0 20px rgba(78, 205, 196, 0.4);
      }

      .camera-section {
        display: flex;
        justify-content: center;
        padding-top: 4px;
      }

      .camera-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: none;
        background: #2A2A4A;
        color: #8A8AAA;
        cursor: pointer;
        transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .camera-btn svg {
        width: 24px;
        height: 24px;
      }

      .camera-btn:hover {
        transform: scale(1.05);
      }

      .camera-btn:active {
        transform: scale(0.95);
      }

      .camera-btn.active {
        background: #FF6B6B;
        color: #FFFFFF;
        box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
      }

      @media (max-width: 768px) {
        .control-panel {
          top: 16px;
          right: 16px;
          bottom: auto;
          width: 200px;
          padding: 16px;
          gap: 12px;
        }

        .style-btn {
          width: 36px;
          height: 36px;
          font-size: 16px;
        }

        .style-section {
          gap: 8px;
        }

        .camera-btn {
          width: 44px;
          height: 44px;
        }

        .camera-btn svg {
          width: 20px;
          height: 20px;
        }

        .fps-value {
          font-size: 20px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    eventBus.on('fps:update', (fps: number) => {
      this.updateFps(fps);
    });

    eventBus.on('camera:started', () => {
      this.setCameraState(true);
    });

    eventBus.on('camera:stopped', () => {
      this.setCameraState(false);
    });

    eventBus.on('gesture:change', (state: GestureState) => {
      // Could add visual feedback for gestures
    });
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === '1') {
        this.setStyle('neon');
      } else if (e.key === '2') {
        this.setStyle('ink');
      } else if (e.key === '3') {
        this.setStyle('pixel');
      }
    });
  }

  private setStyle(style: StyleType): void {
    if (this.currentStyle === style) return;

    this.currentStyle = style;

    this.styleButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.style === style);
    });

    eventBus.emit('style:change', style);
  }

  private toggleCamera(): void {
    eventBus.emit('camera:toggle', !this.cameraOn);
  }

  private setCameraState(on: boolean): void {
    this.cameraOn = on;
    if (this.cameraButton) {
      this.cameraButton.classList.toggle('active', on);
    }
  }

  private updateFps(fps: number): void {
    if (this.fpsDisplay) {
      this.fpsDisplay.textContent = String(fps);
    }
  }

  getCurrentStyle(): StyleType {
    return this.currentStyle;
  }

  isCameraOn(): boolean {
    return this.cameraOn;
  }
}
