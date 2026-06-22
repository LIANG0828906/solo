export type UpdateCallback = (deltaTime: number, timestamp: number) => void;

export class GameLoop {
  private rafId: number | null = null;
  private lastTime: number = 0;
  private running: boolean = false;
  private callback: UpdateCallback | null = null;
  private fps: number = 0;
  private fpsAccum: number = 0;
  private fpsFrames: number = 0;
  private onFpsUpdate?: ((fps: number) => void);

  setOnFpsUpdate(cb: (fps: number) => void) {
    this.onFpsUpdate = cb;
  }

  getFps(): number {
    return this.fps;
  }

  start(callback: UpdateCallback): void {
    if (this.running) return;
    this.callback = callback;
    this.running = true;
    this.lastTime = performance.now();
    this.fpsAccum = 0;
    this.fpsFrames = 0;
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.callback = null;
  }

  isRunning(): boolean {
    return this.running;
  }

  private loop = (timestamp: number): void => {
    if (!this.running || !this.callback) return;

    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.fpsAccum += delta;
    this.fpsFrames++;
    if (this.fpsAccum >= 1000) {
      this.fps = Math.round((this.fpsFrames * 1000) / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
      if (this.onFpsUpdate) this.onFpsUpdate(this.fps);
    }

    this.callback(delta, timestamp);

    this.rafId = requestAnimationFrame(this.loop);
  };

  dispose(): void {
    this.stop();
    this.onFpsUpdate = undefined;
  }
}

export const gameLoop = new GameLoop();
