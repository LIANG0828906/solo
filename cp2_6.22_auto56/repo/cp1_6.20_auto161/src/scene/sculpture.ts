import * as THREE from 'three';

export type SculptureType = 'torusKnot' | 'spiralBranch' | 'fractalTree';

export interface SculptureParams {
  twist: number;
  inflation: number;
  branches: number;
}

export const DEFAULT_PARAMS: SculptureParams = {
  twist: 2,
  inflation: 1,
  branches: 6,
};

export type MorphCallback = (progress: number) => void;

export abstract class SculptureGeometry {
  protected params: SculptureParams;
  protected geometry: THREE.BufferGeometry;

  constructor(params: SculptureParams) {
    this.params = { ...params };
    this.geometry = new THREE.BufferGeometry();
  }

  abstract generate(): THREE.BufferGeometry;
  abstract getVertexCount(): number;

  getGeometry(): THREE.BufferGeometry {
    return this.geometry;
  }

  updateParams(params: Partial<SculptureParams>): void {
    this.params = { ...this.params, ...params };
  }
}

function normalizeLength(geometries: THREE.BufferGeometry[]): number {
  let max = 0;
  for (const g of geometries) {
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    if (pos.count > max) max = pos.count;
  }
  return max;
}

function padGeometry(geo: THREE.BufferGeometry, targetCount: number): Float32Array {
  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
  const src = posAttr.array as Float32Array;
  const result = new Float32Array(targetCount * 3);
  result.set(src);
  for (let i = posAttr.count; i < targetCount; i++) {
    const seedIdx = i % posAttr.count;
    result[i * 3] = src[seedIdx * 3] * 0.001;
    result[i * 3 + 1] = src[seedIdx * 3 + 1] * 0.001;
    result[i * 3 + 2] = src[seedIdx * 3 + 2] * 0.001;
  }
  return result;
}

export class TorusKnotSculpture extends SculptureGeometry {
  generate(): THREE.BufferGeometry {
    const { twist, inflation, branches } = this.params;
    const p = Math.max(1, Math.round(branches / 2));
    const q = Math.max(1, Math.round(twist));
    const radius = 2 * inflation;
    const tube = 0.55 * inflation;
    const tubularSegments = 512;
    const radialSegments = 48;

    this.geometry = new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q);
    const pos = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const norm = this.geometry.getAttribute('normal') as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const nx = norm.getX(i);
      const ny = norm.getY(i);
      const nz = norm.getZ(i);
      const t = (i / pos.count) * Math.PI * 2 * twist;
      const s = Math.sin(t) * 0.12 * inflation;
      const c = Math.cos(t) * 0.12 * inflation;
      pos.setX(i, x + nx * s);
      pos.setY(i, y + ny * c);
      pos.setZ(i, z + nz * (s + c) * 0.5);
    }
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
    return this.geometry;
  }

  getVertexCount(): number {
    return (this.geometry.getAttribute('position') as THREE.BufferAttribute).count;
  }
}

export class SpiralBranchSculpture extends SculptureGeometry {
  generate(): THREE.BufferGeometry {
    const { twist, inflation, branches } = this.params;
    const totalHeight = 5 * inflation;
    const turns = twist * 2;
    const branchCount = Math.max(3, Math.round(branches));
    const pointsPerBranch = 120;
    const radialPoints = 20;
    const positions: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;

    for (let b = 0; b < branchCount; b++) {
      const baseAngle = (b / branchCount) * Math.PI * 2;
      const branchPositions: number[] = [];

      for (let i = 0; i <= pointsPerBranch; i++) {
        const t = i / pointsPerBranch;
        const height = t * totalHeight - totalHeight * 0.5;
        const radius = (1 - t * 0.75) * 2.2 * inflation;
        const angle = baseAngle + t * Math.PI * 2 * turns;
        const taperWidth = (0.35 + (1 - t) * 0.65) * inflation;

        for (let r = 0; r <= radialPoints; r++) {
          const radialAngle = (r / radialPoints) * Math.PI * 2;
          const cx = Math.cos(angle) * radius;
          const cz = Math.sin(angle) * radius;
          const rx = Math.cos(radialAngle) * taperWidth;
          const ry = Math.sin(radialAngle) * taperWidth;
          const tangentX = -Math.sin(angle);
          const tangentZ = Math.cos(angle);
          const perpX = tangentZ;
          const perpZ = -tangentX;
          const wobble = Math.sin(t * Math.PI * 6 + b) * 0.08 * inflation;

          branchPositions.push(
            cx + perpX * rx + tangentX * wobble,
            height + ry,
            cz + perpZ * rx + tangentZ * wobble
          );
        }
      }

      for (const v of branchPositions) positions.push(v);

      const vertsPerLevel = radialPoints + 1;
      for (let i = 0; i < pointsPerBranch; i++) {
        for (let r = 0; r < radialPoints; r++) {
          const a = vertexOffset + i * vertsPerLevel + r;
          const bIdx = a + 1;
          const c = a + vertsPerLevel;
          const d = c + 1;
          indices.push(a, c, bIdx, bIdx, c, d);
        }
      }
      vertexOffset += branchPositions.length / 3;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setIndex(indices);
    this.geometry.computeVertexNormals();
    return this.geometry;
  }

  getVertexCount(): number {
    return (this.geometry.getAttribute('position') as THREE.BufferAttribute).count;
  }
}

export class FractalTreeSculpture extends SculptureGeometry {
  private addCylinder(
    positions: number[],
    indices: number[],
    from: THREE.Vector3,
    to: THREE.Vector3,
    radiusFrom: number,
    radiusTo: number,
    radialSegs: number
  ): void {
    const offset = positions.length / 3;
    const dir = new THREE.Vector3().subVectors(to, from);
    const length = dir.length();
    const axis = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(axis, dir.clone().normalize());
    const bottom: THREE.Vector3[] = [];
    const top: THREE.Vector3[] = [];

    for (let i = 0; i <= radialSegs; i++) {
      const a = (i / radialSegs) * Math.PI * 2;
      const bx = Math.cos(a) * radiusFrom;
      const bz = Math.sin(a) * radiusFrom;
      const tx = Math.cos(a) * radiusTo;
      const tz = Math.sin(a) * radiusTo;
      const vBot = new THREE.Vector3(bx, 0, bz).applyQuaternion(quat).add(from);
      const vTop = new THREE.Vector3(tx, length, tz).applyQuaternion(quat).add(from);
      bottom.push(vBot);
      top.push(vTop);
      positions.push(vBot.x, vBot.y, vBot.z);
      positions.push(vTop.x, vTop.y, vTop.z);
    }

    for (let i = 0; i < radialSegs; i++) {
      const i0 = offset + i * 2;
      const i1 = i0 + 1;
      const i2 = i0 + 2;
      const i3 = i0 + 3;
      indices.push(i0, i2, i1, i1, i2, i3);
    }
  }

  private buildRecursive(
    positions: number[],
    indices: number[],
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    radius: number,
    depth: number,
    branches: number,
    twist: number,
    inflation: number
  ): void {
    if (depth <= 0 || length < 0.04) return;
    const end = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(length));
    this.addCylinder(positions, indices, origin, end, radius, radius * 0.7, 14);

    const numBranches = Math.max(2, Math.round(branches / Math.pow(2, 3 - depth)));
    for (let i = 0; i < numBranches; i++) {
      const spread = 0.45 + (i / Math.max(1, numBranches - 1)) * 0.25;
      const rotation = (i / numBranches) * Math.PI * 2 + twist * 0.6;
      const up = new THREE.Vector3(0, 1, 0);
      const tangent = direction.clone().normalize();
      let right = new THREE.Vector3().crossVectors(tangent, up);
      if (right.lengthSq() < 1e-4) right = new THREE.Vector3(1, 0, 0);
      right.normalize();
      const perp = new THREE.Vector3().crossVectors(tangent, right).normalize();
      const branchDir = new THREE.Vector3()
        .addScaledVector(tangent, Math.cos(spread))
        .addScaledVector(
          new THREE.Vector3()
            .addScaledVector(right, Math.cos(rotation))
            .addScaledVector(perp, Math.sin(rotation)),
          Math.sin(spread)
        )
        .normalize();
      this.buildRecursive(
        positions, indices, end, branchDir,
        length * (0.62 + Math.random() * 0.06),
        radius * 0.62,
        depth - 1, branches, twist, inflation
      );
    }
  }

  generate(): THREE.BufferGeometry {
    const { twist, inflation, branches } = this.params;
    const positions: number[] = [];
    const indices: number[] = [];
    const start = new THREE.Vector3(0, -2.6 * inflation, 0);
    const initialDir = new THREE.Vector3(0, 1, 0);
    const initialLength = 2.6 * inflation;
    const initialRadius = 0.32 * inflation;
    const depth = 4;

    this.buildRecursive(
      positions, indices, start, initialDir,
      initialLength, initialRadius, depth,
      branches, twist, inflation
    );

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setIndex(indices);
    this.geometry.computeVertexNormals();
    return this.geometry;
  }

  getVertexCount(): number {
    return (this.geometry.getAttribute('position') as THREE.BufferAttribute).count;
  }
}

export function createSculpture(type: SculptureType, params: SculptureParams): SculptureGeometry {
  switch (type) {
    case 'torusKnot':
      return new TorusKnotSculpture(params);
    case 'spiralBranch':
      return new SpiralBranchSculpture(params);
    case 'fractalTree':
      return new FractalTreeSculpture(params);
    default:
      return new TorusKnotSculpture(params);
  }
}

export class MorphController {
  private targetGeometry: THREE.BufferGeometry;
  private currentPositions: Float32Array;
  private fromPositions: Float32Array | null = null;
  private toPositions: Float32Array | null = null;
  private morphProgress: number = 0;
  private morphDuration: number = 1.5;
  private isMorphing: boolean = false;
  private onUpdate: MorphCallback | null = null;
  private currentType: SculptureType;
  private currentParams: SculptureParams;
  private smoothedParams: SculptureParams;
  private smoothingFactor: number = 1 / (60 * 0.3);

  constructor(initialType: SculptureType = 'torusKnot', initialParams: SculptureParams = DEFAULT_PARAMS) {
    this.currentType = initialType;
    this.currentParams = { ...initialParams };
    this.smoothedParams = { ...initialParams };
    const sculpt = createSculpture(initialType, initialParams);
    this.targetGeometry = sculpt.generate();
    this.currentPositions = new Float32Array(
      (this.targetGeometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
    );
    this.targetGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(this.currentPositions), 3)
    );
    this.targetGeometry.computeVertexNormals();
  }

  setOnUpdate(callback: MorphCallback): void {
    this.onUpdate = callback;
  }

  getGeometry(): THREE.BufferGeometry {
    return this.targetGeometry;
  }

  getCurrentType(): SculptureType {
    return this.currentType;
  }

  getCurrentParams(): SculptureParams {
    return { ...this.currentParams };
  }

  updateParams(params: Partial<SculptureParams>): void {
    this.currentParams = { ...this.currentParams, ...params };
  }

  morphTo(type: SculptureType, duration: number = 1.5): void {
    if (type === this.currentType && !this.isMorphing) return;
    if (this.isMorphing) {
      const sculpt = createSculpture(this.currentType, this.smoothedParams);
      sculpt.generate();
      this.fromPositions = new Float32Array(this.currentPositions);
    } else {
      this.fromPositions = new Float32Array(this.currentPositions);
    }
    const targetSculpt = createSculpture(type, this.smoothedParams);
    const targetGeo = targetSculpt.generate();

    const geos = [this.targetGeometry, targetGeo];
    const targetCount = normalizeLength(geos);
    this.toPositions = padGeometry(targetGeo, targetCount);

    const currentPosAttr = this.targetGeometry.getAttribute('position') as THREE.BufferAttribute;
    if (currentPosAttr.count < targetCount) {
      const newArr = new Float32Array(targetCount * 3);
      newArr.set(this.currentPositions);
      for (let i = currentPosAttr.count; i < targetCount; i++) {
        const seed = i % currentPosAttr.count;
        newArr[i * 3] = this.currentPositions[seed * 3] * 0.001;
        newArr[i * 3 + 1] = this.currentPositions[seed * 3 + 1] * 0.001;
        newArr[i * 3 + 2] = this.currentPositions[seed * 3 + 2] * 0.001;
      }
      this.currentPositions = newArr;
      this.fromPositions = new Float32Array(newArr);
      this.targetGeometry.dispose();
      this.targetGeometry = new THREE.BufferGeometry();
      this.targetGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(this.currentPositions), 3)
      );
    }

    this.morphProgress = 0;
    this.morphDuration = Math.max(0.1, duration);
    this.isMorphing = true;
    this.currentType = type;
  }

  isTransitioning(): boolean {
    return this.isMorphing;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private rebuildCurrent(): void {
    const sculpt = createSculpture(this.currentType, this.smoothedParams);
    const geo = sculpt.generate();
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const needed = posAttr.count * 3;

    if (this.currentPositions.length !== needed) {
      this.currentPositions = new Float32Array(needed);
      this.targetGeometry.dispose();
      this.targetGeometry = new THREE.BufferGeometry();
      this.targetGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(needed), 3)
      );
    }
    this.currentPositions.set(posAttr.array as Float32Array);
    const targetAttr = this.targetGeometry.getAttribute('position') as THREE.BufferAttribute;
    (targetAttr.array as Float32Array).set(this.currentPositions);
    targetAttr.needsUpdate = true;
    this.targetGeometry.computeVertexNormals();
    geo.dispose();
  }

  update(deltaTime: number): void {
    let paramChanged = false;
    const keys: (keyof SculptureParams)[] = ['twist', 'inflation', 'branches'];
    for (const k of keys) {
      const diff = this.currentParams[k] - this.smoothedParams[k];
      if (Math.abs(diff) > 0.0001) {
        this.smoothedParams[k] += diff * Math.min(1, this.smoothingFactor * 60 * deltaTime);
        paramChanged = true;
      }
    }

    if (this.isMorphing && this.fromPositions && this.toPositions) {
      this.morphProgress = Math.min(1, this.morphProgress + deltaTime / this.morphDuration);
      const eased = this.easeInOutCubic(this.morphProgress);
      const posAttr = this.targetGeometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < this.currentPositions.length; i++) {
        arr[i] = this.fromPositions[i] + (this.toPositions[i] - this.fromPositions[i]) * eased;
      }
      this.currentPositions.set(arr);
      posAttr.needsUpdate = true;
      this.targetGeometry.computeVertexNormals();
      if (this.onUpdate) this.onUpdate(this.morphProgress);
      if (this.morphProgress >= 1) {
        this.isMorphing = false;
        this.fromPositions = null;
        this.toPositions = null;
      }
      return;
    }

    if (paramChanged) {
      this.rebuildCurrent();
    }
  }
}
