import * as THREE from 'three';
import type { SharedConfig, ParticleData } from './sharedConfig';
import { ImageParser } from './imageParser';

export class ParticleCloud {
  private scene: THREE.Scene;
  private config: SharedConfig;
  private particles: ParticleData[] = [];
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;
  private time = 0;
  private paused = false;
  private currentSpreadRadius = 1.5;
  private targetSpreadRadius = 1.5;
  private currentPulseSpeed = 1.0;
  private targetPulseSpeed = 1.0;
  private currentParticleSize = 4.0;
  private targetParticleSize = 4.0;
  private transitionSpeed = 2;

  private basePositions = new Float32Array();
  private colors = new Float32Array();
  private sizes = new Float32Array();
  private phases = new Float32Array();
  private periods = new Float32Array();
  private alphas = new Float32Array();

  constructor(scene: THREE.Scene, config: SharedConfig) {
    this.scene = scene;
    this.config = config;
    this.currentSpreadRadius = config.spreadRadius;
    this.targetSpreadRadius = config.spreadRadius;
    this.currentPulseSpeed = config.pulseSpeed;
    this.targetPulseSpeed = config.pulseSpeed;
    this.currentParticleSize = config.particleSize;
    this.targetParticleSize = config.particleSize;
  }

  loadParticles(particles: ParticleData[]): void {
    this.dispose();
    this.particles = particles;
    
    const count = particles.length;
    this.basePositions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.phases = new Float32Array(count);
    this.periods = new Float32Array(count);
    this.alphas = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      this.basePositions[i * 3] = p.x;
      this.basePositions[i * 3 + 1] = p.y;
      this.basePositions[i * 3 + 2] = p.z;
      
      this.phases[i] = p.phase;
      this.periods[i] = p.period;
      this.sizes[i] = p.size;
      this.alphas[i] = p.v;
    }

    this.updateColors();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.basePositions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));

    const adaptiveSize = count > 3000 ? 2 : this.config.particleSize;
    this.currentParticleSize = adaptiveSize;
    this.targetParticleSize = adaptiveSize;

    this.material = new THREE.PointsMaterial({
      size: adaptiveSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  updateColors(): void {
    const count = this.particles.length;
    
    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      let r = p.r;
      let g = p.g;
      let b = p.b;
      let alpha = p.v;

      if (this.config.colorMode === 'hueGroup') {
        const groupedHue = ImageParser.groupHue(p.h);
        const rgb = ImageParser.hsvToRgb(groupedHue, p.s, 1);
        r = rgb.r;
        g = rgb.g;
        b = rgb.b;
        alpha = 0.9;
      } else {
        alpha = 0.3 + p.v * 0.7;
      }

      this.colors[i * 3] = r;
      this.colors[i * 3 + 1] = g;
      this.colors[i * 3 + 2] = b;
      this.alphas[i] = alpha;
    }

    if (this.geometry) {
      const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      colorAttr.needsUpdate = true;
      const alphaAttr = this.geometry.getAttribute('alpha') as THREE.BufferAttribute;
      alphaAttr.needsUpdate = true;
    }
  }

  update(deltaTime: number): void {
    if (this.paused || !this.points || !this.geometry) return;

    this.time += deltaTime;

    this.targetSpreadRadius = this.config.spreadRadius;
    this.targetPulseSpeed = this.config.pulseSpeed;
    
    const count = this.particles.length;
    const adaptiveSize = count > 3000 ? 2 : this.config.particleSize;
    this.targetParticleSize = adaptiveSize;

    this.currentSpreadRadius = this.lerp(this.currentSpreadRadius, this.targetSpreadRadius, deltaTime * this.transitionSpeed);
    this.currentPulseSpeed = this.lerp(this.currentPulseSpeed, this.targetPulseSpeed, deltaTime * this.transitionSpeed);
    this.currentParticleSize = this.lerp(this.currentParticleSize, this.targetParticleSize, deltaTime * this.transitionSpeed);

    const positions = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    const amplitude = this.currentSpreadRadius * 0.15;
    const radiusRatio = this.currentSpreadRadius / this.config.spreadRadius;

    for (let i = 0; i < count; i++) {
      const baseX = this.basePositions[i * 3] * radiusRatio;
      const baseY = this.basePositions[i * 3 + 1] * radiusRatio;
      const baseZ = this.basePositions[i * 3 + 2] * radiusRatio;
      
      const pulse = Math.sin(this.time * this.currentPulseSpeed / this.periods[i] + this.phases[i]) * amplitude;
      
      const len = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ) || 1;
      
      posArray[i * 3] = baseX + (baseX / len) * pulse;
      posArray[i * 3 + 1] = baseY + (baseY / len) * pulse;
      posArray[i * 3 + 2] = baseZ + (baseZ / len) * pulse;
    }

    positions.needsUpdate = true;

    if (this.material) {
      this.material.size = this.currentParticleSize;
    }
  }

  updateSize(): void {
    if (this.geometry && this.material) {
      const count = this.particles.length;
      const adaptiveSize = count > 3000 ? 2 : this.config.particleSize;
      this.targetParticleSize = adaptiveSize;
      this.material.size = this.currentParticleSize;
    }
  }

  updateColorMode(): void {
    this.updateColors();
  }

  pauseAnimation(): void {
    this.paused = true;
  }

  resumeAnimation(): void {
    this.paused = false;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.min(1, t);
  }

  dispose(): void {
    if (this.points) {
      this.scene.remove(this.points);
      this.points = null;
    }
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.particles = [];
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}
