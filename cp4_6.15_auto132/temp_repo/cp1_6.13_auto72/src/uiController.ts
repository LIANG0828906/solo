import { DisplayMode } from './particleSystem';

interface UIOptions {
  onMicClick: () => void;
  onFileChange: (file: File) => void;
  onModeChange: (mode: DisplayMode) => void;
  onResetCamera: () => void;
  onResetParticles: () => void;
}

export class UIController {
  private container: HTMLElement;
  private options: UIOptions;

  private micButton: HTMLButtonElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private fileButton: HTMLButtonElement | null = null;
  private modeButtons: { bars: HTMLButtonElement; particles: HTMLButtonElement; mixed: HTMLButtonElement } | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private perfWarning: HTMLDivElement | null = null;

  private micActive: boolean = false;
  private currentMode: DisplayMode = 'particles';

  constructor(container: HTMLElement, options: UIOptions) {
    this.container = container;
    this.options = options;
    this.createUI();
    this.injectStyles();
  }

  private createUI(): void {
    const controlBar = document.createElement('div');
    controlBar.className = 'ed-control-bar';

    const leftGroup = document.createElement('div');
    leftGroup.className = 'ed-left-group';

    this.micButton = document.createElement('button');
    this.micButton.className = 'ed-btn ed-mic-btn';
    this.micButton.title = '启用麦克风';
    this.micButton.innerHTML = `
      <svg class="ed-mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    `;
    this.micButton.addEventListener('click', () => {
      this.options.onMicClick();
    });

    this.fileButton = document.createElement('button');
    this.fileButton.className = 'ed-btn ed-file-btn';
    this.fileButton.title = '选择音频文件';
    this.fileButton.innerHTML = `
      <svg class="ed-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="ed-file-label">未选择</span>
    `;
    this.fileButton.addEventListener('click', () => {
      this.fileInput?.click();
    });

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'audio/*';
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.setFileName(file.name);
        this.options.onFileChange(file);
      }
    });

    leftGroup.appendChild(this.micButton);
    leftGroup.appendChild(this.fileButton);
    leftGroup.appendChild(this.fileInput);

    const centerGroup = document.createElement('div');
    centerGroup.className = 'ed-center-group';

    const barsBtn = document.createElement('button');
    barsBtn.className = 'ed-btn ed-mode-btn';
    barsBtn.textContent = '线条';
    barsBtn.addEventListener('click', () => this.setMode('bars'));

    const particlesBtn = document.createElement('button');
    particlesBtn.className = 'ed-btn ed-mode-btn ed-active';
    particlesBtn.textContent = '粒子';
    particlesBtn.addEventListener('click', () => this.setMode('particles'));

    const mixedBtn = document.createElement('button');
    mixedBtn.className = 'ed-btn ed-mode-btn';
    mixedBtn.textContent = '混合';
    mixedBtn.addEventListener('click', () => this.setMode('mixed'));

    this.modeButtons = { bars: barsBtn, particles: particlesBtn, mixed: mixedBtn };

    centerGroup.appendChild(barsBtn);
    centerGroup.appendChild(particlesBtn);
    centerGroup.appendChild(mixedBtn);

    const rightGroup = document.createElement('div');
    rightGroup.className = 'ed-right-group';

    this.resetButton = document.createElement('button');
    this.resetButton.className = 'ed-btn ed-reset-btn';
    this.resetButton.title = '重置视角';
    this.resetButton.innerHTML = `
      <svg class="ed-reset-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"/>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    `;
    this.resetButton.addEventListener('click', () => {
      this.triggerResetAnimation();
      this.options.onResetCamera();
      this.options.onResetParticles();
    });

    rightGroup.appendChild(this.resetButton);

    controlBar.appendChild(leftGroup);
    controlBar.appendChild(centerGroup);
    controlBar.appendChild(rightGroup);

    this.perfWarning = document.createElement('div');
    this.perfWarning.className = 'ed-perf-warning';
    this.perfWarning.textContent = '⚠ 渲染负载高';
    this.perfWarning.style.display = 'none';

    this.container.appendChild(controlBar);
    this.container.appendChild(this.perfWarning);
  }

  private triggerResetAnimation(): void {
    const icon = this.resetButton?.querySelector('.ed-reset-icon') as SVGElement | null;
    if (!icon) return;

    icon.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    icon.style.transform = 'rotate(360deg)';

    setTimeout(() => {
      icon.style.transition = 'none';
      icon.style.transform = 'rotate(0deg)';
    }, 320);
  }

  public triggerMicPulseAnimation(): void {
    if (!this.micButton) return;

    const btn = this.micButton;
    const icon = btn.querySelector('.ed-mic-icon') as SVGElement;

    btn.style.borderColor = '#22c55e';
    btn.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.5)';

    if (icon) {
      icon.classList.add('mic-pulse');
      icon.style.transform = 'scale(1.25)';
    }

    setTimeout(() => {
      btn.style.boxShadow = '';
      if (icon) {
        icon.style.transform = 'scale(1)';
      }
    }, 300);
  }

  public setMicActive(active: boolean): void {
    this.micActive = active;
    if (!this.micButton) return;

    const icon = this.micButton.querySelector('.ed-mic-icon') as SVGElement;

    if (active) {
      this.micButton.classList.add('ed-mic-active');
      this.micButton.title = '关闭麦克风';
      if (icon) {
        icon.setAttribute('fill', '#22c55e');
        icon.style.stroke = '#22c55e';
      }
      this.triggerMicPulseAnimation();
    } else {
      this.micButton.classList.remove('ed-mic-active');
      this.micButton.title = '启用麦克风';
      if (icon) {
        icon.setAttribute('fill', 'none');
        icon.style.stroke = '';
      }
    }
  }

  public setFileName(name: string): void {
    const label = this.fileButton?.querySelector('.ed-file-label');
    if (label) {
      label.textContent = name.length > 12 ? name.slice(0, 10) + '...' : name;
    }
  }

  public setMode(mode: DisplayMode): void {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    if (!this.modeButtons) return;

    (Object.keys(this.modeButtons) as DisplayMode[]).forEach((key) => {
      const btn = this.modeButtons![key];
      if (key === mode) {
        btn.classList.add('ed-active');
        btn.style.transform = 'scale(1.06)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 220);
      } else {
        btn.classList.remove('ed-active');
      }
    });

    this.options.onModeChange(mode);
  }

  public getCurrentMode(): DisplayMode {
    return this.currentMode;
  }

  public showPerformanceWarning(): void {
    if (!this.perfWarning) return;
    if (this.perfWarning.style.display === 'block') return;
    this.perfWarning.style.display = 'block';
  }

  public hidePerformanceWarning(): void {
    if (!this.perfWarning) return;
    this.perfWarning.style.display = 'none';
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .ed-control-bar {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 14px 28px;
        background: rgba(20, 20, 28, 0.55);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        z-index: 1000;
        user-select: none;
      }

      .ed-left-group,
      .ed-center-group,
      .ed-right-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ed-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 18px;
        background: rgba(255, 255, 255, 0.06);
        color: #e0e0e8;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(8px);
      }

      .ed-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.18);
        transform: translateY(-1px);
      }

      .ed-btn:active {
        transform: translateY(0);
      }

      .ed-btn svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .ed-mic-btn {
        width: 44px;
        padding: 10px 0;
      }

      .ed-mic-btn.ed-mic-active {
        color: #22c55e;
        border-color: rgba(34, 197, 94, 0.4);
        background: rgba(34, 197, 94, 0.12);
      }

      .ed-mic-icon {
        transition: transform 0.3s ease;
      }

      .ed-mic-icon.mic-pulse {
        animation: mic-pulse 0.3s ease-out;
      }

      @keyframes mic-pulse {
        0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(34, 197, 94, 0)); }
        50% { transform: scale(1.3); filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.8)); }
        100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.3)); }
      }

      .ed-file-btn {
        padding: 10px 14px;
        min-width: 120px;
      }

      .ed-file-label {
        font-size: 13px;
        opacity: 0.85;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ed-mode-btn {
        padding: 8px 18px;
        font-size: 13px;
        color: #9090a0;
      }

      .ed-mode-btn.ed-active {
        background: rgba(120, 140, 255, 0.18);
        color: #b8c4ff;
        border-color: rgba(120, 140, 255, 0.4);
      }

      .ed-reset-btn {
        width: 44px;
        padding: 10px 0;
      }

      .ed-reset-icon {
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .ed-perf-warning {
        position: fixed;
        top: 16px;
        left: 16px;
        padding: 6px 12px;
        font-size: 12px;
        color: #ffcc00;
        background: rgba(255, 204, 0, 0.1);
        border: 1px solid rgba(255, 204, 0, 0.3);
        border-radius: 6px;
        backdrop-filter: blur(8px);
        z-index: 2000;
        pointer-events: none;
        animation: blink 0.5s ease-in-out infinite;
        font-family: inherit;
      }

      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      @media (max-width: 600px) and (orientation: portrait) {
        .ed-control-bar {
          bottom: 16px;
          padding: 10px 16px;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          width: calc(100% - 32px);
          max-width: 400px;
        }

        .ed-left-group {
          order: 1;
          width: 100%;
          justify-content: center;
        }

        .ed-center-group {
          order: 2;
        }

        .ed-right-group {
          order: 3;
        }

        .ed-btn {
          padding: 8px 14px;
          font-size: 12px;
        }

        .ed-file-btn {
          min-width: 100px;
        }

        .ed-mode-btn {
          padding: 6px 14px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  public dispose(): void {
    // 清理事件监听
  }
}
