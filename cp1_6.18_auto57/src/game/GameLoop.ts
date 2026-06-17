import { BeatManager } from './BeatManager';
import { TrailRenderer } from '../effects/TrailRenderer';
import { InputHandler } from '../input/InputHandler';
import { LIGHT_SPEED, BOUNCE_WHITE_DURATION } from '../config/visualConfig';

export class GameLoop {
  private beatManager: BeatManager;
  private trailRenderer: TrailRenderer;
  private inputHandler: InputHandler;

  private lightX: number;
  private lightY: number;
  private angle: number;

  private flashWhite: boolean;
  private flashWhiteEnd: number;

  private animationFrameId: number;
  private fpsFrameCount: number;
  private fpsLastTime: number;
  private currentFps: number;

  private onFpsUpdate: ((fps: number) => void) | null;
  private onBeatUpdate: ((count: number) => void) | null;

  constructor(canvas: HTMLCanvasElement) {
    this.beatManager = new BeatManager();
    this.trailRenderer = new TrailRenderer(canvas);
    this.inputHandler = new InputHandler();

    this.lightX = canvas.width / 2;
    this.lightY = canvas.height / 2;
    this.angle = Math.PI / 4;

    this.flashWhite = false;
    this.flashWhiteEnd = 0;

    this.animationFrameId = 0;
    this.fpsFrameCount = 0;
    this.fpsLastTime = 0;
    this.currentFps = 60;

    this.onFpsUpdate = null;
    this.onBeatUpdate = null;

    this.inputHandler.setOnKeyDown((deflection: number) => {
      this.angle += (deflection * Math.PI) / 180;
    });
  }

  getBeatManager(): BeatManager {
    return this.beatManager;
  }

  setOnFpsUpdate(cb: (fps: number) => void): void {
    this.onFpsUpdate = cb;
  }

  setOnBeatUpdate(cb: (count: number) => void): void {
    this.onBeatUpdate = cb;
  }

  start(): void {
    this.fpsLastTime = performance.now();
    this.fpsFrameCount = 0;
    const loop = (now: number) => {
      this.update(now);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  reset(): void {
    const canvas = this.trailRenderer.getCanvas();
    this.lightX = canvas.width / 2;
    this.lightY = canvas.height / 2;
    this.angle = Math.PI / 4;
    this.flashWhite = false;
    this.flashWhiteEnd = 0;
    this.beatManager.reset();
    this.inputHandler.resetDeflection();
    this.trailRenderer.clearAll();
  }

  resize(width: number, height: number): void {
    const canvas = this.trailRenderer.getCanvas();
    const oldW = canvas.width;
    const oldH = canvas.height;

    if (this.lightX > oldW * 0.5) {
      this.lightX = (this.lightX / oldW) * width;
    }
    if (this.lightY > oldH * 0.5) {
      this.lightY = (this.lightY / oldH) * height;
    }

    this.lightX = Math.max(20, Math.min(width - 20, this.lightX));
    this.lightY = Math.max(20, Math.min(height - 20, this.lightY));

    this.trailRenderer.resize(width, height);
  }

  private update(now: number): void {
    this.fpsFrameCount++;
    if (now - this.fpsLastTime >= 1000) {
      this.currentFps = this.fpsFrameCount;
      this.fpsFrameCount = 0;
      this.fpsLastTime = now;
      if (this.onFpsUpdate) {
        this.onFpsUpdate(this.currentFps);
      }
    }

    const prevBeatCount = this.beatManager.getBeatCount();
    this.beatManager.update(now);
    if (this.beatManager.getBeatCount() !== prevBeatCount) {
      if (this.onBeatUpdate) {
        this.onBeatUpdate(this.beatManager.getBeatCount());
      }
    }

    const vx = LIGHT_SPEED * Math.cos(this.angle);
    const vy = LIGHT_SPEED * Math.sin(this.angle);
    this.lightX += vx;
    this.lightY += vy;

    const canvas = this.trailRenderer.getCanvas();
    const radius = 14;

    let bounced = false;

    if (this.lightX - radius < 0) {
      this.lightX = radius;
      this.angle = Math.PI - this.angle;
      bounced = true;
    } else if (this.lightX + radius > canvas.width) {
      this.lightX = canvas.width - radius;
      this.angle = Math.PI - this.angle;
      bounced = true;
    }

    if (this.lightY - radius < 0) {
      this.lightY = radius;
      this.angle = -this.angle;
      bounced = true;
    } else if (this.lightY + radius > canvas.height) {
      this.lightY = canvas.height - radius;
      this.angle = -this.angle;
      bounced = true;
    }

    if (bounced) {
      this.flashWhite = true;
      this.flashWhiteEnd = now + BOUNCE_WHITE_DURATION;
      this.normalizeAngle();
    }

    if (this.flashWhite && now >= this.flashWhiteEnd) {
      this.flashWhite = false;
    }

    const currentColor = this.beatManager.getCurrentColor();
    const currentRadius = this.beatManager.getCurrentRadius(now);

    this.trailRenderer.renderFrame(
      this.lightX,
      this.lightY,
      currentRadius,
      currentColor,
      this.flashWhite
    );
  }

  private normalizeAngle(): void {
    while (this.angle < 0) this.angle += Math.PI * 2;
    while (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
  }

  destroy(): void {
    this.stop();
    this.inputHandler.destroy();
  }
}
