import { SceneManager } from './SceneManager';
import { ParticleSystem } from './ParticleSystem';
import { UIController } from './UIController';
import type { WeatherType } from './SceneManager';

class App {
  private canvas: HTMLCanvasElement;
  private sceneManager: SceneManager;
  private particleSystem: ParticleSystem;
  private uiController: UIController;
  private animationId: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsTime: number = 0;

  constructor() {
    const canvas = document.getElementById('scene-canvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvas;

    this.sceneManager = new SceneManager(this.canvas);
    this.particleSystem = new ParticleSystem(this.canvas);

    this.uiController = new UIController({
      onTimeChange: this.handleTimeChange.bind(this),
      onWeatherChange: this.handleWeatherChange.bind(this)
    });

    this.initWeather();
  }

  private initWeather(): void {
    const initialWeather: WeatherType = 'sunny';
    this.sceneManager.setWeather(initialWeather);
    this.particleSystem.setWeather(initialWeather);
  }

  start(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();
    this.lastTime = performance.now();
    this.fpsTime = this.lastTime;
    this.animate();
  }

  private animate(): void {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.frameCount++;
    if (now - this.fpsTime >= 1000) {
      this.frameCount = 0;
      this.fpsTime = now;
    }

    this.sceneManager.update(deltaTime);
    this.particleSystem.update(deltaTime);

    this.sceneManager.draw();
    this.particleSystem.draw();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private handleTimeChange(hour: number): void {
    this.sceneManager.setHour(hour);
  }

  private handleWeatherChange(weather: WeatherType): void {
    this.sceneManager.setWeather(weather);
    this.sceneManager.startWeatherTransition();
    this.particleSystem.setWeather(weather);
  }

  private handleResize(): void {
    this.sceneManager.resize();
    this.particleSystem.resize();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new App();
    app.start();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});
