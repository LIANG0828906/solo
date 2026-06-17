import type { EventBus } from './EventBus.js';

const MIN_YEAR = 1900;
const MAX_YEAR = 2023;
const DEFAULT_YEAR = 2023;

interface HoverInfo {
  lon: number;
  lat: number;
  temp: number;
  screenX: number;
  screenY: number;
}

class UIManager {
  private root: HTMLElement;
  private bus: EventBus;

  private yearSlider!: HTMLInputElement;
  private yearLabel!: HTMLSpanElement;
  private tooltip!: HTMLDivElement;
  private autoRotateBtn!: HTMLButtonElement;

  private pendingYear: number | null = null;
  private yearRafPending: boolean = false;
  private currentYear: number = DEFAULT_YEAR;
  private autoRotateActive: boolean = false;

  constructor(root: HTMLElement, bus: EventBus) {
    this.root = root;
    this.bus = bus;
  }

  init(): void {
    this.buildTopControls();
    this.buildLegend();
    this.buildBottomControls();
    this.buildTooltip();
    this.bindEvents();
  }

  private buildTopControls(): void {
    const wrap = document.createElement('div');
    wrap.className = 'top-controls';

    const btn = document.createElement('button');
    btn.className = 'auto-rotate-btn ui-panel';
    btn.type = 'button';
    btn.setAttribute('aria-label', '切换自动旋转');
    btn.title = '切换自动旋转';

    btn.innerHTML = `
      <svg class="rotate-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-3-6.7L21 8"/>
        <polyline points="21 3 21 8 16 8"/>
      </svg>
    `;
    wrap.appendChild(btn);
    this.autoRotateBtn = btn;

    this.root.appendChild(wrap);
  }

  private buildLegend(): void {
    const container = document.createElement('div');
    container.className = 'legend-container ui-panel';

    const title = document.createElement('div');
    title.className = 'legend-title';
    title.textContent = '温度异常 °C';
    container.appendChild(title);

    const body = document.createElement('div');
    body.className = 'legend-body';

    const gradient = document.createElement('div');
    gradient.className = 'legend-gradient';
    body.appendChild(gradient);

    const labels = document.createElement('div');
    labels.className = 'legend-labels';
    const values = [3, 2, 1, 0, -1, -2, -3];
    for (const v of values) {
      const span = document.createElement('span');
      span.className = 'legend-label';
      span.textContent = v > 0 ? `+${v}°C` : `${v}°C`;
      labels.appendChild(span);
    }
    body.appendChild(labels);

    container.appendChild(body);
    this.root.appendChild(container);
  }

  private buildBottomControls(): void {
    const container = document.createElement('div');
    container.className = 'bottom-controls ui-panel';

    const header = document.createElement('div');
    header.className = 'slider-header';

    const label = document.createElement('div');
    label.className = 'year-label';
    const lblSpan = document.createElement('span');
    lblSpan.textContent = `${DEFAULT_YEAR}`;
    label.innerHTML = 'YEAR  ';
    label.appendChild(lblSpan);
    this.yearLabel = lblSpan;

    const range = document.createElement('div');
    range.className = 'year-range';
    range.textContent = `${MIN_YEAR}  —  ${MAX_YEAR}`;

    header.appendChild(label);
    header.appendChild(range);
    container.appendChild(header);

    const sliderWrap = document.createElement('div');
    sliderWrap.className = 'slider-wrapper';

    const markStart = document.createElement('span');
    markStart.className = 'year-mark-start';
    markStart.textContent = String(MIN_YEAR);

    const markEnd = document.createElement('span');
    markEnd.className = 'year-mark-end';
    markEnd.textContent = String(MAX_YEAR);

    const slider = document.createElement('input');
    slider.className = 'year-slider';
    slider.type = 'range';
    slider.min = String(MIN_YEAR);
    slider.max = String(MAX_YEAR);
    slider.step = '1';
    slider.value = String(DEFAULT_YEAR);
    this.yearSlider = slider;

    sliderWrap.appendChild(markStart);
    sliderWrap.appendChild(slider);
    sliderWrap.appendChild(markEnd);

    container.appendChild(sliderWrap);
    this.root.appendChild(container);
  }

  private buildTooltip(): void {
    const tip = document.createElement('div');
    tip.className = 'hover-tooltip';
    tip.innerHTML = `
      <div class="tooltip-row">
        <span class="tooltip-label">经度</span>
        <span class="tooltip-value tooltip-lon">0°</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">纬度</span>
        <span class="tooltip-value tooltip-lat">0°</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">异常</span>
        <span class="tooltip-value tooltip-temp">0.00°C</span>
      </div>
    `;
    this.tooltip = tip;
    document.body.appendChild(tip);
  }

  private bindEvents(): void {
    this.yearSlider.addEventListener('input', this.onSliderInput);
    this.yearSlider.addEventListener('change', this.onSliderChange);
    this.autoRotateBtn.addEventListener('click', this.onAutoRotateClick);
    this.bus.on('yearChange', this.syncYearLabel);
    this.bus.on('hoverData', this.onHoverData);
  }

  private onSliderInput = (): void => {
    const year = parseInt(this.yearSlider.value, 10);
    if (Number.isNaN(year)) return;
    this.pendingYear = year;
    this.requestYearEmit();
  };

  private onSliderChange = (): void => {
    const year = parseInt(this.yearSlider.value, 10);
    if (Number.isNaN(year)) return;
    this.pendingYear = year;
    this.yearRafPending = false;
    this.emitYear(year);
  };

  private requestYearEmit(): void {
    if (this.yearRafPending) return;
    this.yearRafPending = true;
    requestAnimationFrame(() => {
      this.yearRafPending = false;
      if (this.pendingYear !== null) {
        const y = this.pendingYear;
        this.pendingYear = null;
        this.emitYear(y);
      }
    });
  }

  private emitYear(year: number): void {
    if (year === this.currentYear) return;
    this.currentYear = year;
    this.bus.emit('yearChange', year);
  }

  private syncYearLabel = (year: number): void => {
    this.yearLabel.textContent = String(year);
  };

  private onAutoRotateClick = (): void => {
    this.autoRotateActive = !this.autoRotateActive;
    if (this.autoRotateActive) {
      this.autoRotateBtn.classList.add('active');
    } else {
      this.autoRotateBtn.classList.remove('active');
    }
    this.bus.emit('autoRotateToggle', this.autoRotateActive);
  };

  private onHoverData = (info: HoverInfo | null): void => {
    if (!info) {
      this.hideTooltip();
      return;
    }
    this.showTooltip(info);
  };

  private showTooltip(info: HoverInfo): void {
    const lonEl = this.tooltip.querySelector('.tooltip-lon') as HTMLElement;
    const latEl = this.tooltip.querySelector('.tooltip-lat') as HTMLElement;
    const tempEl = this.tooltip.querySelector('.tooltip-temp') as HTMLElement;
    if (!lonEl || !latEl || !tempEl) return;

    const lonSign = info.lon > 0 ? 'E' : info.lon < 0 ? 'W' : '';
    const latSign = info.lat > 0 ? 'N' : info.lat < 0 ? 'S' : '';
    lonEl.textContent = `${Math.abs(info.lon)}°${lonSign}`;
    latEl.textContent = `${Math.abs(info.lat)}°${latSign}`;

    const tempVal = info.temp;
    const sign = tempVal > 0 ? '+' : '';
    tempEl.textContent = `${sign}${tempVal.toFixed(2)}°C`;
    tempEl.classList.toggle('temp-pos', tempVal > 0);
    tempEl.classList.toggle('temp-neg', tempVal < 0);

    this.tooltip.style.left = `${info.screenX}px`;
    this.tooltip.style.top = `${info.screenY}px`;
    this.tooltip.classList.add('visible');
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove('visible');
  }

  dispose(): void {
    this.yearSlider.removeEventListener('input', this.onSliderInput);
    this.yearSlider.removeEventListener('change', this.onSliderChange);
    this.autoRotateBtn.removeEventListener('click', this.onAutoRotateClick);
    if (this.tooltip.parentElement) {
      this.tooltip.parentElement.removeChild(this.tooltip);
    }
  }
}

export { UIManager, MIN_YEAR, MAX_YEAR, DEFAULT_YEAR };
