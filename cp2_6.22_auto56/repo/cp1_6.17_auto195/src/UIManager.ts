import { EventBus, CountryEnergyData } from './EventBus';

const PRIMARY_COLORS: Record<'renewable' | 'fossil' | 'nuclear', string> = {
  renewable: '#45A29E',
  fossil: '#C5C6C7',
  nuclear: '#66FCF1',
};

export class UIManager {
  private eventBus: EventBus;
  private slider: HTMLInputElement;
  private yearLabel: HTMLElement;
  private trackFill: HTMLElement;
  private detailPanel: HTMLElement;
  private infoYear: HTMLElement;
  private loadingEl: HTMLElement;
  private closeDetailBtn: HTMLElement;

  private detailCountry: HTMLElement;
  private detailRenewable: HTMLElement;
  private detailFossil: HTMLElement;
  private detailNuclear: HTMLElement;
  private detailYear: HTMLElement;
  private barRenewable: HTMLElement;
  private barFossil: HTMLElement;
  private barNuclear: HTMLElement;

  private throttledEmit: ((year: number) => void) | null = null;
  private lastEmitTime: number = 0;
  private readonly THROTTLE_MS: number = 60;

  constructor() {
    this.eventBus = EventBus.getInstance();

    this.slider = document.getElementById('year-slider') as HTMLInputElement;
    this.yearLabel = document.getElementById('year-label') as HTMLElement;
    this.trackFill = document.getElementById('track-fill') as HTMLElement;
    this.detailPanel = document.getElementById('detail-panel') as HTMLElement;
    this.infoYear = document.getElementById('info-year') as HTMLElement;
    this.loadingEl = document.getElementById('loading') as HTMLElement;
    this.closeDetailBtn = document.getElementById('close-detail') as HTMLElement;

    this.detailCountry = document.getElementById('detail-country') as HTMLElement;
    this.detailRenewable = document.getElementById('detail-renewable') as HTMLElement;
    this.detailFossil = document.getElementById('detail-fossil') as HTMLElement;
    this.detailNuclear = document.getElementById('detail-nuclear') as HTMLElement;
    this.detailYear = document.getElementById('detail-year') as HTMLElement;
    this.barRenewable = document.getElementById('bar-renewable') as HTMLElement;
    this.barFossil = document.getElementById('bar-fossil') as HTMLElement;
    this.barNuclear = document.getElementById('bar-nuclear') as HTMLElement;

    this.bindEvents();
    this.subscribeEvents();
    this.updateSliderUI();
  }

  private bindEvents(): void {
    this.slider.addEventListener('input', (e) => {
      const year = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateSliderUI(year);
      this.throttledEmitYear(year);
    });

    this.slider.addEventListener('change', (e) => {
      const year = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateSliderUI(year);
      this.eventBus.emit('year-changed', year);
    });

    this.closeDetailBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideDetailPanel();
      this.eventBus.emit('country-selected', null);
    });
  }

  private throttledEmitYear(year: number): void {
    const now = performance.now();
    if (now - this.lastEmitTime >= this.THROTTLE_MS) {
      this.lastEmitTime = now;
      this.eventBus.emit('year-changed', year);
    } else {
      if (this.throttledEmit) {
        clearTimeout((this.throttledEmit as any)._timer);
      }
      this.throttledEmit = (y: number) => {
        this.lastEmitTime = performance.now();
        this.eventBus.emit('year-changed', y);
      };
      const delay = this.THROTTLE_MS - (now - this.lastEmitTime);
      (this.throttledEmit as any)._timer = setTimeout(() => {
        if (this.throttledEmit) this.throttledEmit(year);
      }, delay);
    }
  }

  private subscribeEvents(): void {
    this.eventBus.on('data-loaded', () => {
      this.loadingEl.classList.add('hidden');
    });

    this.eventBus.on('country-selected', (data) => {
      if (data) {
        this.showDetailPanel(data);
      } else {
        this.hideDetailPanel();
      }
    });

    this.eventBus.on('year-changed', (year) => {
      this.infoYear.textContent = String(year);
      this.updateSliderUI(year);
      const sliderYear = parseInt(this.slider.value, 10);
      if (sliderYear !== year) {
        this.slider.value = String(year);
      }
    });
  }

  private updateSliderUI(year?: number): void {
    const y = year ?? parseInt(this.slider.value, 10);
    const min = parseInt(this.slider.min, 10);
    const max = parseInt(this.slider.max, 10);
    const percent = ((y - min) / (max - min)) * 100;

    this.yearLabel.textContent = String(y);
    this.yearLabel.style.left = `${percent}%`;
    this.trackFill.style.width = `${percent}%`;
    this.infoYear.textContent = String(y);
  }

  private showDetailPanel(data: CountryEnergyData): void {
    const yearData = data.yearlyData[0];
    if (!yearData) return;

    this.detailCountry.textContent = data.name;
    this.detailRenewable.textContent = `${yearData.renewable.toFixed(1)}%`;
    this.detailFossil.textContent = `${yearData.fossil.toFixed(1)}%`;
    this.detailNuclear.textContent = `${yearData.nuclear.toFixed(1)}%`;
    this.detailYear.textContent = String(yearData.year);

    const maxVal = Math.max(yearData.renewable, yearData.fossil, yearData.nuclear, 1);
    this.barRenewable.style.height = `${(yearData.renewable / maxVal) * 100}%`;
    this.barFossil.style.height = `${(yearData.fossil / maxVal) * 100}%`;
    this.barNuclear.style.height = `${(yearData.nuclear / maxVal) * 100}%`;

    const borderColor = PRIMARY_COLORS[data.primaryEnergy];
    this.detailPanel.style.borderLeftColor = borderColor;

    this.detailPanel.classList.add('active');
  }

  private hideDetailPanel(): void {
    this.detailPanel.classList.remove('active');
  }

  public getCurrentYear(): number {
    return parseInt(this.slider.value, 10);
  }
}
