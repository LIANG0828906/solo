import { eventBus } from '../eventBus';

interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

const sliderConfigs: SliderConfig[] = [
  { id: 'electricStrength', label: '电场强度', min: 0, max: 5, step: 0.1, value: 1.5 },
  { id: 'magneticStrength', label: '磁场强度', min: 0, max: 5, step: 0.1, value: 2.0 },
  { id: 'electricX', label: '电场 X', min: -1, max: 1, step: 0.1, value: 0 },
  { id: 'electricY', label: '电场 Y', min: -1, max: 1, step: 0.1, value: 0 },
  { id: 'electricZ', label: '电场 Z', min: -1, max: 1, step: 0.1, value: 1 },
  { id: 'particleCount', label: '粒子数', min: 1, max: 200, step: 1, value: 75 },
];

export class ControlPanel {
  private container: HTMLElement;
  private panel: HTMLElement;
  private toggleBtn: HTMLElement;
  private sliderValues: Map<string, number> = new Map();
  private panelOpen: boolean = false;

  constructor() {
    this.container = document.getElementById('control-panel')!;
    this.toggleBtn = document.getElementById('panel-toggle')!;
    this.panel = this.container;

    this.buildPanel();
    this.setupToggle();

    this.emitFieldParams();
  }

  private buildPanel(): void {
    const title = document.createElement('h3');
    title.textContent = '电磁场控制';
    this.panel.appendChild(title);

    for (const cfg of sliderConfigs) {
      this.sliderValues.set(cfg.id, cfg.value);
      const group = this.createSliderGroup(cfg);
      this.panel.appendChild(group);
    }
  }

  private createSliderGroup(cfg: SliderConfig): HTMLElement {
    const group = document.createElement('div');
    group.className = 'slider-group';

    const header = document.createElement('div');
    header.className = 'slider-header';

    const label = document.createElement('span');
    label.className = 'slider-label';
    label.textContent = cfg.label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'slider-value';
    valueSpan.textContent = cfg.value.toFixed(cfg.step < 1 ? 1 : 0);
    valueSpan.id = `val-${cfg.id}`;

    header.appendChild(label);
    header.appendChild(valueSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.id = `slider-${cfg.id}`;
    input.min = String(cfg.min);
    input.max = String(cfg.max);
    input.step = String(cfg.step);
    input.value = String(cfg.value);

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      this.sliderValues.set(cfg.id, val);
      valueSpan.textContent = val.toFixed(cfg.step < 1 ? 1 : 0);
      this.emitFieldParams();
    });

    group.appendChild(header);
    group.appendChild(input);

    return group;
  }

  private emitFieldParams(): void {
    const electricStrength = this.sliderValues.get('electricStrength') ?? 1.5;
    const magneticStrength = this.sliderValues.get('magneticStrength') ?? 2.0;
    const electricX = this.sliderValues.get('electricX') ?? 0;
    const electricY = this.sliderValues.get('electricY') ?? 0;
    const electricZ = this.sliderValues.get('electricZ') ?? 1;
    const particleCount = this.sliderValues.get('particleCount') ?? 75;

    eventBus.emit('fieldParamsChanged', {
      electricStrength,
      magneticStrength,
      electricDirection: { x: electricX, y: electricY, z: electricZ },
    });

    eventBus.emit('particleCountChanged', particleCount);
  }

  private setupToggle(): void {
    this.toggleBtn.addEventListener('click', () => {
      this.panelOpen = !this.panelOpen;
      if (this.panelOpen) {
        this.panel.classList.remove('collapsed');
      } else {
        this.panel.classList.add('collapsed');
      }
    });

    if (window.innerWidth < 1200) {
      this.panel.classList.add('collapsed');
      this.panelOpen = false;
    }
  }

  getParticleCount(): number {
    return this.sliderValues.get('particleCount') ?? 75;
  }

  setParticleCount(count: number): void {
    this.sliderValues.set('particleCount', count);
    const slider = document.getElementById('slider-particleCount') as HTMLInputElement;
    const valueSpan = document.getElementById('val-particleCount');
    if (slider) slider.value = String(count);
    if (valueSpan) valueSpan.textContent = String(count);
    this.emitFieldParams();
  }

  dispose(): void {}
}
