import type { FrequencyBands } from './audioEngine';
import type { Theme } from './renderer';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  baseOrbitRadius: number;
  opacity: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number;
  private centerX: number = 0;
  private centerY: number = 0;
  private theme: Theme;
  private time: number = 0;

  constructor(maxParticles: number = 500) {
    this.maxParticles = maxParticles;
    this.theme = this.getDefaultTheme();
  }

  private getDefaultTheme(): Theme {
    return {
      name: '极光梦境',
      particleColors: ['#00ffff', '#ff00ff', '#00ff88', '#88ffff', '#ff88ff'],
      backgroundGradient: ['#0a0a1a', '#1a0a2e', '#0a1a2e'],
      waveColor: '#00ffff',
      glowColor: 'rgba(0, 255, 255, 0.3)',
      progressGradient: ['#00ffff', '#ff00ff']
    };
  }

  initialize(count: number, width: number, height: number): void {
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(width, height));
    }
  }

  private createParticle(width: number, height: height): Particle {
    const angle = Math.random() * Math.PI * 2;
    const minOrbit = Math.min(width, height) * 0.1;
    const maxOrbit = Math.min(width, height) * 0.45;
    const baseOrbitRadius = minOrbit + Math.random() * (maxOrbit - minOrbit);
    
    const color = this.theme.particleColors[
      Math.floor(Math.random() * this.theme.particleColors.length)
    ];

    return {
      x: this.centerX + Math.cos(angle) * baseOrbitRadius,
      y: this.centerY + Math.sin(angle) * baseOrbitRadius,
      vx: 0,
      vy: 0,
      radius: 3 + Math.random() * 5,
      color,
      life: 1,
      maxLife: 1,
      angle,
      orbitRadius: baseOrbitRadius,
      baseOrbitRadius,
      orbitSpeed: (0.001 + Math.random() * 0.003) * (Math.random() > 0.5 ? 1 : -1),
      opacity: 0.6 + Math.random() * 0.4
    };
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    for (const particle of this.particles) {
      particle.color = theme.particleColors[
        Math.floor(Math.random() * theme.particleColors.length)
      ];
    }
  }

  update(bands: FrequencyBands, width: number, height: number): void {
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.time += 0.016;

    const lowEnergy = bands.low / 255;
    const midEnergy = bands.mid / 255;

    const breatheScale = 1 + lowEnergy * 0.3;
    const waveOffset = Math.sin(this.time * 2) * 0.05;

    for (const particle of this.particles) {
      particle.angle += particle.orbitSpeed * (1 + lowEnergy * 2);
      
      particle.orbitRadius = particle.baseOrbitRadius * breatheScale;
      particle.orbitRadius *= (1 + waveOffset * Math.sin(particle.angle * 3));

      const ellipseRatio = 0.7;
      const targetX = this.centerX + Math.cos(particle.angle) * particle.orbitRadius;
      const targetY = this.centerY + Math.sin(particle.angle) * particle.orbitRadius * ellipseRatio;

      particle.x += (targetX - particle.x) * 0.1;
      particle.y += (targetY - particle.y) * 0.1;

      particle.radius = (3 + Math.random() * 5) * (0.8 + lowEnergy * 0.4);
    }

    if (lowEnergy > 0.6 && this.particles.length < this.maxParticles) {
      const spawnCount = Math.floor((lowEnergy - 0.6) * 20);
      for (let i = 0; i < spawnCount && this.particles.length < this.maxParticles; i++) {
        this.particles.push(this.createParticle(width, height));
      }
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getMidEnergy(): number {
    return 0;
  }
}