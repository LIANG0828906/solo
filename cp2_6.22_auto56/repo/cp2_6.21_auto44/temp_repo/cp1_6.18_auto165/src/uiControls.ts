import { ParticleParams } from './particleStorm';
import { SceneManager } from './scene';

interface SliderConfig {
  key: keyof ParticleParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const SLIDER_CONFIGS: SliderConfig[] = [
  { key: 'vortexStrength', label: '漩涡强度', min: 0.0, max: 2.0, step: 0.01 },
  { key: 'particleSpeed', label: '粒子速度', min: 0.5, max: 5.0, step: 0.1 },
  { key: 'particleSize', label: '粒子大小', min: 0.1, max: 0.8, step: 0.01 },
  { key: 'windForce', label: '环境风力', min: -1.0, max: 1.0, step: 0.01 },
];

const BREAKPOINT = 1024;

export class UIControls {
  private app: HTMLElement;
  private sceneManager: SceneManager;
  private titleBar!: HTMLElement;
  private controlPanel!: HTMLElement;
  private drawerToggle!: HTMLElement;
  private sliderElements: Map<keyof ParticleParams, HTMLInputElement> = new Map();
  private valueDisplayElements: Map<keyof ParticleParams, HTMLElement> = new Map();
  private colorPicker!: HTMLInputElement;
  private uiElements: HTMLElement[] = [];
  private isDrawerOpen = false;

  constructor(app: HTMLElement, sceneManager: SceneManager) {
    this.app = app;
    this.sceneManager = sceneManager;
    this.init();
  }

  private init(): void {
    this.createStyles();
    this.createTitleBar();
    this.createControlPanel();
    this.createDrawerToggle();
    this.setupResponsiveLayout();
    this.bindEvents();
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .storm-titlebar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 56px;
        background: #1A1A2E;
        border-bottom: 1px solid #333;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        z-index: 100;
        font-family: 'Courier New', monospace;
      }

      .storm-title {
        font-size: 20px;
        font-weight: 600;
        color: #E0E0E0;
        letter-spacing: 2px;
      }

      .storm-title-actions {
        display: flex;
        gap: 12px;
      }

      .storm-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #fff;
        letter-spacing: 1px;
      }

      .storm-btn-reset {
        background: #444;
      }

      .storm-btn-reset:hover {
        background: #555;
        transform: translateY(-1px);
      }

      .storm-btn-reset:active {
        transform: translateY(0);
      }

      .storm-btn-export {
        background: #00BCD4;
      }

      .storm-btn-export:hover {
        background: #00D4EE;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 188, 212, 0.4);
      }

      .storm-btn-export:active {
        transform: translateY(0);
      }

      .storm-control-panel {
        position: fixed;
        top: 80px;
        right: 24px;
        width: 260px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        padding: 20px;
        z-index: 100;
        font-family: 'Courier New', monospace;
        color: #E0E0E0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .storm-control-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 12px;
        padding: 1px;
        background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent, rgba(79, 195, 247, 0.1));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }

      .storm-panel-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #E0E0E0;
        letter-spacing: 1px;
        opacity: 0.9;
      }

      .storm-slider-group {
        margin-bottom: 18px;
      }

      .storm-slider-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;
        color: #B0B0B0;
        letter-spacing: 1px;
      }

      .storm-slider-value {
        color: #4FC3F7;
        font-weight: 600;
        min-width: 40px;
        text-align: right;
      }

      .storm-slider {
        width: 220px;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: #555;
        border-radius: 3px;
        outline: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .storm-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #FFF;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }

      .storm-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 2px 8px rgba(79, 195, 247, 0.6);
      }

      .storm-slider::-webkit-slider-thumb:active {
        transform: scale(1.1);
      }

      .storm-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #FFF;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }

      .storm-slider::-moz-range-thumb:hover {
        transform: scale(1.2);
      }

      .storm-color-group {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .storm-color-label {
        display: block;
        margin-bottom: 8px;
        font-size: 12px;
        color: #B0B0B0;
        letter-spacing: 1px;
      }

      .storm-color-picker {
        width: 100%;
        height: 40px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        background: transparent;
        cursor: pointer;
        padding: 4px;
        transition: all 0.2s ease;
      }

      .storm-color-picker:hover {
        border-color: rgba(79, 195, 247, 0.5);
      }

      .storm-color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
      }

      .storm-color-picker::-webkit-color-swatch {
        border-radius: 4px;
        border: none;
      }

      .storm-drawer-toggle {
        position: fixed;
        top: 80px;
        right: 0;
        width: 40px;
        height: 60px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-right: none;
        border-radius: 8px 0 0 8px;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 99;
        transition: all 0.3s ease;
      }

      .storm-drawer-toggle:hover {
        background: rgba(255, 255, 255, 0.12);
        width: 48px;
      }

      .storm-drawer-toggle span {
        display: block;
        width: 8px;
        height: 8px;
        border-left: 2px solid #E0E0E0;
        border-bottom: 2px solid #E0E0E0;
        transform: rotate(45deg);
        transition: transform 0.3s ease;
      }

      .storm-drawer-toggle.open span {
        transform: rotate(-135deg);
      }

      @media (max-width: 1024px) {
        .storm-control-panel {
          right: -300px;
          opacity: 0;
          pointer-events: none;
        }

        .storm-control-panel.drawer-open {
          right: 0;
          top: 0;
          height: 100vh;
          border-radius: 0;
          opacity: 1;
          pointer-events: auto;
          overflow-y: auto;
        }

        .storm-drawer-toggle {
          display: flex;
        }

        .storm-drawer-toggle.drawer-open {
          right: 260px;
        }
      }

      .storm-hint {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 16px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 20px;
        color: #888;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        letter-spacing: 1px;
        z-index: 100;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
    `;
    document.head.appendChild(style);
  }

  private createTitleBar(): void {
    this.titleBar = document.createElement('div');
    this.titleBar.className = 'storm-titlebar';
    this.titleBar.innerHTML = `
      <div class="storm-title">风暴调音台</div>
      <div class="storm-title-actions">
        <button class="storm-btn storm-btn-reset" id="reset-btn">重置</button>
        <button class="storm-btn storm-btn-export" id="export-btn">导出截图</button>
      </div>
    `;
    this.app.appendChild(this.titleBar);
    this.uiElements.push(this.titleBar);
  }

  private createControlPanel(): void {
    this.controlPanel = document.createElement('div');
    this.controlPanel.className = 'storm-control-panel';

    let html = '<div class="storm-panel-title">参数控制</div>';

    const currentParams = this.sceneManager.getParams();

    for (const config of SLIDER_CONFIGS) {
      const value = currentParams[config.key] as number;
      html += `
        <div class="storm-slider-group">
          <div class="storm-slider-label">
            <span>${config.label}</span>
            <span class="storm-slider-value" data-value-key="${config.key}">${value.toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            class="storm-slider" 
            data-slider-key="${config.key}"
            min="${config.min}" 
            max="${config.max}" 
            step="${config.step}" 
            value="${value}"
          />
        </div>
      `;
    }

    html += `
      <div class="storm-color-group">
        <label class="storm-color-label">背景颜色</label>
        <input 
          type="color" 
          class="storm-color-picker" 
          id="color-picker"
          value="${currentParams.backgroundColor}"
        />
      </div>
    `;

    this.controlPanel.innerHTML = html;
    this.app.appendChild(this.controlPanel);
    this.uiElements.push(this.controlPanel);

    for (const config of SLIDER_CONFIGS) {
      const slider = this.controlPanel.querySelector(`[data-slider-key="${config.key}"]`) as HTMLInputElement;
      const valueDisplay = this.controlPanel.querySelector(`[data-value-key="${config.key}"]`) as HTMLElement;
      this.sliderElements.set(config.key, slider);
      this.valueDisplayElements.set(config.key, valueDisplay);
    }

    this.colorPicker = this.controlPanel.querySelector('#color-picker') as HTMLInputElement;

    const hint = document.createElement('div');
    hint.className = 'storm-hint';
    hint.textContent = '双击中心光点触发爆发 · 拖拽旋转视角';
    this.app.appendChild(hint);
    this.uiElements.push(hint);
  }

  private createDrawerToggle(): void {
    this.drawerToggle = document.createElement('div');
    this.drawerToggle.className = 'storm-drawer-toggle';
    this.drawerToggle.innerHTML = '<span></span>';
    this.app.appendChild(this.drawerToggle);
    this.uiElements.push(this.drawerToggle);
  }

  private setupResponsiveLayout(): void {
    const checkViewport = () => {
      if (window.innerWidth < BREAKPOINT) {
        this.drawerToggle.style.display = 'flex';
        this.controlPanel.classList.remove('drawer-open');
        this.drawerToggle.classList.remove('drawer-open');
        this.isDrawerOpen = false;
      } else {
        this.drawerToggle.style.display = 'none';
        this.controlPanel.classList.remove('drawer-open');
        this.drawerToggle.classList.remove('drawer-open');
        this.isDrawerOpen = false;
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
  }

  private bindEvents(): void {
    for (const config of SLIDER_CONFIGS) {
      const slider = this.sliderElements.get(config.key);
      if (slider) {
        slider.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement;
          const value = parseFloat(target.value);
          this.updateSliderValue(config.key, value);
          this.sceneManager.updateParams({ [config.key]: value });
        });
      }
    }

    this.colorPicker.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.sceneManager.updateParams({ backgroundColor: target.value });
    });

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetAllParams();
      });
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportScreenshot();
      });
    }

    this.drawerToggle.addEventListener('click', () => {
      this.toggleDrawer();
    });
  }

  private updateSliderValue(key: keyof ParticleParams, value: number): void {
    const display = this.valueDisplayElements.get(key);
    if (display) {
      display.textContent = value.toFixed(2);
    }
  }

  private resetAllParams(): void {
    const defaultParams = this.sceneManager.getDefaultParams();
    this.sceneManager.resetParams();

    for (const config of SLIDER_CONFIGS) {
      const slider = this.sliderElements.get(config.key);
      const value = defaultParams[config.key] as number;
      if (slider) {
        slider.value = value.toString();
        this.updateSliderValue(config.key, value);
      }
    }

    this.colorPicker.value = defaultParams.backgroundColor;
  }

  private toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
    if (this.isDrawerOpen) {
      this.controlPanel.classList.add('drawer-open');
      this.drawerToggle.classList.add('drawer-open');
    } else {
      this.controlPanel.classList.remove('drawer-open');
      this.drawerToggle.classList.remove('drawer-open');
    }
  }

  private async exportScreenshot(): Promise<void> {
    this.uiElements.forEach((el) => {
      el.style.visibility = 'hidden';
    });

    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const dataUrl = this.sceneManager.captureScreenshot();

    this.uiElements.forEach((el) => {
      el.style.visibility = 'visible';
    });

    const link = document.createElement('a');
    link.download = `storm-mixer-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  public dispose(): void {
    for (const slider of this.sliderElements.values()) {
      slider.removeEventListener('input', () => {});
    }
    this.colorPicker.removeEventListener('input', () => {});

    const resetBtn = document.getElementById('reset-btn');
    const exportBtn = document.getElementById('export-btn');
    resetBtn?.removeEventListener('click', () => {});
    exportBtn?.removeEventListener('click', () => {});
    this.drawerToggle.removeEventListener('click', () => {});

    this.uiElements.forEach((el) => el.remove());
  }
}
