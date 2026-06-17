import { ParticleEngine } from './engine';
import { Renderer } from './renderer';
import { UIPanel } from './ui';

class GameLoop {
  private lastTime: number = 0;
  private running: boolean = false;
  private animationId: number = 0;
  private callback: (dt: number) => void;
  private accumulator: number = 0;
  private readonly fixedDt: number = 1 / 60;
  private fpsSamples: number[] = [];
  private fpsSampleCount: number = 30;
  private averageFps: number = 60;
  private fpsUpdateFrame: number = 0;

  constructor(callback: (dt: number) => void) {
    this.callback = callback;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.running) return;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.accumulator += Math.min(deltaTime, 0.05);
    while (this.accumulator >= this.fixedDt) {
      this.callback(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    this.fpsUpdateFrame++;
    if (deltaTime > 0) {
      const instantFps = 1 / deltaTime;
      this.fpsSamples.push(instantFps);
      if (this.fpsSamples.length > this.fpsSampleCount) {
        this.fpsSamples.shift();
      }
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  public getAverageFps(): number {
    if (this.fpsSamples.length === 0) return 60;
    const sum = this.fpsSamples.reduce((a, b) => a + b, 0);
    this.averageFps = sum / this.fpsSamples.length;
    return this.averageFps;
  }
}

class Application {
  private engine: ParticleEngine;
  private renderer: Renderer;
  private ui: UIPanel;
  private gameLoop: GameLoop;
  private mouseDown: boolean = false;
  private shiftPressed: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private adaptiveReductionCooldown: number = 0;
  private adaptiveRecoveryCooldown: number = 0;

  constructor() {
    this.engine = new ParticleEngine();
    this.renderer = new Renderer('main-canvas', 'trail-canvas');
    this.gameLoop = new GameLoop((dt) => this.update(dt));

    this.ui = new UIPanel(
      {
        particleCount: 2000,
        particleSize: 3,
        forceStrength: 1.0,
        trailLength: 5,
        backgroundColor: '#0A0A1A'
      },
      {
        onParticleCountChange: (count: number) => this.onParticleCountChange(count),
        onParticleSizeChange: (size: number) => this.onParticleSizeChange(size),
        onForceStrengthChange: (strength: number) => this.onForceStrengthChange(strength),
        onTrailLengthChange: (length: number) => this.onTrailLengthChange(length),
        onBackgroundColorChange: (color: string) => this.onBackgroundColorChange(color),
        onReset: () => this.onReset()
      }
    );
  }

  public init(): void {
    this.resize();
    this.engine.init(window.innerWidth, window.innerHeight);
    this.renderer.resize(window.innerWidth, window.innerHeight);

    this.setupEventListeners();
    this.gameLoop.start();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());

    const container = document.getElementById('canvas-container');
    if (container) {
      container.addEventListener('mousedown', (e) => this.onMouseDown(e));
      container.addEventListener('mousemove', (e) => this.onMouseMove(e));
      container.addEventListener('mouseup', () => this.onMouseUp());
      container.addEventListener('mouseleave', () => this.onMouseUp());

      container.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
      container.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
      container.addEventListener('touchend', () => this.onMouseUp());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') {
        this.shiftPressed = true;
        if (this.mouseDown) {
          this.engine.applyForce(
            this.mouseX,
            this.mouseY,
            true,
            this.shiftPressed ? 'repel' : 'attract'
          );
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        this.shiftPressed = false;
        if (this.mouseDown) {
          this.engine.applyForce(
            this.mouseX,
            this.mouseY,
            true,
            this.shiftPressed ? 'repel' : 'attract'
          );
        }
      }
    });
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.engine.setSize(w, h);
    this.renderer.resize(w, h);
  }

  private onMouseDown(e: MouseEvent): void {
    this.mouseDown = true;
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.engine.applyForce(
      this.mouseX,
      this.mouseY,
      true,
      this.shiftPressed ? 'repel' : 'attract'
    );
  }

  private onMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    if (this.mouseDown) {
      this.engine.applyForce(
        this.mouseX,
        this.mouseY,
        true,
        this.shiftPressed ? 'repel' : 'attract'
      );
    }
  }

  private onMouseUp(): void {
    this.mouseDown = false;
    this.engine.applyForce(0, 0, false, 'attract');
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      this.mouseDown = true;
      this.mouseX = e.touches[0].clientX;
      this.mouseY = e.touches[0].clientY;
      this.shiftPressed = e.touches.length > 1;
      this.engine.applyForce(
        this.mouseX,
        this.mouseY,
        true,
        this.shiftPressed ? 'repel' : 'attract'
      );
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      this.mouseX = e.touches[0].clientX;
      this.mouseY = e.touches[0].clientY;
      this.shiftPressed = e.touches.length > 1;
      this.engine.applyForce(
        this.mouseX,
        this.mouseY,
        true,
        this.shiftPressed ? 'repel' : 'attract'
      );
    }
  }

  private onParticleCountChange(count: number): void {
    this.engine.setParticleCount(count);
    this.ui.updateParticleCountDisplay(this.engine.getActiveParticleCount());
  }

  private onParticleSizeChange(size: number): void {
    this.engine.updateParticleSize(size);
  }

  private onForceStrengthChange(strength: number): void {
    this.engine.setConfig('forceStrength', strength);
  }

  private onTrailLengthChange(length: number): void {
    this.renderer.setConfig('trailLength', length);
  }

  private onBackgroundColorChange(color: string): void {
    this.renderer.setConfig('backgroundColor', color);
    document.body.style.backgroundColor = color;
  }

  private onReset(): void {
    this.engine.resetParticles();
    this.renderer.clearTrails();
    this.engine.performanceWarning = false;
    this.ui.updateParticleCountDisplay(this.engine.getActiveParticleCount());
  }

  private update(dt: number): void {
    const state = this.engine.step(dt);
    const currentFps = this.renderer.render(state);

    this.handleAdaptivePerformance(currentFps, dt);
    this.ui.update(state.particleCount, this.engine.performanceWarning);
  }

  private handleAdaptivePerformance(currentFps: number, dt: number): void {
    this.adaptiveReductionCooldown = Math.max(0, this.adaptiveReductionCooldown - dt);
    this.adaptiveRecoveryCooldown = Math.max(0, this.adaptiveRecoveryCooldown - dt);

    const activeCount = this.engine.getActiveParticleCount();

    if (currentFps < 30 && activeCount > 500 && this.adaptiveReductionCooldown <= 0) {
      const toRemove = Math.min(50, activeCount - 500);
      this.engine.removeParticles(toRemove);
      this.engine.performanceWarning = true;
      this.adaptiveReductionCooldown = 1.0;
    }

    if (currentFps >= 45 && this.engine.performanceWarning && this.adaptiveRecoveryCooldown <= 0) {
      this.engine.performanceWarning = false;
      this.adaptiveRecoveryCooldown = 2.0;
    }
  }
}

const app = new Application();
app.init();
