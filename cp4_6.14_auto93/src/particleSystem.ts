import * as THREE from 'three';

const COLOR_LOW: [number, number, number] = [0xfbbf24 >> 16, (0xfbbf24 >> 8) & 0xff, 0xfbbf24 & 0xff];
const COLOR_HIGH: [number, number, number] = [0xef4444 >> 16, (0xef4444 >> 8) & 0xff, 0xef4444 & 0xff];

export interface ParticleSystemUpdateParams {
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
}

export class ParticleSystem {
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;

  private basePositions: Float32Array;
  private targetPositions: Float32Array;
  private velocity: Float32Array;
  private glowTimers: Float32Array;
  private glowIntensities: Float32Array;

  private particleCount: number;
  private readonly DAMPING = 0.98;
  private readonly MAX_OFFSET = 2;
  private readonly GLOW_THRESHOLD = 0.8;
  private readonly GLOW_DURATION = 0.1;

  constructor(baseCount: number = 8000) {
    this.particleCount = this.calculateParticleCount(baseCount);

    this.geometry = new THREE.BufferGeometry();
    this.basePositions = new Float32Array(this.particleCount * 3);
    this.targetPositions = new Float32Array(this.particleCount * 3);
    this.velocity = new Float32Array(this.particleCount * 3);
    this.glowTimers = new Float32Array(this.particleCount);
    this.glowIntensities = new Float32Array(this.particleCount);

    this.generateSphereSurfacePositions();

    const currentPositions = new Float32Array(this.basePositions);
    this.targetPositions.set(this.basePositions);

    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      colors[i * 3] = COLOR_LOW[0] / 255;
      colors[i * 3 + 1] = COLOR_LOW[1] / 255;
      colors[i * 3 + 2] = COLOR_LOW[2] / 255;
      sizes[i] = 0.1;
      this.glowTimers[i] = 0;
      this.glowIntensities[i] = 0;
      this.velocity[i * 3] = 0;
      this.velocity[i * 3 + 1] = 0;
      this.velocity[i * 3 + 2] = 0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  private calculateParticleCount(baseCount: number): number {
    const baseResolution = 1920 * 1080;
    const currentResolution = window.innerWidth * window.innerHeight;
    const ratio = currentResolution / baseResolution;
    return Math.max(2000, Math.floor(baseCount * Math.min(ratio, 1.5)));
  }

  private generateSphereSurfacePositions(): void {
    const n = this.particleCount;
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const r = 8;
      this.basePositions[i * 3] = x * r;
      this.basePositions[i * 3 + 1] = y * r;
      this.basePositions[i * 3 + 2] = z * r;
    }
  }

  update(params: ParticleSystemUpdateParams, deltaTime: number): void {
    const { lowEnergy, midEnergy, highEnergy } = params;

    const lowOffset = (lowEnergy * 2 - 1) * this.MAX_OFFSET;
    const midOffset = (midEnergy * 2 - 1) * this.MAX_OFFSET;
    const highOffset = (highEnergy * 2 - 1) * this.MAX_OFFSET;

    const avgEnergy = (lowEnergy + midEnergy + highEnergy) / 3;
    const maxOffsetMag = Math.abs(lowOffset) + Math.abs(midOffset) + Math.abs(highOffset);
    const offsetRatio = Math.min(1, maxOffsetMag / (this.MAX_OFFSET * 3));

    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;

    const colorR = COLOR_LOW[0] + (COLOR_HIGH[0] - COLOR_LOW[0]) * avgEnergy;
    const colorG = COLOR_LOW[1] + (COLOR_HIGH[1] - COLOR_LOW[1]) * avgEnergy;
    const colorB = COLOR_LOW[2] + (COLOR_HIGH[2] - COLOR_LOW[2]) * avgEnergy;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const noiseX = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
      const noiseY = (Math.sin(i * 78.233 + 12.9898) * 43758.5453) % 1;
      const particlePhase = Math.abs(noiseX) * 0.4 + 0.6;

      this.targetPositions[i3] = this.basePositions[i3] + midOffset * particlePhase;
      this.targetPositions[i3 + 1] = this.basePositions[i3 + 1] + highOffset * particlePhase;
      this.targetPositions[i3 + 2] = this.basePositions[i3 + 2] + lowOffset * particlePhase;

      this.velocity[i3] = this.velocity[i3] * this.DAMPING + (this.targetPositions[i3] - positions[i3]) * (1 - this.DAMPING);
      this.velocity[i3 + 1] = this.velocity[i3 + 1] * this.DAMPING + (this.targetPositions[i3 + 1] - positions[i3 + 1]) * (1 - this.DAMPING);
      this.velocity[i3 + 2] = this.velocity[i3 + 2] * this.DAMPING + (this.targetPositions[i3 + 2] - positions[i3 + 2]) * (1 - this.DAMPING);

      positions[i3] += this.velocity[i3];
      positions[i3 + 1] += this.velocity[i3 + 1];
      positions[i3 + 2] += this.velocity[i3 + 2];

      const particleGlow = Math.abs(noiseY) * 0.3 + 0.7;
      if (offsetRatio > this.GLOW_THRESHOLD * particleGlow) {
        this.glowTimers[i] = this.GLOW_DURATION;
      }
      if (this.glowTimers[i] > 0) {
        this.glowTimers[i] -= deltaTime;
        this.glowIntensities[i] = Math.max(0, this.glowTimers[i] / this.GLOW_DURATION);
      } else {
        this.glowIntensities[i] = 0;
      }

      const glowBoost = 1 + this.glowIntensities[i] * 1.5;
      colors[i3] = Math.min(1, (colorR / 255) * glowBoost);
      colors[i3 + 1] = Math.min(1, (colorG / 255) * glowBoost);
      colors[i3 + 2] = Math.min(1, (colorB / 255) * glowBoost);

      const baseSize = 0.1 + avgEnergy * 0.4;
      sizes[i] = baseSize * glowBoost;

      this.material.opacity = 0.3 + avgEnergy * 0.6;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  reset(): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = this.basePositions[i3];
      positions[i3 + 1] = this.basePositions[i3 + 1];
      positions[i3 + 2] = this.basePositions[i3 + 2];

      this.targetPositions[i3] = this.basePositions[i3];
      this.targetPositions[i3 + 1] = this.basePositions[i3 + 1];
      this.targetPositions[i3 + 2] = this.basePositions[i3 + 2];

      this.velocity[i3] = 0;
      this.velocity[i3 + 1] = 0;
      this.velocity[i3 + 2] = 0;

      this.glowTimers[i] = 0;
      this.glowIntensities[i] = 0;

      colors[i3] = COLOR_LOW[0] / 255;
      colors[i3 + 1] = COLOR_LOW[1] / 255;
      colors[i3 + 2] = COLOR_LOW[2] / 255;

      sizes[i] = 0.1;
    }

    this.material.opacity = 0.6;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  getDominantColor(): THREE.Color {
    const avgEnergy = 0;
    const r = (COLOR_LOW[0] + (COLOR_HIGH[0] - COLOR_LOW[0]) * avgEnergy) / 255;
    const g = (COLOR_LOW[1] + (COLOR_HIGH[1] - COLOR_LOW[1]) * avgEnergy) / 255;
    const b = (COLOR_LOW[2] + (COLOR_HIGH[2] - COLOR_LOW[2]) * avgEnergy) / 255;
    return new THREE.Color(r, g, b);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
