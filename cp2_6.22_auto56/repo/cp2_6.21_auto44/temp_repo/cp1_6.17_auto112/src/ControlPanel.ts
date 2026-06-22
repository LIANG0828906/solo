import { AstrolabeModel, CoordinateData } from './AstrolabeModel';

type ControlCallback = (innerTilt: number, pointerAzimuth: number) => void;

export class ControlPanel {
  private readonly container: HTMLElement;
  private readonly model: AstrolabeModel;
  private readonly onChangeCallback: ControlCallback;

  private innerTiltSlider: HTMLInputElement | null = null;
  private pointerAzimuthSlider: HTMLInputElement | null = null;
  private cameraElevationSlider: HTMLInputElement | null = null;
  private autoButton: HTMLButtonElement | null = null;

  private coordDisplay: HTMLElement | null = null;
  private lonEl: HTMLElement | null = null;
  private latEl: HTMLElement | null = null;
  private altEl: HTMLElement | null = null;
  private azEl: HTMLElement | null = null;

  private isAutoRunning: boolean = false;
  private autoStartTime: number = 0;
  private readonly AUTO_CYCLE_MS: number = 8000;
  private rafId: number | null = null;
  private pulseAnimationFrame: number | null = null;

  constructor(container: HTMLElement, model: AstrolabeModel, onChangeCallback: ControlCallback) {
    this.container = container;
    this.model = model;
    this.onChangeCallback = onChangeCallback;
    this.buildUI();
    this.updateCoordinateDisplay();
  }

  private buildUI(): void {
    const style = document.createElement('style');
    style.textContent = `
      .astrolabe-reading-panel {
        position: absolute;
        right: 20px;
        bottom: 180px;
        width: 200px;
        background: rgba(26, 27, 46, 0.375);
        border-radius: 12px;
        padding: 12px;
        backdrop-filter: blur(4px);
        font-family: 'Courier New', Courier, monospace;
        color: #E0E0E0;
        font-size: 14px;
        z-index: 10;
      }
      .astrolabe-reading-title {
        font-size: 12px;
        color: #8A8BA0;
        margin-bottom: 8px;
        letter-spacing: 1px;
      }
      .astrolabe-reading-row {
        display: flex;
        justify-content: space-between;
        padding: 3px 0;
        transition: color 0.1s ease;
      }
      .astrolabe-reading-label {
        color: #8A8BA0;
      }
      .astrolabe-reading-value.flash {
        color: #FFFFFF;
      }
      .astrolabe-control-panel {
        position: absolute;
        right: 20px;
        bottom: 20px;
        width: 200px;
        background: rgba(26, 27, 46, 0.5);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3125);
        backdrop-filter: blur(6px);
        z-index: 10;
      }
      .astrolabe-slider-group {
        margin-bottom: 16px;
      }
      .astrolabe-slider-group:last-of-type {
        margin-bottom: 20px;
      }
      .astrolabe-slider-label {
        display: flex;
        justify-content: space-between;
        color: #C0C0C0;
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        margin-bottom: 8px;
      }
      .astrolabe-slider-value {
        color: #B8860B;
        font-weight: bold;
      }
      input[type="range"].astrolabe-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 4px;
        background: #2C2D44;
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }
      input[type="range"].astrolabe-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #B8860B;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      input[type="range"].astrolabe-slider::-webkit-slider-thumb:hover {
        background: #D4A017;
      }
      input[type="range"].astrolabe-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #B8860B;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: background 0.2s ease;
      }
      input[type="range"].astrolabe-slider::-moz-range-thumb:hover {
        background: #D4A017;
      }
      .astrolabe-button-row {
        display: flex;
        justify-content: center;
      }
      .astrolabe-auto-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #3E2723;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.25s ease, box-shadow 0.25s ease;
        position: relative;
      }
      .astrolabe-auto-btn:hover {
        background: #5D4037;
      }
      .astrolabe-auto-btn.pulsing {
        animation: astrolabe-pulse 1.5s ease-in-out infinite;
      }
      @keyframes astrolabe-pulse {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(184, 134, 11, 0.7);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(184, 134, 11, 0);
        }
      }
      .astrolabe-auto-btn svg {
        width: 20px;
        height: 20px;
        fill: #FFFFFF;
      }
    `;
    document.head.appendChild(style);

    const readingPanel = document.createElement('div');
    readingPanel.className = 'astrolabe-reading-panel';
    readingPanel.innerHTML = `
      <div class="astrolabe-reading-title">坐标读数</div>
      <div class="astrolabe-reading-row">
        <span class="astrolabe-reading-label">黄道经度:</span>
        <span class="astrolabe-reading-value" id="astrolabe-lon">0.00°</span>
      </div>
      <div class="astrolabe-reading-row">
        <span class="astrolabe-reading-label">黄道纬度:</span>
        <span class="astrolabe-reading-value" id="astrolabe-lat">0.00°</span>
      </div>
      <div class="astrolabe-reading-row">
        <span class="astrolabe-reading-label">地平高度:</span>
        <span class="astrolabe-reading-value" id="astrolabe-alt">0.00°</span>
      </div>
      <div class="astrolabe-reading-row">
        <span class="astrolabe-reading-label">方位角:</span>
        <span class="astrolabe-reading-value" id="astrolabe-az">0.00°</span>
      </div>
    `;
    this.container.appendChild(readingPanel);

    this.coordDisplay = readingPanel;
    this.lonEl = readingPanel.querySelector('#astrolabe-lon');
    this.latEl = readingPanel.querySelector('#astrolabe-lat');
    this.altEl = readingPanel.querySelector('#astrolabe-alt');
    this.azEl = readingPanel.querySelector('#astrolabe-az');

    const controlPanel = document.createElement('div');
    controlPanel.className = 'astrolabe-control-panel';
    controlPanel.innerHTML = `
      <div class="astrolabe-slider-group">
        <div class="astrolabe-slider-label">
          <span>内环倾斜</span>
          <span class="astrolabe-slider-value" id="inner-tilt-val">0°</span>
        </div>
        <input type="range" class="astrolabe-slider" id="inner-tilt" min="-90" max="90" step="0.1" value="0">
      </div>
      <div class="astrolabe-slider-group">
        <div class="astrolabe-slider-label">
          <span>指针方位</span>
          <span class="astrolabe-slider-value" id="pointer-az-val">0°</span>
        </div>
        <input type="range" class="astrolabe-slider" id="pointer-az" min="0" max="360" step="0.1" value="0">
      </div>
      <div class="astrolabe-slider-group">
        <div class="astrolabe-slider-label">
          <span>观察仰角</span>
          <span class="astrolabe-slider-value" id="camera-el-val">30°</span>
        </div>
        <input type="range" class="astrolabe-slider" id="camera-el" min="-30" max="80" step="0.5" value="30">
      </div>
      <div class="astrolabe-button-row">
        <button class="astrolabe-auto-btn" id="auto-btn" title="自动巡天">
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    `;
    this.container.appendChild(controlPanel);

    this.innerTiltSlider = controlPanel.querySelector('#inner-tilt');
    this.pointerAzimuthSlider = controlPanel.querySelector('#pointer-az');
    this.cameraElevationSlider = controlPanel.querySelector('#camera-el');
    this.autoButton = controlPanel.querySelector('#auto-btn');

    this.bindEvents();
  }

  private bindEvents(): void {
    const innerTiltVal = document.getElementById('inner-tilt-val');
    const pointerAzVal = document.getElementById('pointer-az-val');
    const cameraElVal = document.getElementById('camera-el-val');

    this.innerTiltSlider?.addEventListener('input', () => {
      if (this.isAutoRunning) this.stopAuto();
      const val = parseFloat(this.innerTiltSlider!.value);
      if (innerTiltVal) innerTiltVal.textContent = val.toFixed(1) + '°';
      this.model.setInnerTilt(val);
      this.onChangeCallback(val, this.model.getPointerAzimuth());
      this.updateCoordinateDisplay();
    });

    this.pointerAzimuthSlider?.addEventListener('input', () => {
      if (this.isAutoRunning) this.stopAuto();
      const val = parseFloat(this.pointerAzimuthSlider!.value);
      if (pointerAzVal) pointerAzVal.textContent = val.toFixed(1) + '°';
      this.model.setPointerAzimuth(val);
      this.onChangeCallback(this.model.getInnerTilt(), val);
      this.updateCoordinateDisplay();
    });

    this.cameraElevationSlider?.addEventListener('input', () => {
      const val = parseFloat(this.cameraElevationSlider!.value);
      if (cameraElVal) cameraElVal.textContent = val.toFixed(1) + '°';
      this.model.setCameraElevation(val);
    });

    this.autoButton?.addEventListener('click', () => {
      if (this.isAutoRunning) {
        this.stopAuto();
      } else {
        this.startAuto();
      }
    });
  }

  private startAuto(): void {
    this.isAutoRunning = true;
    this.autoStartTime = performance.now();
    if (this.autoButton) {
      this.autoButton.classList.remove('pulsing');
      this.autoButton.querySelector('svg')!.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    }
    this.animateAuto();
  }

  private stopAuto(): void {
    this.isAutoRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.autoButton) {
      this.autoButton.querySelector('svg')!.innerHTML = '<path d="M8 5v14l11-7z"/>';
      this.autoButton.classList.add('pulsing');
    }
    this.startPulseTimeout();
  }

  private startPulseTimeout(): void {
    if (this.pulseAnimationFrame !== null) {
      clearTimeout(this.pulseAnimationFrame);
    }
    this.pulseAnimationFrame = window.setTimeout(() => {
      this.autoButton?.classList.remove('pulsing');
      this.pulseAnimationFrame = null;
    }, 3000);
  }

  private animateAuto = (): void => {
    if (!this.isAutoRunning) return;

    const elapsed = performance.now() - this.autoStartTime;
    const progress = (elapsed % this.AUTO_CYCLE_MS) / this.AUTO_CYCLE_MS;

    const pointerAz = progress * 360;
    const innerTilt = Math.sin(progress * Math.PI * 2) * 25;

    this.model.setPointerAzimuth(pointerAz);
    this.model.setInnerTilt(innerTilt);

    if (this.pointerAzimuthSlider) this.pointerAzimuthSlider.value = pointerAz.toString();
    if (this.innerTiltSlider) this.innerTiltSlider.value = innerTilt.toString();
    const pointerAzVal = document.getElementById('pointer-az-val');
    const innerTiltVal = document.getElementById('inner-tilt-val');
    if (pointerAzVal) pointerAzVal.textContent = pointerAz.toFixed(1) + '°';
    if (innerTiltVal) innerTiltVal.textContent = innerTilt.toFixed(1) + '°';

    this.onChangeCallback(innerTilt, pointerAz);
    this.updateCoordinateDisplay();

    this.rafId = requestAnimationFrame(this.animateAuto);
  };

  private lastCoords: CoordinateData = {
    eclipticLongitude: -999,
    eclipticLatitude: -999,
    altitude: -999,
    azimuth: -999
  };

  private flashElement(el: HTMLElement): void {
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 100);
  }

  public updateCoordinateDisplay(): void {
    const coords = this.model.getCoordinates();

    if (this.lonEl && Math.abs(coords.eclipticLongitude - this.lastCoords.eclipticLongitude) > 0.05) {
      this.lonEl.textContent = coords.eclipticLongitude.toFixed(2) + '°';
      this.flashElement(this.lonEl);
    }
    if (this.latEl && Math.abs(coords.eclipticLatitude - this.lastCoords.eclipticLatitude) > 0.05) {
      this.latEl.textContent = coords.eclipticLatitude.toFixed(2) + '°';
      this.flashElement(this.latEl);
    }
    if (this.altEl && Math.abs(coords.altitude - this.lastCoords.altitude) > 0.05) {
      this.altEl.textContent = coords.altitude.toFixed(2) + '°';
      this.flashElement(this.altEl);
    }
    if (this.azEl && Math.abs(coords.azimuth - this.lastCoords.azimuth) > 0.05) {
      this.azEl.textContent = coords.azimuth.toFixed(2) + '°';
      this.flashElement(this.azEl);
    }

    this.lastCoords = { ...coords };
  }

  public dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.pulseAnimationFrame !== null) clearTimeout(this.pulseAnimationFrame);
  }
}
