import * as THREE from 'three';
import { GravityNode } from './gravityNode';

const TRAIL_LENGTH = 10;
const CONNECTION_DISTANCE = 1.5;
const GRAVITY_ACCEL = 0.5;
const ORBIT_SPEED = 1.2;
const ORBIT_THRESHOLD = 0.3;
const MAX_TRAIL_PARTICLES = 500;

interface ParticleData {
  velocity: THREE.Vector3;
  originalColor: THREE.Color;
  isOrbiting: boolean;
  orbitNode: GravityNode | null;
  trailPositions: THREE.Vector3[];
  hasTrail: boolean;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particleCount: number;
  private startColor: THREE.Color;
  private endColor: THREE.Color;
  private gravityStrength: number = 1.0;

  private points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private particleData: ParticleData[] = [];

  private connectionLines: THREE.LineSegments;
  private connectionPositions: Float32Array;
  private connectionColors: Float32Array;
  private maxConnections: number = 20000;

  private trailLines: THREE.LineSegments;
  private trailPositionsBuffer: Float32Array;
  private trailColorsBuffer: Float32Array;

  private geometry: THREE.BufferGeometry;
  private connectionGeometry: THREE.BufferGeometry;
  private trailGeometry: THREE.BufferGeometry;

  private rotationAngle: number = 0;

  private updateIndex: number = 0;
  private maxUpdatesPerFrame: number = 200;

  private spatialGrid: Map<string, number[]> = new Map();
  private gridSize: number = CONNECTION_DISTANCE;

  constructor(scene: THREE.Scene, count: number, startColor: THREE.Color, endColor: THREE.Color) {
    this.scene = scene;
    this.particleCount = count;
    this.startColor = startColor.clone();
    this.endColor = endColor.clone();

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);

    this.initParticles();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, material);
    scene.add(this.points);

    this.connectionGeometry = new THREE.BufferGeometry();
    this.connectionPositions = new Float32Array(this.maxConnections * 6);
    this.connectionColors = new Float32Array(this.maxConnections * 6);
    this.connectionGeometry.setAttribute('position', new THREE.BufferAttribute(this.connectionPositions, 3));
    this.connectionGeometry.setAttribute('color', new THREE.BufferAttribute(this.connectionColors, 3));
    this.connectionGeometry.setDrawRange(0, 0);

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.connectionLines = new THREE.LineSegments(this.connectionGeometry, lineMaterial);
    scene.add(this.connectionLines);

    const maxTrailVerts = MAX_TRAIL_PARTICLES * TRAIL_LENGTH * 2 * 3;
    this.trailGeometry = new THREE.BufferGeometry();
    this.trailPositionsBuffer = new Float32Array(maxTrailVerts);
    this.trailColorsBuffer = new Float32Array(maxTrailVerts);
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositionsBuffer, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(this.trailColorsBuffer, 3));
    this.trailGeometry.setDrawRange(0, 0);

    const trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.trailLines = new THREE.LineSegments(this.trailGeometry, trailMaterial);
    scene.add(this.trailLines);
  }

  private initParticles(): void {
    const tempColor = new THREE.Color();
    for (let i = 0; i < this.particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5 + Math.random() * 15;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      const t = Math.random();
      tempColor.copy(this.startColor).lerp(this.endColor, t);

      this.colors[i * 3] = tempColor.r;
      this.colors[i * 3 + 1] = tempColor.g;
      this.colors[i * 3 + 2] = tempColor.b;

      this.sizes[i] = 0.02 + Math.random() * 0.06;

      this.particleData[i] = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        originalColor: tempColor.clone(),
        isOrbiting: false,
        orbitNode: null,
        trailPositions: [],
        hasTrail: false
      };
    }
  }

  private getGridKey(x: number, y: number, z: number): string {
    const gx = Math.floor(x / this.gridSize);
    const gy = Math.floor(y / this.gridSize);
    const gz = Math.floor(z / this.gridSize);
    return `${gx},${gy},${gz}`;
  }

  private buildSpatialGrid(): void {
    this.spatialGrid.clear();
    for (let i = 0; i < this.particleCount; i++) {
      const x = this.positions[i * 3];
      const y = this.positions[i * 3 + 1];
      const z = this.positions[i * 3 + 2];
      const key = this.getGridKey(x, y, z);
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, []);
      }
      this.spatialGrid.get(key)!.push(i);
    }
  }

  private getNeighborIndices(x: number, y: number, z: number): number[] {
    const gx = Math.floor(x / this.gridSize);
    const gy = Math.floor(y / this.gridSize);
    const gz = Math.floor(z / this.gridSize);
    const result: number[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${gx + dx},${gy + dy},${gz + dz}`;
          const indices = this.spatialGrid.get(key);
          if (indices) {
            for (const idx of indices) {
              result.push(idx);
            }
          }
        }
      }
    }
    return result;
  }

  private updateConnections(): void {
    let connectionCount = 0;
    const posAttr = this.connectionGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.connectionGeometry.getAttribute('color') as THREE.BufferAttribute;

    this.buildSpatialGrid();

    const processed = new Set<string>();

    for (let i = 0; i < this.particleCount && connectionCount < this.maxConnections; i++) {
      const ix = this.positions[i * 3];
      const iy = this.positions[i * 3 + 1];
      const iz = this.positions[i * 3 + 2];

      const neighbors = this.getNeighborIndices(ix, iy, iz);

      for (const j of neighbors) {
        if (j <= i) continue;
        const pairKey = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const jx = this.positions[j * 3];
        const jy = this.positions[j * 3 + 1];
        const jz = this.positions[j * 3 + 2];

        const dx = ix - jx;
        const dy = iy - jy;
        const dz = iz - jz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECTION_DISTANCE && connectionCount < this.maxConnections) {
          const idx = connectionCount * 6;

          this.connectionPositions[idx] = ix;
          this.connectionPositions[idx + 1] = iy;
          this.connectionPositions[idx + 2] = iz;
          this.connectionPositions[idx + 3] = jx;
          this.connectionPositions[idx + 4] = jy;
          this.connectionPositions[idx + 5] = jz;

          const mr = (this.colors[i * 3] + this.colors[j * 3]) * 0.5;
          const mg = (this.colors[i * 3 + 1] + this.colors[j * 3 + 1]) * 0.5;
          const mb = (this.colors[i * 3 + 2] + this.colors[j * 3 + 2]) * 0.5;

          this.connectionColors[idx] = mr;
          this.connectionColors[idx + 1] = mg;
          this.connectionColors[idx + 2] = mb;
          this.connectionColors[idx + 3] = mr;
          this.connectionColors[idx + 4] = mg;
          this.connectionColors[idx + 5] = mb;

          connectionCount++;
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    this.connectionGeometry.setDrawRange(0, connectionCount * 2);
  }

  private updateTrails(): void {
    let vertexCount = 0;

    for (let i = 0; i < this.particleCount; i++) {
      const data = this.particleData[i];
      if (!data.hasTrail || data.trailPositions.length < 2) continue;

      const px = this.positions[i * 3];
      const py = this.positions[i * 3 + 1];
      const pz = this.positions[i * 3 + 2];

      const cr = this.colors[i * 3];
      const cg = this.colors[i * 3 + 1];
      const cb = this.colors[i * 3 + 2];

      for (let t = 0; t < data.trailPositions.length - 1 && vertexCount < MAX_TRAIL_PARTICLES * TRAIL_LENGTH * 2; t++) {
        const fade = 1.0 - t / data.trailPositions.length;
        const idx = vertexCount * 3;

        const tp = data.trailPositions[t];
        const tp2 = data.trailPositions[t + 1];

        this.trailPositionsBuffer[idx] = tp.x;
        this.trailPositionsBuffer[idx + 1] = tp.y;
        this.trailPositionsBuffer[idx + 2] = tp.z;
        this.trailPositionsBuffer[idx + 3] = tp2.x;
        this.trailPositionsBuffer[idx + 4] = tp2.y;
        this.trailPositionsBuffer[idx + 5] = tp2.z;

        this.trailColorsBuffer[idx] = cr * fade;
        this.trailColorsBuffer[idx + 1] = cg * fade;
        this.trailColorsBuffer[idx + 2] = cb * fade;
        this.trailColorsBuffer[idx + 3] = cr * fade * 0.8;
        this.trailColorsBuffer[idx + 4] = cg * fade * 0.8;
        this.trailColorsBuffer[idx + 5] = cb * fade * 0.8;

        vertexCount += 2;
      }

      data.trailPositions.unshift(new THREE.Vector3(px, py, pz));
      if (data.trailPositions.length > TRAIL_LENGTH) {
        data.trailPositions.pop();
      }
    }

    const posAttr = this.trailGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.trailGeometry.getAttribute('color') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    this.trailGeometry.setDrawRange(0, vertexCount);
  }

  update(deltaTime: number, gravityNodes: GravityNode[]): void {
    this.rotationAngle += 0.01 * deltaTime;

    const tempVec = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const yellowColor = new THREE.Color(0xffcc00);
    const brightGold = new THREE.Color(0xffaa00);
    const tempColor = new THREE.Color();

    const updatesThisFrame = Math.min(this.maxUpdatesPerFrame, this.particleCount);
    const endIndex = this.updateIndex + updatesThisFrame;
    let actualUpdates = 0;

    for (let iter = this.updateIndex; iter < endIndex && iter < this.particleCount; iter++) {
      const i = iter;
      actualUpdates++;

      const px = this.positions[i * 3];
      const py = this.positions[i * 3 + 1];
      const pz = this.positions[i * 3 + 2];
      const data = this.particleData[i];

      let closestDist = Infinity;
      let closestNode: GravityNode | null = null;

      for (const node of gravityNodes) {
        const nPos = node.getPosition();
        const dx = nPos.x - px;
        const dy = nPos.y - py;
        const dz = nPos.z - pz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < closestDist) {
          closestDist = dist;
          closestNode = node;
        }

        if (dist < node.getInfluenceRadius()) {
          const accel = GRAVITY_ACCEL * this.gravityStrength / (dist + 0.1);
          const dirX = dx / (dist + 0.001);
          const dirY = dy / (dist + 0.001);
          const dirZ = dz / (dist + 0.001);
          data.velocity.x += dirX * accel * deltaTime;
          data.velocity.y += dirY * accel * deltaTime;
          data.velocity.z += dirZ * accel * deltaTime;
        }
      }

      if (closestNode && closestDist < ORBIT_THRESHOLD) {
        if (!data.isOrbiting) {
          data.isOrbiting = true;
          data.orbitNode = closestNode;
          data.hasTrail = true;
          data.trailPositions = [];
        }

        const nPos = closestNode.getPosition();
        const dx = nPos.x - px;
        const dy = nPos.y - py;
        const dz = nPos.z - pz;
        const dist = Math.max(closestDist, 0.01);

        tempVec.set(dx, dy, dz).normalize();
        tangent.crossVectors(tempVec, new THREE.Vector3(0, 1, 0)).normalize();
        if (tangent.lengthSq() < 0.001) {
          tangent.crossVectors(tempVec, new THREE.Vector3(1, 0, 0)).normalize();
        }

        const orbSpeed = ORBIT_SPEED / Math.sqrt(dist);
        data.velocity.x = tangent.x * orbSpeed * 0.5 + dx * 0.1;
        data.velocity.y = tangent.y * orbSpeed * 0.5 + dy * 0.1;
        data.velocity.z = tangent.z * orbSpeed * 0.5 + dz * 0.1;

        this.colors[i * 3] = brightGold.r;
        this.colors[i * 3 + 1] = brightGold.g;
        this.colors[i * 3 + 2] = brightGold.b;
      } else if (closestNode && closestDist < closestNode.getInfluenceRadius()) {
        data.isOrbiting = false;
        data.orbitNode = null;
        data.hasTrail = false;

        const colorShift = (1.0 - closestDist / closestNode.getInfluenceRadius()) * 0.3;
        tempColor.copy(data.originalColor).lerp(yellowColor, colorShift);
        this.colors[i * 3] = tempColor.r;
        this.colors[i * 3 + 1] = tempColor.g;
        this.colors[i * 3 + 2] = tempColor.b;
      } else {
        data.isOrbiting = false;
        data.orbitNode = null;
        data.hasTrail = false;
        this.colors[i * 3] = data.originalColor.r;
        this.colors[i * 3 + 1] = data.originalColor.g;
        this.colors[i * 3 + 2] = data.originalColor.b;
      }

      this.positions[i * 3] += data.velocity.x * deltaTime;
      this.positions[i * 3 + 1] += data.velocity.y * deltaTime;
      this.positions[i * 3 + 2] += data.velocity.z * deltaTime;

      data.velocity.multiplyScalar(0.998);
    }

    this.updateIndex = endIndex >= this.particleCount ? 0 : endIndex;

    const cosA = Math.cos(0.01 * deltaTime);
    const sinA = Math.sin(0.01 * deltaTime);
    for (let i = 0; i < this.particleCount; i++) {
      const x = this.positions[i * 3];
      const z = this.positions[i * 3 + 2];
      this.positions[i * 3] = x * cosA - z * sinA;
      this.positions[i * 3 + 2] = x * sinA + z * cosA;
    }

    (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;

    this.updateConnections();
    this.updateTrails();
  }

  setDensity(count: number): void {
    if (count === this.particleCount) return;
    this.dispose();

    this.particleCount = count;
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.particleData = [];

    this.initParticles();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.points = new THREE.Points(this.geometry, new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    this.scene.add(this.points);

    this.updateIndex = 0;
  }

  setGravityStrength(strength: number): void {
    this.gravityStrength = strength;
  }

  setColorRange(startColor: THREE.Color, endColor: THREE.Color): void {
    this.startColor.copy(startColor);
    this.endColor.copy(endColor);

    const tempColor = new THREE.Color();
    for (let i = 0; i < this.particleCount; i++) {
      const t = Math.random();
      tempColor.copy(this.startColor).lerp(this.endColor, t);
      this.colors[i * 3] = tempColor.r;
      this.colors[i * 3 + 1] = tempColor.g;
      this.colors[i * 3 + 2] = tempColor.b;
      this.particleData[i].originalColor.copy(tempColor);
    }
    (this.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }

  getParticleCount(): number {
    return this.particleCount;
  }

  reset(): void {
    this.setDensity(this.particleCount);
  }

  getPositions(): Float32Array {
    return this.positions;
  }

  private dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
