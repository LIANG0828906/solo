import { WeatherMode, ControlParams } from './types';

export class UIManager {
  private container: HTMLElement;
  private onWeatherChange: (mode: WeatherMode) => void;
  private onParamsChange: (params: Partial<ControlParams>) => void;
  private weatherButtons: Map<WeatherMode, HTMLButtonElement> = new Map();
  private sliders: {
    particleDensity: HTMLInputElement;
    windStrength: HTMLInputElement;
    terrainScale: HTMLInputElement;
  } | null = null;
  private valueDisplays: {
    particleDensity: HTMLSpanElement;
    windStrength: HTMLSpanElement;
    terrainScale: HTMLSpanElement;
  } | null = null;

  constructor(
    container: HTMLElement,
    onWeatherChange: (mode: WeatherMode) => void,
    onParamsChange: (params: Partial<ControlParams>) => void
  ) {
    this.container = container;
    this.onWeatherChange = onWeatherChange;
    this.onParamsChange = onParamsChange;

    this.createTitle();
    this.createWeatherButtons();
    this.createControlPanel();
  }

  private createTitle(): void {
    const title = document.createElement('div');
    title.style.position = 'absolute';
    title.style.top = '24px';
    title.style.left = '24px';
    title.style.zIndex = '100';
    title.style.fontFamily = '"PingFang SC", "Microsoft YaHei", sans-serif';
    title.style.fontWeight = '100';
    title.style.fontSize = '28px';
    title.style.letterSpacing = '4px';
    title.style.color = '#ffffff';
    title.style.textShadow = `
      0 0 10px rgba(0, 191, 255, 0.8),
      0 0 20px rgba(0, 191, 255, 0.6),
      0 0 30px rgba(0, 191, 255, 0.4),
      1px 1px 2px rgba(0, 191, 255, 1)
    `;
    title.style.webkitTextStroke = '0.5px #00bfff';
    title.textContent = '气象地形';
    this.container.appendChild(title);
  }

  private createWeatherButtons(): void {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.top = '50%';
    buttonContainer.style.right = '24px';
    buttonContainer.style.transform = 'translateY(-50%)';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '16px';
    buttonContainer.style.zIndex = '100';

    const weatherConfigs = [
      { mode: WeatherMode.SUNNY, color: '#ffd700', label: '晴天' },
      { mode: WeatherMode.RAIN, color: '#2f2f2f', label: '雷雨' },
      { mode: WeatherMode.SNOW, color: '#ffffff', label: '暴雪' },
      { mode: WeatherMode.SANDSTORM, color: '#b8860b', label: '沙尘暴' }
    ];

    weatherConfigs.forEach(({ mode, color, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.title = label;
      button.style.width = '48px';
      button.style.height = '48px';
      button.style.borderRadius = '50%';
      button.style.border = 'none';
      button.style.cursor = 'pointer';
      button.style.backgroundColor = color;
      button.style.boxShadow = `
        0 0 15px ${color}80,
        inset 0 0 10px rgba(255, 255, 255, 0.2)
      `;
      button.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 0.3s ease';
      button.style.outline = 'none';
      button.style.padding = '0';

      if (color === '#ffffff') {
        button.style.border = '2px solid rgba(0, 0, 0, 0.1)';
      }

      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
      });

      button.addEventListener('mouseleave', () => {
        if (!button.classList.contains('active')) {
          button.style.transform = 'scale(1)';
        }
      });

      button.addEventListener('click', () => {
        this.handleWeatherClick(mode);
      });

      this.weatherButtons.set(mode, button);
      buttonContainer.appendChild(button);
    });

    this.container.appendChild(buttonContainer);
    this.setActiveWeather(WeatherMode.SUNNY);
  }

  private handleWeatherClick(mode: WeatherMode): void {
    this.weatherButtons.forEach((btn) => {
      btn.classList.remove('active');
      btn.style.transform = 'scale(1)';
    });

    const activeBtn = this.weatherButtons.get(mode);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.style.transform = 'scale(1.1)';
    }

    this.onWeatherChange(mode);
  }

  private createControlPanel(): void {
    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.bottom = '24px';
    panel.style.left = '50%';
    panel.style.transform = 'translateX(-50%)';
    panel.style.width = '90%';
    panel.style.maxWidth = '600px';
    panel.style.padding = '20px 24px';
    panel.style.background = 'rgba(13, 17, 23, 0.8)';
    panel.style.backdropFilter = 'blur(8px)';
    (panel.style as any).webkitBackdropFilter = 'blur(8px)';
    panel.style.border = '1px solid rgba(255, 255, 255, 0.06)';
    panel.style.borderRadius = '16px';
    panel.style.zIndex = '100';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '16px';

    const sliderConfigs = [
      {
        key: 'particleDensity' as const,
        label: '粒子密度',
        min: 500,
        max: 5000,
        step: 100,
        value: 3000,
        unit: '个'
      },
      {
        key: 'windStrength' as const,
        label: '风力强度',
        min: 0,
        max: 10,
        step: 0.5,
        value: 3,
        unit: '级'
      },
      {
        key: 'terrainScale' as const,
        label: '地形高度',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        value: 1.0,
        unit: 'x'
      }
    ];

    this.sliders = {
      particleDensity: document.createElement('input'),
      windStrength: document.createElement('input'),
      terrainScale: document.createElement('input')
    };

    this.valueDisplays = {
      particleDensity: document.createElement('span'),
      windStrength: document.createElement('span'),
      terrainScale: document.createElement('span')
    };

    sliderConfigs.forEach(({ key, label, min, max, step, value, unit }) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '16px';

      const labelEl = document.createElement('span');
      labelEl.textContent = label;
      labelEl.style.color = '#ffffff';
      labelEl.style.fontSize = '14px';
      labelEl.style.minWidth = '80px';
      labelEl.style.fontWeight = '300';

      const slider = this.sliders![key];
      slider.type = 'range';
      slider.min = String(min);
      slider.max = String(max);
      slider.step = String(step);
      slider.value = String(value);
      slider.style.flex = '1';
      slider.style.height = '6px';
      slider.style.borderRadius = '3px';
      slider.style.background = 'linear-gradient(to right, #333333, #555555)';
      slider.style.outline = 'none';
      slider.style.webkitAppearance = 'none';
      slider.style.appearance = 'none';
      slider.style.cursor = 'pointer';

      const valueDisplay = this.valueDisplays![key];
      valueDisplay.textContent = `${value}${unit}`;
      valueDisplay.style.color = '#00bfff';
      valueDisplay.style.fontSize = '13px';
      valueDisplay.style.minWidth = '60px';
      valueDisplay.style.textAlign = 'right';
      valueDisplay.style.fontWeight = '500';
      valueDisplay.style.opacity = '0';
      valueDisplay.style.transition = 'opacity 0.2s ease';

      const style = document.createElement('style');
      style.textContent = `
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #dddddd 100%);
          cursor: pointer;
          border: 2px solid rgba(0, 191, 255, 0.5);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(0, 191, 255, 0.6);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #dddddd 100%);
          cursor: pointer;
          border: 2px solid rgba(0, 191, 255, 0.5);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(0, 191, 255, 0.6);
        }
      `;
      document.head.appendChild(style);

      slider.addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        valueDisplay.textContent = `${val}${unit}`;
        valueDisplay.style.opacity = '1';
        
        this.onParamsChange({ [key]: val });
      });

      slider.addEventListener('mousedown', () => {
        slider.style.transform = 'scale(1.02)';
      });

      slider.addEventListener('mouseup', () => {
        slider.style.transform = 'scale(1)';
        setTimeout(() => {
          valueDisplay.style.opacity = '0';
        }, 1000);
      });

      slider.addEventListener('mouseleave', () => {
        setTimeout(() => {
          valueDisplay.style.opacity = '0';
        }, 500);
      });

      row.appendChild(labelEl);
      row.appendChild(slider);
      row.appendChild(valueDisplay);
      panel.appendChild(row);
    });

    this.container.appendChild(panel);
  }

  public setActiveWeather(mode: WeatherMode): void {
    this.weatherButtons.forEach((btn, m) => {
      if (m === mode) {
        btn.classList.add('active');
        btn.style.transform = 'scale(1.1)';
      } else {
        btn.classList.remove('active');
        btn.style.transform = 'scale(1)';
      }
    });
  }

  public updateParamsDisplay(params: ControlParams): void {
    if (this.sliders && this.valueDisplays) {
      this.sliders.particleDensity.value = String(params.particleDensity);
      this.valueDisplays.particleDensity.textContent = `${params.particleDensity}个`;
      
      this.sliders.windStrength.value = String(params.windStrength);
      this.valueDisplays.windStrength.textContent = `${params.windStrength}级`;
      
      this.sliders.terrainScale.value = String(params.terrainScale);
      this.valueDisplays.terrainScale.textContent = `${params.terrainScale}x`;
    }
  }
}
