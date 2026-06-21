export interface ControlParams {
  stormIntensity: number;
  windDirection: number;
  primaryColor: string;
}

export interface ControlCallbacks {
  onIntensityChange: (value: number) => void;
  onWindDirectionChange: (value: number) => void;
  onColorChange: (color: string) => void;
}

export class ControlPanel {
  private callbacks: ControlCallbacks;
  private intensitySlider: HTMLInputElement;
  private intensityValue: HTMLElement;
  private windDirectionSlider: HTMLInputElement;
  private windDirectionValue: HTMLElement;
  private colorPresets: NodeListOf<HTMLButtonElement>;
  private customColorBtn: HTMLButtonElement;
  private colorPicker: HTMLInputElement;

  constructor(containerId: string, callbacks: ControlCallbacks, initialParams: ControlParams) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.callbacks = callbacks;
    
    this.intensitySlider = document.getElementById('intensity-slider') as HTMLInputElement;
    this.intensityValue = document.getElementById('intensity-value') as HTMLElement;
    this.windDirectionSlider = document.getElementById('wind-direction-slider') as HTMLInputElement;
    this.windDirectionValue = document.getElementById('wind-direction-value') as HTMLElement;
    this.colorPresets = document.querySelectorAll('.color-preset');
    this.customColorBtn = document.getElementById('custom-color-btn') as HTMLButtonElement;
    this.colorPicker = document.getElementById('color-picker') as HTMLInputElement;
    
    this.init(initialParams);
  }

  private init(initialParams: ControlParams): void {
    this.intensitySlider.value = String(initialParams.stormIntensity);
    this.intensityValue.textContent = initialParams.stormIntensity.toFixed(1);
    
    this.windDirectionSlider.value = String(initialParams.windDirection);
    this.windDirectionValue.textContent = String(Math.round(initialParams.windDirection));
    
    this.colorPicker.value = initialParams.primaryColor;
    this.updateActiveColorPreset(initialParams.primaryColor);
    
    this.bindEvents();
  }

  private bindEvents(): void {
    this.intensitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.intensityValue.textContent = value.toFixed(1);
      this.callbacks.onIntensityChange(value);
    });
    
    this.windDirectionSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.windDirectionValue.textContent = String(Math.round(value));
      this.callbacks.onWindDirectionChange(value);
    });
    
    this.colorPresets.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        
        if (target.id === 'custom-color-btn') {
          this.colorPicker.classList.toggle('visible');
          return;
        }
        
        const color = target.dataset.color;
        if (color) {
          this.colorPicker.value = color;
          this.colorPicker.classList.remove('visible');
          this.updateActiveColorPreset(color);
          this.callbacks.onColorChange(color);
        }
      });
    });
    
    this.colorPicker.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      this.updateActiveColorPreset(color);
      this.callbacks.onColorChange(color);
    });
  }

  private updateActiveColorPreset(color: string): void {
    let foundMatch = false;
    
    this.colorPresets.forEach((btn) => {
      if (btn.id === 'custom-color-btn') return;
      
      const btnColor = btn.dataset.color;
      if (btnColor && this.colorsMatch(btnColor, color)) {
        btn.classList.add('active');
        foundMatch = true;
      } else {
        btn.classList.remove('active');
      }
    });
    
    if (!foundMatch) {
      this.customColorBtn.classList.add('active');
    } else {
      this.customColorBtn.classList.remove('active');
    }
  }

  private colorsMatch(color1: string, color2: string): boolean {
    const c1 = color1.toLowerCase();
    const c2 = color2.toLowerCase();
    return c1 === c2;
  }
}
