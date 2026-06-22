import { Subject, Observable, Subscription } from 'rxjs';
import { Particle, ThemeType, ParticleParams, TextConfig } from './types';
import { ParticleEngine } from './ParticleEngine';
import { ParticleRenderer } from './ParticleRenderer';

export type AnimationEvent = 
  | { type: 'frame'; particles: Particle[]; progress: number }
  | { type: 'complete' }
  | { type: 'reset' }
  | { type: 'state'; isPlaying: boolean; isPaused: boolean; progress: number; remainingTime: number };

export interface ControllerConfig {
  textConfig: TextConfig;
  theme: ThemeType;
  particleParams: ParticleParams;
  dissipateDuration: number;
}

export class AnimationController {
  private engine: ParticleEngine;
  private renderer: ParticleRenderer;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private elapsedTime = 0;
  private dissipateDuration = 2;
  private isPlaying = false;
  private isPaused = false;
  private speedMultiplier = 1;
  private autoResetTimeout: number | null = null;

  private eventSubject = new Subject<AnimationEvent>();
  private particles: Particle[] = [];

  private subscriptions: Subscription[] = [];

  private canvasWidth = 800;
  private canvasHeight = 600;

  constructor(engine: ParticleEngine, renderer: ParticleRenderer) {
    this.engine = engine;
    this.renderer = renderer;
  }

  get events(): Observable<AnimationEvent> {
    return this.eventSubject.asObservable();
  }

  init(config: ControllerConfig, canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.dissipateDuration = config.particleParams.dissipateSpeed;
    this.speedMultiplier = 1;

    this.particles = this.engine.init({
      text: config.textConfig.text,
      textConfig: config.textConfig,
      theme: config.theme,
      params: config.particleParams,
      canvasWidth,
      canvasHeight
    });

    this.renderer.setTheme(config.theme);
    this.render();
    this.emitState();
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.renderer.resize(width, height);
  }

  play(): void {
    if (this.isPlaying && !this.isPaused) return;

    if (this.autoResetTimeout) {
      clearTimeout(this.autoResetTimeout);
      this.autoResetTimeout = null;
    }

    if (!this.isPlaying) {
      this.elapsedTime = 0;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    this.startAnimationLoop();
    this.emitState();
  }

  pause(): void {
    if (!this.isPlaying) return;
    this.isPaused = true;
    this.stopAnimationLoop();
    this.emitState();
  }

  resume(): void {
    if (!this.isPlaying || !this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.startAnimationLoop();
    this.emitState();
  }

  togglePlay(): void {
    if (!this.isPlaying) {
      this.play();
    } else if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  reset(): void {
    this.stopAnimationLoop();
    
    if (this.autoResetTimeout) {
      clearTimeout(this.autoResetTimeout);
      this.autoResetTimeout = null;
    }

    this.isPlaying = false;
    this.isPaused = false;
    this.elapsedTime = 0;

    this.engine.resetPositions();
    this.particles = this.engine.getParticles();
    this.render();

    this.eventSubject.next({ type: 'reset' });
    this.emitState();
  }

  regenerate(config: ControllerConfig): void {
    this.stopAnimationLoop();
    
    if (this.autoResetTimeout) {
      clearTimeout(this.autoResetTimeout);
      this.autoResetTimeout = null;
    }

    this.dissipateDuration = config.particleParams.dissipateSpeed;
    this.isPlaying = false;
    this.isPaused = false;
    this.elapsedTime = 0;

    this.engine.updateParams(config.particleParams);
    this.engine.updateTheme(config.theme);
    
    this.particles = this.engine.init({
      text: config.textConfig.text,
      textConfig: config.textConfig,
      theme: config.theme,
      params: config.particleParams,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight
    });

    this.renderer.setTheme(config.theme);
    this.render();
    this.emitState();
  }

  updateParams(params: ParticleParams): void {
    this.engine.updateParams(params);
    this.dissipateDuration = params.dissipateSpeed;
  }

  updateTheme(theme: ThemeType): void {
    this.engine.updateTheme(theme);
    this.renderer.setTheme(theme);
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.5, Math.min(3, multiplier));
  }

  getProgress(): number {
    return Math.min(this.elapsedTime / this.dissipateDuration, 1);
  }

  getRemainingTime(): number {
    return Math.max(0, this.dissipateDuration - this.elapsedTime);
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getCanvasDimensions(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  captureFrame(): string {
    return this.renderer.captureFrameDataURL();
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) return;
    
    const loop = (time: number) => {
      this.animationFrameId = requestAnimationFrame(loop);
      
      const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      if (!this.isPaused) {
        this.elapsedTime += deltaTime * this.speedMultiplier;
        
        const progress = this.getProgress();
        
        this.particles = this.engine.update({
          deltaTime,
          progress,
          speedMultiplier: this.speedMultiplier
        });

        this.render();

        this.eventSubject.next({
          type: 'frame',
          particles: this.particles,
          progress
        });

        this.emitState();

        if (progress >= 1) {
          this.onComplete();
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private onComplete(): void {
    this.stopAnimationLoop();
    this.isPlaying = false;
    this.isPaused = false;
    this.elapsedTime = this.dissipateDuration;

    this.eventSubject.next({ type: 'complete' });
    this.emitState();

    this.autoResetTimeout = window.setTimeout(() => {
      this.reset();
    }, 1500);
  }

  private render(): void {
    const progress = this.getProgress();
    this.renderer.render(
      this.particles,
      progress,
      this.canvasWidth,
      this.canvasHeight
    );
  }

  private emitState(): void {
    this.eventSubject.next({
      type: 'state',
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      progress: this.getProgress(),
      remainingTime: this.getRemainingTime()
    });
  }

  destroy(): void {
    this.stopAnimationLoop();
    
    if (this.autoResetTimeout) {
      clearTimeout(this.autoResetTimeout);
    }

    this.subscriptions.forEach(s => s.unsubscribe());
    this.eventSubject.complete();
    this.renderer.destroy();
  }
}
