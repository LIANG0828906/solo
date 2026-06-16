import type { GalaxyType } from '../utils/colorPalette';

export interface ControlState {
  galaxyType: GalaxyType;
  densityMultiplier: number;
  rotationSpeed: number;
  evolutionTime: number;
}

export type ControlChangeHandler = (state: Partial<ControlState>) => void;

const GALAXY_LABELS: Record<GalaxyType, { zh: string; en: string }> = {
  spiral: { zh: '旋涡星系', en: 'SPIRAL GALAXY' },
  elliptical: { zh: '椭圆星系', en: 'ELLIPTICAL GALAXY' },
  irregular: { zh: '不规则星系', en: 'IRREGULAR GALAXY' }
};

export class ControlPanel {
  private state: ControlState = {
    galaxyType: 'spiral',
    densityMultiplier: 1.0,
    rotationSpeed: 0.02,
    evolutionTime: 0
  };

  private handlers: Set<ControlChangeHandler> = new Set();

  private typeButtons: NodeListOf<HTMLElement> | null = null;
  private densitySlider: HTMLInputElement | null = null;
  private speedSlider: HTMLInputElement | null = null;
  private timeSlider: HTMLInputElement | null = null;
  private densityValue: HTMLElement | null = null;
  private speedValue: HTMLElement | null = null;
  private timeValue: HTMLElement | null = null;
  private densityFill: HTMLElement | null = null;
  private speedFill: HTMLElement | null = null;
  private timeFill: HTMLElement | null = null;
  private densityThumb: HTMLElement | null = null;
  private speedThumb: HTMLElement | null = null;
  private timeThumb: HTMLElement | null = null;
  private galaxyLabel: HTMLElement | null = null;
  private fpsCounter: HTMLElement | null = null;

  init(): void {
    this.typeButtons = document.querySelectorAll('.type-btn');
    this.densitySlider = document.getElementById('density-slider') as HTMLInputElement;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    this.densityValue = document.getElementById('density-value');
    this.speedValue = document.getElementById('speed-value');
    this.timeValue = document.getElementById('time-value');
    this.densityFill = document.getElementById('density-fill');
    this.speedFill = document.getElementById('speed-fill');
    this.timeFill = document.getElementById('time-fill');
    this.densityThumb = document.getElementById('density-thumb');
    this.speedThumb = document.getElementById('speed-thumb');
    this.timeThumb = document.getElementById('time-thumb');
    this.galaxyLabel = document.getElementById('galaxy-label');
    this.fpsCounter = document.getElementById('fps-counter');

    this.bindEvents();
    this.updateUI();
  }

  private bindEvents(): void {
    if (this.typeButtons) {
      this.typeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type as GalaxyType;
          if (type && type !== this.state.galaxyType) {
            this.setState({ galaxyType: type });
          }
        });
      });
    }

    if (this.densitySlider) {
      let rafPending = false;
      this.densitySlider.addEventListener('input', () => {
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(() => {
            const value = parseFloat(this.densitySlider!.value);
            this.setState({ densityMultiplier: value });
            rafPending = false;
          });
        }
      });
    }

    if (this.speedSlider) {
      let rafPending = false;
      this.speedSlider.addEventListener('input', () => {
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(() => {
            const value = parseFloat(this.speedSlider!.value);
            this.setState({ rotationSpeed: value });
            rafPending = false;
          });
        }
      });
    }

    if (this.timeSlider) {
      let rafPending = false;
      this.timeSlider.addEventListener('input', () => {
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(() => {
            const value = parseFloat(this.timeSlider!.value);
            this.setState({ evolutionTime: value });
            rafPending = false;
          });
        }
      });
    }
  }

  private setState(partial: Partial<ControlState>): void {
    const needsRegenerate =
      partial.galaxyType !== undefined ||
      partial.densityMultiplier !== undefined ||
      partial.evolutionTime !== undefined;

    this.state = { ...this.state, ...partial };
    this.updateUI();

    if (needsRegenerate) {
      this.notify({
        galaxyType: this.state.galaxyType,
        densityMultiplier: this.state.densityMultiplier,
        evolutionTime: this.state.evolutionTime
      });
    } else {
      this.notify(partial);
    }
  }

  private updateUI(): void {
    if (this.typeButtons) {
      this.typeButtons.forEach((btn) => {
        if (btn.dataset.type === this.state.galaxyType) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    if (this.densityValue) {
      this.densityValue.textContent = this.state.densityMultiplier.toFixed(1) + 'x';
    }
    if (this.speedValue) {
      this.speedValue.textContent = this.state.rotationSpeed.toFixed(3);
    }
    if (this.timeValue) {
      this.timeValue.textContent = this.state.evolutionTime.toFixed(0);
    }

    const densityPct = this.calcPct(this.state.densityMultiplier, 0.5, 2.0);
    const speedPct = this.calcPct(this.state.rotationSpeed, 0, 0.05);
    const timePct = this.calcPct(this.state.evolutionTime, 0, 100);

    if (this.densityFill) this.densityFill.style.width = densityPct + '%';
    if (this.speedFill) this.speedFill.style.width = speedPct + '%';
    if (this.timeFill) this.timeFill.style.width = timePct + '%';
    if (this.densityThumb) this.densityThumb.style.left = densityPct + '%';
    if (this.speedThumb) this.speedThumb.style.left = speedPct + '%';
    if (this.timeThumb) this.timeThumb.style.left = timePct + '%';

    if (this.galaxyLabel) {
      const labels = GALAXY_LABELS[this.state.galaxyType];
      this.galaxyLabel.innerHTML = `<div>${labels.zh}</div><div class="subtitle">${labels.en}</div>`;
    }
  }

  private calcPct(value: number, min: number, max: number): number {
    return ((value - min) / (max - min)) * 100;
  }

  onChange(handler: ControlChangeHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private notify(state: Partial<ControlState>): void {
    this.handlers.forEach((h) => h(state));
  }

  getState(): ControlState {
    return { ...this.state };
  }

  updateFPS(fps: number): void {
    if (this.fpsCounter) {
      this.fpsCounter.textContent = `FPS: ${fps.toFixed(0)}`;
    }
  }
}
