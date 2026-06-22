import { CityRenderer, CityParams } from './cityRenderer';

export class UIController {
  private renderer: CityRenderer;
  private sliders: { [key: string]: HTMLInputElement } = {};
  private valueDisplays: { [key: string]: HTMLSpanElement } = {};
  private regenerateBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;
  private fpsCounter: HTMLDivElement;
  private lastRenderTime: number = 0;
  private readonly RENDER_THROTTLE_MS: number = 16;

  constructor(renderer: CityRenderer) {
    this.renderer = renderer;
    this.sliders = {
      density: document.getElementById('density') as HTMLInputElement,
      neonBrightness: document.getElementById('neonBrightness') as HTMLInputElement,
      skyHue: document.getElementById('skyHue') as HTMLInputElement,
      heightOffset: document.getElementById('heightOffset') as HTMLInputElement,
      roadBrightness: document.getElementById('roadBrightness') as HTMLInputElement,
      fogIntensity: document.getElementById('fogIntensity') as HTMLInputElement
    };

    this.valueDisplays = {
      density: document.getElementById('densityValue') as HTMLSpanElement,
      neonBrightness: document.getElementById('neonBrightnessValue') as HTMLSpanElement,
      skyHue: document.getElementById('skyHueValue') as HTMLSpanElement,
      heightOffset: document.getElementById('heightOffsetValue') as HTMLSpanElement,
      roadBrightness: document.getElementById('roadBrightnessValue') as HTMLSpanElement,
      fogIntensity: document.getElementById('fogIntensityValue') as HTMLSpanElement
    };

    this.regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
    this.exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    this.fpsCounter = document.getElementById('fpsCounter') as HTMLDivElement;

    this.bindEvents();
    this.updateAllValueDisplays();
  }

  private bindEvents(): void {
    const paramMap: { [key: string]: keyof CityParams } = {
      density: 'density',
      neonBrightness: 'neonBrightness',
      skyHue: 'skyHue',
      heightOffset: 'heightOffset',
      roadBrightness: 'roadBrightness',
      fogIntensity: 'fogIntensity'
    };

    for (const [sliderId, paramKey] of Object.entries(paramMap)) {
      const slider = this.sliders[sliderId];
      const valueDisplay = this.valueDisplays[sliderId];

      slider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        valueDisplay.textContent = value.toString();
        
        const now = performance.now();
        if (now - this.lastRenderTime >= this.RENDER_THROTTLE_MS) {
          this.lastRenderTime = now;
          this.renderer.setParams({ [paramKey]: value });
          
          if (paramKey === 'density' || paramKey === 'heightOffset') {
            this.renderer.generateCity();
          }
        }
      });

      slider.addEventListener('change', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        this.renderer.setParams({ [paramKey]: value });
        
        if (paramKey === 'density' || paramKey === 'heightOffset') {
          this.renderer.generateCity();
        }
      });
    }

    this.regenerateBtn.addEventListener('click', () => {
      this.animateButton(this.regenerateBtn);
      this.renderer.regenerate();
    });

    this.exportBtn.addEventListener('click', () => {
      this.animateButton(this.exportBtn);
      this.renderer.exportPNG();
    });

    this.renderer.setFpsCallback((fps) => {
      this.fpsCounter.textContent = `FPS: ${fps}`;
    });
  }

  private animateButton(btn: HTMLButtonElement): void {
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 150);
  }

  private updateAllValueDisplays(): void {
    for (const [sliderId, slider] of Object.entries(this.sliders)) {
      this.valueDisplays[sliderId].textContent = slider.value;
    }
  }

  public getCurrentParams(): CityParams {
    return {
      density: parseInt(this.sliders.density.value),
      neonBrightness: parseInt(this.sliders.neonBrightness.value),
      skyHue: parseInt(this.sliders.skyHue.value),
      heightOffset: parseInt(this.sliders.heightOffset.value),
      roadBrightness: parseInt(this.sliders.roadBrightness.value),
      fogIntensity: parseInt(this.sliders.fogIntensity.value)
    };
  }
}
