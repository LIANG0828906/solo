import { LightingParams } from '../utils/EventBus';

interface PanelCallbacks {
  onTimeChange: (time: number) => void;
  onPresetChange: (preset: 'dawn' | 'noon' | 'dusk') => void;
  onStyleChange: (wireframe: boolean) => void;
  onMaterialChange: (reflectivity: number, roughness: number) => void;
}

export class Panel {
  private container: HTMLElement;
  private callbacks: PanelCallbacks;
  
  private timeSlider!: HTMLInputElement;
  private timeValue!: HTMLElement;
  private timePeriod!: HTMLElement;
  
  private elevationValue!: HTMLElement;
  private azimuthValue!: HTMLElement;
  private temperatureValue!: HTMLElement;
  private intensityValue!: HTMLElement;
  
  private reflectivitySlider!: HTMLInputElement;
  private reflectivityValue!: HTMLElement;
  private roughnessSlider!: HTMLInputElement;
  private roughnessValue!: HTMLElement;
  
  private styleToggle!: HTMLElement;
  private fadeOverlay!: HTMLElement;

  private isWireframe: boolean = false;
  private currentReflectivity: number = 0.3;
  private currentRoughness: number = 0.7;

  constructor(containerId: string, callbacks: PanelCallbacks) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }
    this.container = container;
    this.callbacks = callbacks;
    this.fadeOverlay = document.getElementById('fade-overlay')!;
    
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="panel">
        <div class="time-display">
          <div class="time-value" id="time-value">12:00</div>
          <div class="time-period" id="time-period">正午</div>
        </div>
        <div class="slider-group">
          <div class="slider-label">
            <span>时间</span>
            <span class="slider-value" id="time-slider-value">12:00</span>
          </div>
          <input type="range" id="time-slider" min="5" max="20" step="0.1" value="12" />
        </div>
        <div class="btn-group">
          <button class="btn" data-preset="dawn">清晨</button>
          <button class="btn" data-preset="noon">正午</button>
          <button class="btn" data-preset="dusk">黄昏</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">光照参数</div>
        <div class="param-item">
          <span class="param-label">太阳高度角</span>
          <span class="param-value" id="elevation-value">90.0°</span>
        </div>
        <div class="param-item">
          <span class="param-label">太阳方位角</span>
          <span class="param-value" id="azimuth-value">0.0°</span>
        </div>
        <div class="param-item">
          <span class="param-label">色温</span>
          <span class="param-value" id="temperature-value">5500K</span>
        </div>
        <div class="param-item">
          <span class="param-label">光照强度</span>
          <span class="param-value" id="intensity-value">2.50</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">材质调节</div>
        <div class="slider-group">
          <div class="slider-label">
            <span>反射率</span>
            <span class="slider-value" id="reflectivity-value">0.30</span>
          </div>
          <input type="range" id="reflectivity-slider" min="0" max="1" step="0.01" value="0.3" />
        </div>
        <div class="slider-group">
          <div class="slider-label">
            <span>粗糙度</span>
            <span class="slider-value" id="roughness-value">0.70</span>
          </div>
          <input type="range" id="roughness-slider" min="0" max="1" step="0.01" value="0.7" />
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">显示风格</div>
        <div class="toggle-group">
          <span class="toggle-label">轮廓线模式</span>
          <div class="toggle" id="style-toggle"></div>
        </div>
      </div>
    `;

    this.timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    this.timeValue = document.getElementById('time-value')!;
    this.timePeriod = document.getElementById('time-period')!;
    
    this.elevationValue = document.getElementById('elevation-value')!;
    this.azimuthValue = document.getElementById('azimuth-value')!;
    this.temperatureValue = document.getElementById('temperature-value')!;
    this.intensityValue = document.getElementById('intensity-value')!;
    
    this.reflectivitySlider = document.getElementById('reflectivity-slider') as HTMLInputElement;
    this.reflectivityValue = document.getElementById('reflectivity-value')!;
    this.roughnessSlider = document.getElementById('roughness-slider') as HTMLInputElement;
    this.roughnessValue = document.getElementById('roughness-value')!;
    
    this.styleToggle = document.getElementById('style-toggle')!;
  }

  private bindEvents(): void {
    this.timeSlider.addEventListener('input', (e) => {
      const time = parseFloat((e.target as HTMLInputElement).value);
      this.updateTimeDisplay(time);
      this.callbacks.onTimeChange(time);
    });

    document.querySelectorAll('.btn[data-preset]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const preset = (e.target as HTMLElement).dataset.preset as 'dawn' | 'noon' | 'dusk';
        this.callbacks.onPresetChange(preset);
      });
    });

    this.styleToggle.addEventListener('click', () => {
      this.toggleStyle();
    });

    this.reflectivitySlider.addEventListener('input', (e) => {
      this.currentReflectivity = parseFloat((e.target as HTMLInputElement).value);
      this.reflectivityValue.textContent = this.currentReflectivity.toFixed(2);
      this.callbacks.onMaterialChange(this.currentReflectivity, this.currentRoughness);
    });

    this.roughnessSlider.addEventListener('input', (e) => {
      this.currentRoughness = parseFloat((e.target as HTMLInputElement).value);
      this.roughnessValue.textContent = this.currentRoughness.toFixed(2);
      this.callbacks.onMaterialChange(this.currentReflectivity, this.currentRoughness);
    });
  }

  private toggleStyle(): void {
    this.isWireframe = !this.isWireframe;
    this.styleToggle.classList.toggle('active', this.isWireframe);
    
    this.fadeOverlay.classList.add('active');
    setTimeout(() => {
      this.callbacks.onStyleChange(this.isWireframe);
      setTimeout(() => {
        this.fadeOverlay.classList.remove('active');
      }, 150);
    }, 150);
  }

  private updateTimeDisplay(time: number): void {
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    this.timeValue.textContent = timeStr;
    const sliderValue = document.getElementById('time-slider-value');
    if (sliderValue) sliderValue.textContent = timeStr;
    
    let period = '';
    if (time >= 5 && time < 9) period = '清晨';
    else if (time >= 9 && time < 12) period = '上午';
    else if (time >= 12 && time < 14) period = '正午';
    else if (time >= 14 && time < 17) period = '下午';
    else if (time >= 17 && time < 20) period = '黄昏';
    else period = '夜晚';
    
    this.timePeriod.textContent = period;
  }

  public updateLightingParams(params: LightingParams): void {
    this.updateTimeDisplay(params.time);
    this.timeSlider.value = params.time.toString();
    
    this.elevationValue.textContent = `${params.elevation.toFixed(1)}°`;
    this.azimuthValue.textContent = `${params.azimuth.toFixed(1)}°`;
    this.temperatureValue.textContent = `${Math.round(params.colorTemperature)}K`;
    this.intensityValue.textContent = params.intensity.toFixed(2);
  }

  public setTime(time: number): void {
    this.timeSlider.value = time.toString();
    this.updateTimeDisplay(time);
  }

  public getReflectivity(): number {
    return this.currentReflectivity;
  }

  public getRoughness(): number {
    return this.currentRoughness;
  }

  public getIsWireframe(): boolean {
    return this.isWireframe;
  }
}
