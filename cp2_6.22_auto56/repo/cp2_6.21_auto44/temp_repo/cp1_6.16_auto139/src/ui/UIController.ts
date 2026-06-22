import { ParticleType, PARTICLE_COLORS, SimulationStats, SIMULATION_CONFIG } from '../core/ParticleTypes';
import { SimulationEngine } from '../core/SimulationEngine';
import { Renderer } from '../render/Renderer';

export class UIController {
  private engine: SimulationEngine;
  private renderer: Renderer;
  private selectedType: ParticleType | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMobile: boolean = false;

  private toolbar!: HTMLDivElement;
  private panel!: HTMLDivElement;
  private statsContainer!: HTMLDivElement;
  private spawnButton!: HTMLButtonElement;
  private gravitySlider!: HTMLInputElement;
  private repulsionSlider!: HTMLInputElement;
  private lifeDecaySlider!: HTMLInputElement;
  private gravityValue!: HTMLSpanElement;
  private repulsionValue!: HTMLSpanElement;
  private lifeDecayValue!: HTMLSpanElement;
  private gridToggle!: HTMLButtonElement;
  private typeSelectors: Map<ParticleType, HTMLDivElement> = new Map();

  constructor(engine: SimulationEngine, renderer: Renderer) {
    this.engine = engine;
    this.renderer = renderer;
    this.checkMobile();
    this.createUI();
    this.bindEvents();
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private createUI(): void {
    this.createStatsContainer();
    this.createToolbar();
    this.createParameterPanel();
  }

  private createStatsContainer(): void {
    this.statsContainer = document.createElement('div');
    this.statsContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: #ffffff;
      font-size: 16px;
      font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 0, 0, 0.8);
      z-index: 100;
      line-height: 1.8;
      pointer-events: none;
    `;
    this.statsContainer.innerHTML = `
      <div>粒子总数: <span id="particle-count">0</span></div>
      <div>帧率: <span id="fps">0</span> FPS</div>
      <div>总结合次数: <span id="bindings">0</span></div>
    `;
    document.body.appendChild(this.statsContainer);
  }

  private createToolbar(): void {
    this.toolbar = document.createElement('div');
    const toolbarHeight = this.isMobile ? '48px' : '60px';
    const padding = this.isMobile ? '0 16px' : '0 24px';
    const gap = this.isMobile ? '12px' : '20px';

    this.toolbar.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      height: ${toolbarHeight};
      padding: ${padding};
      background: #000000CC;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: ${gap};
      z-index: 100;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    `;

    this.createSpawnButton();
    this.createTypeSelectors();
    this.createGridToggle();

    document.body.appendChild(this.toolbar);
  }

  private createSpawnButton(): void {
    this.spawnButton = document.createElement('button');
    const fontSize = this.isMobile ? '14px' : '16px';
    const padding = this.isMobile ? '8px 20px' : '10px 28px';

    this.spawnButton.textContent = 'Spawn';
    this.spawnButton.style.cssText = `
      padding: ${padding};
      font-size: ${fontSize};
      color: #ffffff;
      background: linear-gradient(135deg, #9C27B0 0%, #2196F3 100%);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;
      box-shadow: 0 0 0 rgba(156, 39, 176, 0);
      font-family: inherit;
    `;

    this.spawnButton.addEventListener('mouseenter', () => {
      this.spawnButton.style.boxShadow = '0 0 20px rgba(156, 39, 176, 0.6), 0 0 40px rgba(33, 150, 243, 0.4)';
      this.spawnButton.style.transform = 'translateY(-2px)';
    });

    this.spawnButton.addEventListener('mouseleave', () => {
      this.spawnButton.style.boxShadow = '0 0 0 rgba(156, 39, 176, 0)';
      this.spawnButton.style.transform = 'translateY(0)';
    });

    this.spawnButton.addEventListener('mousedown', () => {
      this.spawnButton.style.transform = 'scale(0.95)';
    });

    this.spawnButton.addEventListener('mouseup', () => {
      this.spawnButton.style.transform = 'scale(1) translateY(-2px)';
    });

    this.toolbar.appendChild(this.spawnButton);
  }

  private createTypeSelectors(): void {
    const container = document.createElement('div');
    const gap = this.isMobile ? '8px' : '12px';
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: ${gap};
    `;

    const types = [ParticleType.A, ParticleType.B, ParticleType.C];
    const size = this.isMobile ? 24 : 32;

    for (const type of types) {
      const selector = document.createElement('div');
      const color = PARTICLE_COLORS[type];

      selector.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
        box-sizing: border-box;
      `;

      selector.addEventListener('click', () => {
        this.setSelectedType(this.selectedType === type ? null : type);
      });

      container.appendChild(selector);
      this.typeSelectors.set(type, selector);
    }

    this.toolbar.appendChild(container);
  }

  private createGridToggle(): void {
    this.gridToggle = document.createElement('button');
    const fontSize = this.isMobile ? '12px' : '14px';
    const padding = this.isMobile ? '6px 12px' : '8px 16px';

    this.gridToggle.textContent = '网格';
    this.gridToggle.style.cssText = `
      padding: ${padding};
      font-size: ${fontSize};
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    `;

    this.gridToggle.addEventListener('click', () => {
      const newState = !this.renderer.isGridVisible();
      this.renderer.setShowGrid(newState);
      this.gridToggle.style.background = newState ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
      this.gridToggle.style.borderColor = newState ? '#00FFFF' : 'rgba(255, 255, 255, 0.3)';
    });

    this.toolbar.appendChild(this.gridToggle);
  }

  private createParameterPanel(): void {
    this.panel = document.createElement('div');
    const panelWidth = this.isMobile ? '180px' : '220px';

    this.panel.style.cssText = `
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      width: ${panelWidth};
      background: rgba(13, 13, 13, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 10px;
      padding: 20px 16px;
      z-index: 100;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      color: #ffffff;
      font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
    `;

    const title = document.createElement('div');
    title.textContent = '参数控制';
    title.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 16px;
      text-align: center;
      color: #00FFFF;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    `;
    this.panel.appendChild(title);

    this.createSlider('gravity', '引力强度', 0.1, 2.0, 0.1,
      SIMULATION_CONFIG.GRAVITY_STRENGTH_DEFAULT,
      'linear-gradient(to right, #00FFFF, #FF00FF)');

    this.createSlider('repulsion', '斥力强度', 0.1, 2.0, 0.1,
      SIMULATION_CONFIG.REPULSION_STRENGTH_DEFAULT,
      'linear-gradient(to right, #00FFFF, #FF00FF)');

    this.createSlider('lifeDecay', '寿命衰减', 0.01, 0.5, 0.01,
      SIMULATION_CONFIG.LIFE_DECAY_DEFAULT,
      'linear-gradient(to right, #00FFFF, #FF00FF)');

    document.body.appendChild(this.panel);
  }

  private createSlider(
    id: string,
    label: string,
    min: number,
    max: number,
    step: number,
    defaultValue: number,
    gradient: string
  ): void {
    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 18px;';

    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
    `;

    const labelText = document.createElement('span');
    labelText.textContent = label;
    labelText.style.color = '#cccccc';

    const valueSpan = document.createElement('span');
    valueSpan.textContent = defaultValue.toFixed(2);
    valueSpan.style.cssText = 'color: #ffffff; font-weight: bold;';

    labelRow.appendChild(labelText);
    labelRow.appendChild(valueSpan);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = defaultValue.toString();

    slider.style.cssText = `
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: ${gradient};
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
    `;

    const style = document.createElement('style');
    style.textContent = `
      #${id}-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      }
      #${id}-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      }
    `;
    document.head.appendChild(style);
    slider.id = `${id}-slider`;

    container.appendChild(labelRow);
    container.appendChild(slider);
    this.panel.appendChild(container);

    if (id === 'gravity') {
      this.gravitySlider = slider;
      this.gravityValue = valueSpan;
    } else if (id === 'repulsion') {
      this.repulsionSlider = slider;
      this.repulsionValue = valueSpan;
    } else if (id === 'lifeDecay') {
      this.lifeDecaySlider = slider;
      this.lifeDecayValue = valueSpan;
    }
  }

  private setSelectedType(type: ParticleType | null): void {
    this.selectedType = type;

    this.typeSelectors.forEach((selector, t) => {
      if (type === t) {
        selector.style.boxShadow = `0 0 15px ${PARTICLE_COLORS[t]}, 0 0 30px rgba(255, 255, 255, 0.5)`;
        selector.style.border = '2px solid #ffffff';
      } else {
        selector.style.boxShadow = 'none';
        selector.style.border = '2px solid transparent';
      }
    });
  }

  private bindEvents(): void {
    this.spawnButton.addEventListener('click', () => {
      const rect = this.renderer['canvas'].getBoundingClientRect();
      const x = this.mouseX - rect.left;
      const y = this.mouseY - rect.top;
      this.engine.spawnParticles(x, y, SIMULATION_CONFIG.SPAWN_COUNT_PER_CLICK, this.selectedType || undefined);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    this.gravitySlider.addEventListener('input', () => {
      const value = parseFloat(this.gravitySlider.value);
      this.engine.setGravityStrength(value);
      this.gravityValue.textContent = value.toFixed(2);
    });

    this.repulsionSlider.addEventListener('input', () => {
      const value = parseFloat(this.repulsionSlider.value);
      this.engine.setRepulsionStrength(value);
      this.repulsionValue.textContent = value.toFixed(2);
    });

    this.lifeDecaySlider.addEventListener('input', () => {
      const value = parseFloat(this.lifeDecaySlider.value);
      this.engine.setLifeDecayRate(value);
      this.lifeDecayValue.textContent = value.toFixed(2);
    });

    window.addEventListener('resize', () => {
      this.checkMobile();
      this.updateResponsiveStyles();
    });
  }

  private updateResponsiveStyles(): void {
    const toolbarHeight = this.isMobile ? '48px' : '60px';
    const panelWidth = this.isMobile ? '180px' : '220px';

    this.toolbar.style.height = toolbarHeight;
    this.panel.style.width = panelWidth;
  }

  public updateStats(stats: SimulationStats): void {
    const particleCountEl = document.getElementById('particle-count');
    const fpsEl = document.getElementById('fps');
    const bindingsEl = document.getElementById('bindings');

    if (particleCountEl) particleCountEl.textContent = stats.particleCount.toString();
    if (fpsEl) fpsEl.textContent = Math.round(stats.fps).toString();
    if (bindingsEl) bindingsEl.textContent = stats.totalBindings.toString();
  }
}
