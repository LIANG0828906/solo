import { v4 as uuidv4 } from 'uuid';
import type { CanvasSize, CityConfig, Particle, ParticleParams } from './types';
import { WeatherType } from './types';

interface TransitionState {
  fromConfig: CityConfig;
  toConfig: CityConfig;
  startTime: number;
  duration: number;
  active: boolean;
  fromCount: number;
  toCount: number;
}

interface FpsTracker {
  frames: number[];
  lastTime: number;
}

export class WeatherEngine {
  private particles: Particle[] = [];
  private mistParticles: Particle[] = [];
  private highlightParticles: Particle[] = [];
  private canvasSize: CanvasSize = { width: 800, height: 600, dpr: 1 };
  private currentConfig: CityConfig;
  private transition: TransitionState | null = null;
  private fpsTracker: FpsTracker = { frames: [], lastTime: performance.now() };
  private currentFps = 60;
  private globalTime = 0;
  private mistSpawnTimer = 0;
  private snowAccumulation = 0;
  private lightningTimer = 0;
  private nextLightningInterval = 3000 + Math.random() * 2000;
  private lightningFlash = 0;
  private isMobileReduction = false;

  constructor(initialConfig: CityConfig) {
    this.currentConfig = initialConfig;
  }

  setCanvasSize(size: CanvasSize): void {
    this.canvasSize = size;
  }

  setMobileReduction(isMobile: boolean): void {
    this.isMobileReduction = isMobile;
  }

  setInitialConfig(config: CityConfig): void {
    this.currentConfig = config;
    const targetCount = this.getEffectiveCount(config.particleParams.count);
    this.particles = [];
    for (let i = 0; i < targetCount; i++) {
      this.particles.push(this.createParticle(config, true));
    }
  }

  transitionTo(targetConfig: CityConfig, duration = 1500): void {
    const fromConfig = this.currentConfig;
    const fromCount = this.particles.filter((p) => p.active).length;
    const toCount = this.getEffectiveCount(targetConfig.particleParams.count);

    this.transition = {
      fromConfig,
      toConfig: targetConfig,
      startTime: this.globalTime,
      duration,
      active: true,
      fromCount,
      toCount,
    };

    if (toCount > this.particles.length) {
      const need = toCount - this.particles.length;
      for (let i = 0; i < need; i++) {
        this.particles.push(this.createParticle(fromConfig, true));
      }
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (i < toCount) {
        p.active = true;
        (p as Particle & { _targetSize?: number })._targetSize = this.randomRange(
          targetConfig.particleParams.minSize,
          targetConfig.particleParams.maxSize,
        );
      } else {
        p.active = false;
      }
    }

    this.currentConfig = targetConfig;
  }

  update(deltaTimeMs: number): void {
    const dt = deltaTimeMs / 16.6667;
    this.globalTime += deltaTimeMs;
    this.updateFps(deltaTimeMs);

    const t = this.transition?.active
      ? this.easeInOut(Math.min(1, (this.globalTime - this.transition.startTime) / this.transition.duration))
      : 1;
    if (this.transition && t >= 1) {
      this.transition.active = false;
      this.transition = null;
    }

    const config = this.currentConfig;

    for (const p of this.particles) {
      if (!p.active) continue;
      this.updateParticle(p, dt, config, t);
      this.wrapParticle(p);
    }

    if (config.weatherType === WeatherType.Rainy) {
      this.updateMist(dt, deltaTimeMs);
    } else {
      this.mistParticles = [];
    }

    if (config.weatherType === WeatherType.Snowy) {
      this.snowAccumulation = Math.min(0.3, this.snowAccumulation + deltaTimeMs * 0.00002);
    } else {
      this.snowAccumulation = Math.max(0, this.snowAccumulation - deltaTimeMs * 0.0005);
    }

    if (config.weatherType === WeatherType.Thunderstorm) {
      this.updateLightning(deltaTimeMs);
    } else {
      this.lightningFlash = 0;
      this.highlightParticles = [];
    }

    for (const hp of this.highlightParticles) {
      if (!hp.active) continue;
      hp.x += hp.vx * dt;
      hp.y += hp.vy * dt;
      hp.life = (hp.life ?? 0) - deltaTimeMs;
      if (hp.life <= 0 || hp.y > this.canvasSize.height + 20) {
        hp.active = false;
      }
    }
    this.highlightParticles = this.highlightParticles.filter((p) => p.active);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.canvasSize;
    const config = this.currentConfig;

    const bg = this.interpolateBackground(ctx, config);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    if (config.weatherType === WeatherType.Sunny) {
      this.drawSunGlow(ctx);
    }

    for (const p of this.particles) {
      if (!p.active) continue;
      this.drawParticle(ctx, p);
    }

    if (config.weatherType === WeatherType.Rainy) {
      for (const mp of this.mistParticles) {
        this.drawParticle(ctx, mp);
      }
    }

    if (config.weatherType === WeatherType.Snowy && this.snowAccumulation > 0) {
      this.drawSnowGround(ctx);
    }

    for (const hp of this.highlightParticles) {
      this.drawParticle(ctx, hp);
    }

    if (this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.7})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  getParticleCount(): number {
    return (
      this.particles.filter((p) => p.active).length +
      this.mistParticles.filter((p) => p.active).length +
      this.highlightParticles.filter((p) => p.active).length
    );
  }

  getFps(): number {
    return Math.round(this.currentFps);
  }

  getCurrentWeatherType(): WeatherType {
    return this.currentConfig.weatherType;
  }

  private getEffectiveCount(baseCount: number): number {
    return this.isMobileReduction ? Math.floor(baseCount / 2) : baseCount;
  }

  private createParticle(config: CityConfig, randomY = false): Particle {
    const params = config.particleParams;
    const { width, height } = this.canvasSize;
    const size = this.randomRange(params.minSize, params.maxSize);
    const sizeY =
      params.minSizeY !== undefined && params.maxSizeY !== undefined
        ? this.randomRange(params.minSizeY, params.maxSizeY)
        : undefined;
    const speed = this.randomRange(params.minSpeed, params.maxSpeed);

    let vx = 0;
    let vy = 0;
    if (params.angleDeg !== undefined) {
      const variance = params.angleVarianceDeg ?? 0;
      const angleDeg = params.angleDeg + this.randomRange(-variance, variance);
      const angleRad = (angleDeg * Math.PI) / 180;
      vx = Math.cos(angleRad) * speed;
      vy = Math.sin(angleRad) * speed;
    } else {
      const randomAngle = Math.random() * Math.PI * 2;
      vx = Math.cos(randomAngle) * speed;
      vy = Math.sin(randomAngle) * speed;
    }

    const phase = Math.random() * Math.PI * 2;

    return {
      id: uuidv4(),
      x: Math.random() * width,
      y: randomY ? Math.random() * height : -10,
      vx,
      vy,
      size,
      sizeY,
      color: params.colors[Math.floor(Math.random() * params.colors.length)],
      opacity: this.randomRange(params.opacityRange[0], params.opacityRange[1]),
      shape: params.shape,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      phase,
      life: undefined,
      maxLife: undefined,
      active: true,
      blinkOffset: Math.random() * Math.PI * 2,
      blinkSpeed: 0.5 + Math.random() * 1.5,
    };
  }

  private updateParticle(p: Particle, dt: number, config: CityConfig, t: number): void {
    const params = config.particleParams;
    const { width, height } = this.canvasSize;

    switch (config.weatherType) {
      case WeatherType.Sunny: {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (Math.random() < 0.01) {
          const angle = Math.random() * Math.PI * 2;
          const speed = this.randomRange(params.minSpeed, params.maxSpeed);
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
        }
        if (params.blinkEnabled) {
          const blinkPhase = (this.globalTime / 1000) * p.blinkSpeed! + p.blinkOffset!;
          const baseOpacity = this.lerp(params.opacityRange[0], params.opacityRange[1], 0.5);
          p.opacity = baseOpacity + Math.sin(blinkPhase) * 0.2;
          p.opacity = Math.max(params.opacityRange[0], Math.min(params.opacityRange[1], p.opacity));
        }
        break;
      }
      case WeatherType.Rainy: {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        break;
      }
      case WeatherType.Snowy: {
        const swayPhase = (this.globalTime / 1000) * (2 * Math.PI / 1.5) + p.phase!;
        const swayAmount = Math.sin(swayPhase) * 5;
        const baseVx = p.vx;
        p.x += (baseVx + swayAmount * 0.1) * dt;
        p.y += p.vy * dt;
        p.rotation = (p.rotation ?? 0) + (p.rotationSpeed ?? 0) * dt;
        break;
      }
      case WeatherType.Thunderstorm: {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation = (p.rotation ?? 0) + (p.rotationSpeed ?? 0) * dt;
        break;
      }
    }

    if (this.transition) {
      const toParams = this.transition.toConfig.particleParams;
      const targetSize = this.lerp(
        this.transition.fromConfig.particleParams.minSize,
        toParams.minSize,
        t,
      ) + ((p as Particle & { _targetSize?: number })._targetSize ?? p.size) * 0.0001;
      p.size = this.lerp(p.size, this.lerp(p.size, targetSize, 1), t * 0.05);

      const toColor = toParams.colors[Math.floor(toParams.colors.length * (parseInt(p.id.slice(0, 8), 16) / 0xffffffff))];
      p.color = this.lerpColor(p.color, toColor, Math.min(1, t));
    }

    void width;
    void height;
  }

  private wrapParticle(p: Particle): void {
    const { width, height } = this.canvasSize;
    const margin = 20;

    if (p.y > height + margin) {
      p.y = -margin;
      p.x = Math.random() * width;
    } else if (p.y < -margin * 2) {
      p.y = height + margin;
      p.x = Math.random() * width;
    }
    if (p.x > width + margin) {
      p.x = -margin;
    } else if (p.x < -margin) {
      p.x = width + margin;
    }
  }

  private updateMist(dt: number, deltaTimeMs: number): void {
    void dt;
    this.mistSpawnTimer += deltaTimeMs;
    const spawnInterval = 50;
    while (this.mistSpawnTimer >= spawnInterval) {
      this.mistSpawnTimer -= spawnInterval;
      const count = 1;
      for (let i = 0; i < count; i++) {
        const mp: Particle = {
          id: uuidv4(),
          x: Math.random() * this.canvasSize.width,
          y: this.canvasSize.height * (0.85 + Math.random() * 0.1),
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 0.3,
          size: 15 + Math.random() * 25,
          color: '#B0C4DE',
          opacity: 0,
          shape: 'circle',
          active: true,
          life: 500,
          maxLife: 500,
        };
        this.mistParticles.push(mp);
      }
    }

    for (const mp of this.mistParticles) {
      mp.x += mp.vx;
      mp.y += mp.vy;
      mp.life = (mp.life ?? 0) - deltaTimeMs;
      const lifeRatio = 1 - (mp.life ?? 0) / (mp.maxLife ?? 500);
      if (lifeRatio < 0.3) {
        mp.opacity = 0.15 * (lifeRatio / 0.3);
      } else if (lifeRatio > 0.7) {
        mp.opacity = 0.15 * ((1 - lifeRatio) / 0.3);
      } else {
        mp.opacity = 0.15;
      }
      if ((mp.life ?? 0) <= 0) {
        mp.active = false;
      }
    }
    this.mistParticles = this.mistParticles.filter((p) => p.active);
  }

  private updateLightning(deltaTimeMs: number): void {
    this.lightningTimer += deltaTimeMs;
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - deltaTimeMs / 100);
    }
    if (this.lightningTimer >= this.nextLightningInterval) {
      this.lightningTimer = 0;
      this.nextLightningInterval = 3000 + Math.random() * 2000;
      this.lightningFlash = 1;
      for (let i = 0; i < 30; i++) {
        const hp: Particle = {
          id: uuidv4(),
          x: Math.random() * this.canvasSize.width,
          y: -10,
          vx: (Math.random() - 0.5) * 3,
          vy: 10 + Math.random() * 6,
          size: 5,
          color: '#FFD700',
          opacity: 0.95,
          shape: 'circle',
          active: true,
          life: 800,
          maxLife: 800,
          isHighlight: true,
        };
        this.highlightParticles.push(hp);
      }
    }
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;

    if (p.rotation !== undefined) {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.translate(-p.x, -p.y);
    }

    switch (p.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.sizeY ?? p.size * 3, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'rectangle':
        ctx.fillRect(p.x - p.size / 2, p.y - (p.sizeY ?? p.size) / 2, p.size, p.sizeY ?? p.size);
        break;
      case 'hexagon':
        this.drawHexagon(ctx, p.x, p.y, p.size);
        break;
    }
    ctx.restore();
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  private drawSunGlow(ctx: CanvasRenderingContext2D): void {
    const { width } = this.canvasSize;
    const cx = width * 0.8;
    const cy = 80;
    const r = 100;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSnowGround(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.canvasSize;
    const groundHeight = height * 0.08;
    const gradient = ctx.createLinearGradient(0, height - groundHeight, 0, height);
    gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
    gradient.addColorStop(0.3, `rgba(255, 255, 255, ${this.snowAccumulation * 0.5})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${this.snowAccumulation})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - groundHeight, width, groundHeight);
  }

  private interpolateBackground(ctx: CanvasRenderingContext2D, toConfig: CityConfig): string {
    if (!this.transition) return toConfig.themeColors.background;
    const t = this.easeInOut(
      Math.min(1, (this.globalTime - this.transition.startTime) / this.transition.duration),
    );
    const fromColor = this.transition.fromConfig.themeColors.background;
    const toColor = toConfig.themeColors.background;
    void ctx;
    return this.lerpColor(fromColor, toColor, t);
  }

  private updateFps(deltaTimeMs: number): void {
    const now = this.globalTime;
    if (deltaTimeMs > 0) {
      const instantFps = 1000 / deltaTimeMs;
      this.fpsTracker.frames.push(instantFps);
      if (this.fpsTracker.frames.length > 10) {
        this.fpsTracker.frames.shift();
      }
      const sum = this.fpsTracker.frames.reduce((a, b) => a + b, 0);
      this.currentFps = sum / this.fpsTracker.frames.length;
    }
    void now;
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(full.substring(0, 2), 16);
    const g = parseInt(full.substring(2, 4), 16);
    const b = parseInt(full.substring(4, 6), 16);
    return { r, g, b };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private lerpColor(a: string, b: string, t: number): string {
    try {
      const ca = this.hexToRgb(a);
      const cb = this.hexToRgb(b);
      return this.rgbToHex(this.lerp(ca.r, cb.r, t), this.lerp(ca.g, cb.g, t), this.lerp(ca.b, cb.b, t));
    } catch {
      return b;
    }
  }
}
