import * as THREE from 'three';
import { FrequencyBands } from './audioAnalyzer';

export interface ParticleSystemOptions {
  count: number;
  opacity: number;
  speedMultiplier: number;
  sensitivity: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export class ParticleSystem {
  private scene: THREE.Scene;
  private particleCount: number;
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  private baseSizes: Float32Array;
  private rotations: Float32Array;
  private rotationSpeeds: Float32Array;
  private targetSizes: Float32Array;
  private currentSizes: Float32Array;

  private targetColors: Float32Array;
  private currentColors: Float32Array;

  private targetVelocities: Float32Array;
  private currentVelocities: Float32Array;

  private opacity: number;
  private speedMultiplier: number;
  private sensitivity: number;

  private readonly TOP_Y = 10;
  private readonly BOTTOM_Y = -10;
  private readonly X_MIN = -8;
  private readonly X_MAX = 8;
  private readonly Z_MIN = -6;
  private readonly Z_MAX = 6;

  private readonly MIN_SIZE = 0.05;
  private readonly MAX_SIZE = 0.4;
  private readonly MIN_SPEED = 0.1;
  private readonly MAX_SPEED = 2.0;

  private readonly COLOR_LOW = new THREE.Color(0xff3300);
  private readonly COLOR_MID = new THREE.Color(0xffaa00);
  private readonly COLOR_HIGH = new THREE.Color(0x9933ff);
  private readonly COLOR_WHITE = new THREE.Color(0xffffff);

  private hasAudio: boolean = false;

  private positionAttribute: THREE.BufferAttribute;
  private colorAttribute: THREE.BufferAttribute;
  private sizeAttribute: THREE.BufferAttribute;

  constructor(scene: THREE.Scene, options: ParticleSystemOptions) {
    this.scene = scene;
    this.particleCount = options.count;
    this.opacity = options.opacity;
    this.speedMultiplier = options.speedMultiplier;
    this.sensitivity = options.sensitivity;

    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);

    this.baseSizes = new Float32Array(this.particleCount);
    this.rotations = new Float32Array(this.particleCount);
    this.rotationSpeeds = new Float32Array(this.particleCount);
    this.targetSizes = new Float32Array(this.particleCount);
    this.currentSizes = new Float32Array(this.particleCount);

    this.targetColors = new Float32Array(this.particleCount * 3);
    this.currentColors = new Float32Array(this.particleCount * 3);

    this.targetVelocities = new Float32Array(this.particleCount);
    this.currentVelocities = new Float32Array(this.particleCount);

    this.initParticles();

    this.geometry = new THREE.BufferGeometry();
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.colorAttribute = new THREE.BufferAttribute(this.colors, 3);
    this.sizeAttribute = new THREE.BufferAttribute(this.sizes, 1);

    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('color', this.colorAttribute);
    this.geometry.setAttribute('size', this.sizeAttribute);

    this.material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: this.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i, true);

      const baseSize = 0.05 + Math.random() * 0.1;
      this.baseSizes[i] = baseSize;
      this.sizes[i] = baseSize;
      this.currentSizes[i] = baseSize;
      this.targetSizes[i] = baseSize;

      this.currentVelocities[i] = 0;
      this.targetVelocities[i] = 0;

      this.rotations[i] = Math.random() * Math.PI * 2;
      this.rotationSpeeds[i] = 0.01 + Math.random() * 0.04;

      const i3 = i * 3;
      this.colors[i3] = 1;
      this.colors[i3 + 1] = 1;
      this.colors[i3 + 2] = 1;

      this.currentColors[i3] = 1;
      this.currentColors[i3 + 1] = 1;
      this.currentColors[i3 + 2] = 1;

      this.targetColors[i3] = 1;
      this.targetColors[i3 + 1] = 1;
      this.targetColors[i3 + 2] = 1;
    }
  }

  private resetParticle(i: number, initial: boolean = false): void {
    const i3 = i * 3;
    this.positions[i3] = this.X_MIN + Math.random() * (this.X_MAX - this.X_MIN);
    this.positions[i3 + 2] = this.Z_MIN + Math.random() * (this.Z_MAX - this.Z_MIN);

    if (initial) {
      this.positions[i3 + 1] = this.BOTTOM_Y + Math.random() * (this.TOP_Y - this.BOTTOM_Y);
    } else {
      this.positions[i3 + 1] = this.TOP_Y + Math.random() * 2;
    }
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity;
    this.material.opacity = opacity;
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  setSensitivity(sensitivity: number): void {
    this.sensitivity = sensitivity;
  }

  setHasAudio(has: boolean): void {
    this.hasAudio = has;
  }

  update(frequencyBands: FrequencyBands | null, deltaTime: number): void {
    const dt = Math.min(deltaTime * 60, 2);

    let low = 0, mid = 0, high = 0;
    if (frequencyBands) {
      low = easeOutCubic(Math.min(frequencyBands.low * this.sensitivity, 1));
      mid = easeOutCubic(Math.min(frequencyBands.mid * this.sensitivity, 1));
      high = easeOutCubic(Math.min(frequencyBands.high * this.sensitivity, 1));
    }

    const baseColor = this.hasAudio ? this.COLOR_LOW : this.COLOR_WHITE;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const noise = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
      const jitter = Math.abs(noise) * 0.3;

      const lowFactor = smoothstep(0.0, 0.4, low) * (0.7 + jitter * 0.6);
      const midFactor = smoothstep(0.0, 0.3, mid) * (0.7 + ((Math.sin(i * 0.37) + 1) * 0.15));
      const highFactor = smoothstep(0.0, 0.2, high) * (0.7 + ((Math.cos(i * 0.53) + 1) * 0.15));

      const targetSpeed = this.hasAudio
        ? lerp(this.MIN_SPEED, this.MAX_SPEED, lowFactor)
        : this.MIN_SPEED * 0.3;
      this.targetVelocities[i] = targetSpeed;

      this.currentVelocities[i] = lerp(this.currentVelocities[i], this.targetVelocities[i], 0.08);

      const y = this.positions[i3 + 1] - this.currentVelocities[i] * this.speedMultiplier * dt;
      this.positions[i3 + 1] = y;

      if (y < this.BOTTOM_Y) {
        this.resetParticle(i, false);
      }

      this.rotations[i] += this.rotationSpeeds[i] * dt;
      const sinR = Math.sin(this.rotations[i]);
      const cosR = Math.cos(this.rotations[i]);
      const rotAmount = this.hasAudio ? (0.02 + low * 0.08) : 0.01;

      const x = this.positions[i3];
      const z = this.positions[i3 + 2];
      const cx = 0;
      const cz = 0;
      const dx = x - cx;
      const dz = z - cz;
      this.positions[i3] = cx + dx * cosR * rotAmount - dz * sinR * rotAmount + x * (1 - rotAmount);
      this.positions[i3 + 2] = cz + dx * sinR * rotAmount + dz * cosR * rotAmount + z * (1 - rotAmount);

      const targetSize = this.hasAudio
        ? lerp(this.MIN_SIZE, this.MAX_SIZE, midFactor) * (0.8 + this.baseSizes[i])
        : this.baseSizes[i];
      this.targetSizes[i] = targetSize;
      this.currentSizes[i] = lerp(this.currentSizes[i], this.targetSizes[i], 0.1);
      this.sizes[i] = this.currentSizes[i];

      let r: number, g: number, b: number;
      if (this.hasAudio) {
        const t = highFactor;
        if (t < 0.5) {
          const tt = t * 2;
          r = lerp(this.COLOR_LOW.r, this.COLOR_MID.r, tt);
          g = lerp(this.COLOR_LOW.g, this.COLOR_MID.g, tt);
          b = lerp(this.COLOR_LOW.b, this.COLOR_MID.b, tt);
        } else {
          const tt = (t - 0.5) * 2;
          r = lerp(this.COLOR_MID.r, this.COLOR_HIGH.r, tt);
          g = lerp(this.COLOR_MID.g, this.COLOR_HIGH.g, tt);
          b = lerp(this.COLOR_MID.b, this.COLOR_HIGH.b, tt);
        }
        const intensityBoost = 0.8 + (low + mid + high) * 0.2 / 3;
        r = Math.min(r * intensityBoost, 1);
        g = Math.min(g * intensityBoost, 1);
        b = Math.min(b * intensityBoost, 1);
      } else {
        r = baseColor.r;
        g = baseColor.g;
        b = baseColor.b;
      }

      this.targetColors[i3] = r;
      this.targetColors[i3 + 1] = g;
      this.targetColors[i3 + 2] = b;

      this.currentColors[i3] = lerp(this.currentColors[i3], this.targetColors[i3], 0.08);
      this.currentColors[i3 + 1] = lerp(this.currentColors[i3 + 1], this.targetColors[i3 + 1], 0.08);
      this.currentColors[i3 + 2] = lerp(this.currentColors[i3 + 2], this.targetColors[i3 + 2], 0.08);

      this.colors[i3] = this.currentColors[i3];
      this.colors[i3 + 1] = this.currentColors[i3 + 1];
      this.colors[i3 + 2] = this.currentColors[i3 + 2];
    }

    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.sizeAttribute.needsUpdate = true;
  }

  dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
