import * as THREE from 'three';

export type ForceFieldType = 'attract' | 'repel' | 'spiral';

export interface ForceField {
  id: number;
  type: ForceFieldType;
  position: THREE.Vector3;
  path?: THREE.Vector3[];
  radius: number;
  strength: number;
  lifetime: number;
  maxLifetime: number;
  spiralAngle: number;
  isActive: boolean;
  isDecaying: boolean;
}

const COLOR_ATTRACT = new THREE.Color(0x00ff66);
const COLOR_REPEL = new THREE.Color(0xff3344);
const COLOR_SPIRAL = new THREE.Color(0x3399ff);

export class ForceManager {
  public forceFields: ForceField[] = [];
  public currentMode: ForceFieldType = 'attract';
  public helperGroup: THREE.Group;

  private nextId = 0;
  private activeSpiral: ForceField | null = null;
  private spiralPathPoints: THREE.Vector3[] = [];
  private spiralGenerateTimer = 0;

  constructor() {
    this.helperGroup = new THREE.Group();
  }

  public setMode(mode: ForceFieldType): void {
    this.currentMode = mode;
  }

  public addPointForce(position: THREE.Vector3, type?: ForceFieldType): void {
    const fieldType = type || this.currentMode;
    if (fieldType === 'spiral') return;

    const field: ForceField = {
      id: this.nextId++,
      type: fieldType,
      position: position.clone(),
      radius: 2,
      strength: fieldType === 'attract' ? 8 : -8,
      lifetime: 0,
      maxLifetime: 2,
      spiralAngle: 0,
      isActive: true,
      isDecaying: false,
    };
    this.forceFields.push(field);
    this.createSphereHelper(field);
  }

  public startSpiral(position: THREE.Vector3): void {
    this.spiralPathPoints = [position.clone()];
    this.activeSpiral = {
      id: this.nextId++,
      type: 'spiral',
      position: position.clone(),
      path: this.spiralPathPoints,
      radius: 0.5,
      strength: 6,
      lifetime: 0,
      maxLifetime: 3,
      spiralAngle: 0,
      isActive: true,
      isDecaying: false,
    };
    this.forceFields.push(this.activeSpiral);
    this.createSpiralHelper(this.activeSpiral);
  }

  public updateSpiral(position: THREE.Vector3, dt: number): number {
    if (!this.activeSpiral) return 0;

    const lastPoint = this.spiralPathPoints[this.spiralPathPoints.length - 1];
    if (lastPoint.distanceTo(position) > 0.1) {
      this.spiralPathPoints.push(position.clone());
      this.activeSpiral!.position.copy(position);
      this.updateSpiralHelper(this.activeSpiral!);
    }

    this.spiralGenerateTimer += dt;
    let toSpawn = 0;
    const spawnInterval = 1 / 50;
    while (this.spiralGenerateTimer >= spawnInterval) {
      this.spiralGenerateTimer -= spawnInterval;
      toSpawn++;
    }
    return toSpawn;
  }

  public endSpiral(): void {
    if (this.activeSpiral) {
      this.activeSpiral.isDecaying = true;
      this.activeSpiral.lifetime = 0;
      this.activeSpiral = null;
    }
    this.spiralGenerateTimer = 0;
  }

  public getSpiralSpawnPosition(): THREE.Vector3 | null {
    if (this.spiralPathPoints.length === 0) return null;
    const last = this.spiralPathPoints[this.spiralPathPoints.length - 1];
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
    );
    return last.clone().add(offset);
  }

  public update(
    positions: Float32Array,
    velocities: Float32Array,
    count: number,
    dt: number,
  ): void {
    const removeFields: number[] = [];

    for (let f = 0; f < this.forceFields.length; f++) {
      const field = this.forceFields[f];

      if (field.type !== 'spiral') {
        field.lifetime += dt;
        const alpha = Math.max(0, 1 - field.lifetime / field.maxLifetime);
        this.updateHelperOpacity(field, alpha);
        if (field.lifetime >= field.maxLifetime) {
          removeFields.push(f);
          continue;
        }
      } else {
        if (field.isDecaying) {
          field.lifetime += dt;
          const alpha = Math.max(0, 1 - field.lifetime / field.maxLifetime);
          this.updateHelperOpacity(field, alpha);
          if (field.lifetime >= field.maxLifetime) {
            removeFields.push(f);
            continue;
          }
        }
      }

      if (field.type === 'spiral') {
        this.applySpiralForce(field, positions, velocities, count, dt);
      } else {
        this.applyPointForce(field, positions, velocities, count, dt);
      }
    }

    for (let i = removeFields.length - 1; i >= 0; i--) {
      const idx = removeFields[i];
      this.removeHelper(this.forceFields[idx]);
      this.forceFields.splice(idx, 1);
    }
  }

  private applyPointForce(
    field: ForceField,
    positions: Float32Array,
    velocities: Float32Array,
    count: number,
    dt: number,
  ): void {
    const fx = field.position.x;
    const fy = field.position.y;
    const fz = field.position.z;
    const radiusSq = field.radius * field.radius;
    const isAttract = field.type === 'attract';
    const decayFactor = Math.max(0, 1 - field.lifetime / field.maxLifetime);
    const burstWindow = 0.8;
    const inBurstPhase = field.lifetime < burstWindow;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const dx = fx - positions[ix];
      const dy = fy - positions[ix + 1];
      const dz = fz - positions[ix + 2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq > radiusSq) continue;

      const dist = Math.sqrt(distSq) + 0.0001;

      if (isAttract && inBurstPhase && dist < 0.25) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 2 + Math.random() * 2;
        velocities[ix] = Math.sin(phi) * Math.cos(theta) * speed;
        velocities[ix + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        velocities[ix + 2] = Math.cos(phi) * speed;
        continue;
      }

      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      const t = 1 - dist / field.radius;
      const accel = field.strength * t * t * decayFactor;

      const currentSpeed = Math.sqrt(
        velocities[ix] ** 2 + velocities[ix + 1] ** 2 + velocities[ix + 2] ** 2,
      );
      const maxSpeed = 3;

      if (isAttract && currentSpeed < maxSpeed) {
        const speedBoost = (maxSpeed - currentSpeed) * t;
        velocities[ix] += nx * (accel * dt + speedBoost * dt);
        velocities[ix + 1] += ny * (accel * dt + speedBoost * dt);
        velocities[ix + 2] += nz * (accel * dt + speedBoost * dt);
      } else {
        velocities[ix] += nx * accel * dt;
        velocities[ix + 1] += ny * accel * dt;
        velocities[ix + 2] += nz * accel * dt;
      }
    }
  }

  private applySpiralForce(
    field: ForceField,
    positions: Float32Array,
    velocities: Float32Array,
    count: number,
    dt: number,
  ): void {
    if (!field.path || field.path.length < 2) return;

    const path = field.path;
    const angularVel = Math.PI;
    const decayFactor = field.isDecaying
      ? Math.max(0, 1 - field.lifetime / field.maxLifetime)
      : 1;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      let nearestDist = Infinity;
      let nearestIdx = 0;
      let nearestT = 0;

      for (let p = 0; p < path.length - 1; p++) {
        const a = path[p];
        const b = path[p + 1];
        const abx = b.x - a.x;
        const aby = b.y - a.y;
        const abz = b.z - a.z;
        const apx = positions[ix] - a.x;
        const apy = positions[ix + 1] - a.y;
        const apz = positions[ix + 2] - a.z;
        const abLenSq = abx * abx + aby * aby + abz * abz;
        if (abLenSq < 0.0001) continue;
        let t = (apx * abx + apy * aby + apz * abz) / abLenSq;
        t = Math.max(0, Math.min(1, t));
        const cx = a.x + abx * t;
        const cy = a.y + aby * t;
        const cz = a.z + abz * t;
        const distSq =
          (positions[ix] - cx) ** 2 +
          (positions[ix + 1] - cy) ** 2 +
          (positions[ix + 2] - cz) ** 2;
        if (distSq < nearestDist) {
          nearestDist = distSq;
          nearestIdx = p;
          nearestT = t;
        }
      }

      const influenceRadius = 1.5;
      if (nearestDist > influenceRadius * influenceRadius) continue;

      const a = path[nearestIdx];
      const b = path[Math.min(nearestIdx + 1, path.length - 1)];
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const abz = b.z - a.z;
      const abLen = Math.sqrt(abx * abx + aby * aby + abz * abz) + 0.0001;
      const tangentX = abx / abLen;
      const tangentY = aby / abLen;
      const tangentZ = abz / abLen;

      const cx = a.x + (b.x - a.x) * nearestT;
      const cy = a.y + (b.y - a.y) * nearestT;
      const cz = a.z + (b.z - a.z) * nearestT;

      const radialX = positions[ix] - cx;
      const radialY = positions[ix + 1] - cy;
      const radialZ = positions[ix + 2] - cz;
      const radialDist = Math.sqrt(nearestDist) + 0.0001;

      const perpX = tangentY * radialZ - tangentZ * radialY;
      const perpY = tangentZ * radialX - tangentX * radialZ;
      const perpZ = tangentX * radialY - tangentY * radialX;
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ) + 0.0001;

      const distFactor = (1 - radialDist / influenceRadius) * decayFactor;
      const targetRadius = 0.5;
      const pullStrength = (targetRadius - radialDist) * 4 * distFactor;

      const spiralSpeed = angularVel * radialDist * distFactor;
      const forwardSpeed = 2 * distFactor;

      velocities[ix] +=
        (perpX / perpLen) * spiralSpeed * dt +
        (radialX / radialDist) * pullStrength * dt +
        tangentX * forwardSpeed * dt;
      velocities[ix + 1] +=
        (perpY / perpLen) * spiralSpeed * dt +
        (radialY / radialDist) * pullStrength * dt +
        tangentY * forwardSpeed * dt;
      velocities[ix + 2] +=
        (perpZ / perpLen) * spiralSpeed * dt +
        (radialZ / radialDist) * pullStrength * dt +
        tangentZ * forwardSpeed * dt;
    }
  }

  private helperMap = new Map<number, THREE.Object3D>();

  private createSphereHelper(field: ForceField): void {
    const color =
      field.type === 'attract' ? COLOR_ATTRACT : COLOR_REPEL;
    const geometry = new THREE.SphereGeometry(field.radius, 24, 16);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(field.position);
    this.helperGroup.add(mesh);
    this.helperMap.set(field.id, mesh);
  }

  private createSpiralHelper(field: ForceField): void {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: COLOR_SPIRAL,
      transparent: true,
      opacity: 0.3,
    });
    const line = new THREE.Line(geometry, material);
    this.helperGroup.add(line);
    this.helperMap.set(field.id, line);
    this.updateSpiralHelper(field);
  }

  private updateSpiralHelper(field: ForceField): void {
    const helper = this.helperMap.get(field.id);
    if (!helper || !(helper instanceof THREE.Line) || !field.path) return;

    const posArr: number[] = [];
    for (const p of field.path) {
      posArr.push(p.x, p.y, p.z);
    }
    helper.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(posArr, 3),
    );
    helper.geometry.computeBoundingSphere();
  }

  private updateHelperOpacity(field: ForceField, alpha: number): void {
    const helper = this.helperMap.get(field.id);
    if (!helper) return;
    if (helper instanceof THREE.Mesh) {
      (helper.material as THREE.MeshBasicMaterial).opacity = alpha * 0.3;
    } else if (helper instanceof THREE.Line) {
      (helper.material as THREE.LineBasicMaterial).opacity = alpha * 0.3;
    }
  }

  private removeHelper(field: ForceField): void {
    const helper = this.helperMap.get(field.id);
    if (helper) {
      this.helperGroup.remove(helper);
      if (helper instanceof THREE.Mesh) {
        helper.geometry.dispose();
        (helper.material as THREE.Material).dispose();
      } else if (helper instanceof THREE.Line) {
        helper.geometry.dispose();
        (helper.material as THREE.Material).dispose();
      }
      this.helperMap.delete(field.id);
    }
  }
}
