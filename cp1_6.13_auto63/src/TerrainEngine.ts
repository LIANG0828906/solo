import * as THREE from 'three';
import { createLavaMaterial, LavaMaterialUniforms } from './LavaShader';

export interface TerrainForce {
  x: number;
  z: number;
  strength: number;
  radius: number;
  isSink: boolean;
}

export interface PoolInfo {
  center: THREE.Vector2;
  radius: number;
  time: number;
  active: boolean;
}

interface SinkArea {
  time: number;
  x: number;
  z: number;
  radius: number;
  originalHeights: Map<number, number>;
}

export class TerrainEngine {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  public material: THREE.ShaderMaterial;
  public uniforms: LavaMaterialUniforms;

  private resolution: number;
  private size: number;
  private originalHeights: Float32Array;
  private heightModifiers: Float32Array;
  private sinkAreas: SinkArea[] = [];
  private vertexCount: number;

  public poolInfo: PoolInfo = {
    center: new THREE.Vector2(0, 0),
    radius: 0,
    time: 0,
    active: false,
  };

  public fadeInProgress = 0;

  constructor(size: number = 50, resolution: number = 64) {
    this.size = size;
    this.resolution = resolution;

    this.geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    this.geometry.rotateX(-Math.PI / 2);

    const { material, uniforms } = createLavaMaterial();
    this.material = material;
    this.uniforms = uniforms;

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;

    const positionAttr = this.geometry.attributes.position;
    this.vertexCount = positionAttr.count;
    this.originalHeights = new Float32Array(this.vertexCount);
    this.heightModifiers = new Float32Array(this.vertexCount);

    for (let i = 0; i < this.vertexCount; i++) {
      this.originalHeights[i] = positionAttr.getY(i);
      this.heightModifiers[i] = 0;
    }
  }

  addForce(force: TerrainForce): void {
    const positionAttr = this.geometry.attributes.position;

    for (let i = 0; i < this.vertexCount; i++) {
      const x = positionAttr.getX(i);
      const z = positionAttr.getZ(i);

      const dx = x - force.x;
      const dz = z - force.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < force.radius) {
        const falloff = 1 - dist / force.radius;
        const smoothFalloff = falloff * falloff * (3 - 2 * falloff);

        if (force.isSink) {
          const currentY = positionAttr.getY(i);
          this.heightModifiers[i] = -currentY * smoothFalloff;
        } else {
          const targetHeight = force.strength * smoothFalloff;
          this.heightModifiers[i] += targetHeight * 0.3;
          this.heightModifiers[i] = Math.max(0, Math.min(10, this.heightModifiers[i]));
        }
      }
    }

    this.updateGeometry();
  }

  registerSinkArea(x: number, z: number, radius: number): void {
    const positionAttr = this.geometry.attributes.position;
    const originalHeights = new Map<number, number>();

    for (let i = 0; i < this.vertexCount; i++) {
      const vx = positionAttr.getX(i);
      const vz = positionAttr.getZ(i);
      const dx = vx - x;
      const dz = vz - z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < radius) {
        originalHeights.set(i, positionAttr.getY(i));
      }
    }

    this.sinkAreas.push({
      time: 0,
      x,
      z,
      radius,
      originalHeights,
    });
  }

  smooth(strength: number = 0.1): void {
    const positionAttr = this.geometry.attributes.position;
    const temp = new Float32Array(this.vertexCount);

    for (let i = 0; i < this.vertexCount; i++) {
      temp[i] = this.heightModifiers[i];
    }

    const cols = this.resolution;
    const rows = this.resolution;

    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        const idx = r * cols + c;
        const neighbors = [
          temp[(r - 1) * cols + c],
          temp[(r + 1) * cols + c],
          temp[r * cols + (c - 1)],
          temp[r * cols + (c + 1)],
        ];
        const avg = neighbors.reduce((a, b) => a + b, 0) / 4;
        this.heightModifiers[idx] += (avg - this.heightModifiers[idx]) * strength;
      }
    }

    this.updateGeometry();
  }

  createPool(x: number, z: number, radius: number): void {
    const positionAttr = this.geometry.attributes.position;

    for (let i = 0; i < this.vertexCount; i++) {
      const vx = positionAttr.getX(i);
      const vz = positionAttr.getZ(i);
      const dx = vx - x;
      const dz = vz - z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < radius) {
        const falloff = 1 - dist / radius;
        const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
        this.heightModifiers[i] = -positionAttr.getY(i) * smoothFalloff;
      }
    }

    this.poolInfo = {
      center: new THREE.Vector2(x, z),
      radius,
      time: 2,
      active: true,
    };

    this.uniforms.uPoolCenter.value.set(x, z);
    this.uniforms.uPoolRadius.value = radius;

    this.updateGeometry();
  }

  private updateGeometry(): void {
    const positionAttr = this.geometry.attributes.position;

    for (let i = 0; i < this.vertexCount; i++) {
      const newY = this.originalHeights[i] + this.heightModifiers[i];
      positionAttr.setY(i, Math.max(-2, newY));
    }

    positionAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  getHeightAt(x: number, z: number): number {
    const positionAttr = this.geometry.attributes.position;
    let nearestHeight = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < this.vertexCount; i++) {
      const vx = positionAttr.getX(i);
      const vz = positionAttr.getZ(i);
      const dx = vx - x;
      const dz = vz - z;
      const dist = dx * dx + dz * dz;

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestHeight = positionAttr.getY(i);
      }
    }

    return nearestHeight;
  }

  getRandomSurfacePoints(count: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const positionAttr = this.geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * this.vertexCount);
      points.push(new THREE.Vector3(
        positionAttr.getX(idx),
        positionAttr.getY(idx),
        positionAttr.getZ(idx)
      ));
    }

    return points;
  }

  getHeightModifiers(): Float32Array {
    return this.heightModifiers;
  }

  update(deltaTime: number, elapsedTime: number): void {
    this.uniforms.uTime.value = elapsedTime;

    if (this.fadeInProgress < 1) {
      this.fadeInProgress = Math.min(1, this.fadeInProgress + deltaTime / 2);
      this.uniforms.uFadeIn.value = this.fadeInProgress;
    }

    for (let i = this.sinkAreas.length - 1; i >= 0; i--) {
      const sink = this.sinkAreas[i];
      sink.time += deltaTime;

      if (sink.time >= 2) {
        this.sinkAreas.splice(i, 1);
        continue;
      }

      const t = sink.time / 2;
      const sinkAmount = 0.1 * t;

      const positionAttr = this.geometry.attributes.position;
      for (const [idx, original] of sink.originalHeights.entries()) {
        const currentY = positionAttr.getY(idx);
        const targetY = original * (1 - sinkAmount);
        positionAttr.setY(idx, targetY);
        this.heightModifiers[idx] = targetY - this.originalHeights[idx];
      }

      positionAttr.needsUpdate = true;
      this.geometry.computeVertexNormals();
    }

    if (this.poolInfo.active) {
      this.poolInfo.time -= deltaTime;
      if (this.poolInfo.time <= 0) {
        this.poolInfo.active = false;
        this.uniforms.uPoolRadius.value = 0;
      }
    }
  }
}
