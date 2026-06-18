import type { SharedConfig, ColorMode } from './sharedConfig';
import { isValidColorMode } from './sharedConfig';

export class UIController {
  private config: SharedConfig;
  private onImageUpload: (file: File) => void;
  private onScreenshot: () => void;
  private onParamChange: () => void;

  private uploadContainer: HTMLDivElement | null = null;
  private controlPanel: HTMLDivElement | null = null;
  private mobileToggleBtn: HTMLButtonElement | null = null;
  private screenshotBtn: HTMLButtonElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private flashOverlay: HTMLDivElement | null = null;

  private spreadSlider: HTMLInputElement | null = null;
  private pulseSlider: HTMLInputElement | null = null;
  private sizeSlider: HTMLInputElement | null = null;
  private colorModeSelect: HTMLSelectElement | null = null;

  private isMobile = false;
  private panelVisible = true;

  private boundOutsideClickListener: ((e: MouseEvent) => void) | null = null;

  constructor(
    config: SharedConfig,
    onImageUpload: (file: File) => void,
    onScreenshot: () => void,
    onParamChange: () => void
  ) {
    this.config = config;
    this.onImageUpload = onImageUpload;
    this.onScreenshot = onScreenshot;
    this.onParamChange = onParamChange;

    this.isMobile = window.innerWidth < 768;
    this.createUI();
    this.bindEvents();
    this.syncInitialValues();
    window.addEventListener('resize', () => this.onResize());
  }

  private onResize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    if (wasMobile !== this.isMobile) {
      this.updateLayout();
    }
  }

  private createUI(): void {
    this.createStyles();
    this.createUploadContainer();
    this.createControlPanel();
    this.createScreenshotButton();
    this.createFlashOverlay();
    this.createMobileToggle();
    this.updateLayout();
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .aurabloom-upload-container {
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 1000;
        transition: opacity 0.3s, transform 0.3s;
      }

      .aurabloom-upload-container.hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(-20px);
      }

      .aurabloom-upload-btn {
        background: linear-gradient(135deg, #6C64C0 0%, #BE5BFD 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: filter 0.25s ease, transform 0.25s ease;
        white-space: nowrap;
      }

      .aurabloom-upload-btn:hover {
        filter: brightness(1.2);
        transform: scale(1.02);
      }

      .aurabloom-file-input {
        display: none;
      }

      .aurabloom-control-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(30, 27, 51, 0.8);
        border-radius: 12px;
        padding: 16px;
        width: 220px;
        z-index: 1000;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        animation: aurabloomPanelEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        transform-origin: bottom right;
      }

      .aurabloom-control-panel.mobile-layout {
        position: fixed;
        bottom: 80px;
        left: 50%;
        right: auto;
        transform: translateX(-50%);
        transform-origin: center bottom;
        animation: aurabloomPanelEnterMobile 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      .aurabloom-control-panel.panel-hidden {
        display: none;
      }

      @keyframes aurabloomPanelEnter {
        0% {
          opacity: 0;
          transform: scale(0.15);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes aurabloomPanelEnterMobile {
        0% {
          opacity: 0;
          transform: translateX(-50%) scale(0.15);
        }
        100% {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }
      }

      .aurabloom-control-group {
        margin-bottom: 14px;
      }

      .aurabloom-control-group:last-child {
        margin-bottom: 0;
      }

      .aurabloom-control-label {
        color: rgba(255, 255, 255, 0.9);
        font-size: 12px;
        margin-bottom: 6px;
        display: block;
        font-weight: 500;
      }

      .aurabloom-slider {
        width: 100%;
        height: 4px;
        background: #2A2648;
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;
      }

      .aurabloom-slider::-webkit-slider-runnable-track {
        height: 4px;
        background: #2A2648;
        border-radius: 2px;
      }

      .aurabloom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #7C6FF0;
        border-radius: 50%;
        cursor: pointer;
        margin-top: -6px;
        transition: background 0.2s;
        border: none;
      }

      .aurabloom-slider::-webkit-slider-thumb:hover {
        background: #9B8FF5;
      }

      .aurabloom-slider::-moz-range-track {
        height: 4px;
        background: #2A2648;
        border-radius: 2px;
        border: none;
      }

      .aurabloom-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #7C6FF0;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: background 0.2s;
      }

      .aurabloom-slider::-moz-range-thumb:hover {
        background: #9B8FF5;
      }

      .aurabloom-select {
        width: 100%;
        padding: 8px 12px;
        background: #2A2648;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239B8FF5' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        padding-right: 28px;
      }

      .aurabloom-select:focus {
        border-color: #7C6FF0;
      }

      .aurabloom-select option {
        background: #1E1B33;
        color: white;
      }

      .aurabloom-screenshot-btn {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #BE5BFD;
        border: none;
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, opacity 0.3s ease;
        opacity: 0;
        pointer-events: none;
      }

      .aurabloom-screenshot-btn.visible {
        opacity: 1;
        pointer-events: auto;
      }

      .aurabloom-screenshot-btn:hover {
        transform: translateX(-50%) rotate(5deg) scale(1.1);
      }

      .aurabloom-screenshot-btn svg {
        width: 24px;
        height: 24px;
        fill: white;
      }

      .aurabloom-flash-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        opacity: 0;
        pointer-events: none;
        z-index: 9999;
      }

      .aurabloom-flash-overlay.flash-active {
        opacity: 1;
      }

      .aurabloom-mobile-toggle {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6C64C0 0%, #BE5BFD 100%);
        border: none;
        cursor: pointer;
        z-index: 1000;
        display: none;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s;
      }

      .aurabloom-mobile-toggle.toggle-visible {
        display: flex;
      }

      .aurabloom-mobile-toggle:hover {
        transform: translateX(-50%) scale(1.1);
      }

      .aurabloom-slider-value {
        color: rgba(255, 255, 255, 0.6);
        font-size: 11px;
        float: right;
      }
    `;
    document.head.appendChild(style);
  }

  private createUploadContainer(): void {
    this.uploadContainer = document.createElement('div');
    this.uploadContainer.className = 'aurabloom-upload-container';

    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'aurabloom-upload-btn';
    uploadBtn.textContent = '上传照片';

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.className = 'aurabloom-file-input';

    uploadBtn.addEventListener('click', () => this.fileInput?.click());

    this.uploadContainer.appendChild(uploadBtn);
    this.uploadContainer.appendChild(this.fileInput);
    document.body.appendChild(this.uploadContainer);
  }

  private createControlPanel(): void {
    this.controlPanel = document.createElement('div');
    this.controlPanel.className = 'aurabloom-control-panel panel-hidden';

    this.controlPanel.innerHTML = `
      <div class="aurabloom-control-group">
        <label class="aurabloom-control-label">
          扩散半径 <span class="aurabloom-slider-value" id="aurabloom-spread-val">1.5</span>
        </label>
        <input type="range" class="aurabloom-slider" id="aurabloom-spread-slider"
               min="0.5" max="3" step="0.1" value="1.5">
      </div>
      <div class="aurabloom-control-group">
        <label class="aurabloom-control-label">
          脉动速度 <span class="aurabloom-slider-value" id="aurabloom-pulse-val">1.0</span>
        </label>
        <input type="range" class="aurabloom-slider" id="aurabloom-pulse-slider"
               min="0" max="2" step="0.1" value="1">
      </div>
      <div class="aurabloom-control-group">
        <label class="aurabloom-control-label">
          粒子大小 <span class="aurabloom-slider-value" id="aurabloom-size-val">4.0</span>
        </label>
        <input type="range" class="aurabloom-slider" id="aurabloom-size-slider"
               min="1" max="6" step="0.5" value="4">
      </div>
      <div class="aurabloom-control-group">
        <label class="aurabloom-control-label">颜色模式</label>
        <select class="aurabloom-select" id="aurabloom-color-mode">
          <option value="brightnessMix">亮度混合</option>
          <option value="hueGroup">色相分组</option>
        </select>
      </div>
    `;

    document.body.appendChild(this.controlPanel);

    this.spreadSlider = document.getElementById('aurabloom-spread-slider') as HTMLInputElement;
    this.pulseSlider = document.getElementById('aurabloom-pulse-slider') as HTMLInputElement;
    this.sizeSlider = document.getElementById('aurabloom-size-slider') as HTMLInputElement;
    this.colorModeSelect = document.getElementById('aurabloom-color-mode') as HTMLSelectElement;
  }

  private createScreenshotButton(): void {
    this.screenshotBtn = document.createElement('button');
    this.screenshotBtn.className = 'aurabloom-screenshot-btn';
    this.screenshotBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12 9a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4zm0-6c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm8 4h-3.2l-1.8-2H9L7.2 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/>
      </svg>
    `;
    document.body.appendChild(this.screenshotBtn);
  }

  private createFlashOverlay(): void {
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.className = 'aurabloom-flash-overlay';
    document.body.appendChild(this.flashOverlay);
  }

  private createMobileToggle(): void {
    this.mobileToggleBtn = document.createElement('button');
    this.mobileToggleBtn.className = 'aurabloom-mobile-toggle';
    this.mobileToggleBtn.innerHTML = '&#9881;';
    document.body.appendChild(this.mobileToggleBtn);
  }

  private bindEvents(): void {
    this.fileInput?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.onImageUpload(file);
      }
    });

    this.spreadSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.config.spreadRadius = value;
      const valEl = document.getElementById('aurabloom-spread-val');
      if (valEl) valEl.textContent = value.toFixed(1);
      this.onParamChange();
    });

    this.pulseSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.config.pulseSpeed = value;
      const valEl = document.getElementById('aurabloom-pulse-val');
      if (valEl) valEl.textContent = value.toFixed(1);
      this.onParamChange();
    });

    this.sizeSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.config.particleSize = value;
      const valEl = document.getElementById('aurabloom-size-val');
      if (valEl) valEl.textContent = value.toFixed(1);
      this.onParamChange();
    });

    this.colorModeSelect?.addEventListener('change', (e) => {
      const rawValue = (e.target as HTMLSelectElement).value;
      if (!isValidColorMode(rawValue)) {
        console.warn(`Invalid color mode: ${rawValue}, fallback to brightnessMix`);
        (e.target as HTMLSelectElement).value = this.config.colorMode;
        return;
      }
      const value = rawValue as ColorMode;
      this.config.colorMode = value;
      this.onParamChange();
    });

    this.screenshotBtn?.addEventListener('click', () => {
      this.onScreenshot();
    });

    this.mobileToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMobilePanel();
    });

    this.boundOutsideClickListener = (e: MouseEvent) => {
      if (!this.isMobile) return;
      if (!this.panelVisible) return;
      if (!this.controlPanel) return;
      if (this.controlPanel.contains(e.target as Node)) return;
      if (this.mobileToggleBtn?.contains(e.target as Node)) return;
      this.panelVisible = false;
      this.controlPanel.classList.add('panel-hidden');
    };
    document.addEventListener('click', this.boundOutsideClickListener);
  }

  private updateLayout(): void {
    if (this.isMobile) {
      this.controlPanel?.classList.add('mobile-layout');
      this.mobileToggleBtn?.classList.add('toggle-visible');
      if (!this.panelVisible) {
        this.controlPanel?.classList.add('panel-hidden');
      }
    } else {
      this.controlPanel?.classList.remove('mobile-layout');
      this.mobileToggleBtn?.classList.remove('toggle-visible');
      this.controlPanel?.classList.remove('panel-hidden');
      this.panelVisible = true;
    }
  }

  private toggleMobilePanel(): void {
    this.panelVisible = !this.panelVisible;
    if (this.panelVisible) {
      this.controlPanel?.classList.remove('panel-hidden');
    } else {
      this.controlPanel?.classList.add('panel-hidden');
    }
  }

  private syncInitialValues(): void {
    this.updateUI();
  }

  showUploadPanel(): void {
    this.uploadContainer?.classList.remove('hidden');
    this.screenshotBtn?.classList.remove('visible');
    this.controlPanel?.classList.add('panel-hidden');
  }

  hideUploadPanel(): void {
    this.uploadContainer?.classList.add('hidden');
    this.screenshotBtn?.classList.add('visible');
    this.controlPanel?.classList.remove('panel-hidden');
    if (this.isMobile) {
      this.panelVisible = false;
      this.controlPanel?.classList.add('panel-hidden');
    }
  }

  triggerFlashEffect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMobile) {
        resolve();
        return;
      }

      if (!this.flashOverlay) {
        resolve();
        return;
      }

      this.flashOverlay.classList.add('flash-active');

      setTimeout(() => {
        this.flashOverlay?.classList.remove('flash-active');
        setTimeout(resolve, 30);
      }, 30);
    });
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  updateUI(): void {
    if (this.spreadSlider) {
      this.spreadSlider.value = this.config.spreadRadius.toString();
      const valEl = document.getElementById('aurabloom-spread-val');
      if (valEl) valEl.textContent = this.config.spreadRadius.toFixed(1);
    }
    if (this.pulseSlider) {
      this.pulseSlider.value = this.config.pulseSpeed.toString();
      const valEl = document.getElementById('aurabloom-pulse-val');
      if (valEl) valEl.textContent = this.config.pulseSpeed.toFixed(1);
    }
    if (this.sizeSlider) {
      this.sizeSlider.value = this.config.particleSize.toString();
      const valEl = document.getElementById('aurabloom-size-val');
      if (valEl) valEl.textContent = this.config.particleSize.toFixed(1);
    }
    if (this.colorModeSelect) {
      if (isValidColorMode(this.config.colorMode)) {
        this.colorModeSelect.value = this.config.colorMode;
      } else {
        this.colorModeSelect.value = 'brightnessMix';
      }
    }
  }

  destroy(): void {
    if (this.boundOutsideClickListener) {
      document.removeEventListener('click', this.boundOutsideClickListener);
      this.boundOutsideClickListener = null;
    }
  }
}
