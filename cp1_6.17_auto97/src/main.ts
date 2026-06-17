import './style.css';
import {
  PhysicsEngine,
  type SimulationConfig,
  MAX_TRAIL_POINTS
} from './PhysicsEngine';
import { Renderer } from './Renderer';
import { UIController } from './UIController';

class App {
  private canvas: HTMLCanvasElement;
  private physics: PhysicsEngine | null = null;
  private renderer: Renderer | null = null;
  private ui: UIController | null = null;
  private rafId: number | null = null;
  private hasTriggeredToast: boolean = false;

  constructor() {
    const canvasEl = document.getElementById('scene') as HTMLCanvasElement | null;
    if (!canvasEl) {
      throw new Error('找不到 Canvas 元素 #scene');
    }
    this.canvas = canvasEl;

    this.init();
  }

  private init(): void {
    this.resizeCanvas();

    this.ui = new UIController({
      onConfigChange: (cfg: SimulationConfig) => this.handleConfigChange(cfg),
      onReset: () => this.handleReset()
    });

    this.physics = new PhysicsEngine(
      this.canvas.width,
      this.canvas.height,
      this.ui.getConfig()
    );

    this.renderer = new Renderer(this.canvas, MAX_TRAIL_POINTS);

    window.addEventListener('resize', () => this.handleResize());

    this.startLoop();
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private handleResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.resizeCanvas();

    if (this.physics) {
      this.physics.resize(w, h);
    }
    if (this.renderer) {
      this.renderer.resize(w, h);
    }
  }

  private handleConfigChange(cfg: SimulationConfig): void {
    if (this.physics) {
      this.physics.updateConfig(cfg);
      this.hasTriggeredToast = false;
      this.ui?.hideSuccessToast();
    }
    if (this.renderer) {
      this.renderer.resetTrailAndParticles();
    }
  }

  private handleReset(): void {
    if (this.physics) {
      this.physics.reset();
      this.hasTriggeredToast = false;
    }
    if (this.renderer) {
      this.renderer.resetTrailAndParticles();
    }
  }

  private startLoop(): void {
    const loop = () => {
      this.tick();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private tick(): void {
    if (!this.physics || !this.renderer || !this.ui) return;

    this.physics.step();

    const sc = this.physics.getSpacecraft();
    const pl = this.physics.getPlanet();
    const speed = this.physics.getSpeed();
    const distance = this.physics.getDistance();
    const orbitType = this.physics.getOrbitType();
    const collided = this.physics.collided;
    const escaped = this.physics.escaped;

    if (!this.hasTriggeredToast && this.physics.hasEscapedGravity()) {
      this.hasTriggeredToast = true;
      this.ui.showSuccessToast();
    }

    this.ui.updateInfo({
      speed,
      distance,
      orbitType
    });

    this.renderer.render(
      {
        position: {
          x: sc.position.x,
          y: sc.position.y
        },
        velocity: {
          x: sc.velocity.x,
          y: sc.velocity.y
        }
      },
      {
        position: {
          x: pl.position.x,
          y: pl.position.y
        },
        radius: pl.radius
      },
      collided,
      escaped
    );
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
