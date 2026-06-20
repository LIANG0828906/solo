import { ParticleInitData, CharCloudInitData } from './TextParser';
import { Particle, CharCloud } from '../stores/appStore';

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export class ParticleEngine {
  private particles: Particle[] = [];
  private charClouds: CharCloud[] = [];
  private time: number = 0;
  private hoveredIndex: number | null = null;

  constructor(initParticles: ParticleInitData[], initCharClouds: CharCloudInitData[]) {
    this.setParticles(initParticles, initCharClouds);
  }

  setParticles(initParticles: ParticleInitData[], initCharClouds: CharCloudInitData[]): void {
    this.particles = initParticles.map((p) => ({
      ...p,
      x: p.baseX,
      y: p.baseY,
      z: p.baseZ,
    }));
    this.charClouds = initCharClouds.map((c) => ({
      ...c,
      isHovered: false,
      expandProgress: 0,
    }));
    this.time = 0;
    this.hoveredIndex = null;
  }

  setHovered(index: number | null): void {
    this.hoveredIndex = index;
    this.charClouds.forEach((cloud) => {
      cloud.isHovered = cloud.index === index;
    });
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    for (const cloud of this.charClouds) {
      const target = cloud.isHovered ? 1 : 0;
      const duration = cloud.isHovered ? 0.8 : 1.2;
      cloud.expandProgress += (target - cloud.expandProgress) * (deltaTime / duration);
      if (cloud.expandProgress < 0) cloud.expandProgress = 0;
      if (cloud.expandProgress > 1) cloud.expandProgress = 1;
    }

    for (const particle of this.particles) {
      const cloud = this.charClouds.find((c) => c.index === particle.charIndex);
      if (!cloud) continue;

      const progress = easeOutQuad(cloud.expandProgress);
      const dy = Math.sin(this.time * particle.floatFrequency + particle.floatOffset) * 0.1;

      particle.x = particle.baseX * (1 - progress) + particle.expandedX * progress;
      particle.y = particle.baseY * (1 - progress) + particle.expandedY * progress + dy;
      particle.z = particle.baseZ * (1 - progress) + particle.expandedZ * progress;
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getCharClouds(): CharCloud[] {
    return this.charClouds;
  }

  getSnapshot(): { particles: Particle[]; charClouds: CharCloud[] } {
    return {
      particles: this.particles.map((p) => ({ ...p })),
      charClouds: this.charClouds.map((c) => ({ ...c })),
    };
  }
}
