import type { WeatherCondition, ThemeStyle } from './weatherTypes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  length: number;
}

interface ThemeConfig {
  sunColor: string;
  cloudColor: string;
  rainColor: string;
  snowColor: string;
  bgGradient: string[];
  animationSpeed: number;
}

const themeConfigs: Record<ThemeStyle, ThemeConfig> = {
  realistic: {
    sunColor: '#F5DEB3',
    cloudColor: '#778899',
    rainColor: '#FFFFFF',
    snowColor: '#FFFFFF',
    bgGradient: ['#0a0a1a', '#1a1a2e', '#16213e'],
    animationSpeed: 1,
  },
  minimal: {
    sunColor: '#E8DCC0',
    cloudColor: '#8899AA',
    rainColor: '#E0E0E0',
    snowColor: '#F0F0F0',
    bgGradient: ['#1a1a2e', '#16213e'],
    animationSpeed: 0.8,
  },
  dreamy: {
    sunColor: '#FFD700',
    cloudColor: '#9370DB',
    rainColor: '#87CEEB',
    snowColor: '#FFB6C1',
    bgGradient: ['#1a0a2e', '#2d1b4e', '#1a1a3e'],
    animationSpeed: 0.5,
  },
};

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private condition: WeatherCondition = 'sunny';
  private theme: ThemeStyle = 'realistic';
  private density: number = 0.6;
  private precipitation: number = 0;
  private time: number = 0;
  private isPaused: boolean = false;
  private maxParticles: number = 500;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private handleScroll(): void {
    this.isPaused = window.scrollY > 50;
  }

  public setWeather(condition: WeatherCondition, precipitation: number = 0): void {
    this.condition = condition;
    this.precipitation = precipitation;
    this.particles = [];
  }

  public setTheme(theme: ThemeStyle): void {
    this.theme = theme;
  }

  public setDensity(density: number): void {
    this.density = Math.max(0.1, Math.min(1, density));
  }

  private createParticle(): Particle {
    const width = this.canvas.width;
    const height = this.canvas.height;

    switch (this.condition) {
      case 'sunny':
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: 20 + Math.random() * 40,
          opacity: 0.1 + Math.random() * 0.3,
          life: 4000,
          maxLife: 4000,
          rotation: 0,
          rotationSpeed: 0,
          length: 0,
        };
      case 'cloudy':
        return {
          x: Math.random() * width,
          y: height * 0.2 + Math.random() * height * 0.4,
          vx: 0.5,
          vy: 0,
          size: 100 + Math.random() * 150,
          opacity: 0.3 + Math.random() * 0.4,
          life: 8000,
          maxLife: 8000,
          rotation: 0,
          rotationSpeed: 0,
          length: 0,
        };
      case 'rainy':
        const speed = 8 + this.precipitation * 0.5;
        return {
          x: Math.random() * width,
          y: -20 - Math.random() * 100,
          vx: (Math.random() - 0.5) * 2,
          vy: speed + Math.random() * 4,
          size: 1,
          opacity: 0.6 + Math.random() * 0.4,
          life: (height + 100) / speed * 16.67,
          maxLife: (height + 100) / speed * 16.67,
          rotation: 0,
          rotationSpeed: 0,
          length: 20 + Math.random() * 40,
        };
      case 'snowy':
        return {
          x: Math.random() * width,
          y: -20 - Math.random() * 100,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 1 + Math.random() * 2,
          size: 6,
          opacity: 0.8 + Math.random() * 0.2,
          life: (height + 100) / 2 * 16.67,
          maxLife: (height + 100) / 2 * 16.67,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          length: 0,
        };
    }
  }

  private updateParticle(p: Particle, dt: number): void {
    const speedMult = themeConfigs[this.theme].animationSpeed;
    
    p.x += p.vx * dt * 0.06 * speedMult;
    p.y += p.vy * dt * 0.06 * speedMult;
    p.rotation += p.rotationSpeed * dt * 0.06;
    p.life -= dt;

    if (this.condition === 'sunny') {
      const phase = (this.time + p.x * 0.01) * 0.001;
      p.opacity = 0.1 + Math.sin(phase * Math.PI * 2 / 4) * 0.15 + 0.15;
    }

    if (this.condition === 'cloudy') {
      if (p.x > this.canvas.width + p.size) {
        p.x = -p.size;
      }
    }
  }

  private drawParticle(p: Particle): void {
    const ctx = this.ctx;
    const config = themeConfigs[this.theme];

    ctx.save();

    switch (this.condition) {
      case 'sunny':
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, config.sunColor + Math.floor(p.opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, config.sunColor + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'cloudy':
        const cloudGrad = ctx.createLinearGradient(
          p.x - p.size, p.y,
          p.x + p.size, p.y + p.size * 0.5
        );
        const alpha = Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
        cloudGrad.addColorStop(0, config.cloudColor + alpha);
        cloudGrad.addColorStop(0.5, config.cloudColor + Math.floor(p.opacity * 200).toString(16).padStart(2, '0'));
        cloudGrad.addColorStop(1, config.cloudColor + '00');
        ctx.fillStyle = cloudGrad;
        this.drawCloud(p.x, p.y, p.size);
        break;

      case 'rainy':
        ctx.strokeStyle = config.rainColor;
        ctx.lineWidth = p.size;
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        const angle = Math.atan2(p.vy, p.vx);
        ctx.lineTo(
          p.x + Math.cos(angle) * p.length,
          p.y + Math.sin(angle) * p.length
        );
        ctx.stroke();
        break;

      case 'snowy':
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = config.snowColor;
        ctx.globalAlpha = p.opacity;
        this.drawSnowflake(0, 0, p.size);
        break;
    }

    ctx.restore();
  }

  private drawCloud(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x - size * 0.4, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x - size * 0.1, y - size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.2, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x, y + size * 0.1, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSnowflake(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * size,
        y + Math.sin(angle) * size
      );
      const midX = x + Math.cos(angle) * size * 0.6;
      const midY = y + Math.sin(angle) * size * 0.6;
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX + Math.cos(angle + Math.PI / 4) * size * 0.3,
        midY + Math.sin(angle + Math.PI / 4) * size * 0.3
      );
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX + Math.cos(angle - Math.PI / 4) * size * 0.3,
        midY + Math.sin(angle - Math.PI / 4) * size * 0.3
      );
    }
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const config = themeConfigs[this.theme];
    const width = this.canvas.width;
    const height = this.canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    config.bgGradient.forEach((color, i) => {
      gradient.addColorStop(i / (config.bgGradient.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (this.theme === 'dreamy') {
      const time = this.time * 0.0001;
      for (let i = 0; i < 3; i++) {
        const x = width * (0.3 + Math.sin(time + i * 2) * 0.2);
        const y = height * (0.3 + Math.cos(time * 0.7 + i * 2) * 0.2);
        const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 300);
        const colors = ['#FF6B9D', '#9D4EDD', '#4ECDC4'];
        glowGrad.addColorStop(0, colors[i] + '40');
        glowGrad.addColorStop(1, colors[i] + '00');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }
    }
  }

  private animate(timestamp: number): void {
    if (this.lastFrameTime === 0) this.lastFrameTime = timestamp;
    const dt = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    this.frameCount++;
    if (this.frameCount % 30 === 0) {
      this.fps = Math.round(1000 / dt);
    }

    if (!this.isPaused || this.condition !== 'sunny') {
      this.time += dt;

      const targetCount = Math.min(
        Math.floor(this.maxParticles * this.density),
        this.maxParticles
      );

      const spawnRate = this.condition === 'sunny' ? 0.02 : 
                        this.condition === 'cloudy' ? 0.01 :
                        this.condition === 'rainy' ? 0.3 * (1 + this.precipitation * 0.05) :
                        0.2;

      while (this.particles.length < targetCount && Math.random() < spawnRate) {
        this.particles.push(this.createParticle());
      }

      this.drawBackground();

      this.particles = this.particles.filter(p => {
        if (p.life <= 0) return false;
        if (p.y > this.canvas.height + 100) return false;
        return true;
      });

      if (this.fps < 45) {
        const toRemove = Math.floor(this.particles.length * 0.1);
        this.particles.splice(0, toRemove);
      }

      this.particles.forEach(p => {
        this.updateParticle(p, dt);
        this.drawParticle(p);
      });
    }

    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  public start(): void {
    if (this.animationId === null) {
      this.lastFrameTime = 0;
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.resize.bind(this));
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }

  public getFPS(): number {
    return this.fps;
  }
}
