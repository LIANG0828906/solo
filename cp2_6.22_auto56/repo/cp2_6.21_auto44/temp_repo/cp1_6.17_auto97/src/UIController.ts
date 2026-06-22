export interface SimulationConfig {
  initialSpeed: number;
  launchAngle: number;
  planetMass: number;
}

export interface UICallbacks {
  onConfigChange: (config: SimulationConfig) => void;
  onReset: () => void;
}

interface InfoData {
  speed: number;
  distance: number;
  orbitType: string;
}

const ORBIT_LABELS: Record<string, string> = {
  elliptical: '椭圆',
  hyperbolic: '双曲线',
  parabolic: '抛物线'
};

export class UIController {
  private speedSlider: HTMLInputElement;
  private angleSlider: HTMLInputElement;
  private massSlider: HTMLInputElement;
  private speedValue: HTMLElement;
  private angleValue: HTMLElement;
  private massValue: HTMLElement;
  private resetBtn: HTMLButtonElement;
  private infoSpeed: HTMLElement;
  private infoDistance: HTMLElement;
  private infoOrbit: HTMLElement;
  private successToast: HTMLElement;
  private callbacks: UICallbacks;
  private config: SimulationConfig;
  private toastTimer: number | null = null;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    this.speedSlider = this.getEl<HTMLInputElement>('slider-speed');
    this.angleSlider = this.getEl<HTMLInputElement>('slider-angle');
    this.massSlider = this.getEl<HTMLInputElement>('slider-mass');
    this.speedValue = this.getEl<HTMLElement>('value-speed');
    this.angleValue = this.getEl<HTMLElement>('value-angle');
    this.massValue = this.getEl<HTMLElement>('value-mass');
    this.resetBtn = this.getEl<HTMLButtonElement>('btn-reset');
    this.infoSpeed = this.getEl<HTMLElement>('info-speed');
    this.infoDistance = this.getEl<HTMLElement>('info-distance');
    this.infoOrbit = this.getEl<HTMLElement>('info-orbit');
    this.successToast = this.getEl<HTMLElement>('success-toast');

    this.config = {
      initialSpeed: parseFloat(this.speedSlider.value),
      launchAngle: parseFloat(this.angleSlider.value),
      planetMass: parseFloat(this.massSlider.value)
    };

    this.bindEvents();
    this.updateSliderValues();
  }

  private getEl<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id) as T | null;
    if (!el) {
      throw new Error(`找不到元素 #${id}`);
    }
    return el;
  }

  private bindEvents(): void {
    this.speedSlider.addEventListener('input', () => {
      this.config.initialSpeed = parseFloat(this.speedSlider.value);
      this.updateSliderValues();
      this.callbacks.onConfigChange({ ...this.config });
    });

    this.angleSlider.addEventListener('input', () => {
      this.config.launchAngle = parseFloat(this.angleSlider.value);
      this.updateSliderValues();
      this.callbacks.onConfigChange({ ...this.config });
    });

    this.massSlider.addEventListener('input', () => {
      this.config.planetMass = parseFloat(this.massSlider.value);
      this.updateSliderValues();
      this.callbacks.onConfigChange({ ...this.config });
    });

    this.resetBtn.addEventListener('click', () => {
      this.hideSuccessToast();
      this.callbacks.onReset();
    });
  }

  private updateSliderValues(): void {
    this.speedValue.textContent = this.config.initialSpeed.toString();
    this.angleValue.textContent = `${this.config.launchAngle}°`;
    this.massValue.textContent = this.config.planetMass.toString();
  }

  public updateInfo(data: InfoData): void {
    this.infoSpeed.textContent = `${data.speed.toFixed(1)} px/s`;
    this.infoDistance.textContent = `${data.distance.toFixed(1)} px`;
    this.infoOrbit.textContent = ORBIT_LABELS[data.orbitType] ?? data.orbitType;
  }

  public showSuccessToast(): void {
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
    }

    this.successToast.classList.remove('hidden');
    this.successToast.style.animation = 'none';
    void this.successToast.offsetWidth;
    this.successToast.style.animation = '';

    this.toastTimer = window.setTimeout(() => {
      this.hideSuccessToast();
    }, 3000);
  }

  public hideSuccessToast(): void {
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.successToast.classList.add('hidden');
  }

  public getConfig(): SimulationConfig {
    return { ...this.config };
  }
}
