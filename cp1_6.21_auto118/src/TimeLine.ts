import { BuildingData } from './CityModel.js';

interface Callbacks {
  onYearChange: (year: number) => void;
  onBuildingSelect: (building: BuildingData) => void;
}

export class TimeLine {
  private container: HTMLElement;
  private trackWrapper: HTMLElement;
  private progress: HTMLElement;
  private dotsContainer: HTMLElement;
  private slider: HTMLElement;
  private yearDisplay: HTMLElement;
  private minYear: number = 1800;
  private maxYear: number = 2024;
  private currentYear: number = 2024;
  private isDragging: boolean = false;
  private buildings: BuildingData[] = [];
  private callbacks: Callbacks;
  private activeDotId: string | null = null;

  constructor(containerId: string, callbacks: Callbacks) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Timeline container #${containerId} not found`);
    this.container = container;
    this.callbacks = callbacks;

    this.trackWrapper = this.container.querySelector('.timeline-track-wrapper') as HTMLElement;
    this.progress = this.container.querySelector('#timeline-progress') as HTMLElement;
    this.dotsContainer = this.container.querySelector('#timeline-dots') as HTMLElement;
    this.slider = this.container.querySelector('#timeline-slider') as HTMLElement;
    this.yearDisplay = this.container.querySelector('#timeline-year') as HTMLElement;

    if (!this.trackWrapper || !this.progress || !this.dotsContainer || !this.slider || !this.yearDisplay) {
      throw new Error('Timeline DOM elements not found');
    }

    this.setupSliderEvents();
    this.setYear(this.currentYear, false);
  }

  public setBuildings(buildings: BuildingData[]): void {
    this.buildings = buildings;
    this.renderDots();
  }

  private renderDots(): void {
    this.dotsContainer.innerHTML = '';
    for (const building of this.buildings) {
      const dot = document.createElement('div');
      dot.className = 'timeline-dot';
      dot.dataset.buildingId = building.id;
      const percent = this.yearToPercent(building.year);
      dot.style.left = `${percent}%`;
      dot.style.background = this.getColorByYear(building.year);
      dot.style.color = this.getColorByYear(building.year);
      dot.title = `${building.name} (${building.year})`;

      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setYear(building.year, true);
        this.highlightDot(building.id);
        this.callbacks.onBuildingSelect(building);
      });

      this.dotsContainer.appendChild(dot);
    }
  }

  private highlightDot(buildingId: string): void {
    if (this.activeDotId) {
      const prevDot = this.dotsContainer.querySelector(`[data-building-id="${this.activeDotId}"]`);
      if (prevDot) prevDot.classList.remove('active');
    }
    const dot = this.dotsContainer.querySelector(`[data-building-id="${buildingId}"]`);
    if (dot) {
      dot.classList.add('active');
      this.activeDotId = buildingId;
    }
  }

  public clearActiveDot(): void {
    if (this.activeDotId) {
      const prevDot = this.dotsContainer.querySelector(`[data-building-id="${this.activeDotId}"]`);
      if (prevDot) prevDot.classList.remove('active');
      this.activeDotId = null;
    }
  }

  private getColorByYear(year: number): string {
    if (year <= 1900) return '#FFB300';
    if (year <= 2000) return '#FF5722';
    return '#8E24AA';
  }

  private yearToPercent(year: number): number {
    return ((year - this.minYear) / (this.maxYear - this.minYear)) * 100;
  }

  private percentToYear(percent: number): number {
    return Math.round(this.minYear + (percent / 100) * (this.maxYear - this.minYear));
  }

  private setYear(year: number, trigger: boolean): void {
    year = Math.max(this.minYear, Math.min(this.maxYear, year));
    this.currentYear = year;
    const percent = this.yearToPercent(year);

    this.slider.style.left = `${percent}%`;
    this.progress.style.width = `${percent}%`;
    this.yearDisplay.textContent = String(year);

    if (trigger) {
      this.callbacks.onYearChange(year);
    }
  }

  private setupSliderEvents(): void {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      this.isDragging = true;
      this.slider.classList.add('dragging');
      this.handlePointerMove(e);
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return;
      this.handlePointerMove(e);
    };

    const onPointerUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.slider.classList.remove('dragging');
      }
    };

    this.slider.addEventListener('mousedown', onPointerDown);
    this.slider.addEventListener('touchstart', onPointerDown, { passive: false });

    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove, { passive: false });

    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);

    this.trackWrapper.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.slider) return;
      const rect = this.trackWrapper.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      this.setYear(this.percentToYear(percent), true);
    });
  }

  private handlePointerMove(e: MouseEvent | TouchEvent): void {
    const rect = this.trackWrapper.getBoundingClientRect();
    let clientX: number;
    if (e instanceof TouchEvent) {
      clientX = e.touches[0]?.clientX ?? 0;
    } else {
      clientX = e.clientX;
    }
    const percent = ((clientX - rect.left) / rect.width) * 100;
    this.setYear(this.percentToYear(percent), true);
  }

  public setActiveBuilding(building: BuildingData | null): void {
    if (building) {
      this.setYear(building.year, false);
      this.highlightDot(building.id);
    } else {
      this.clearActiveDot();
    }
  }

  public getCurrentYear(): number {
    return this.currentYear;
  }
}
