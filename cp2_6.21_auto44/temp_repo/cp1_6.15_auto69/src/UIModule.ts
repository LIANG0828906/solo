import type { HeatLevel } from './BuildingModule';
import type { UIModuleCallbacks } from './types';

export class UIModule {
  private timeSlider: HTMLInputElement;
  private currentTimeLabel: HTMLElement;
  private sliderFill: HTMLElement;
  private heatFilter: HTMLSelectElement;
  private callbacks: UIModuleCallbacks;

  constructor(callbacks: UIModuleCallbacks) {
    this.callbacks = callbacks;
    this.timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    this.currentTimeLabel = document.getElementById('current-time') as HTMLElement;
    this.sliderFill = document.getElementById('slider-fill') as HTMLElement;
    this.heatFilter = document.getElementById('heat-filter') as HTMLSelectElement;
    this.bindEvents();
    this.updateTimeDisplay(parseFloat(this.timeSlider.value));
  }

  private bindEvents(): void {
    this.timeSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.updateTimeDisplay(val);
      this.callbacks.onTimeChange(val);
    });

    this.heatFilter.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value as 'all' | HeatLevel;
      this.callbacks.onFilterChange(val);
    });
  }

  private updateTimeDisplay(time: number): void {
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    this.currentTimeLabel.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const min = parseFloat(this.timeSlider.min);
    const max = parseFloat(this.timeSlider.max);
    const pct = ((time - min) / (max - min)) * 100;
    this.sliderFill.style.width = `${pct}%`;
  }

  public getCurrentTime(): number {
    return parseFloat(this.timeSlider.value);
  }
}
