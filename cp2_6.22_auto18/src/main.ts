import * as PIXI from 'pixi.js';
import { ParticleEmitter } from './core/ParticleEmitter';
import { ParticleRenderer } from './core/ParticleRenderer';
import { ControlPanel } from './ui/ControlPanel';
import type { ParticleConfig, Mode } from './types';

class ParticleEditorApp {
  private app: PIXI.Application;
  private emitter: ParticleEmitter;
  private renderer: ParticleRenderer;
  private controlPanel: ControlPanel;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private currentFPS: number = 60;
  private isRunning: boolean = true;

  constructor() {
    const canvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
    const container = canvas.parentElement as HTMLElement;

    const canvasWidth = Math.floor(container.clientWidth - 40);
    const canvasHeight = Math.floor(container.clientHeight - 40);

    this.app = new PIXI.Application({
      view: canvas,
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 0x16213e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.controlPanel = new ControlPanel();
    const initialConfig = this.controlPanel.getInitialConfig();

    this.emitter = new ParticleEmitter(initialConfig);
    this.emitter.setPosition(canvasWidth / 2, canvasHeight / 2);

    this.renderer = new ParticleRenderer(this.app);
    this.renderer.setColors(initialConfig.startColor, initialConfig.endColor);

    this.setupEventListeners();
    this.startAnimationLoop();
  }

  private setupEventListeners(): void {
    this.controlPanel.setOnConfigChange((config) => {
      this.handleConfigChange(config);
    });

    this.controlPanel.setOnModeChange((mode) => {
      this.handleModeChange(mode);
    });

    window.addEventListener('resize', () => {
      this.handleResize();
    });

    const canvas = this.app.view as HTMLCanvasElement;
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.emitter.setPosition(x, y);
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
      const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
      this.emitter.setPosition(x, y);
    }, { passive: false });
  }

  private handleConfigChange(config: Partial<ParticleConfig>): void {
    this.emitter.updateConfig(config);

    if (config.startColor || config.endColor) {
      const currentConfig = this.emitter.getConfig();
      this.renderer.setColors(
        config.startColor || currentConfig.startColor,
        config.endColor || currentConfig.endColor
      );
    }
  }

  private handleModeChange(mode: Mode): void {
    if (mode === 'play') {
      this.emitter.reset();
      this.isRunning = true;
    }
  }

  private handleResize(): void {
    const canvas = this.app.view as HTMLCanvasElement;
    const container = canvas.parentElement as HTMLElement;

    const canvasWidth = Math.floor(container.clientWidth - 40);
    const canvasHeight = Math.floor(container.clientHeight - 40);

    this.renderer.resize(canvasWidth, canvasHeight);
    this.emitter.setPosition(canvasWidth / 2, canvasHeight / 2);
  }

  private startAnimationLoop(): void {
    this.lastTime = performance.now();
    this.app.ticker.add(this.update.bind(this));
  }

  private update(): void {
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.frameCount++;
    this.fpsUpdateTime += deltaTime;
    if (this.fpsUpdateTime >= 0.5) {
      this.currentFPS = this.frameCount / this.fpsUpdateTime;
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
    }

    if (this.isRunning) {
      const particles = this.emitter.update(deltaTime);
      this.renderer.render(particles);
    }

    this.controlPanel.updateStatus(this.emitter.getParticleCount(), this.currentFPS);
  }

  destroy(): void {
    this.app.destroy(true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ParticleEditorApp();
});
