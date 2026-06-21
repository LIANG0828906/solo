export class TimeSlider {
  private slider: HTMLInputElement;
  private yearDisplay: HTMLElement;
  private currentYear: number;
  private onChangeCallback: (year: number) => void;
  private debounceTimer: number | null = null;

  constructor(sliderId: string, displayId: string) {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    
    if (!slider || !display) {
      throw new Error('Time slider elements not found');
    }

    this.slider = slider as HTMLInputElement;
    this.yearDisplay = display;
    this.currentYear = parseInt(this.slider.value, 10);
    this.onChangeCallback = () => {};

    this.init();
  }

  private init(): void {
    this.updateDisplay(this.currentYear);

    this.slider.addEventListener('input', () => {
      const year = parseInt(this.slider.value, 10);
      this.updateDisplay(year);
      
      if (this.debounceTimer !== null) {
        clearTimeout(this.debounceTimer);
      }
      
      this.debounceTimer = window.setTimeout(() => {
        this.currentYear = year;
        if (this.onChangeCallback) {
          this.onChangeCallback(year);
        }
      }, 50);
    });

    this.slider.addEventListener('change', () => {
      const year = parseInt(this.slider.value, 10);
      this.currentYear = year;
      this.updateDisplay(year);
      
      if (this.debounceTimer !== null) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      
      if (this.onChangeCallback) {
        this.onChangeCallback(year);
      }
    });
  }

  private updateDisplay(year: number): void {
    this.yearDisplay.textContent = String(year);
  }

  public onChange(callback: (year: number) => void): void {
    this.onChangeCallback = callback;
  }

  public getYear(): number {
    return this.currentYear;
  }

  public setYear(year: number, animate = true): void {
    this.currentYear = year;
    this.slider.value = String(year);
    this.updateDisplay(year);
    
    if (animate && this.onChangeCallback) {
      this.onChangeCallback(year);
    }
  }
}
