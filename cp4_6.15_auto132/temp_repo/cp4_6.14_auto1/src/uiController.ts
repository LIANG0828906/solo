import gsap from 'gsap';
import type { ParticleMode } from './particleSystem';

interface UIControls {
  countSlider: HTMLInputElement;
  sizeSlider: HTMLInputElement;
  speedSlider: HTMLInputElement;
  colorSlider: HTMLInputElement;
  lineSlider: HTMLInputElement;
  countValue: HTMLElement;
  sizeValue: HTMLElement;
  speedValue: HTMLElement;
  colorValue: HTMLElement;
  lineValue: HTMLElement;
  statusMode: HTMLElement;
  statusLines: HTMLElement;
  fpsValue: HTMLElement;
  particleCount: HTMLElement;
  modeButtons: NodeListOf<HTMLElement>;
}

export class UIController {
  private controls: UIControls;
  private onModeChange: (mode: ParticleMode) => void;
  private onCountChange: (count: number) => void;
  private onSizeChange: (size: number) => void;
  private onSpeedChange: (speed: number) => void;
  private onColorChange: (hue: number) => void;
  private onLineChange: (threshold: number) => void;

  private currentMode: ParticleMode = 'random';

  constructor(callbacks: {
    onModeChange: (mode: ParticleMode) => void;
    onCountChange: (count: number) => void;
    onSizeChange: (size: number) => void;
    onSpeedChange: (speed: number) => void;
    onColorChange: (hue: number) => void;
    onLineChange: (threshold: number) => void;
  }) {
    this.onModeChange = callbacks.onModeChange;
    this.onCountChange = callbacks.onCountChange;
    this.onSizeChange = callbacks.onSizeChange;
    this.onSpeedChange = callbacks.onSpeedChange;
    this.onColorChange = callbacks.onColorChange;
    this.onLineChange = callbacks.onLineChange;

    this.controls = this.getControls();
    this.bindEvents();
    this.updateModeUI('random');
  }

  private getControls(): UIControls {
    return {
      countSlider: document.getElementById('count-slider') as HTMLInputElement,
      sizeSlider: document.getElementById('size-slider') as HTMLInputElement,
      speedSlider: document.getElementById('speed-slider') as HTMLInputElement,
      colorSlider: document.getElementById('color-slider') as HTMLInputElement,
      lineSlider: document.getElementById('line-slider') as HTMLInputElement,
      countValue: document.getElementById('count-value') as HTMLElement,
      sizeValue: document.getElementById('size-value') as HTMLElement,
      speedValue: document.getElementById('speed-value') as HTMLElement,
      colorValue: document.getElementById('color-value') as HTMLElement,
      lineValue: document.getElementById('line-value') as HTMLElement,
      statusMode: document.getElementById('status-mode') as HTMLElement,
      statusLines: document.getElementById('status-lines') as HTMLElement,
      fpsValue: document.getElementById('fps-value') as HTMLElement,
      particleCount: document.getElementById('particle-count') as HTMLElement,
      modeButtons: document.querySelectorAll('.mode-btn')
    };
  }

  private bindEvents(): void {
    this.controls.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as ParticleMode;
        if (mode && mode !== this.currentMode) {
          this.setMode(mode);
        }
      });
    });

    this.controls.countSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.controls.countValue.textContent = value.toString();
      this.onCountChange(value);
    });

    this.controls.sizeSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.controls.sizeValue.textContent = value.toFixed(1);
      this.onSizeChange(value);
    });

    this.controls.speedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.controls.speedValue.textContent = value.toFixed(1);
      this.onSpeedChange(value);
    });

    this.controls.colorSlider.addEventListener('input', (e) => {
      const hue = parseInt((e.target as HTMLInputElement).value);
      const hex = this.hueToHex(hue);
      this.controls.colorValue.textContent = hex;
      this.controls.colorValue.style.color = hex;
      this.onColorChange(hue);
    });

    this.controls.lineSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.controls.lineValue.textContent = value.toString();
      this.onLineChange(value);
    });
  }

  private hueToHex(hue: number): string {
    const h = hue / 360;
    const s: number = 0.8;
    const l: number = 0.65;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  public setMode(mode: ParticleMode): void {
    this.currentMode = mode;
    this.updateModeUI(mode);
    this.onModeChange(mode);
  }

  private updateModeUI(mode: ParticleMode): void {
    this.controls.modeButtons.forEach(btn => {
      const btnMode = btn.getAttribute('data-mode');
      if (btnMode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const modeNames: Record<ParticleMode, string> = {
      random: '随机运动',
      ellipsoid: '椭球轨迹'
    };
    this.controls.statusMode.textContent = modeNames[mode];
  }

  public updateLineCount(count: number): void {
    this.controls.statusLines.textContent = count.toString();
  }

  public updateFPS(fps: number): void {
    this.controls.fpsValue.textContent = Math.round(fps).toString();

    this.controls.fpsValue.classList.remove('fps-good', 'fps-mid', 'fps-bad');
    if (fps >= 55) {
      this.controls.fpsValue.classList.add('fps-good');
    } else if (fps >= 30) {
      this.controls.fpsValue.classList.add('fps-mid');
    } else {
      this.controls.fpsValue.classList.add('fps-bad');
    }
  }

  public updateParticleCount(count: number): void {
    this.controls.particleCount.textContent = count.toString();
  }

  public animatePanelIn(): void {
    const panel = document.querySelector('.control-panel') as HTMLElement;
    gsap.fromTo(
      panel,
      { x: -320, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    );
  }

  public animateStatsIn(): void {
    const stats = document.querySelector('.stats-display') as HTMLElement;
    gsap.fromTo(
      stats,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.3, ease: 'power2.out' }
    );
  }
}
