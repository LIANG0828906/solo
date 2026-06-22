import { SimParams, EnergyStats } from './collision';

export interface UICallbacks {
  onParamsChange: (params: SimParams) => void;
  onReset: () => void;
  onRecreate: () => void;
  onPlayPause: () => void;
  onTimelineChange: (time: number) => void;
  onSpeedChange: (speed: number) => void;
}

export class UI {
  private params: SimParams;
  private callbacks: UICallbacks;
  private isPlaying: boolean = false;
  private currentSpeed: number = 1;
  private particleCount: number = 8000;

  private sliders: Record<string, HTMLInputElement> = {};
  private valueDisplays: Record<string, HTMLSpanElement> = {};
  private kineticEnergyEl!: HTMLElement;
  private potentialEnergyEl!: HTMLElement;
  private totalEnergyEl!: HTMLElement;
  private fpsEl!: HTMLElement;
  private currentTimeEl!: HTMLElement;
  private totalTimeEl!: HTMLElement;
  private timelineEl!: HTMLInputElement;
  private playBtn!: HTMLButtonElement;

  constructor(initialParams: SimParams, callbacks: UICallbacks) {
    this.params = { ...initialParams };
    this.callbacks = callbacks;
    this.bindElements();
    this.bindEvents();
  }

  private bindElements(): void {
    const sliderIds = ['mass1', 'mass2', 'distance', 'angle', 'velocity', 'particles'];
    sliderIds.forEach(id => {
      this.sliders[id] = document.getElementById(id) as HTMLInputElement;
      this.valueDisplays[id] = document.getElementById(`${id}-value`) as HTMLSpanElement;
    });

    this.kineticEnergyEl = document.getElementById('kinetic-energy')!;
    this.potentialEnergyEl = document.getElementById('potential-energy')!;
    this.totalEnergyEl = document.getElementById('total-energy')!;
    this.fpsEl = document.getElementById('fps')!;
    this.currentTimeEl = document.getElementById('current-time')!;
    this.totalTimeEl = document.getElementById('total-time')!;
    this.timelineEl = document.getElementById('timeline') as HTMLInputElement;
    this.playBtn = document.getElementById('play-btn') as HTMLButtonElement;
  }

  private bindEvents(): void {
    this.sliders.mass1.addEventListener('input', (e) => {
      this.params.mass1 = parseFloat((e.target as HTMLInputElement).value);
      this.valueDisplays.mass1.textContent = this.params.mass1.toFixed(1);
      this.callbacks.onParamsChange({ ...this.params });
    });

    this.sliders.mass2.addEventListener('input', (e) => {
      this.params.mass2 = parseFloat((e.target as HTMLInputElement).value);
      this.valueDisplays.mass2.textContent = this.params.mass2.toFixed(1);
      this.callbacks.onParamsChange({ ...this.params });
    });

    this.sliders.distance.addEventListener('input', (e) => {
      this.params.distance = parseFloat((e.target as HTMLInputElement).value);
      this.valueDisplays.distance.textContent = this.params.distance.toFixed(0);
      this.callbacks.onParamsChange({ ...this.params });
    });

    this.sliders.angle.addEventListener('input', (e) => {
      this.params.angle = parseFloat((e.target as HTMLInputElement).value);
      this.valueDisplays.angle.textContent = this.params.angle.toFixed(0);
      this.callbacks.onParamsChange({ ...this.params });
    });

    this.sliders.velocity.addEventListener('input', (e) => {
      this.params.velocityMultiplier = parseFloat((e.target as HTMLInputElement).value);
      this.valueDisplays.velocity.textContent = this.params.velocityMultiplier.toFixed(1);
      this.callbacks.onParamsChange({ ...this.params });
    });

    this.sliders.particles.addEventListener('input', (e) => {
      this.particleCount = parseInt((e.target as HTMLInputElement).value);
      this.valueDisplays.particles.textContent = this.particleCount.toFixed(0);
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      this.callbacks.onReset();
    });

    document.getElementById('recreate-btn')?.addEventListener('click', () => {
      this.callbacks.onRecreate();
    });

    this.playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      this.playBtn.textContent = this.isPlaying ? '⏸' : '▶';
      this.playBtn.classList.toggle('active', this.isPlaying);
      this.callbacks.onPlayPause();
    });

    document.getElementById('reset-timeline-btn')?.addEventListener('click', () => {
      this.setTimeline(0);
      this.callbacks.onTimelineChange(0);
    });

    this.timelineEl.addEventListener('input', (e) => {
      const time = parseFloat((e.target as HTMLInputElement).value);
      this.callbacks.onTimelineChange(time);
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentSpeed = parseFloat((btn as HTMLElement).dataset.speed || '1');
        this.callbacks.onSpeedChange(this.currentSpeed);
      });
    });
  }

  updateEnergy(stats: EnergyStats): void {
    this.kineticEnergyEl.textContent = stats.kinetic.toExponential(2);
    this.potentialEnergyEl.textContent = stats.potential.toExponential(2);
    this.totalEnergyEl.textContent = stats.total.toExponential(2);
  }

  updateFPS(fps: number): void {
    this.fpsEl.textContent = fps.toFixed(0);
  }

  updateTimeline(currentTime: number, totalTime: number): void {
    this.timelineEl.max = totalTime.toFixed(1);
    this.currentTimeEl.textContent = currentTime.toFixed(2);
    this.totalTimeEl.textContent = totalTime.toFixed(2);
    
    if (document.activeElement !== this.timelineEl) {
      this.timelineEl.value = currentTime.toFixed(1);
    }
  }

  setTimeline(time: number): void {
    this.timelineEl.value = time.toFixed(1);
    this.currentTimeEl.textContent = time.toFixed(2);
  }

  getParticleCount(): number {
    return this.particleCount;
  }

  getParams(): SimParams {
    return { ...this.params };
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    this.playBtn.textContent = playing ? '⏸' : '▶';
    this.playBtn.classList.toggle('active', playing);
  }
}
