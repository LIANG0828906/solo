import { DisplayMode } from './heatmapCalculator';
import { TIME_SLOTS, getDensityLevel, getDensityLevelText, getSuggestion } from './dataProcessor';

export interface UICallbacks {
  onTimeChange: (index: number) => void;
  onModeChange: (mode: DisplayMode) => void;
  onGainChange: (gain: number) => void;
  onDetailClose: () => void;
}

export interface CellDetailData {
  roadName: string;
  density: number;
  gridX: number;
  gridZ: number;
  history: { label: string; value: number }[];
}

export class UIController {
  private callbacks: UICallbacks;

  private timeSlider: HTMLInputElement;
  private timeValue: HTMLElement;
  private gainSlider: HTMLInputElement;
  private gainValue: HTMLElement;
  private modeButtons: HTMLElement;
  private detailPanel: HTMLElement;
  private detailClose: HTMLElement;
  private mobileToggle: HTMLElement;
  private controlPanel: HTMLElement;

  private currentTimeIndex: number = 0;
  private currentMode: DisplayMode = DisplayMode.HEATMAP;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    this.timeSlider = document.getElementById('timeSlider') as HTMLInputElement;
    this.timeValue = document.getElementById('timeValue') as HTMLElement;
    this.gainSlider = document.getElementById('gainSlider') as HTMLInputElement;
    this.gainValue = document.getElementById('gainValue') as HTMLElement;
    this.modeButtons = document.getElementById('modeButtons') as HTMLElement;
    this.detailPanel = document.getElementById('detailPanel') as HTMLElement;
    this.detailClose = document.getElementById('detailClose') as HTMLElement;
    this.mobileToggle = document.getElementById('mobileToggle') as HTMLElement;
    this.controlPanel = document.getElementById('controlPanel') as HTMLElement;

    this._bindEvents();
  }

  private _bindEvents(): void {
    this.timeSlider.addEventListener('input', (e) => {
      const idx = parseInt((e.target as HTMLInputElement).value, 10);
      this.currentTimeIndex = idx;
      this.timeValue.textContent = TIME_SLOTS[idx];
      this.callbacks.onTimeChange(idx);
    });

    this.gainSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.gainValue.textContent = val.toFixed(1);
      this.callbacks.onGainChange(val);
    });

    this.modeButtons.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('mode-btn')) return;
      const mode = target.dataset.mode as DisplayMode;
      if (!mode || mode === this.currentMode) return;
      this.setMode(mode);
      this.callbacks.onModeChange(mode);
    });

    this.detailClose.addEventListener('click', () => {
      this.hideDetail();
      this.callbacks.onDetailClose();
    });

    this.mobileToggle.addEventListener('click', () => {
      this.controlPanel.classList.toggle('mobile-open');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        const target = e.target as HTMLElement;
        if (
          !this.controlPanel.contains(target) &&
          !this.mobileToggle.contains(target)
        ) {
          this.controlPanel.classList.remove('mobile-open');
        }
      }
    });
  }

  public setTime(index: number): void {
    const clamped = Math.max(0, Math.min(TIME_SLOTS.length - 1, index));
    this.currentTimeIndex = clamped;
    this.timeSlider.value = String(clamped);
    this.timeValue.textContent = TIME_SLOTS[clamped];
  }

  public setMode(mode: DisplayMode): void {
    this.currentMode = mode;
    const btns = this.modeButtons.querySelectorAll('.mode-btn');
    btns.forEach((b) => {
      const el = b as HTMLElement;
      if (el.dataset.mode === mode) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  public setGain(gain: number): void {
    const val = Math.max(0.1, Math.min(5.0, gain));
    this.gainSlider.value = String(val);
    this.gainValue.textContent = val.toFixed(1);
  }

  public showDetail(data: CellDetailData): void {
    const roadNameEl = document.getElementById('detailRoadName') as HTMLElement;
    const levelEl = document.getElementById('detailLevel') as HTMLElement;
    const densityEl = document.getElementById('detailDensity') as HTMLElement;
    const coordEl = document.getElementById('detailCoord') as HTMLElement;
    const barsEl = document.getElementById('chartBars') as HTMLElement;
    const sugEl = document.getElementById('detailSuggestion') as HTMLElement;

    const displayName = data.roadName || `无名路段 (${data.gridX}, ${data.gridZ})`;
    roadNameEl.textContent = displayName;

    const level = getDensityLevel(data.density);
    levelEl.textContent = getDensityLevelText(level);
    levelEl.className = 'detail-val';
    levelEl.classList.add(`level-${level}`);

    densityEl.textContent = (data.density * 100).toFixed(1) + '%';
    coordEl.textContent = `(${data.gridX}, ${data.gridZ})`;

    barsEl.innerHTML = '';
    const maxVal = Math.max(...data.history.map((h) => h.value), 0.01);
    data.history.forEach((h) => {
      const wrap = document.createElement('div');
      wrap.className = 'chart-bar-wrap';

      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      const pct = Math.max(4, (h.value / maxVal) * 100);
      bar.style.height = pct + '%';

      const label = document.createElement('span');
      label.className = 'chart-bar-label';
      label.textContent = h.label;

      wrap.appendChild(bar);
      wrap.appendChild(label);
      barsEl.appendChild(wrap);
    });

    sugEl.textContent = getSuggestion(data.density, data.gridX, data.gridZ);

    this.detailPanel.classList.add('visible');
  }

  public hideDetail(): void {
    this.detailPanel.classList.remove('visible');
  }
}
