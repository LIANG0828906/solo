import { AudioEngine } from './audioEngine';
import { DisplayMode, OrbitCameraController, ParticleSystem } from './particleSystem';

interface UICallbacks {
  onResetCamera: () => void;
  onResetParticles: () => void;
}

export class UIController {
  private container: HTMLElement;
  private audioEngine: AudioEngine;
  private cameraController: OrbitCameraController;
  private particleSystem: ParticleSystem;
  private callbacks: UICallbacks;

  private controlBar!: HTMLDivElement;
  private micButton!: HTMLButtonElement;
  private fileButton!: HTMLButtonElement;
  private fileInput!: HTMLInputElement;
  private fileStatus!: HTMLSpanElement;
  private modeButtons!: HTMLButtonElement[];
  private resetButton!: HTMLButtonElement;
  private warningLabel!: HTMLDivElement;
  private tooltip!: HTMLDivElement;

  private micAuthorized: boolean = false;
  private currentMode: DisplayMode = 'particles';
  private resetButtonSpinning: boolean = false;

  constructor(
    container: HTMLElement,
    audioEngine: AudioEngine,
    cameraController: OrbitCameraController,
    particleSystem: ParticleSystem,
    callbacks: UICallbacks
  ) {
    this.container = container;
    this.audioEngine = audioEngine;
    this.cameraController = cameraController;
    this.particleSystem = particleSystem;
    this.callbacks = callbacks;

    this.createControlBar();
    this.createTooltip();
    this.bindResponsive();
    this.hidePermissionPrompt();
  }

  private hidePermissionPrompt(): void {
    const prompt = document.getElementById('permission-prompt');
    if (prompt) {
      setTimeout(() => {
        prompt.classList.add('hidden');
      }, 4000);
    }
  }

  private createControlBar(): void {
    this.controlBar = document.createElement('div');
    this.controlBar.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      height: 60px;
      min-width: 400px;
      max-width: calc(100% - 48px);
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      backdrop-filter: blur(20px) saturate(1.2);
      -webkit-backdrop-filter: blur(20px) saturate(1.2);
      box-shadow: 
        0 0 0 1px rgba(255, 255, 255, 0.05) inset,
        0 0 20px rgba(100, 150, 255, 0.08),
        0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 100;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
    `;

    this.warningLabel = document.createElement('div');
    this.warningLabel.textContent = '⚠ 渲染负载高';
    this.warningLabel.style.cssText = `
      position: absolute;
      top: -24px;
      left: 8px;
      font-size: 12px;
      color: #ffcc00;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      text-shadow: 0 0 8px rgba(255, 204, 0, 0.6);
    `;
    this.controlBar.appendChild(this.warningLabel);

    const leftSection = this.createLeftSection();
    const centerSection = this.createCenterSection();
    const rightSection = this.createRightSection();

    this.controlBar.appendChild(leftSection);
    this.controlBar.appendChild(centerSection);
    this.controlBar.appendChild(rightSection);

    this.container.appendChild(this.controlBar);
  }

  private createLeftSection(): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    `;

    this.micButton = document.createElement('button');
    this.micButton.innerHTML = this.getMicSVG(false);
    this.applyCircularButtonStyle(this.micButton, '启用麦克风');

    this.fileButton = document.createElement('button');
    this.fileButton.innerHTML = this.getFileSVG();
    this.fileButton.style.cssText = `
      width: 120px;
      height: 40px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 12px;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-size: 13px;
      font-weight: 500;
      position: relative;
    `;

    this.fileStatus = document.createElement('span');
    this.fileStatus.textContent = '未选择';
    this.fileStatus.style.cssText = `
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      white-space: nowrap;
    `;
    this.fileButton.appendChild(this.fileStatus);

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.mp3,.wav,audio/mpeg,audio/wav';
    this.fileInput.style.display = 'none';

    this.bindTooltip(this.micButton, '麦克风输入');
    this.bindTooltip(this.fileButton, '选择音频文件');

    section.appendChild(this.micButton);
    section.appendChild(this.fileButton);
    section.appendChild(this.fileInput);

    this.micButton.addEventListener('click', this.onMicClick);
    this.fileButton.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', this.onFileSelect);

    this.addPressEffect(this.micButton);
    this.addPressEffect(this.fileButton);

    return section;
  }

  private createCenterSection(): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      display: flex;
      align-items: center;
      gap: 2px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      padding: 3px;
      flex-shrink: 0;
    `;

    const modes: { key: DisplayMode; label: string }[] = [
      { key: 'bars', label: '线条' },
      { key: 'particles', label: '粒子' },
      { key: 'mixed', label: '混合' }
    ];

    this.modeButtons = [];
    modes.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.dataset.mode = key;
      btn.style.cssText = `
        width: 80px;
        height: 30px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: inherit;
      `;

      if (key === this.currentMode) {
        btn.style.background = 'rgba(255, 255, 255, 0.25)';
        btn.style.color = 'white';
      }

      btn.addEventListener('click', () => this.onModeChange(key, btn));
      this.addPressEffect(btn);
      this.bindTooltip(btn, label + '模式');
      this.modeButtons.push(btn);
      section.appendChild(btn);
    });

    return section;
  }

  private createRightSection(): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      display: flex;
      align-items: center;
      flex-shrink: 0;
    `;

    this.resetButton = document.createElement('button');
    this.resetButton.innerHTML = this.getResetSVG();
    this.applyCircularButtonStyle(this.resetButton, '重置视角');

    this.resetButton.addEventListener('click', this.onResetClick);
    this.addPressEffect(this.resetButton);
    this.bindTooltip(this.resetButton, '重置视角与粒子');

    section.appendChild(this.resetButton);
    return section;
  }

  private applyCircularButtonStyle(btn: HTMLButtonElement, aria: string): void {
    btn.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      flex-shrink: 0;
    `;
    btn.setAttribute('aria-label', aria);
  }

  private addPressEffect(btn: HTMLButtonElement): void {
    btn.addEventListener('mousedown', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.3)';
      setTimeout(() => {
        if (btn.dataset.mode) {
          if ((btn.dataset.mode as DisplayMode) === this.currentMode) {
            btn.style.background = 'rgba(255, 255, 255, 0.25)';
          } else {
            btn.style.background = 'transparent';
          }
        } else {
          btn.style.background = 'rgba(255, 255, 255, 0.05)';
        }
      }, 150);
    });
  }

  private bindTooltip(btn: HTMLElement, text: string): void {
    btn.addEventListener('mouseenter', (e) => {
      this.showTooltip(e.clientX, e.clientY, text);
    });
    btn.addEventListener('mousemove', (e) => {
      this.moveTooltip(e.clientX, e.clientY);
    });
    btn.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `
      position: fixed;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.85);
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 6px;
      backdrop-filter: blur(10px);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s;
      white-space: nowrap;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-family: inherit;
    `;
    document.body.appendChild(this.tooltip);
  }

  private showTooltip(x: number, y: number, text: string): void {
    this.tooltip.textContent = text;
    this.tooltip.style.opacity = '1';
    this.moveTooltip(x, y);
  }

  private moveTooltip(x: number, y: number): void {
    const padding = 12;
    this.tooltip.style.left = `${x + padding}px`;
    this.tooltip.style.top = `${y - 36}px`;
  }

  private hideTooltip(): void {
    this.tooltip.style.opacity = '0.8';
    setTimeout(() => {
      if (this.tooltip.style.opacity === '0.8') {
        this.tooltip.style.opacity = '0';
      }
    }, 50);
  }

  private getMicSVG(active: boolean): string {
    const color = active ? '#22c55e' : 'white';
    return `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1C9.79 1 8 2.79 8 5V13C8 15.21 9.79 17 12 17C14.21 17 16 15.21 16 13V5C16 2.79 14.21 1 12 1Z" 
          fill="${active ? color : 'none'}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 11V13C19 16.87 15.87 20 12 20C8.13 20 5 16.87 5 13V11" 
          fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 20V23" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 23H16" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private getFileSVG(): string {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H15" 
          stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 21V13H21L17 21Z" 
          stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.5 11L11.5 8L14.5 11" 
          stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11.5 8V14" 
          stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private getResetSVG(): string {
    return `
      <svg class="reset-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
        style="transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);">
        <path d="M3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21" 
          stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 12H7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 12L7 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 7V12L15 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private onMicClick = async (): Promise<void> => {
    if (this.micAuthorized) {
      this.audioEngine.stop();
      this.micAuthorized = false;
      this.micButton.innerHTML = this.getMicSVG(false);
      this.triggerMicAnimation(false);
    } else {
      const success = await this.audioEngine.startMicrophone();
      if (success) {
        this.micAuthorized = true;
        this.micButton.innerHTML = this.getMicSVG(true);
        this.triggerMicAnimation(true);
        this.hidePermissionPrompt();
        this.fileStatus.textContent = '麦克风';
      }
    }
  };

  private triggerMicAnimation(active: boolean): void {
    if (active) {
      this.micButton.style.transform = 'scale(1.2)';
      setTimeout(() => {
        this.micButton.style.transform = 'scale(1)';
      }, 300);
    }
  }

  private onFileSelect = async (e: Event): Promise<void> => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('audio/') && 
        !file.name.endsWith('.mp3') && 
        !file.name.endsWith('.wav')) {
      alert('请选择 .mp3 或 .wav 格式的音频文件');
      return;
    }

    this.fileStatus.textContent = '加载中...';
    const success = await this.audioEngine.loadAudioFile(file);
    
    if (success) {
      const shortName = file.name.length > 10 
        ? file.name.substring(0, 7) + '...' 
        : file.name;
      this.fileStatus.textContent = `已加载`;
      this.micAuthorized = false;
      this.micButton.innerHTML = this.getMicSVG(false);
      this.hidePermissionPrompt();
    } else {
      this.fileStatus.textContent = '加载失败';
      setTimeout(() => {
        this.fileStatus.textContent = '未选择';
      }, 2000);
    }
    input.value = '';
  };

  private onModeChange(mode: DisplayMode, btn: HTMLButtonElement): void {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    this.particleSystem.setDisplayMode(mode);

    this.modeButtons.forEach((b) => {
      const isActive = b.dataset.mode === mode;
      b.style.background = isActive ? 'rgba(255, 255, 255, 0.25)' : 'transparent';
      b.style.color = isActive ? 'white' : 'rgba(255, 255, 255, 0.7)';
      b.style.transform = isActive ? 'scale(1.05)' : 'scale(1)';
      setTimeout(() => {
        b.style.transform = 'scale(1)';
      }, 200);
    });
  }

  private onResetClick = (): void => {
    if (this.resetButtonSpinning) return;
    this.resetButtonSpinning = true;

    const icon = this.resetButton.querySelector('.reset-icon') as SVGElement;
    if (icon) {
      icon.style.transform = 'rotate(360deg)';
    }

    this.callbacks.onResetCamera();
    this.callbacks.onResetParticles();

    setTimeout(() => {
      if (icon) {
        icon.style.transform = 'rotate(0deg)';
      }
      this.resetButtonSpinning = false;
    }, 300);
  };

  public showPerformanceWarning(show: boolean): void {
    if (show) {
      this.warningLabel.style.opacity = '1';
      this.warningLabel.style.animation = 'blink 0.5s infinite';
    } else {
      this.warningLabel.style.opacity = '0';
      this.warningLabel.style.animation = 'none';
    }
  }

  private bindResponsive(): void {
    const mediaQuery = window.matchMedia('(max-width: 600px) and (orientation: portrait)');
    
    const applyResponsive = (isMobile: boolean) => {
      if (isMobile) {
        this.controlBar.style.height = '110px';
        this.controlBar.style.minWidth = '300px';
        this.controlBar.style.flexDirection = 'column';
        this.controlBar.style.flexWrap = 'wrap';
        this.controlBar.style.padding = '12px 16px';
        this.controlBar.style.gap = '10px';
        this.controlBar.style.alignContent = 'center';
        this.controlBar.style.transform = 'translateX(-50%) scale(0.85)';
        this.controlBar.style.bottom = '16px';
      } else {
        this.controlBar.style.height = '60px';
        this.controlBar.style.minWidth = '400px';
        this.controlBar.style.flexDirection = 'row';
        this.controlBar.style.flexWrap = 'nowrap';
        this.controlBar.style.padding = '0 20px';
        this.controlBar.style.gap = '16px';
        this.controlBar.style.alignContent = 'stretch';
        this.controlBar.style.transform = 'translateX(-50%) scale(1)';
        this.controlBar.style.bottom = '24px';
      }
    };

    mediaQuery.addEventListener('change', (e) => applyResponsive(e.matches));
    applyResponsive(mediaQuery.matches);
  }

  public dispose(): void {
    if (this.tooltip) this.tooltip.remove();
    if (this.controlBar) this.controlBar.remove();
    this.fileInput.removeEventListener('change', this.onFileSelect);
    this.micButton.removeEventListener('click', this.onMicClick);
    this.resetButton.removeEventListener('click', this.onResetClick);
  }
}
