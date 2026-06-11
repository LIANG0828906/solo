import type { WeatherType } from './SceneManager';

interface RainParticle {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  active: boolean;
  spawnDelay: number;
}

interface FogParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  active: boolean;
  targetOpacity: number;
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private weather: WeatherType = 'sunny';
  private targetWeather: WeatherType = 'sunny';
  private transitionProgress: number = 1;
  private transitionDuration: number = 500;
  private lastTime: number = 0;

  private rainParticles: RainParticle[] = [];
  private fogParticles: FogParticle[] = [];

  private readonly maxRainParticles: number = 400;
  private readonly minRainParticles: number = 200;
  private readonly maxFogParticles: number = 300;
  private readonly minFogParticles: number = 150;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const prevWidth = this.width;
    const prevHeight = this.height;

    const dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.width / dpr;
    this.height = this.canvas.height / dpr;

    if (prevWidth > 0 && prevHeight > 0 && this.width > 0 && this.height > 0) {
      const scaleX = this.width / prevWidth;
      const scaleY = this.height / prevHeight;

      for (const p of this.rainParticles) {
        p.x *= scaleX;
        p.y *= scaleY;
        p.length *= Math.min(scaleX, scaleY);
        p.speed *= Math.min(scaleX, scaleY);
      }

      for (const p of this.fogParticles) {
        p.x *= scaleX;
        p.y *= scaleY;
        p.size *= Math.min(scaleX, scaleY);
        p.speedX *= Math.min(scaleX, scaleY);
        p.speedY *= Math.min(scaleX, scaleY);
      }
    }
  }

  setWeather(weather: WeatherType): void {
    if (weather === this.targetWeather) return;

    this.targetWeather = weather;
    this.transitionProgress = 0;

    if (weather === 'rainy') {
      this.initRainTransition(true);
    } else if (weather === 'foggy') {
      this.initFogTransition(true);
    } else if (weather === 'sunny') {
      this.initFadeOut();
    }
  }

  private initRainTransition(fromTop: boolean): void {
    const targetCount = this.minRainParticles +
      Math.floor(Math.random() * (this.maxRainParticles - this.minRainParticles));

    while (this.rainParticles.length < targetCount) {
      this.rainParticles.push({
        x: 0, y: 0, length: 0, speed: 0, opacity: 0, active: false, spawnDelay: 0
      });
    }

    for (let i = 0; i < this.rainParticles.length; i++) {
      const p = this.rainParticles[i];
      if (i < targetCount) {
        p.x = Math.random() * (this.width + 100) - 50;
        p.y = fromTop ? -Math.random() * this.height * 0.3 : Math.random() * this.height;
        p.length = 6 + Math.random() * 6;
        p.speed = 6 + Math.random() * 6;
        p.opacity = 0;
        p.active = true;
        p.spawnDelay = fromTop ? Math.random() * 500 : 0;
      } else {
        p.active = false;
      }
    }
  }

  private initFogTransition(fromEdges: boolean): void {
    const targetCount = this.minFogParticles +
      Math.floor(Math.random() * (this.maxFogParticles - this.minFogParticles));

    while (this.fogParticles.length < targetCount) {
      this.fogParticles.push({
        x: 0, y: 0, size: 0, opacity: 0, speedX: 0, speedY: 0,
        active: false, targetOpacity: 0
      });
    }

    for (let i = 0; i < this.fogParticles.length; i++) {
      const p = this.fogParticles[i];
      if (i < targetCount) {
        if (fromEdges) {
          const edge = Math.floor(Math.random() * 4);
          switch (edge) {
            case 0: p.x = -20; p.y = Math.random() * this.height; break;
            case 1: p.x = this.width + 20; p.y = Math.random() * this.height; break;
            case 2: p.x = Math.random() * this.width; p.y = -20; break;
            default: p.x = Math.random() * this.width; p.y = this.height + 20; break;
          }
        } else {
          p.x = Math.random() * this.width;
          p.y = Math.random() * this.height;
        }
        p.size = 8 + Math.random() * 12;
        p.targetOpacity = 0.05 + Math.random() * 0.15;
        p.opacity = 0;
        p.speedX = (Math.random() - 0.5) * 0.3;
        p.speedY = (Math.random() - 0.5) * 0.2;
        p.active = true;
      } else {
        p.active = false;
      }
    }
  }

  private initFadeOut(): void {
    for (const p of this.rainParticles) {
      if (p.active) {
        p.opacity = p.opacity;
      }
    }
    for (const p of this.fogParticles) {
      if (p.active) {
        p.targetOpacity = 0;
      }
    }
  }

  update(deltaTime: number): void {
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + deltaTime / this.transitionDuration);

      if (this.transitionProgress >= 1) {
        this.weather = this.targetWeather;
      }
    }

    if (this.weather === 'rainy' || this.targetWeather === 'rainy') {
      this.updateRain(deltaTime);
    }

    if (this.weather === 'foggy' || this.targetWeather === 'foggy') {
      this.updateFog(deltaTime);
    }
  }

  private updateRain(deltaTime: number): void {
    const dt = deltaTime / 16.67;

    for (const p of this.rainParticles) {
      if (!p.active) continue;

      if (p.spawnDelay > 0) {
        p.spawnDelay -= deltaTime;
        continue;
      }

      p.y += p.speed * dt;
      p.x += p.speed * 0.3 * dt;

      const fadeInProgress = this.targetWeather === 'rainy'
        ? Math.min(1, this.transitionProgress * 2)
        : 1;
      const fadeOutProgress = this.targetWeather !== 'rainy' && this.weather === 'rainy'
        ? 1 - this.transitionProgress
        : 1;

      p.opacity = 0.4 + Math.random() * 0.3;
      p.opacity *= Math.min(fadeInProgress, fadeOutProgress);

      if (p.y > this.height + 10 || p.x > this.width + 50) {
        if (this.targetWeather === 'rainy' ||
            (this.weather === 'rainy' && this.transitionProgress < 0.8)) {
          p.x = Math.random() * (this.width + 100) - 50;
          p.y = -10 - Math.random() * 50;
          p.length = 6 + Math.random() * 6;
          p.speed = 6 + Math.random() * 6;
        } else {
          p.active = false;
        }
      }
    }
  }

  private updateFog(deltaTime: number): void {
    const dt = deltaTime / 16.67;

    for (const p of this.fogParticles) {
      if (!p.active) continue;

      p.x += p.speedX * dt;
      p.y += p.speedY * dt;
      p.size += 0.02 * dt;

      const targetOpacity = this.targetWeather === 'foggy'
        ? p.targetOpacity
        : 0;
      const fadeSpeed = 0.02;

      if (p.opacity < targetOpacity) {
        p.opacity = Math.min(targetOpacity, p.opacity + fadeSpeed * dt);
      } else if (p.opacity > targetOpacity) {
        p.opacity = Math.max(0, p.opacity - fadeSpeed * dt);
      }

      if (p.x < -50) p.x = this.width + 50;
      if (p.x > this.width + 50) p.x = -50;
      if (p.y < -50) p.y = this.height + 50;
      if (p.y > this.height + 50) p.y = -50;

      if (p.opacity <= 0 && this.targetWeather !== 'foggy') {
        p.active = false;
      }
    }
  }

  draw(): void {
    const ctx = this.ctx;

    if (this.weather === 'rainy' || (this.targetWeather === 'rainy' && this.transitionProgress < 1)) {
      this.drawRain(ctx);
    }

    if (this.weather === 'foggy' || (this.targetWeather === 'foggy' && this.transitionProgress < 1)) {
      this.drawFog(ctx);
    }
  }

  private drawRain(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#6ca6cd';
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';

    for (const p of this.rainParticles) {
      if (!p.active || p.opacity <= 0 || p.spawnDelay > 0) continue;

      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.moveTo(Math.floor(p.x), Math.floor(p.y));
      ctx.lineTo(Math.floor(p.x + p.length * 0.3), Math.floor(p.y + p.length));
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private drawFog(ctx: CanvasRenderingContext2D): void {
    for (const p of this.fogParticles) {
      if (!p.active || p.opacity <= 0) continue;

      const gradient = ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, p.size
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  getWeather(): WeatherType {
    return this.weather;
  }
}
