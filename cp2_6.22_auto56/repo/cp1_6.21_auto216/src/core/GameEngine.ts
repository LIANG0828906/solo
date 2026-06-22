import type { HUDData } from './types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private onHUDUpdate: (data: HUDData) => void;
  private onGameOver: () => void;
  private running: boolean = false;
  private animFrameId: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    onHUDUpdate: (data: HUDData) => void,
    onGameOver: () => void
  ) {
    this.canvas = canvas;
    this.onHUDUpdate = onHUDUpdate;
    this.onGameOver = onGameOver;
  }

  start(): void {
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.onHUDUpdate({
        health: 3,
        maxHealth: 3,
        combo: 0,
        score: 0,
        comboFlash: false,
        specialCooldown: 0,
        specialMaxCooldown: 8,
        specialReady: true,
      });
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}
