import { eventBus } from './eventBus';

export class UIController {
  private amplitudeSlider: HTMLInputElement;
  private amplitudeValue: HTMLElement;
  private speedSlider: HTMLInputElement;
  private speedValue: HTMLElement;
  private countSlider: HTMLInputElement;
  private countValue: HTMLElement;
  private themeSelect: HTMLSelectElement;

  constructor() {
    this.amplitudeSlider = document.getElementById('amplitude-slider') as HTMLInputElement;
    this.amplitudeValue = document.getElementById('amplitude-value')!;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.speedValue = document.getElementById('speed-value')!;
    this.countSlider = document.getElementById('count-slider') as HTMLInputElement;
    this.countValue = document.getElementById('count-value')!;
    this.themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.amplitudeSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.amplitudeValue.textContent = value.toFixed(1);
      eventBus.emit('param:amplitude', value);
    });

    this.speedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.speedValue.textContent = value.toFixed(1);
      eventBus.emit('param:speed', value);
    });

    this.countSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      this.countValue.textContent = value.toString();
      eventBus.emit('param:count', value);
    });

    this.themeSelect.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      eventBus.emit('param:colorTheme', value);
    });
  }
}
