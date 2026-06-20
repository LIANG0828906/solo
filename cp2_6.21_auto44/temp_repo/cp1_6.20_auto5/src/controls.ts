import { ColorTheme } from './colorThemes';

export interface ControlCallbacks {
  onParticleCountChange: (count: number) => void;
  onRotationSpeedChange: (speed: number) => void;
  onThemeChange: (theme: ColorTheme) => void;
}

export class UIControls {
  private particleCountSlider: HTMLInputElement;
  private particleCountValue: HTMLElement;
  private rotationSpeedSlider: HTMLInputElement;
  private rotationSpeedValue: HTMLElement;
  private themeButtons: NodeListOf<HTMLButtonElement>;
  private callbacks: ControlCallbacks;

  constructor(callbacks: ControlCallbacks) {
    this.callbacks = callbacks;

    this.particleCountSlider = document.getElementById('particle-count') as HTMLInputElement;
    this.particleCountValue = document.getElementById('particle-count-value') as HTMLElement;
    this.rotationSpeedSlider = document.getElementById('rotation-speed') as HTMLInputElement;
    this.rotationSpeedValue = document.getElementById('rotation-speed-value') as HTMLElement;
    this.themeButtons = document.querySelectorAll('.theme-btn');

    this.bindEvents();
  }

  private bindEvents(): void {
    this.particleCountSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.particleCountValue.textContent = value.toString();
      this.callbacks.onParticleCountChange(value);
    });

    this.rotationSpeedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.rotationSpeedValue.textContent = value.toFixed(1) + 'x';
      this.callbacks.onRotationSpeedChange(value);
    });

    this.themeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const theme = button.dataset.theme as ColorTheme;
        this.setActiveThemeButton(theme);
        this.callbacks.onThemeChange(theme);
      });
    });
  }

  private setActiveThemeButton(theme: ColorTheme): void {
    this.themeButtons.forEach((btn) => {
      if (btn.dataset.theme === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  public getParticleCount(): number {
    return parseInt(this.particleCountSlider.value);
  }

  public getRotationSpeed(): number {
    return parseFloat(this.rotationSpeedSlider.value);
  }
}
