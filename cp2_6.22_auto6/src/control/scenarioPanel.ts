import { ScenarioParams, ScenarioResult, calculateScenario, defaultScenarioParams } from '../data/carbonData';

type ScenarioType = 'transport' | 'diet' | 'energy';

interface SliderConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export class ScenarioPanel {
  private container: HTMLElement;
  private contentEl: HTMLElement;
  private carbonValueEl: HTMLElement;
  private currentScenario: ScenarioType = 'transport';
  private params: ScenarioParams;
  private result: ScenarioResult;
  private onChangeCallback: (result: ScenarioResult) => void;
  private debounceTimer: number | null = null;

  private sliderConfigs: Record<ScenarioType, SliderConfig[]> = {
    transport: [
      { key: 'flightsPerMonth', label: '每月飞行次数', min: 0, max: 20, step: 1, unit: '次' },
      { key: 'carKmPerWeek', label: '每周驾车里程', min: 0, max: 1000, step: 10, unit: '公里' }
    ],
    diet: [
      { key: 'redMeatPerWeek', label: '每周红肉食用量', min: 0, max: 5, step: 0.1, unit: 'kg' },
      { key: 'dairyPerWeek', label: '每周乳制品食用量', min: 0, max: 10, step: 0.5, unit: 'kg' }
    ],
    energy: [
      { key: 'electricityPerMonth', label: '每月家庭用电量', min: 50, max: 2000, step: 10, unit: 'kWh' }
    ]
  };

  constructor() {
    const panel = document.getElementById('scenario-panel');
    const content = document.getElementById('scenario-content');
    const carbonValue = document.getElementById('carbon-value');
    
    if (!panel || !content || !carbonValue) {
      throw new Error('Scenario panel elements not found');
    }

    this.container = panel;
    this.contentEl = content;
    this.carbonValueEl = carbonValue;
    this.params = JSON.parse(JSON.stringify(defaultScenarioParams));
    this.result = calculateScenario(this.params);
    this.onChangeCallback = () => {};

    this.init();
  }

  private init(): void {
    this.bindTabEvents();
    this.renderScenario(this.currentScenario);
    this.updateCarbonDisplay();
  }

  private bindTabEvents(): void {
    const tabs = this.container.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const scenario = (tab as HTMLElement).dataset.scenario as ScenarioType;
        if (scenario && scenario !== this.currentScenario) {
          this.switchScenario(scenario);
        }
      });
    });
  }

  private switchScenario(scenario: ScenarioType): void {
    this.currentScenario = scenario;
    
    const tabs = this.container.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      const tabScenario = (tab as HTMLElement).dataset.scenario;
      if (tabScenario === scenario) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.renderScenario(scenario);
  }

  private renderScenario(scenario: ScenarioType): void {
    const configs = this.sliderConfigs[scenario];
    const scenarioData = this.params[scenario];
    
    this.contentEl.innerHTML = '';

    configs.forEach(config => {
      const value = (scenarioData as Record<string, number>)[config.key];
      
      const sliderGroup = document.createElement('div');
      sliderGroup.className = 'slider-group';
      
      const sliderLabel = document.createElement('div');
      sliderLabel.className = 'slider-label';
      sliderLabel.innerHTML = `
        <span>${config.label}</span>
        <span class="slider-value" data-key="${config.key}">${this.formatValue(value)} ${config.unit}</span>
      `;
      
      const sliderWrapper = document.createElement('div');
      sliderWrapper.className = 'slider-wrapper';
      
      const glowRing = document.createElement('div');
      glowRing.className = 'slider-glow-ring';
      glowRing.dataset.key = config.key;
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = String(config.min);
      slider.max = String(config.max);
      slider.step = String(config.step);
      slider.value = String(value);
      slider.dataset.key = config.key;
      slider.dataset.scenario = scenario;
      slider.className = 'custom-slider';
      
      const ticksContainer = document.createElement('div');
      ticksContainer.className = 'slider-ticks';
      ticksContainer.dataset.key = config.key;
      
      const tickCount = 5;
      for (let i = 0; i < tickCount; i++) {
        const tickValue = config.min + (config.max - config.min) * (i / (tickCount - 1));
        const tick = document.createElement('div');
        tick.className = 'tick';
        tick.style.left = `${(i / (tickCount - 1)) * 100}%`;
        tick.dataset.value = String(tickValue);
        
        const tickLabel = document.createElement('span');
        tickLabel.className = 'tick-label';
        tickLabel.textContent = this.formatTickValue(tickValue, config);
        tick.appendChild(tickLabel);
        
        ticksContainer.appendChild(tick);
      }
      
      const activeTick = document.createElement('div');
      activeTick.className = 'tick-active';
      activeTick.dataset.key = config.key;
      ticksContainer.appendChild(activeTick);
      
      slider.addEventListener('input', (e) => {
        this.onSliderChange(e, scenario, config);
      });
      
      slider.addEventListener('mousedown', () => {
        this.triggerGlowPulse(config.key, value, config);
      });
      
      slider.addEventListener('touchstart', () => {
        this.triggerGlowPulse(config.key, value, config);
      });
      
      sliderWrapper.appendChild(glowRing);
      sliderWrapper.appendChild(slider);
      sliderWrapper.appendChild(ticksContainer);
      
      sliderGroup.appendChild(sliderLabel);
      sliderGroup.appendChild(sliderWrapper);
      this.contentEl.appendChild(sliderGroup);
      
      this.updateActiveTickPosition(config.key, value, config);
    });
  }

  private formatTickValue(value: number, config: SliderConfig): string {
    if (config.max >= 100) {
      return String(Math.round(value));
    } else if (config.step >= 1) {
      return String(Math.round(value));
    } else {
      return value.toFixed(1);
    }
  }

  private triggerGlowPulse(key: string, value: number, config: SliderConfig): void {
    const glowRing = this.contentEl.querySelector(`.slider-glow-ring[data-key="${key}"]`);
    if (!glowRing) return;
    
    const normalizedValue = (value - config.min) / (config.max - config.min);
    const glowSize = 20 + normalizedValue * 30;
    
    glowRing.classList.remove('pulse-active');
    void glowRing.getBoundingClientRect();
    
    (glowRing as HTMLElement).style.setProperty('--glow-size', `${glowSize}px`);
    (glowRing as HTMLElement).style.left = `${normalizedValue * 100}%`;
    
    glowRing.classList.add('pulse-active');
  }

  private updateActiveTickPosition(key: string, value: number, config: SliderConfig): void {
    const activeTick = this.contentEl.querySelector(`.tick-active[data-key="${key}"]`);
    if (!activeTick) return;
    
    const percentage = ((value - config.min) / (config.max - config.min)) * 100;
    (activeTick as HTMLElement).style.left = `${percentage}%`;
  }

  private formatValue(value: number): string {
    if (value % 1 === 0) {
      return String(value);
    }
    return value.toFixed(1);
  }

  private onSliderChange(e: Event, scenario: ScenarioType, config: SliderConfig): void {
    const slider = e.target as HTMLInputElement;
    const value = parseFloat(slider.value);
    
    const scenarioData = this.params[scenario] as Record<string, number>;
    scenarioData[config.key] = value;

    const valueEl = this.contentEl.querySelector(`.slider-value[data-key="${config.key}"]`);
    if (valueEl) {
      valueEl.textContent = `${this.formatValue(value)} ${config.unit}`;
    }

    this.triggerGlowPulse(config.key, value, config);
    this.updateActiveTickPosition(config.key, value, config);

    this.result = calculateScenario(this.params);
    this.updateCarbonDisplay();

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      if (this.onChangeCallback) {
        this.onChangeCallback(this.result);
      }
    }, 300);
  }

  private updateCarbonDisplay(): void {
    const target = this.result.totalCarbon;
    const current = parseFloat(this.carbonValueEl.textContent || '0');
    const duration = 500;
    const startTime = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const value = current + (target - current) * easeProgress;
      
      this.carbonValueEl.textContent = value.toFixed(2);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  public onChange(callback: (result: ScenarioResult) => void): void {
    this.onChangeCallback = callback;
  }

  public getResult(): ScenarioResult {
    return this.result;
  }

  public getParams(): ScenarioParams {
    return this.params;
  }
}
