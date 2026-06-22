import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator';
import { COLORS, OceanConfig } from './OceanConfig';

interface ParticleData {
  baseSpeed: number;
  dirX: number;
  dirZ: number;
  directionOffset: number;
}

function lerpColor(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function getParticleColor(speed: number): { r: number; g: number; b: number } {
  if (speed < 2) {
    const t = speed / 2;
    return lerpColor(COLORS.PARTICLE_SLOW, COLORS.PARTICLE_MEDIUM, t);
  } else if (speed < 3.5) {
    const t = (speed - 2) / 1.5;
    return lerpColor(COLORS.PARTICLE_MEDIUM, COLORS.PARTICLE_FAST, t);
  } else {
    return COLORS.PARTICLE_FAST;
  }
}

export class CurrentParticleSystem {
  private terrain: TerrainGenerator;
  private count: number;
  private size: number;
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private particleData: ParticleData[];
  private positions: Float32Array;
  private colors: Float32Array;
  private gridSize: number;
  private halfGrid: number;

  constructor(terrain: TerrainGenerator, config: { count: number; size: number }) {
    this.terrain = terrain;
    this.count = config.count;
    this.size = config.size;
    this.gridSize = OceanConfig.GRID_SIZE;
    this.halfGrid = this.gridSize / 2;
    this.particleData = [];

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);

    this.initParticles();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.size,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: false,
    });

    this.points = new THREE.Points(this.geometry, material);
  }

  private initParticles(): void {
    for (let i = 0; i < this.count; i++) {
      const x = (Math.random() - 0.5) * this.gridSize;
      const z = (Math.random() - 0.5) * this.gridSize;
      const y = this.terrain.getHeightAt(x, z) + 0.5;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      const baseSpeed = 1 + Math.random() * 4;

      const angle = (Math.random() - 0.5) * Math.PI * 0.5;
      const dirX = Math.cos(angle);
      const dirZ = Math.sin(angle);

      this.particleData.push({
        baseSpeed,
        dirX,
        dirZ,
        directionOffset: Math.random() * Math.PI * 2,
      });

      const color = getParticleColor(baseSpeed);
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;
    }
  }

  getPoints(): THREE.Points {
    return this.points;
  }

  update(deltaTime: number, timeScale: number, simulationTime: number): void {
    const scaledDelta = deltaTime * timeScale;

    for (let i = 0; i < this.count; i++) {
      const data = this.particleData[i];
      let x = this.positions[i * 3];
      let z = this.positions[i * 3 + 2];

      const slope = this.terrain.getSlopeAt(x, z);
      const slopeFactor = 1 - Math.min(slope * 2, 0.6);

      const curveAngle = Math.sin(simulationTime * 0.3 + data.directionOffset) * 0.3;
      const cosA = Math.cos(curveAngle);
      const sinA = Math.sin(curveAngle);
      const dx = data.dirX * cosA - data.dirZ * sinA;
      const dz = data.dirX * sinA + data.dirZ * cosA;

      const currentSpeed = data.baseSpeed * slopeFactor;

      x += dx * currentSpeed * scaledDelta;
      z += dz * currentSpeed * scaledDelta;

      if (x > this.halfGrid) x -= this.gridSize;
      if (x < -this.halfGrid) x += this.gridSize;
      if (z > this.halfGrid) z -= this.gridSize;
      if (z < -this.halfGrid) z += this.gridSize;

      const y = this.terrain.getHeightAt(x, z) + 0.5;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      const color = getParticleColor(currentSpeed);
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
