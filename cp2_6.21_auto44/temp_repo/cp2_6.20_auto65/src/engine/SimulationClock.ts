export class SimulationClock {
  private currentTime: number = 0;
  private speed: number = 1;
  private isRunning: boolean = false;
  private lastTimestamp: number = 0;
  private animationFrameId: number | null = null;
  private listeners: ((time: number, deltaTime: number) => void)[] = [];
  private scheduledEvents: Map<number, () => void> = new Map();

  constructor(initialTime: number = 0) {
    this.currentTime = initialTime;
  }

  getTime(): number {
    return this.currentTime;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  getSpeed(): number {
    return this.speed;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  toggle(): boolean {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  reset() {
    this.stop();
    this.currentTime = 0;
    this.scheduledEvents.clear();
    this.notifyListeners(0);
  }

  onTick(listener: (time: number, deltaTime: number) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  scheduleEvent(time: number, callback: () => void) {
    this.scheduledEvents.set(time, callback);
  }

  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const realDelta = now - this.lastTimestamp;
    this.lastTimestamp = now;

    const scaledDelta = realDelta * this.speed;
    this.currentTime += scaledDelta;

    this.checkScheduledEvents();
    this.notifyListeners(scaledDelta);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private notifyListeners(deltaTime: number) {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTime, deltaTime);
      } catch (e) {
        console.error('Error in simulation clock listener:', e);
      }
    });
  }

  private checkScheduledEvents() {
    const triggeredEvents: number[] = [];
    
    this.scheduledEvents.forEach((callback, time) => {
      if (time <= this.currentTime) {
        triggeredEvents.push(time);
        try {
          callback();
        } catch (e) {
          console.error('Error in scheduled event:', e);
        }
      }
    });

    triggeredEvents.forEach(time => this.scheduledEvents.delete(time));
  }

  formatTime(): string {
    const totalSeconds = Math.floor(this.currentTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
