import * as THREE from 'three';
import { PerlinNoise3D } from '@/utils/noise';
import { ColorMode } from '@/utils/colors';

export interface NebulaCloudOptions {
  particleCount?: number;
  radius?: number;
  density?: number;
  turbulence?: number;
  colorMode?: ColorMode;
}

export class NebulaCloud {
  public mesh: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;

  private particleCount: number;
  private baseRadius: number;
  private density: number;
  private turbulence: number;
  private noise: PerlinNoise3D;
  private basePositions: Float32Array;
  private colors: Float32Array;
  private currentColorMode: ColorMode;

  private colorInterpolator: (t: number) => { r: number; g: number; b: number };

  constructor(options: NebulaCloudOptions = {}) {
    this.particleCount = options.particleCount || 20000;
    this.baseRadius = options.radius || 3.5;
    this.density = options.density ?? 0.6;
    this.turbulence = options.turbulence ?? 40;
    this.currentColorMode = options.colorMode || 'purple-green';
    this.noise = new PerlinNoise3D(42);
    this.colorInterpolator = (t) => ({ r: t, g: t, b: 1 });

    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.basePositions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);

    this.generateBasePositions();
    this.updateGeometry();

    this.mesh = new THREE.Points(this.geometry, this.material);
  }

  private generateBasePositions(): void {
    const positions = this.basePositions;
    const noiseScale = 1.2;
    const turbulenceStrength = (this.turbulence / 100) * 1.2;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      const radialRandom = Math.pow(Math.random(), 1.5);
      const r = this.baseRadius * radialRandom;

      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi);

      const noiseX = this.noise.fbm(x * noiseScale + 10, y * noiseScale, z * noiseScale, 4, 2.0, 0.5);
      const noiseY = this.noise.fbm(x * noiseScale, y * noiseScale + 10, z * noiseScale, 4, 2.0, 0.5);
      const noiseZ = this.noise.fbm(x * noiseScale, y * noiseScale, z * noiseScale + 10, 4, 2.0, 0.5);

      const displacement = turbulenceStrength * (1 - radialRandom * 0.5);
      x += noiseX * displacement;
      y += noiseY * displacement;
      z += noiseZ * displacement;

      const filamentNoise = this.noise.fbm(x * 2.5, y * 2.5, z * 2.5, 3, 2.5, 0.4);
      const filamentStrength = turbulenceStrength * 0.6 * radialRandom;
      x += filamentNoise * filamentStrength * (Math.random() - 0.5) * 2;
      y += filamentNoise * filamentStrength * (Math.random() - 0.5) * 2;
      z += filamentNoise * filamentStrength * (Math.random() - 0.5) * 2;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }
  }

  private updateGeometry(): void {
    const activeCount = Math.floor(this.particleCount * this.density);
    const positions = new Float32Array(activeCount * 3);
    const colors = new Float32Array(activeCount * 3);

    for (let i = 0; i < activeCount; i++) {
      const srcIdx = i * 3;
      positions[i * 3] = this.basePositions[srcIdx];
      positions[i * 3 + 1] = this.basePositions[srcIdx + 1];
      positions[i * 3 + 2] = this.basePositions[srcIdx + 2];

      const dist = Math.sqrt(
        this.basePositions[srcIdx] ** 2 +
          this.basePositions[srcIdx + 1] ** 2 +
          this.basePositions[srcIdx + 2] ** 2
      );
      const normalizedDist = dist / this.baseRadius;
      const alpha = Math.max(0, 1 - normalizedDist * 0.8);

      const color = this.colorInterpolator(alpha);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.colors = colors;

    this.geometry.computeBoundingSphere();
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  setDensity(density: number): void {
    this.density = Math.max(0.1, Math.min(1.0, density));
    this.updateGeometry();
  }

  setTurbulence(turbulence: number): void {
    this.turbulence = Math.max(0, Math.min(100, turbulence));
    this.generateBasePositions();
    this.updateGeometry();
  }

  setColorInterpolator(interpolator: (t: number) => { r: number; g: number; b: number }): void {
    this.colorInterpolator = interpolator;
    this.updateColors();
  }

  private updateColors(): void {
    const activeCount = Math.floor(this.particleCount * this.density);
    const colors = this.colors;

    for (let i = 0; i < activeCount; i++) {
      const i3 = i * 3;
      const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      const dist = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
      const normalizedDist = dist / this.baseRadius;
      const alpha = Math.max(0, 1 - normalizedDist * 0.8);

      const color = this.colorInterpolator(alpha);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const colorAttr = this.geometry.attributes.color as THREE.BufferAttribute;
    colorAttr.needsUpdate = true;
  }

  updateParticleScale(scale: number): void {
    const effectiveCount = Math.floor(this.particleCount * this.density * scale);
    const maxCount = Math.floor(this.particleCount * this.density);
    const finalCount = Math.max(1000, Math.min(maxCount, effectiveCount));

    const positions = new Float32Array(finalCount * 3);
    const colors = new Float32Array(finalCount * 3);

    for (let i = 0; i < finalCount; i++) {
      const srcIdx = i * 3;
      positions[i * 3] = this.basePositions[srcIdx];
      positions[i * 3 + 1] = this.basePositions[srcIdx + 1];
      positions[i * 3 + 2] = this.basePositions[srcIdx + 2];

      const dist = Math.sqrt(
        this.basePositions[srcIdx] ** 2 +
          this.basePositions[srcIdx + 1] ** 2 +
          this.basePositions[srcIdx + 2] ** 2
      );
      const normalizedDist = dist / this.baseRadius;
      const alpha = Math.max(0, 1 - normalizedDist * 0.8);

      const color = this.colorInterpolator(alpha);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.colors = colors;
    this.geometry.computeBoundingSphere();
  }

  animate(time: number): void {
    this.mesh.rotation.y = time * 0.02;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
