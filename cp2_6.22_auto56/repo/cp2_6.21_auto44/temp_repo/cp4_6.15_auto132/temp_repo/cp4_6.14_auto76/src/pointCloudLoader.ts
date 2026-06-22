import * as THREE from 'three';

export type DisplayMode = 'original' | 'height' | 'density';

export interface PointCloudData {
  positions: Float32Array;
  colors: Float32Array;
  originalColors: Float32Array;
  pointCount: number;
  boundingBox: THREE.Box3;
  center: THREE.Vector3;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export type ProgressCallback = (progress: LoadProgress) => void;

export class PointCloudLoader {
  private scene: THREE.Scene;
  private points?: THREE.Points;
  private data?: PointCloudData;
  private gridMap?: Map<string, number>;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public getPoints(): THREE.Points | undefined {
    return this.points;
  }

  public getData(): PointCloudData | undefined {
    return this.data;
  }

  public getGridMap(): Map<string, number> | undefined {
    return this.gridMap;
  }

  public async loadBuiltInSimulation(
    progressCallback?: ProgressCallback
  ): Promise<THREE.Points> {
    const totalPoints = 60000;
    const totalSteps = 10;

    const progress: LoadProgress = { loaded: 0, total: totalPoints, percent: 0 };

    for (let i = 0; i <= totalSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      progress.loaded = Math.floor((totalPoints * i) / totalSteps);
      progress.percent = (progress.loaded / totalPoints) * 100;
      if (progressCallback) progressCallback(progress);
    }

    const data = this.generateSimulationData(totalPoints);
    this.data = data;
    this.buildDensityGrid(3);
    this.points = this.createPointsMesh(data);
    this.scene.add(this.points);

    progress.loaded = totalPoints;
    progress.percent = 100;
    if (progressCallback) progressCallback(progress);

    return this.points;
  }

  private generateSimulationData(count: number): PointCloudData {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const siteWidth = 80;
    const siteDepth = 80;
    const centerX = 0;
    const centerZ = 0;

    const terrainNoise = (x: number, z: number): number => {
      const n1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 4;
      const n2 = Math.sin(x * 0.15 + 1.2) * Math.cos(z * 0.12 + 0.5) * 2;
      const n3 = Math.sin((x + z) * 0.05) * 3;
      return n1 + n2 + n3;
    };

    const inRect = (x: number, z: number, cx: number, cz: number, w: number, d: number): boolean => {
      return x >= cx - w / 2 && x <= cx + w / 2 && z >= cz - d / 2 && z <= cz + d / 2;
    };

    const addWallPoints = (
      idx: number,
      startX: number,
      startZ: number,
      endX: number,
      endZ: number,
      height: number,
      wallColor: THREE.Color,
      thickness: number = 1.2
    ): number => {
      const dx = endX - startX;
      const dz = endZ - startZ;
      const length = Math.sqrt(dx * dx + dz * dz);
      const stepSize = 0.6;
      const steps = Math.floor(length / stepSize);
      const layers = Math.floor(height / 0.4);

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const wx = startX + dx * t + (Math.random() - 0.5) * thickness;
        const wz = startZ + dz * t + (Math.random() - 0.5) * thickness;
        for (let l = 0; l < layers; l++) {
          if (idx >= count) break;
          const ly = l * 0.4 + (Math.random() - 0.5) * 0.3;
          if (ly < 0) continue;
          const noise = Math.random() * 0.15 - 0.075;
          positions[idx * 3] = wx;
          positions[idx * 3 + 1] = ly;
          positions[idx * 3 + 2] = wz;
          const shade = 0.85 + Math.random() * 0.3;
          colors[idx * 3] = Math.min(1, wallColor.r * shade);
          colors[idx * 3 + 1] = Math.min(1, wallColor.g * shade);
          colors[idx * 3 + 2] = Math.min(1, wallColor.b * shade);
          idx++;
        }
      }
      return idx;
    };

    let idx = 0;
    const stoneColor = new THREE.Color(0xb8a88a);
    const earthColor = new THREE.Color(0x8b6f47);
    const darkStone = new THREE.Color(0x6b5b47);
    const redBrick = new THREE.Color(0xa0522d);

    while (idx < count) {
      const x = (Math.random() - 0.5) * siteWidth + centerX;
      const z = (Math.random() - 0.5) * siteDepth + centerZ;
      const baseY = terrainNoise(x, z);

      const distFromCenter = Math.sqrt(x * x + z * z);
      let densityMultiplier = 1;
      if (distFromCenter < 15) densityMultiplier = 2.2;
      else if (distFromCenter < 30) densityMultiplier = 1.5;

      if (Math.random() > 0.85 / densityMultiplier) continue;

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = baseY + Math.random() * 0.3;
      positions[idx * 3 + 2] = z;

      let c = earthColor.clone();
      if (distFromCenter < 25) c = stoneColor.clone().lerp(earthColor, 0.4);
      if (Math.random() < 0.1) c = darkStone.clone();

      const shade = 0.8 + Math.random() * 0.4;
      colors[idx * 3] = Math.min(1, c.r * shade);
      colors[idx * 3 + 1] = Math.min(1, c.g * shade);
      colors[idx * 3 + 2] = Math.min(1, c.b * shade);
      idx++;
    }

    idx = Math.floor(count * 0.55);

    const templeCX = 0;
    const templeCZ = 0;
    const templeW = 24;
    const templeD = 16;

    const templeY = terrainNoise(templeCX, templeCZ);

    const floorSteps = 40;
    for (let i = 0; i < floorSteps; i++) {
      for (let j = 0; j < floorSteps; j++) {
        if (idx >= count) break;
        const fx = templeCX - templeW / 2 + (templeW * i) / (floorSteps - 1) + (Math.random() - 0.5) * 0.4;
        const fz = templeCZ - templeD / 2 + (templeD * j) / (floorSteps - 1) + (Math.random() - 0.5) * 0.4;
        positions[idx * 3] = fx;
        positions[idx * 3 + 1] = templeY + 0.1 + Math.random() * 0.2;
        positions[idx * 3 + 2] = fz;
        const shade = 0.85 + Math.random() * 0.3;
        colors[idx * 3] = Math.min(1, stoneColor.r * shade);
        colors[idx * 3 + 1] = Math.min(1, stoneColor.g * shade);
        colors[idx * 3 + 2] = Math.min(1, stoneColor.b * shade);
        idx++;
      }
    }

    const columns = [
      [-templeW / 2 + 2, -templeD / 2 + 2],
      [templeW / 2 - 2, -templeD / 2 + 2],
      [-templeW / 2 + 2, templeD / 2 - 2],
      [templeW / 2 - 2, templeD / 2 - 2],
      [0, -templeD / 2 + 2],
      [0, templeD / 2 - 2],
    ];

    for (const [cx, cz] of columns) {
      for (let layer = 0; layer < 25; layer++) {
        for (let p = 0; p < 6; p++) {
          if (idx >= count) break;
          const angle = (p / 6) * Math.PI * 2;
          const radius = 0.9 + (Math.random() - 0.5) * 0.2;
          positions[idx * 3] = templeCX + cx + Math.cos(angle) * radius;
          positions[idx * 3 + 1] = templeY + 0.3 + layer * 0.55 + (Math.random() - 0.5) * 0.3;
          positions[idx * 3 + 2] = templeCZ + cz + Math.sin(angle) * radius;
          const shade = 0.8 + Math.random() * 0.4;
          colors[idx * 3] = Math.min(1, stoneColor.r * shade);
          colors[idx * 3 + 1] = Math.min(1, stoneColor.g * shade);
          colors[idx * 3 + 2] = Math.min(1, stoneColor.b * shade);
          idx++;
        }
      }
    }

    const wallStructures = [
      { cx: -18, cz: -8, w: 14, d: 10, color: darkStone, h: 4 },
      { cx: 20, cz: -5, w: 10, d: 12, color: redBrick, h: 3 },
      { cx: -10, cz: 22, w: 16, d: 8, color: stoneColor, h: 3.5 },
      { cx: 22, cz: 18, w: 8, d: 14, color: darkStone, h: 2.5 },
    ];

    for (const w of wallStructures) {
      const wy = terrainNoise(w.cx, w.cz);
      idx = addWallPoints(idx, w.cx - w.w / 2, w.cz - w.d / 2, w.cx + w.w / 2, w.cz - w.d / 2, w.h, w.color);
      if (idx >= count) break;
      idx = addWallPoints(idx, w.cx + w.w / 2, w.cz - w.d / 2, w.cx + w.w / 2, w.cz + w.d / 2, w.h, w.color);
      if (idx >= count) break;
      idx = addWallPoints(idx, w.cx - w.w / 2, w.cz + w.d / 2, w.cx + w.w / 2, w.cz + w.d / 2, w.h, w.color);
      if (idx >= count) break;
      idx = addWallPoints(idx, w.cx - w.w / 2, w.cz - w.d / 2, w.cx - w.w / 2, w.cz + w.d / 2, w.h, w.color);
      if (idx >= count) break;

      for (let p = 0; p < 200; p++) {
        if (idx >= count) break;
        positions[idx * 3] = w.cx + (Math.random() - 0.5) * w.w * 0.8;
        positions[idx * 3 + 1] = wy + 0.1 + Math.random() * 0.2;
        positions[idx * 3 + 2] = w.cz + (Math.random() - 0.5) * w.d * 0.8;
        const shade = 0.8 + Math.random() * 0.4;
        colors[idx * 3] = Math.min(1, w.color.r * shade);
        colors[idx * 3 + 1] = Math.min(1, w.color.g * shade);
        colors[idx * 3 + 2] = Math.min(1, w.color.b * shade);
        idx++;
      }
    }

    for (let r = 0; r < 1500; r++) {
      if (idx >= count) break;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 38;
      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;
      const ry = terrainNoise(rx, rz);
      const rh = Math.random() * 1.5 + 0.3;
      for (let layer = 0; layer < Math.floor(rh / 0.35); layer++) {
        if (idx >= count) break;
        const radiusJitter = Math.random() * 0.5;
        positions[idx * 3] = rx + Math.cos(angle + Math.PI / 2) * radiusJitter;
        positions[idx * 3 + 1] = ry + layer * 0.35 + Math.random() * 0.2;
        positions[idx * 3 + 2] = rz + Math.sin(angle + Math.PI / 2) * radiusJitter;
        const c = Math.random() < 0.5 ? darkStone : stoneColor;
        const shade = 0.7 + Math.random() * 0.4;
        colors[idx * 3] = Math.min(1, c.r * shade);
        colors[idx * 3 + 1] = Math.min(1, c.g * shade);
        colors[idx * 3 + 2] = Math.min(1, c.b * shade);
        idx++;
      }
    }

    const actualCount = idx;
    const finalPositions = new Float32Array(actualCount * 3);
    const finalColors = new Float32Array(actualCount * 3);
    finalPositions.set(positions.subarray(0, actualCount * 3));
    finalColors.set(colors.subarray(0, actualCount * 3));

    const boundingBox = new THREE.Box3();
    for (let i = 0; i < actualCount; i++) {
      boundingBox.expandByPoint(
        new THREE.Vector3(
          finalPositions[i * 3],
          finalPositions[i * 3 + 1],
          finalPositions[i * 3 + 2]
        )
      );
    }

    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    return {
      positions: finalPositions,
      colors: finalColors,
      originalColors: new Float32Array(finalColors),
      pointCount: actualCount,
      boundingBox,
      center,
    };
  }

  private buildDensityGrid(cellSize: number): void {
    if (!this.data) return;
    const grid = new Map<string, number>();
    const { positions, pointCount } = this.data;

    for (let i = 0; i < pointCount; i++) {
      const x = Math.floor(positions[i * 3] / cellSize);
      const y = Math.floor(positions[i * 3 + 1] / cellSize);
      const z = Math.floor(positions[i * 3 + 2] / cellSize);
      const key = `${x},${y},${z}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    }

    this.gridMap = grid;
  }

  public getDensityAt(position: THREE.Vector3, cellSize: number = 3): number {
    if (!this.gridMap) return 0;
    const x = Math.floor(position.x / cellSize);
    const y = Math.floor(position.y / cellSize);
    const z = Math.floor(position.z / cellSize);
    return this.gridMap.get(`${x},${y},${z}`) || 0;
  }

  public getMaxDensity(cellSize: number = 3): number {
    if (!this.gridMap) return 1;
    let max = 0;
    for (const count of this.gridMap.values()) {
      if (count > max) max = count;
    }
    return max || 1;
  }

  private createPointsMesh(data: PointCloudData): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(data.colors), 3));
    geometry.computeBoundingBox();

    const material = new THREE.PointsMaterial({
      size: 3,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'pointCloud';
    return points;
  }

  public setPointSize(size: number): void {
    if (!this.points) return;
    const material = this.points.material as THREE.PointsMaterial;
    material.size = size;
  }

  public applyDisplayMode(mode: DisplayMode): void {
    if (!this.points || !this.data) return;

    const { positions, originalColors, colors, pointCount, boundingBox } = this.data;
    const colorAttr = this.points.geometry.getAttribute('color') as THREE.BufferAttribute;

    if (mode === 'original') {
      colors.set(originalColors);
      colorAttr.needsUpdate = true;
      return;
    }

    if (mode === 'height') {
      const minY = boundingBox.min.y;
      const maxY = boundingBox.max.y;
      const range = Math.max(0.001, maxY - minY);
      const lowColor = new THREE.Color(0x22c55e);
      const highColor = new THREE.Color(0xef4444);
      const temp = new THREE.Color();

      for (let i = 0; i < pointCount; i++) {
        const y = positions[i * 3 + 1];
        const t = Math.max(0, Math.min(1, (y - minY) / range));
        temp.copy(lowColor).lerp(highColor, t);
        colors[i * 3] = temp.r;
        colors[i * 3 + 1] = temp.g;
        colors[i * 3 + 2] = temp.b;
      }
      colorAttr.needsUpdate = true;
      return;
    }

    if (mode === 'density') {
      const cellSize = 3;
      const maxDensity = this.getMaxDensity(cellSize);
      const lowColor = new THREE.Color(0x0ea5e9);
      const highColor = new THREE.Color(0xf43f5e);
      const temp = new THREE.Color();

      for (let i = 0; i < pointCount; i++) {
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];
        const pz = positions[i * 3 + 2];
        const density = this.getDensityAt(new THREE.Vector3(px, py, pz), cellSize);
        const t = Math.max(0, Math.min(1, density / maxDensity));
        const t2 = Math.pow(t, 0.5);
        temp.copy(lowColor).lerp(highColor, t2);
        colors[i * 3] = temp.r;
        colors[i * 3 + 1] = temp.g;
        colors[i * 3 + 2] = temp.b;
      }
      colorAttr.needsUpdate = true;
      return;
    }
  }
}
