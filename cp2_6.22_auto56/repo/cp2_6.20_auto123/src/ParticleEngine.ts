export type Theme = 'fire' | 'ice' | 'sand' | 'petal';

export type ParticleShape = 'circle' | 'square' | 'triangle' | 'ellipse' | 'shard';

export interface Particle {
  id: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  shape: ParticleShape;
  alpha: number;
  life: number;
  maxLife: number;
  dead: boolean;
}

export interface ParticleConfig {
  size: number;
  duration: number;
  randomness: number;
}

export class ParticleEngine {
  private particles: Particle[] = [];
  private config: ParticleConfig;
  private theme: Theme;

  constructor(theme: Theme = 'fire', config: ParticleConfig = { size: 4, duration: 2, randomness: 50 }) {
    this.theme = theme;
    this.config = config;
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
  }

  setConfig(config: Partial<ParticleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  initFromPoints(points: { x: number; y: number }[]): void {
    const colors = this.getThemeColors();
    const shapes = this.getThemeShapes();

    this.particles = points.map((point, index) => {
      const baseAngle = this.getThemeBaseAngle();
      const randomFactor = (this.config.randomness / 100) * Math.PI * 2;
      const angle = baseAngle + (Math.random() - 0.5) * randomFactor;
      const speed = 0.5 + Math.random() * 2;

      return {
        id: index,
        x: point.x,
        y: point.y,
        originX: point.x,
        originY: point.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: this.config.size * (0.7 + Math.random() * 0.6),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        alpha: 1,
        life: 0,
        maxLife: this.config.duration * 60,
        dead: false,
      };
    });
  }

  update(): Particle[] {
    for (const particle of this.particles) {
      if (particle.dead) continue;

      particle.life++;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;
      particle.vy += this.getThemeGravity();
      particle.alpha = Math.max(0, 1 - particle.life / particle.maxLife);

      if (particle.life >= particle.maxLife || particle.alpha <= 0) {
        particle.dead = true;
      }
    }
    return this.particles;
  }

  reset(): void {
    for (const particle of this.particles) {
      particle.x = particle.originX;
      particle.y = particle.originY;
      particle.alpha = 1;
      particle.life = 0;
      particle.dead = false;
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getProgress(): number {
    if (this.particles.length === 0) return 0;
    const totalMaxLife = this.particles.reduce((sum, p) => sum + p.maxLife, 0);
    const totalLife = this.particles.reduce((sum, p) => sum + p.life, 0);
    return totalMaxLife > 0 ? totalLife / totalMaxLife : 0;
  }

  private getThemeColors(): string[] {
    switch (this.theme) {
      case 'fire':
        return ['#ff4500', '#ff6347', '#ff8c00', '#ffd700', '#ffa500'];
      case 'ice':
        return ['#b3e5fc', '#81d4fa', '#4fc3f7', '#e1f5fe', '#ffffff'];
      case 'sand':
        return ['#d4a574', '#f5deb3', '#c19a6b', '#deb887', '#e8c99b'];
      case 'petal':
        return ['#ffb6c1', '#f48fb1', '#f8bbd9', '#fce4ec', '#f48fb1'];
      default:
        return ['#ffffff'];
    }
  }

  private getThemeShapes(): ParticleShape[] {
    switch (this.theme) {
      case 'fire':
        return ['circle', 'ellipse'];
      case 'ice':
        return ['triangle', 'shard', 'square'];
      case 'sand':
        return ['circle', 'square'];
      case 'petal':
        return ['ellipse'];
      default:
        return ['circle'];
    }
  }

  private getThemeBaseAngle(): number {
    switch (this.theme) {
      case 'fire':
        return -Math.PI / 2;
      case 'ice':
        return Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      case 'sand':
        return Math.random() * Math.PI * 2;
      case 'petal':
        return Math.PI / 2;
      default:
        return -Math.PI / 2;
    }
  }

  private getThemeGravity(): number {
    switch (this.theme) {
      case 'fire':
        return -0.05;
      case 'ice':
        return 0.02;
      case 'sand':
        return 0.01;
      case 'petal':
        return 0.03;
      default:
        return 0;
    }
  }
}
