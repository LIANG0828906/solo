import { Particle, ThemeType, ParticleParams, TextConfig } from './types';
import { THEMES } from './themes';
import { Point, textToPathPoints } from './TextToPath';

interface InitOptions {
  text: string;
  textConfig: TextConfig;
  theme: ThemeType;
  params: ParticleParams;
  canvasWidth: number;
  canvasHeight: number;
}

interface UpdateOptions {
  deltaTime: number;
  progress: number;
  speedMultiplier: number;
}

export class ParticleEngine {
  private particles: Particle[] = [];
  private points: Point[] = [];
  private canvasWidth = 0;
  private canvasHeight = 0;
  private theme: ThemeType = 'fire';
  private params: ParticleParams = { particleSize: 4, dissipateSpeed: 2, directionRandomness: 50 };

  init(options: InitOptions): Particle[] {
    const { text, textConfig, theme, params, canvasWidth, canvasHeight } = options;
    this.theme = theme;
    this.params = params;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    const result = textToPathPoints(text, textConfig, canvasWidth, canvasHeight);
    this.points = result.points;

    this.particles = this.points.map((point, index) => this.createParticle(index, point));
    return this.particles;
  }

  private createParticle(id: number, point: Point): Particle {
    const themeConfig = THEMES[this.theme];
    const colors = themeConfig.colors;
    const defaultDir = themeConfig.defaultDirection;
    const randomness = this.params.directionRandomness / 100;

    const baseAngle = Math.atan2(defaultDir.y, defaultDir.x);
    const randomAngle = baseAngle + (Math.random() - 0.5) * Math.PI * 2 * randomness;
    const baseSpeed = 30 + Math.random() * 70;
    const speedMultiplier = 1 / Math.max(this.params.dissipateSpeed, 0.5);

    const randomVX = (Math.random() - 0.5) * 100 * randomness;
    const randomVY = (Math.random() - 0.5) * 100 * randomness;

    let shape: Particle['shape'] = 'circle';
    switch (this.theme) {
      case 'ice':
        shape = Math.random() > 0.5 ? 'triangle' : 'square';
        break;
      case 'petal':
        shape = 'ellipse';
        break;
      case 'sand':
        shape = 'circle';
        break;
      case 'fire':
        shape = Math.random() > 0.7 ? 'ellipse' : 'circle';
        break;
    }

    const sizeVariation = 0.6 + Math.random() * 0.8;
    const lifetime = (0.5 + Math.random() * 0.5) * this.params.dissipateSpeed;

    return {
      id,
      x: point.x,
      y: point.y,
      initialX: point.x,
      initialY: point.y,
      vx: (Math.cos(randomAngle) * baseSpeed + randomVX) * speedMultiplier,
      vy: (Math.sin(randomAngle) * baseSpeed + randomVY) * speedMultiplier,
      size: this.params.particleSize * sizeVariation,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 8,
      shape,
      lifetime,
      maxLifetime: lifetime,
      phase: Math.random() * Math.PI * 2
    };
  }

  update(options: UpdateOptions): Particle[] {
    const { deltaTime, progress, speedMultiplier } = options;
    const dt = deltaTime * speedMultiplier;

    const themeConfig = THEMES[this.theme];
    const gravity = this.getGravity();

    for (const p of this.particles) {
      if (progress <= 0) {
        p.x = p.initialX;
        p.y = p.initialY;
        p.opacity = 1;
        p.lifetime = p.maxLifetime;
        continue;
      }

      if (progress > 1 || p.lifetime <= 0) {
        p.opacity = 0;
        continue;
      }

      const normalizedProgress = Math.min(progress * 1.2, 1);
      const startProgress = (p.id / this.particles.length) * 0.3;
      const effectiveProgress = Math.max(0, (normalizedProgress - startProgress) / (1 - startProgress));

      if (effectiveProgress <= 0) continue;

      p.vx += gravity.x * dt;
      p.vy += gravity.y * dt;

      const drag = 0.98;
      p.vx *= drag;
      p.vy *= drag;

      const movementFactor = Math.min(effectiveProgress * 2, 1);
      p.x += p.vx * dt * movementFactor;
      p.y += p.vy * dt * movementFactor;

      switch (this.theme) {
        case 'fire':
          p.y -= Math.sin(effectiveProgress * Math.PI * 2 + p.phase) * 20 * dt;
          break;
        case 'petal':
          p.x += Math.sin(effectiveProgress * Math.PI * 3 + p.phase) * 30 * dt;
          break;
        case 'sand':
          p.x += Math.sin(effectiveProgress * Math.PI * 4 + p.phase) * 15 * dt;
          p.y += Math.cos(effectiveProgress * Math.PI * 3 + p.phase) * 10 * dt;
          break;
      }

      p.rotation += p.rotationSpeed * dt;

      const fadeStart = 0.3;
      if (effectiveProgress > fadeStart) {
        p.opacity = Math.max(0, 1 - (effectiveProgress - fadeStart) / (1 - fadeStart));
      }

      p.lifetime -= dt;
    }

    return this.particles;
  }

  private getGravity(): { x: number; y: number } {
    switch (this.theme) {
      case 'fire':
        return { x: 0, y: -40 };
      case 'ice':
        return { x: 0, y: 60 };
      case 'sand':
        return { x: 20, y: 10 };
      case 'petal':
        return { x: 5, y: 30 };
      default:
        return { x: 0, y: 0 };
    }
  }

  regenerate(): Particle[] {
    this.particles = this.points.map((point, index) => this.createParticle(index, point));
    return this.particles;
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  updateParams(params: ParticleParams): void {
    this.params = params;
  }

  updateTheme(theme: ThemeType): void {
    this.theme = theme;
  }

  resetPositions(): void {
    for (const p of this.particles) {
      p.x = p.initialX;
      p.y = p.initialY;
      p.opacity = 1;
      p.lifetime = p.maxLifetime;
    }
  }
}
