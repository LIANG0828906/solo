import { v4 as uuidv4 } from 'uuid';
import type { CanvasSize, CityConfig, Particle, ParticleParams } from './types';
import { WeatherType } from './types';

interface TransitionState {
  fromConfig: CityConfig;
  toConfig: CityConfig;
  startTime: number;
  duration: number;
  active: boolean;
  phase: 'fade-out' | 'fade-in' | 'crossfade';
  fadeProgress: number;
  fromParticles: Particle[];
  toParticles: Particle[];
}

interface FpsTracker {
  frameCount: number;
  lastFpsUpdate: number;
  currentFps: number;
}

export class WeatherEngine {
  private particles: Particle[] = [];
  private mistParticles: Particle[] = [];
  private highlightParticles: Particle[] = [];
  private canvasSize: CanvasSize = { width: 800, height: 600, dpr: 1 };
  private currentConfig: CityConfig;
  private transition: TransitionState | null = null;
  private fpsTracker: FpsTracker = { frameCount: 0, lastFpsUpdate: 0, currentFps: 60 };
  private globalTime = 0;
  private mistSpawnTimer = 0;
  private snowAccumulation = 0;
  private lightningTimer = 0;
  private nextLightningInterval = 3000 + Math.random() * 2000;
  private lightningFlash = 0;
  private lightningRemaining = 0;
  private isMobileReduction = false;

  constructor(initialConfig: CityConfig) {
    this.currentConfig = initialConfig;
  }

  setCanvasSize(size: CanvasSize): void {
    this.canvasSize = size;
  }

  setMobileReduction(isMobile: boolean): void {
    if (this.isMobileReduction !== isMobile) {
      this.isMobileReduction = isMobile;
      const targetCount = this.getEffectiveCount(this.currentConfig.particleParams.count);
      if (this.particles.length > targetCount) {
        this.particles = this.particles.slice(0, targetCount);
      } else if (this.particles.length < targetCount) {
        const need = targetCount - this.particles.length;
        for (let i = 0; i < need; i++) {
          this.particles.push(this.createParticle(this.currentConfig, true));
        }
      }
    }
  }

  setInitialConfig(config: CityConfig): void {
    this.currentConfig = config;
    const targetCount = this.getEffectiveCount(config.particleParams.count);
    this.particles = [];
    for (let i = 0; i < targetCount; i++) {
      const p = this.createParticle(config, true);
      p.opacity = this.randomRange(config.particleParams.opacityRange[0], config.particleParams.opacityRange[1]);
      this.particles.push(p);
    }
  }

  transitionTo(targetConfig: CityConfig, duration = 1500): void {
    const fadeDuration = 500;
    const fromCount = this.particles.filter((p) => p.active).length;
    const toCount = this.getEffectiveCount(targetConfig.particleParams.count);

    const fromParticles = this.particles.map((p) => ({ ...p }));

    const toParticles: Particle[] = [];
    const maxToCount = Math.max(fromCount, toCount);
    for (let i = 0; i < maxToCount; i++) {
      if (i < toCount) {
        const p = this.createParticle(targetConfig, true);
        p.opacity = 0;
        toParticles.push(p);
      }
    }

    this.transition = {
      fromConfig: this.currentConfig,
      toConfig: targetConfig,
      startTime: this.globalTime,
      duration: fadeDuration,
      active: true,
      phase: 'crossfade',
      fadeProgress: 0,
      fromParticles,
      toParticles,
    };

    this.currentConfig = targetConfig;

    const maxCount = Math.max(fromCount, toCount);
    if (this.particles.length < maxCount) {
      const need = maxCount - this.particles.length;
      for (let i = 0; i < need; i++) {
        const p = this.createParticle(targetConfig, true);
        p.opacity = 0;
        this.particles.push(p);
      }
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i] as Particle & {
        _targetVx?: number;
        _targetVy?: number;
        _targetSize?: number;
        _targetSizeY?: number;
        _targetColor?: string;
        _targetOpacity?: number;
        _startOpacity?: number;
      };
      if (i < toCount) {
        p.active = true;
        const targetP = toParticles[i] ?? this.createParticle(targetConfig, true);
        p._targetVx = targetP.vx;
        p._targetVy = targetP.vy;
        p._targetSize = targetP.size;
        p._targetSizeY = targetP.sizeY;
        p._targetColor = targetP.color;
        p._targetOpacity = targetP.opacity;
        p._startOpacity = p.opacity;
        p.shape = targetP.shape;
      } else {
        p.active = false;
      }
    }

    void duration;
  }

  update(deltaTimeMs: number): void {
    const dt = deltaTimeMs / 16.6667;
    this.globalTime += deltaTimeMs;
    this.updateFps(deltaTimeMs);

    let fadeT = 1;
    let isTransitioning = false;
    if (this.transition?.active) {
      isTransitioning = true;
      const elapsed = this.globalTime - this.transition.startTime;
      fadeT = Math.min(1, elapsed / this.transition.duration);
      this.transition.fadeProgress = fadeT;
      if (fadeT >= 1) {
        this.transition.active = false;
        this.transition = null;
        fadeT = 1;
        for (const p of this.particles) {
          if (p.active) {
            p.opacity = this.randomRange(
              this.currentConfig.particleParams.opacityRange[0],
              this.currentConfig.particleParams.opacityRange[1],
            );
          }
        }
      }
    }

    const config = this.currentConfig;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      this.updateParticle(p, dt, config, fadeT, isTransitioning, i);
      this.wrapParticle(p);
    }

    if (config.weatherType === WeatherType.Rainy) {
      this.updateMist(dt, deltaTimeMs, isTransitioning, fadeT);
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
      if (hp.life !== undefined && hp.maxLife !== undefined) {
        hp.opacity = (hp.life / hp.maxLife) * 0.95;
      }
      if ((hp.life ?? 0) <= 0 || hp.y > this.canvasSize.height + 20) {
        hp.active = false;
      }
    }
    this.highlightParticles = this.highlightParticles.filter((p) => p.active);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.canvasSize;
    const config = this.currentConfig;

    const bg = this.interpolateBackground(config);
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
    return Math.round(this.fpsTracker.currentFps);
  }

  getMemoryMB(): number | null {
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } };
    if (perf.memory && perf.memory.usedJSHeapSize !== undefined) {
      return perf.memory.usedJSHeapSize / (1024 * 1024);
    }
    return null;
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

  private updateParticle(
    p: Particle,
    dt: number,
    config: CityConfig,
    fadeT: number,
    isTransitioning: boolean,
    index: number,
  ): void {
    const params = config.particleParams;

    const extra = p as Particle & {
      _targetVx?: number;
      _targetVy?: number;
      _targetSize?: number;
      _targetSizeY?: number;
      _targetColor?: string;
      _targetOpacity?: number;
      _startOpacity?: number;
    };

    if (isTransitioning && extra._targetVx !== undefined && extra._targetVy !== undefined) {
      p.vx = this.lerp(p.vx, extra._targetVx, fadeT);
      p.vy = this.lerp(p.vy, extra._targetVy, fadeT);
    }

    if (isTransitioning && extra._targetSize !== undefined) {
      p.size = this.lerp(p.size, extra._targetSize, fadeT);
      if (extra._targetSizeY !== undefined && p.sizeY !== undefined) {
        p.sizeY = this.lerp(p.sizeY, extra._targetSizeY, fadeT);
      }
    }

    if (isTransitioning && extra._targetColor) {
      p.color = this.lerpColor(p.color, extra._targetColor, fadeT);
    }

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
          const blinkOpacity = baseOpacity + Math.sin(blinkPhase) * 0.2;
          const clampedBlink = Math.max(
            params.opacityRange[0],
            Math.min(params.opacityRange[1], blinkOpacity),
          );
          if (isTransitioning && extra._startOpacity !== undefined) {
            const targetOpacity = this.lerp(extra._startOpacity, clampedBlink, fadeT);
            p.opacity = targetOpacity;
          } else {
            p.opacity = clampedBlink;
          }
        } else if (isTransitioning && extra._startOpacity !== undefined) {
          const targetOpacity = this.lerp(
            extra._startOpacity,
            this.lerp(params.opacityRange[0], params.opacityRange[1], 0.5),
            fadeT,
          );
          p.opacity = targetOpacity;
        }
        break;
      }
      case WeatherType.Rainy: {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (isTransitioning && extra._startOpacity !== undefined) {
          p.opacity = this.lerp(
            extra._startOpacity,
            this.lerp(params.opacityRange[0], params.opacityRange[1], 0.7),
            fadeT,
          );
        }
        break;
      }
      case WeatherType.Snowy: {
        const swayPhase = (this.globalTime / 1000) * ((2 * Math.PI) / 1.5) + (p.phase ?? 0);
        const swayAmount = Math.sin(swayPhase) * 5;
        p.x += (p.vx + swayAmount * 0.1) * dt;
        p.y += p.vy * dt;
        p.rotation = (p.rotation ?? 0) + (p.rotationSpeed ?? 0) * dt;
        if (isTransitioning && extra._startOpacity !== undefined) {
          p.opacity = this.lerp(
            extra._startOpacity,
            this.lerp(params.opacityRange[0], params.opacityRange[1], 0.8),
            fadeT,
          );
        }
        break;
      }
      case WeatherType.Thunderstorm: {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation = (p.rotation ?? 0) + (p.rotationSpeed ?? 0) * dt;
        if (isTransitioning && extra._startOpacity !== undefined) {
          p.opacity = this.lerp(
            extra._startOpacity,
            this.lerp(params.opacityRange[0], params.opacityRange[1], 0.8),
            fadeT,
          );
        }
        break;
      }
    }

    void index;
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

  private updateMist(dt: number, deltaTimeMs: number, isTransitioning: boolean, fadeT: number): void {
    void dt;
    this.mistSpawnTimer += deltaTimeMs;
    const spawnInterval = 50;
    const spawnRate = isTransitioning ? fadeT : 1;
    while (this.mistSpawnTimer >= spawnInterval) {
      this.mistSpawnTimer -= spawnInterval;
      if (Math.random() < spawnRate) {
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
      const baseOpacity = 0.15 * (isTransitioning ? fadeT : 1);
      if (lifeRatio < 0.3) {
        mp.opacity = baseOpacity * (lifeRatio / 0.3);
      } else if (lifeRatio > 0.7) {
        mp.opacity = baseOpacity * ((1 - lifeRatio) / 0.3);
      } else {
        mp.opacity = baseOpacity;
      }
      if ((mp.life ?? 0) <= 0) {
        mp.active = false;
      }
    }
    this.mistParticles = this.mistParticles.filter((p) => p.active);
  }

  private updateLightning(deltaTimeMs: number): void {
    this.lightningTimer += deltaTimeMs;

    if (this.lightningRemaining > 0) {
      this.lightningRemaining -= deltaTimeMs;
      if (this.lightningRemaining <= 0) {
        this.lightningFlash = 0;
        this.lightningRemaining = 0;
      } else {
        const progress = 1 - this.lightningRemaining / 100;
        this.lightningFlash = 1 - progress * 0.5;
      }
    }

    if (this.lightningTimer >= this.nextLightningInterval) {
      this.lightningTimer = 0;
      this.nextLightningInterval = 3000 + Math.random() * 2000;
      this.lightningFlash = 1;
      this.lightningRemaining = 100;

      const centerX = this.canvasSize.width * (0.3 + Math.random() * 0.4);
      const centerY = this.canvasSize.height * 0.1;

      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        const hp: Particle = {
          id: uuidv4(),
          x: centerX + (Math.random() - 0.5) * 40,
          y: centerY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed * 0.5,
          vy: Math.abs(Math.sin(angle)) * speed + 4,
          size: 3 + Math.random() * 4,
          color: '#FFD700',
          opacity: 0.95,
          shape: 'circle',
          active: true,
          life: 600 + Math.random() * 400,
          maxLife: 1000,
          isHighlight: true,
        };
        this.highlightParticles.push(hp);
      }
    }
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
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
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.3, `rgba(255, 255, 255, ${this.snowAccumulation * 0.5})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${this.snowAccumulation})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - groundHeight, width, groundHeight);
  }

  private interpolateBackground(toConfig: CityConfig): string {
    if (!this.transition?.active) return toConfig.themeColors.background;
    const t = Math.min(1, (this.globalTime - this.transition.startTime) / this.transition.duration);
    const fromColor = this.transition.fromConfig.themeColors.background;
    const toColor = toConfig.themeColors.background;
    return this.lerpColor(fromColor, toColor, this.easeInOut(t));
  }

  private updateFps(deltaTimeMs: number): void {
    this.fpsTracker.frameCount++;
    if (this.globalTime - this.fpsTracker.lastFpsUpdate >= 500) {
      const elapsed = this.globalTime - this.fpsTracker.lastFpsUpdate;
      this.fpsTracker.currentFps = (this.fpsTracker.frameCount / elapsed) * 1000;
      this.fpsTracker.frameCount = 0;
      this.fpsTracker.lastFpsUpdate = this.globalTime;
    }
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
