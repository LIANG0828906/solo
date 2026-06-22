import * as PIXI from 'pixi.js';
import { ParticleEmitter } from './core/ParticleEmitter';
import { ParticleRenderer } from './core/ParticleRenderer';
import { ControlPanel } from './ui/ControlPanel';
import { PresetManager } from './ui/Presets';
import type { ParticleConfig, AppMode } from './types';

class App {
  private pixiApp: PIXI.Application;
  private emitter: ParticleEmitter;
  private renderer: ParticleRenderer;
  private controlPanel: ControlPanel;
  private presetManager: PresetManager;
  private container: HTMLElement;
  private mode: AppMode = 'edit';
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 60;
  private pendingConfig: ParticleConfig | null = null;
  private isPresetSwitching: boolean = false;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.pixiApp = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x16213e,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    });

    this.container.appendChild(this.pixiApp.view as unknown as HTMLCanvasElement);

    const defaultConfig: ParticleConfig = {
      emissionRate: 50,
      speed: 200,
      lifetime: 2.0,
      size: 8,
      spreadAngle: 360,
      startColor: '#ff6600',
      endColor: '#ff0000'
    };

    this.emitter = new ParticleEmitter(defaultConfig);
    this.emitter.x = width / 2;
    this.emitter.y = height / 2;

    this.renderer = new ParticleRenderer(this.pixiApp.stage, width, height);

    this.presetManager = new PresetManager();
    this.controlPanel = new ControlPanel(this.presetManager);

    this.bindEvents();
    this.setupResize();
    this.startGameLoop();
  }

  private bindEvents(): void {
    this.controlPanel.setOnConfigChange((config) => {
      if (this.isPresetSwitching) {
        this.pendingConfig = config;
      } else {
        this.emitter.setConfig(config);
      }
    });

    this.controlPanel.setOnPresetChangeStart(() => {
      if (!this.isPresetSwitching && !this.emitter.isTransitioning()) {
        this.isPresetSwitching = true;
        this.emitter.fadeOutAndReset();
      }
    });

    this.controlPanel.setOnModeChange((mode) => {
      this.mode = mode;
      if (mode === 'play') {
        this.emitter.reset();
      }
    });

    this.container.addEventListener('mousemove', (e) => {
      if (this.mode === 'play') return;
      const rect = this.container.getBoundingClientRect();
      this.emitter.x = e.clientX - rect.left;
      this.emitter.y = e.clientY - rect.top;
    });
  }

  private setupResize(): void {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.pixiApp.renderer.resize(width, height);
        this.renderer.resize(width, height);
        
        if (this.mode === 'edit') {
          this.emitter.x = width / 2;
          this.emitter.y = height / 2;
        }
      }
    });

    resizeObserver.observe(this.container);
  }

  private startGameLoop(): void {
    this.lastFpsUpdate = performance.now();
    
    this.pixiApp.ticker.add((delta) => {
      const deltaTime = delta / 60;

      const wasTransitioning = this.emitter.isTransitioning();
      const particles = this.emitter.update(deltaTime, this.currentFps);
      const isTransitioning = this.emitter.isTransitioning();

      if (wasTransitioning && !isTransitioning && this.isPresetSwitching) {
        if (this.pendingConfig) {
          this.emitter.setConfig(this.pendingConfig);
          this.pendingConfig = null;
        }
        this.isPresetSwitching = false;
      }

      this.renderer.render(particles);

      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsUpdate >= 250) {
        this.currentFps = (this.frameCount * 1000) / (now - this.lastFpsUpdate);
        this.frameCount = 0;
        this.lastFpsUpdate = now;
        
        this.controlPanel.updateStats(
          this.emitter.getParticleCount(),
          this.currentFps
        );
      }
    });
  }

  public destroy(): void {
    this.pixiApp.destroy();
    this.renderer.destroy();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
