import { Simulator } from './simulator';
import { ControlPanel } from './controlPanel';

const CANVAS_SIZE = 600;
const TARGET_FPS = 30;
const FRAME_DURATION = 1000 / TARGET_FPS;

class App {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  simulator: Simulator;
  controlPanel: ControlPanel;
  lastTime: number;
  accumulator: number;
  fpsFrames: number;
  fpsTime: number;
  currentFps: number;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.ctx = this.canvas.getContext('2d')!;
    this.simulator = new Simulator(CANVAS_SIZE, CANVAS_SIZE);
    this.controlPanel = new ControlPanel(this.simulator);
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fpsFrames = 0;
    this.fpsTime = 0;
    this.currentFps = 0;

    this.simulator.spawnFood();
    this.loop(performance.now());
  }

  loop(now: number): void {
    const rawDelta = now - this.lastTime;
    this.lastTime = now;
    const delta = Math.min(rawDelta, 100);

    this.fpsFrames++;
    this.fpsTime += rawDelta;
    if (this.fpsTime >= 1000) {
      this.currentFps = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }

    const speedMultiplier = this.controlPanel.getSpeedMultiplier();
    this.accumulator += delta;

    while (this.accumulator >= FRAME_DURATION) {
      this.simulator.runGeneration(FRAME_DURATION / 1000, speedMultiplier);
      this.accumulator -= FRAME_DURATION;
    }

    this.render();
    this.controlPanel.updateStats();

    requestAnimationFrame((t) => this.loop(t));
  }

  render(): void {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const bgGrad = ctx.createRadialGradient(
      CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0,
      CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.7
    );
    bgGrad.addColorStop(0, '#1a0a2e');
    bgGrad.addColorStop(0.5, '#0f0a28');
    bgGrad.addColorStop(1, '#060520');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    this.simulator.drawFoods(ctx);
    this.simulator.drawCreatures(ctx);
    this.simulator.drawParticles(ctx);

    ctx.save();
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(180, 160, 220, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(`FPS: ${this.currentFps}`, CANVAS_SIZE - 10, 18);
    ctx.restore();
  }
}

new App();
