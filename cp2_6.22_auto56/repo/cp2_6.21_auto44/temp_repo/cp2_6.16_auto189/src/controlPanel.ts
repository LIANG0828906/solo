import { STAGES, getStagesDuration, PlantParams } from './plantSimulator';

export interface ControlCallbacks {
  onProgressChange: (progress: number) => void;
  onPlayPause: (isPlaying: boolean) => void;
  onParamsChange: (params: PlantParams) => void;
  onTogglePanel?: () => void;
}

export class ControlPanel {
  container: HTMLElement;
  stageLabel!: HTMLDivElement;
  progressBar!: HTMLInputElement;
  currentTimeLabel!: HTMLDivElement;
  totalTimeLabel!: HTMLDivElement;
  playPauseBtn!: HTMLButtonElement;
  playIcon!: HTMLDivElement;
  pauseIcon!: HTMLDivElement;
  lightSlider!: HTMLInputElement;
  waterSlider!: HTMLInputElement;
  speedSlider!: HTMLInputElement;
  lightValue!: HTMLSpanElement;
  waterValue!: HTMLSpanElement;
  speedValue!: HTMLSpanElement;
  panelWrapper!: HTMLDivElement;
  toggleBtn!: HTMLButtonElement;

  callbacks: ControlCallbacks;
  isPlaying: boolean = true;
  isDragging: boolean = false;
  currentParams: PlantParams = { light: 0.7, water: 0.6, speed: 1 };
  progress: number = 0;
  params: PlantParams;

  constructor(callbacks: ControlCallbacks) {
    this.callbacks = callbacks;
    this.params = { ...this.currentParams };
    this.container = document.createElement('div');
    this.buildUI();
    this.bindEvents();
  }

  buildUI() {
    this.container.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      font-family: 'Inter', sans-serif;
      z-index: 10;
    `;

    this.buildStageLabel();
    this.buildTopToggle();
    this.buildBottomControls();
    this.buildSidePanel();
  }

  buildStageLabel() {
    this.stageLabel = document.createElement('div');
    this.stageLabel.style.cssText = `
      position: absolute;
      top: 24px;
      left: 24px;
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 12px;
      color: #2E4053;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transform: translateX(-30px);
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
      pointer-events: none;
    `;
    this.stageLabel.textContent = STAGES[0].name;
    this.container.appendChild(this.stageLabel);
    setTimeout(() => {
      this.stageLabel.style.transform = 'translateX(0)';
      this.stageLabel.style.opacity = '1';
    }, 100);
  }

  buildTopToggle() {
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;
    this.toggleBtn.style.cssText = `
      position: absolute;
      top: 24px;
      right: 24px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(27, 38, 49, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: none;
      color: white;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      transition: transform 0.3s ease, background 0.2s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      z-index: 20;
    `;
    this.toggleBtn.addEventListener('mouseenter', () => {
      this.toggleBtn.style.background = 'rgba(27, 38, 49, 0.85)';
    });
    this.toggleBtn.addEventListener('mouseleave', () => {
      this.toggleBtn.style.background = 'rgba(27, 38, 49, 0.7)';
    });
    this.toggleBtn.addEventListener('click', () => {
      this.togglePanel();
    });
    this.container.appendChild(this.toggleBtn);
  }

  buildBottomControls() {
    const bottomBar = document.createElement('div');
    bottomBar.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      width: min(92%, 780px);
      padding: 16px 24px;
      background: rgba(27, 38, 49, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 12px;
      pointer-events: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    `;

    const progressRow = document.createElement('div');
    progressRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    `;

    this.playPauseBtn = document.createElement('button');
    this.playPauseBtn.style.cssText = `
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2ECC71, #1ABC9C);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 10px rgba(46, 204, 113, 0.4);
      transition: transform 0.25s ease, box-shadow 0.2s ease;
    `;
    this.playPauseBtn.addEventListener('mouseenter', () => {
      this.playPauseBtn.style.transform = 'scale(1.08)';
      this.playPauseBtn.style.boxShadow = '0 4px 16px rgba(46, 204, 113, 0.5)';
    });
    this.playPauseBtn.addEventListener('mouseleave', () => {
      this.playPauseBtn.style.transform = 'scale(1)';
      this.playPauseBtn.style.boxShadow = '0 2px 10px rgba(46, 204, 113, 0.4)';
    });

    this.playIcon = document.createElement('div');
    this.playIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <polygon points="6,4 20,12 6,20"></polygon>
      </svg>
    `;
    this.playIcon.style.cssText = `position: absolute; opacity: 0; transition: opacity 0.2s ease, transform 0.3s ease;`;

    this.pauseIcon = document.createElement('div');
    this.pauseIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>
    `;
    this.pauseIcon.style.cssText = `position: absolute; opacity: 1; transition: opacity 0.2s ease, transform 0.3s ease;`;

    this.playPauseBtn.appendChild(this.playIcon);
    this.playPauseBtn.appendChild(this.pauseIcon);

    const progressWrapper = document.createElement('div');
    progressWrapper.style.cssText = `
      flex: 1;
      position: relative;
      height: 40px;
      display: flex;
      align-items: center;
    `;

    this.progressBar = document.createElement('input');
    this.progressBar.type = 'range';
    this.progressBar.min = '0';
    this.progressBar.max = '1000';
    this.progressBar.value = '0';
    this.progressBar.style.cssText = `
      width: 100%;
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      cursor: pointer;
      height: 36px;
      margin: 0;
      z-index: 2;
      position: relative;
    `;

    const sliderStyle = document.createElement('style');
    sliderStyle.textContent = `
      .plant-progress::-webkit-slider-runnable-track {
        height: 6px;
        background: rgba(255,255,255,0.15);
        border-radius: 3px;
      }
      .plant-progress::-moz-range-track {
        height: 6px;
        background: rgba(255,255,255,0.15);
        border-radius: 3px;
      }
      .plant-progress::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px; height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2ECC71, #1ABC9C);
        cursor: pointer;
        margin-top: -6px;
        box-shadow: 0 2px 8px rgba(46, 204, 113, 0.5);
        transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 2px solid white;
      }
      .plant-progress::-moz-range-thumb {
        width: 18px; height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2ECC71, #1ABC9C);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(46, 204, 113, 0.5);
      }
      .plant-progress.dragging::-webkit-slider-thumb {
        transform: scale(1.25);
      }
      .plant-progress.dragging::-moz-range-thumb {
        transform: scale(1.25);
      }
      .event-marker {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #F1C40F;
        box-shadow: 0 0 8px rgba(241, 196, 15, 0.7);
        z-index: 1;
        pointer-events: none;
      }
      .param-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 32px;
        background: transparent;
        cursor: pointer;
        margin: 0;
      }
      .param-slider::-webkit-slider-runnable-track {
        height: 8px;
        background: linear-gradient(to right, rgba(46, 204, 113, 0.6), rgba(26, 188, 156, 0.6));
        border-radius: 4px;
      }
      .param-slider::-moz-range-track {
        height: 8px;
        background: linear-gradient(to right, rgba(46, 204, 113, 0.6), rgba(26, 188, 156, 0.6));
        border-radius: 4px;
      }
      .param-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 22px; height: 22px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        margin-top: -7px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        border: 3px solid #2ECC71;
        transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .param-slider::-moz-range-thumb {
        width: 22px; height: 22px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 3px solid #2ECC71;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }
      .param-slider.dragging::-webkit-slider-thumb {
        transform: scale(1.2);
      }
      .param-slider.dragging::-moz-range-thumb {
        transform: scale(1.2);
      }
    `;
    this.container.appendChild(sliderStyle);

    this.progressBar.className = 'plant-progress';

    progressWrapper.appendChild(this.progressBar);

    const markersContainer = document.createElement('div');
    markersContainer.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
    `;
    this.addStageMarkers(markersContainer);
    progressWrapper.appendChild(markersContainer);

    this.currentTimeLabel = document.createElement('div');
    this.currentTimeLabel.style.cssText = `
      color: rgba(255, 255, 255, 0.85);
      font-size: 13px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      min-width: 42px;
      text-align: right;
    `;
    this.currentTimeLabel.textContent = '0:00';

    progressRow.appendChild(this.playPauseBtn);
    progressRow.appendChild(progressWrapper);
    progressRow.appendChild(this.currentTimeLabel);

    const stageRow = document.createElement('div');
    stageRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      padding: 0 56px 0 56px;
    `;
    for (const stage of STAGES) {
      const label = document.createElement('div');
      label.style.cssText = `
        font-size: 11px;
        color: rgba(255, 255, 255, 0.55);
        font-weight: 500;
      `;
      label.textContent = stage.name;
      stageRow.appendChild(label);
    }
    this.totalTimeLabel = document.createElement('div');
    this.totalTimeLabel.style.cssText = `
      position: absolute;
      right: 24px;
      top: 72px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
    `;
    this.totalTimeLabel.textContent = this.formatTime(getStagesDuration(this.params));
    bottomBar.appendChild(progressRow);
    bottomBar.appendChild(stageRow);
    bottomBar.appendChild(this.totalTimeLabel);

    this.container.appendChild(bottomBar);
  }

  addStageMarkers(container: HTMLElement) {
    for (let i = 1; i < STAGES.length; i++) {
      const marker = document.createElement('div');
      marker.className = 'event-marker';
      const pos = (i / STAGES.length) * 100;
      marker.style.left = `${pos}%`;
      container.appendChild(marker);
    }
  }

  buildSidePanel() {
    this.panelWrapper = document.createElement('div');
    this.panelWrapper.style.cssText = `
      position: absolute;
      top: 24px;
      right: 24px;
      width: 280px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 16px;
      pointer-events: auto;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 15px;
      font-weight: 600;
      color: white;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    `;
    title.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"></path>
        <path d="M18 16v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"></path>
      </svg>
      生长参数
    `;
    this.panelWrapper.appendChild(title);

    this.lightSlider = this.buildSlider('光照强度', '#F1C40F', '☀️', 70, (v) => `${Math.round(v)}%`, 'light');
    this.waterSlider = this.buildSlider('水分', '#3498DB', '💧', 60, (v) => `${Math.round(v)}%`, 'water');
    this.speedSlider = this.buildSlider('生长速度', '#E74C3C', '⚡', 50, (v) => `${(0.5 + v * 0.025).toFixed(1)}x`, 'speed');

    this.container.appendChild(this.panelWrapper);

    this.applyResponsive();
    window.addEventListener('resize', () => this.applyResponsive());
  }

  buildSlider(labelText: string, _color: string, emoji: string, defaultValue: number, formatFn: (v: number) => string, type: 'light' | 'water' | 'speed'): HTMLInputElement {
    const row = document.createElement('div');
    row.style.cssText = `margin-bottom: 18px;`;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;
    const label = document.createElement('div');
    label.style.cssText = `
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    label.innerHTML = `<span style="font-size: 15px;">${emoji}</span>${labelText}`;

    const value = document.createElement('span');
    value.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: white;
      background: rgba(255, 255, 255, 0.15);
      padding: 3px 10px;
      border-radius: 8px;
      font-variant-numeric: tabular-nums;
    `;
    value.textContent = formatFn(defaultValue);
    header.appendChild(label);
    header.appendChild(value);
    row.appendChild(header);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = String(defaultValue);
    slider.className = 'param-slider';
    slider.style.cssText = `width: 100%;`;

    slider.addEventListener('pointerdown', () => {
      slider.classList.add('dragging');
    });
    slider.addEventListener('pointerup', () => {
      slider.classList.remove('dragging');
    });
    slider.addEventListener('pointerleave', () => {
      slider.classList.remove('dragging');
    });

    slider.addEventListener('input', () => {
      const v = Number(slider.value);
      value.textContent = formatFn(v);
      if (type === 'light') this.params.light = v / 100;
      else if (type === 'water') this.params.water = v / 100;
      else this.params.speed = 0.5 + (v / 100) * 2.5;
      this.currentParams = { ...this.params };
      this.callbacks.onParamsChange({ ...this.params });
      this.totalTimeLabel.textContent = this.formatTime(getStagesDuration(this.params));
    });

    row.appendChild(slider);
    this.panelWrapper.appendChild(row);

    if (type === 'light') this.lightValue = value;
    else if (type === 'water') this.waterValue = value;
    else this.speedValue = value;

    return slider;
  }

  applyResponsive() {
    const width = window.innerWidth;
    if (width <= 768) {
      this.toggleBtn.style.display = 'flex';
      this.panelWrapper.style.top = 'auto';
      this.panelWrapper.style.bottom = '110px';
      this.panelWrapper.style.right = '16px';
      this.panelWrapper.style.left = '16px';
      this.panelWrapper.style.width = 'auto';
      this.panelWrapper.style.transform = 'translateY(120%)';
      this.panelWrapper.style.opacity = '0';
      this.panelWrapper.style.pointerEvents = 'none';
    } else {
      this.toggleBtn.style.display = width > 1024 ? 'none' : 'flex';
      this.panelWrapper.style.top = '24px';
      this.panelWrapper.style.bottom = 'auto';
      this.panelWrapper.style.right = '24px';
      this.panelWrapper.style.left = 'auto';
      this.panelWrapper.style.width = '280px';
      if (width > 1024) {
        this.panelWrapper.style.transform = 'translateX(0)';
        this.panelWrapper.style.opacity = '1';
        this.panelWrapper.style.pointerEvents = 'auto';
      } else {
        this.panelWrapper.style.transform = 'translateX(120%)';
        this.panelWrapper.style.opacity = '0';
        this.panelWrapper.style.pointerEvents = 'none';
      }
    }
  }

  togglePanel() {
    const isOpen = this.panelWrapper.style.opacity === '1';
    const width = window.innerWidth;
    if (width <= 768) {
      if (isOpen) {
        this.panelWrapper.style.transform = 'translateY(120%)';
        this.panelWrapper.style.opacity = '0';
        this.panelWrapper.style.pointerEvents = 'none';
      } else {
        this.panelWrapper.style.transform = 'translateY(0)';
        this.panelWrapper.style.opacity = '1';
        this.panelWrapper.style.pointerEvents = 'auto';
      }
    } else {
      if (isOpen) {
        this.panelWrapper.style.transform = 'translateX(120%)';
        this.panelWrapper.style.opacity = '0';
        this.panelWrapper.style.pointerEvents = 'none';
      } else {
        this.panelWrapper.style.transform = 'translateX(0)';
        this.panelWrapper.style.opacity = '1';
        this.panelWrapper.style.pointerEvents = 'auto';
      }
    }
  }

  bindEvents() {
    this.playPauseBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      this.updatePlayPauseIcon();
      this.callbacks.onPlayPause(this.isPlaying);
    });

    this.progressBar.addEventListener('pointerdown', () => {
      this.isDragging = true;
      this.progressBar.classList.add('dragging');
    });

    this.progressBar.addEventListener('input', () => {
      const v = Number(this.progressBar.value) / 1000;
      this.progress = v;
      this.callbacks.onProgressChange(v);
    });

    const endDrag = () => {
      this.isDragging = false;
      this.progressBar.classList.remove('dragging');
    };
    this.progressBar.addEventListener('pointerup', endDrag);
    this.progressBar.addEventListener('pointerleave', endDrag);
  }

  updatePlayPauseIcon() {
    if (this.isPlaying) {
      this.playIcon.style.opacity = '0';
      this.playIcon.style.transform = 'rotate(-90deg)';
      this.pauseIcon.style.opacity = '1';
      this.pauseIcon.style.transform = 'rotate(0deg)';
    } else {
      this.playIcon.style.opacity = '1';
      this.playIcon.style.transform = 'rotate(0deg)';
      this.pauseIcon.style.opacity = '0';
      this.pauseIcon.style.transform = 'rotate(90deg)';
    }
    this.playPauseBtn.style.transform = this.isPlaying ? 'rotate(0deg)' : 'rotate(180deg)';
  }

  updateProgress(p: number) {
    if (this.isDragging) return;
    this.progress = p;
    this.progressBar.value = String(Math.round(p * 1000));
    this.currentTimeLabel.textContent = this.formatTime(p * getStagesDuration(this.params));
  }

  setStage(stageIndex: number) {
    if (this.stageLabel.textContent !== STAGES[stageIndex].name) {
      this.stageLabel.style.transform = 'translateX(-30px)';
      this.stageLabel.style.opacity = '0';
      setTimeout(() => {
        this.stageLabel.textContent = STAGES[stageIndex].name;
        this.stageLabel.style.transform = 'translateX(0)';
        this.stageLabel.style.opacity = '1';
      }, 300);
    }
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  attachTo(parent: HTMLElement) {
    parent.appendChild(this.container);
  }
}
