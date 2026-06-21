import { DoublePendulum } from './engine';
import { Renderer } from './renderer';

export class Controls {
  private pendulum: DoublePendulum;
  private renderer: Renderer;

  private toggleArmsBtn: HTMLButtonElement;
  private toggleTrailBtn: HTMLButtonElement;
  private clearTrailBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private speedSlider: HTMLInputElement;
  private speedValue: HTMLSpanElement;

  constructor(
    pendulum: DoublePendulum,
    renderer: Renderer
  ) {
    this.pendulum = pendulum;
    this.renderer = renderer;

    const toggleArmsBtn = document.getElementById('toggleArmsBtn');
    const toggleTrailBtn = document.getElementById('toggleTrailBtn');
    const clearTrailBtn = document.getElementById('clearTrailBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');

    if (!toggleArmsBtn || !toggleTrailBtn || !clearTrailBtn ||
        !resetBtn || !speedSlider || !speedValue) {
      throw new Error('无法找到控制元素');
    }

    this.toggleArmsBtn = toggleArmsBtn as HTMLButtonElement;
    this.toggleTrailBtn = toggleTrailBtn as HTMLButtonElement;
    this.clearTrailBtn = clearTrailBtn as HTMLButtonElement;
    this.resetBtn = resetBtn as HTMLButtonElement;
    this.speedSlider = speedSlider as HTMLInputElement;
    this.speedValue = speedValue as HTMLSpanElement;

    this.speedValue.textContent = '1.0x';
    this.toggleArmsBtn.textContent = '隐藏摆臂';
    this.toggleArmsBtn.classList.add('active');
    this.toggleTrailBtn.textContent = '隐藏轨迹';
    this.toggleTrailBtn.classList.add('active');

    this.bindEvents();
  }

  private bindEvents(): void {
    this.toggleArmsBtn.addEventListener('click', () => this.toggleArms());
    this.toggleTrailBtn.addEventListener('click', () => this.toggleTrail());
    this.clearTrailBtn.addEventListener('click', () => this.clearTrail());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.speedSlider.addEventListener('input', (e) => this.onSpeedChange(e));
  }

  private toggleArms(): void {
    this.renderer.options.showArms = !this.renderer.options.showArms;
    if (this.renderer.options.showArms) {
      this.toggleArmsBtn.textContent = '隐藏摆臂';
      this.toggleArmsBtn.classList.add('active');
    } else {
      this.toggleArmsBtn.textContent = '显示摆臂';
      this.toggleArmsBtn.classList.remove('active');
    }
  }

  private toggleTrail(): void {
    this.renderer.options.showTrail = !this.renderer.options.showTrail;
    if (this.renderer.options.showTrail) {
      this.toggleTrailBtn.textContent = '隐藏轨迹';
      this.toggleTrailBtn.classList.add('active');
    } else {
      this.toggleTrailBtn.textContent = '显示轨迹';
      this.toggleTrailBtn.classList.remove('active');
    }
  }

  private clearTrail(): void {
    this.renderer.clearTrail();
  }

  private reset(): void {
    this.pendulum.reset();
    this.renderer.clearTrail();
  }

  private onSpeedChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    const speed = parseFloat(target.value);
    this.pendulum.speed = speed;
    this.speedValue.textContent = `${speed.toFixed(1)}x`;
  }
}
