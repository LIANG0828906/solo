import * as THREE from 'three';
import { PerlinNoise } from './PerlinNoise';

export interface TerrainParams {
  amplitude: number;
  frequency: number;
  seed: number;
}

export class TerrainManager {
  private mesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;
  private noise: PerlinNoise;
  private params: TerrainParams;
  private gridSize: number;
  private planeSize: number;
  private baseColors: Float32Array | null = null;
  private heights: Float32Array | null = null;

  constructor(gridSize: number = 64, planeSize: number = 10) {
    this.gridSize = gridSize;
    this.planeSize = planeSize;
    this.params = {
      amplitude: 2.0,
      frequency: 1.5,
      seed: 42
    };

    this.noise = new PerlinNoise(this.params.seed);
    this.geometry = new THREE.PlaneGeometry(
      this.planeSize,
      this.planeSize,
      this.gridSize - 1,
      this.gridSize - 1
    );
    this.geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;

    this.updateTerrain();
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public getParams(): TerrainParams {
    return { ...this.params };
  }

  public setAmplitude(amplitude: number): void {
    this.params.amplitude = amplitude;
    this.updateTerrain();
  }

  public setFrequency(frequency: number): void {
    this.params.frequency = frequency;
    this.updateTerrain();
  }

  public setSeed(seed: number): void {
    this.params.seed = seed;
    this.noise.setSeed(seed);
    this.updateTerrain();
  }

  public updateWaterEffect(waterHeight: number): void {
    const positions = this.geometry.attributes.position;
    const colors = this.geometry.attributes.color;

    if (!this.baseColors || !this.heights) {
      return;
    }

    const color = new THREE.Color();
    const foamColor = new THREE.Color(0.9, 0.95, 1.0);

    for (let i = 0; i < positions.count; i++) {
      const y = this.heights[i];
      const baseR = this.baseColors[i * 3];
      const baseG = this.baseColors[i * 3 + 1];
      const baseB = this.baseColors[i * 3 + 2];

      color.setRGB(baseR, baseG, baseB);

      const heightDiff = waterHeight - y;

      if (heightDiff > 0) {
        const depthFactor = Math.min(1, heightDiff / 2.5);
        const darkenAmount = depthFactor * 0.65;
        color.multiplyScalar(1 - darkenAmount);
        color.lerp(new THREE.Color(0x005599), depthFactor * 0.45);
      } else if (heightDiff > -0.08) {
        const foamFactor = 1.0 - Math.abs(heightDiff) / 0.08;
        color.lerp(foamColor, foamFactor * 0.7);
      }

      colors.setXYZ(i, color.r, color.g, color.b);
    }

    colors.needsUpdate = true;
  }

  private updateTerrain(): void {
    const positions = this.geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    this.heights = new Float32Array(positions.count);

    let minHeight = Infinity;
    let maxHeight = -Infinity;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const noiseValue = this.noise.fbm(
        x / this.planeSize + 0.5,
        z / this.planeSize + 0.5,
        this.params.frequency,
        5
      );

      const height = noiseValue * this.params.amplitude;
      positions.setY(i, height);
      this.heights[i] = height;

      if (height < minHeight) minHeight = height;
      if (height > maxHeight) maxHeight = height;
    }

    const heightRange = maxHeight - minHeight || 1;

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const normalizedHeight = (y - minHeight) / heightRange;

      const color = this.getTerrainColor(normalizedHeight);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.baseColors = new Float32Array(colors);

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  private getTerrainColor(normalizedHeight: number): THREE.Color {
    const color = new THREE.Color();

    if (normalizedHeight < 0.2) {
      color.setRGB(0.15, 0.45, 0.25);
    } else if (normalizedHeight < 0.4) {
      const t = (normalizedHeight - 0.2) / 0.2;
      color.setRGB(
        0.15 + 0.25 * t,
        0.45 + 0.2 * t,
        0.25 + 0.1 * t
      );
    } else if (normalizedHeight < 0.6) {
      const t = (normalizedHeight - 0.4) / 0.2;
      color.setRGB(
        0.4 + 0.2 * t,
        0.65 - 0.1 * t,
        0.35 + 0.05 * t
      );
    } else if (normalizedHeight < 0.8) {
      const t = (normalizedHeight - 0.6) / 0.2;
      color.setRGB(
        0.6 + 0.15 * t,
        0.55 - 0.05 * t,
        0.4 + 0.1 * t
      );
    } else {
      const t = (normalizedHeight - 0.8) / 0.2;
      color.setRGB(
        0.75 + 0.2 * t,
        0.5 + 0.4 * t,
        0.5 + 0.4 * t
      );
    }

    return color;
  }

  public dispose(): void {
    this.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    } else if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose());
    }
  }
}
