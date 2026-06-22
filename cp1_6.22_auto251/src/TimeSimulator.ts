import { eventBus } from './EventBus';

const J2000_EPOCH = Date.UTC(2000, 0, 1, 12, 0, 0, 0);
const MS_PER_DAY = 86400000;

class TimeSimulator {
  private static instance: TimeSimulator;
  private currentTime: Date;
  private speed: number;
  private direction: 1 | -1;
  private isPaused: boolean;
  private animationFrameId: number | null;
  private lastFrameTime: number;

  private constructor() {
    this.currentTime = new Date(Date.UTC(2025, 0, 1, 0, 0, 0, 0));
    this.speed = 1;
    this.direction = 1;
    this.isPaused = false;
    this.animationFrameId = null;
    this.lastFrameTime = 0;
  }

  public static getInstance(): TimeSimulator {
    if (!TimeSimulator.instance) {
      TimeSimulator.instance = new TimeSimulator();
    }
    return TimeSimulator.instance;
  }

  public start(): void {
    if (this.animationFrameId !== null) {
      return;
    }
    this.lastFrameTime = performance.now();
    this.animate();
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public setSpeed(speed: number): void {
    const clampedSpeed = Math.max(0.1, Math.min(1000, speed));
    if (this.speed !== clampedSpeed) {
      this.speed = clampedSpeed;
      eventBus.emit('speedChanged', this.speed);
    }
  }

  public toggleDirection(): void {
    this.direction = this.direction === 1 ? -1 : 1;
    eventBus.emit('directionChanged', this.direction);
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    eventBus.emit('togglePause', this.isPaused);
  }

  public setTime(date: Date): void {
    this.currentTime = new Date(date);
  }

  public getEpochDays(): number {
    return (this.currentTime.getTime() - J2000_EPOCH) / MS_PER_DAY;
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const deltaMs = now - this.lastFrameTime;
    this.lastFrameTime = now;

    if (!this.isPaused) {
      const deltaDays = (deltaMs / 1000) * this.speed * this.direction;
      this.currentTime = new Date(this.currentTime.getTime() + deltaDays * MS_PER_DAY);
      const epochDays = this.getEpochDays();
      eventBus.emit('timeUpdated', {
        currentTime: new Date(this.currentTime),
        epochDays,
        deltaDays,
      });
    }
  };

  get epochDays(): number {
    return this.getEpochDays();
  }
}

export const timeSimulator = TimeSimulator.getInstance();
