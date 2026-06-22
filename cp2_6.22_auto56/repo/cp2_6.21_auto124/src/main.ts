import { WeatherEngine, WeatherType } from './weatherEngine';
import { UIController } from './uiController';
import { TimeController } from './timeController';

class WeatherSimulatorApp {
  private canvas: HTMLCanvasElement;
  private weatherEngine: WeatherEngine;
  private uiController: UIController;
  private timeController: TimeController;

  private animationId: number | null = null;
  private lastTime: number = 0;
  private isPaused: boolean = false;
  private frameCount: number = 0;
  private fpsTime: number = 0;
  private currentFps: number = 0;

  constructor() {
    this.canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;
    this.timeController = new TimeController();
    this.weatherEngine = new WeatherEngine(this.canvas, this.timeController);
    this.uiController = new UIController();

    this.init();
  }

  private init(): void {
    this.weatherEngine.init();

    this.uiController.setOnWeatherChange((weather: WeatherType) => {
      this.weatherEngine.setWeather(weather);
    });

    this.uiController.setOnParamChange((key: string, value: number | string) => {
      (this.weatherEngine as any).setParam(key, value);
    });

    this.uiController.setOnTimeChange((minutes: number) => {
      this.timeController.setTime(minutes);
    });

    this.weatherEngine.setOnThunder(() => {
      this.uiController.showThunderText();
    });

    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    this.uiController.setTime(720);
    this.timeController.setTime(720);

    this.lastTime = performance.now();
    this.fpsTime = this.lastTime;
    this.startAnimation();
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.isPaused = true;
      this.stopAnimation();
    } else {
      this.isPaused = false;
      this.lastTime = performance.now();
      this.fpsTime = this.lastTime;
      this.startAnimation();
    }
  }

  private startAnimation(): void {
    if (this.animationId !== null) return;

    const animate = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - this.lastTime, 50);
      this.lastTime = currentTime;

      this.frameCount++;
      if (currentTime - this.fpsTime >= 1000) {
        this.currentFps = this.frameCount;
        this.frameCount = 0;
        this.fpsTime = currentTime;
      }

      this.update(deltaTime);
      this.render();

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  private stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private update(deltaTime: number): void {
    this.timeController.update(deltaTime);
    this.weatherEngine.update(deltaTime);
  }

  private render(): void {
    this.weatherEngine.render();
  }

  destroy(): void {
    this.stopAnimation();
    this.weatherEngine.destroy();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new WeatherSimulatorApp();
  (window as any).weatherApp = app;
});
