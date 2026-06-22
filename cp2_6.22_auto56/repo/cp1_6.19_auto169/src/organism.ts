import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';

const SPECIES_COLORS = [0x00e5ff, 0xff6f00, 0xe040fb];

const MAX_TRAIL = 500;
let globalTrailCount = 0;

export class Organism {
  mesh: THREE.Group;
  species: number;
  speed: number;
  forageRange: number;
  feedCount: number;
  reproThreshold: number;
  aliveTime: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  wanderAngle: number;
  isSelected: boolean;
  trailParticles: Array<{ mesh: THREE.Mesh; life: number }>;
  _originalScale: number;
  _spawnAnimProgress: number;
  _birthTime: number;

  private _bodyMaterial: THREE.MeshPhongMaterial;
  private _glowMaterial: THREE.MeshBasicMaterial;
  private _wireframeMesh: THREE.Mesh | null;
  private _wireframeMaterial: THREE.MeshBasicMaterial | null;
  private _trailCounter: number;

  constructor(species: number, position: THREE.Vector3, speed?: number, forageRange?: number) {
    this.species = species;
    this.speed = speed ?? (0.3 + Math.random() * 0.7);
    this.forageRange = forageRange ?? (2 + Math.random() * 2);
    this.feedCount = 0;
    this.reproThreshold = 3 + Math.floor(Math.random() * 3);
    this.aliveTime = 0;
    this.position = position.clone();
    this.velocity = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize().multiplyScalar(this.speed);
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.isSelected = false;
    this.trailParticles = [];
    this._originalScale = 1.0;
    this._spawnAnimProgress = 0;
    this._birthTime = performance.now() / 1000;
    this._wireframeMesh = null;
    this._wireframeMaterial = null;
    this._trailCounter = 0;

    const color = SPECIES_COLORS[species];

    const vertexCount = 8 + Math.floor(Math.random() * 9);
    const baseRadius = 0.3 + Math.random() * 0.2;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < vertexCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = baseRadius * (0.8 + Math.random() * 0.4);
      points.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }

    const convexGeo = new ConvexGeometry(points);

    this._bodyMaterial = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: 0.7,
      emissive: color,
      emissiveIntensity: 0.3
    });

    const bodyMesh = new THREE.Mesh(convexGeo, this._bodyMaterial);

    const pointLight = new THREE.PointLight(color, 0.3, 3);

    const glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
    this._glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.08
    });
    const glowMesh = new THREE.Mesh(glowGeo, this._glowMaterial);

    this.mesh = new THREE.Group();
    this.mesh.add(bodyMesh);
    this.mesh.add(pointLight);
    this.mesh.add(glowMesh);
    this.mesh.position.copy(this.position);
    this.mesh.scale.set(0, 0, 0);
  }

  update(deltaTime: number, bounds: number): void {
    this.aliveTime += deltaTime;

    if (this._spawnAnimProgress < 1) {
      this._spawnAnimProgress = Math.min(1, this._spawnAnimProgress + deltaTime / 0.5);
      const t = this._spawnAnimProgress;
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      const s = eased * this._originalScale;
      this.mesh.scale.set(s, s, s);
    } else if (this.isSelected && this._originalScale !== 1.5) {
      this._originalScale = 1.5;
    } else if (!this.isSelected && this._originalScale !== 1.0) {
      this._originalScale = 1.0;
    }

    if (this._spawnAnimProgress >= 1) {
      const s = this._originalScale;
      this.mesh.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, 5 * deltaTime));
    }

    const forward = this.velocity.clone().normalize();
    const up = Math.abs(forward.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const perp = new THREE.Vector3().crossVectors(forward, right).normalize();

    this.wanderAngle += 4.0 * deltaTime;
    const wiggle = perp.multiplyScalar(Math.sin(this.wanderAngle) * 0.3);
    this.velocity.add(wiggle);
    this.velocity.normalize().multiplyScalar(this.speed);

    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    const half = bounds / 2;
    if (this.position.x > half) { this.velocity.x *= -1; this.position.x = half; }
    if (this.position.x < -half) { this.velocity.x *= -1; this.position.x = -half; }
    if (this.position.y > half) { this.velocity.y *= -1; this.position.y = half; }
    if (this.position.y < -half) { this.velocity.y *= -1; this.position.y = -half; }
    if (this.position.z > half) { this.velocity.z *= -1; this.position.z = half; }
    if (this.position.z < -half) { this.velocity.z *= -1; this.position.z = -half; }

    this._trailCounter++;
    if (this._trailCounter % 2 === 0 && globalTrailCount < MAX_TRAIL) {
      const trailGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const trailMat = new THREE.MeshBasicMaterial({
        color: SPECIES_COLORS[this.species],
        transparent: true,
        opacity: 0.5
      });
      const trailMesh = new THREE.Mesh(trailGeo, trailMat);
      trailMesh.position.copy(this.position);
      this.mesh.parent?.add(trailMesh);
      this.trailParticles.push({ mesh: trailMesh, life: 1.0 });
      globalTrailCount++;
    }

    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.life -= deltaTime;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life * 0.5);
      if (p.life <= 0) {
        p.mesh.parent?.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.MeshBasicMaterial).dispose();
        this.trailParticles.splice(i, 1);
        globalTrailCount--;
      }
    }

    this.mesh.position.copy(this.position);
  }

  checkEat(foodArray: THREE.Mesh[]): THREE.Mesh | null {
    let nearest: THREE.Mesh | null = null;
    let nearestDist = this.forageRange;

    for (const food of foodArray) {
      const dist = this.position.distanceTo(food.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = food;
      }
    }

    if (nearest !== null && nearestDist < 0.5) {
      this.feedCount++;
      return nearest;
    }

    return null;
  }

  findNearestFood(foodArray: THREE.Mesh[]): THREE.Vector3 | null {
    let nearest: THREE.Vector3 | null = null;
    let nearestDist = this.forageRange;

    for (const food of foodArray) {
      const dist = this.position.distanceTo(food.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = food.position;
      }
    }

    return nearest;
  }

  reproduce(): Organism | null {
    if (this.feedCount < this.reproThreshold) return null;

    this.feedCount = 0;

    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 1.6,
      (Math.random() - 0.5) * 1.6,
      (Math.random() - 0.5) * 1.6
    );
    const newPos = this.position.clone().add(offset);

    return new Organism(this.species, newPos, this.speed * 2 / 3, this.forageRange * 0.5);
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;

    if (selected) {
      this._originalScale = 1.5;

      if (!this._wireframeMesh) {
        const bodyMesh = this.mesh.children[0] as THREE.Mesh;
        const wireGeo = new (bodyMesh.geometry as THREE.BufferGeometry).constructor();
        wireGeo.copy(bodyMesh.geometry as THREE.BufferGeometry);
        this._wireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.4
        });
        this._wireframeMesh = new THREE.Mesh(wireGeo, this._wireframeMaterial);
        this.mesh.add(this._wireframeMesh);
      }
    } else {
      this._originalScale = 1.0;

      if (this._wireframeMesh) {
        this.mesh.remove(this._wireframeMesh);
        this._wireframeMesh.geometry.dispose();
        this._wireframeMaterial?.dispose();
        this._wireframeMesh = null;
        this._wireframeMaterial = null;
      }
    }
  }

  steerToward(target: THREE.Vector3, deltaTime: number): void {
    const direction = target.clone().sub(this.position).normalize().multiplyScalar(this.speed);
    this.velocity.lerp(direction, Math.min(1, 2.0 * deltaTime));
    this.velocity.normalize().multiplyScalar(this.speed);
  }

  wander(deltaTime: number): void {
    const angle = (Math.random() - 0.5) * 2.0 * deltaTime;
    const axis = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    this.velocity.applyAxisAngle(axis, angle);
    this.velocity.normalize().multiplyScalar(this.speed);
  }

  dispose(): void {
    for (const p of this.trailParticles) {
      p.mesh.parent?.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.MeshBasicMaterial).dispose();
      globalTrailCount--;
    }
    this.trailParticles = [];

    if (this._wireframeMesh) {
      this._wireframeMesh.geometry.dispose();
      this._wireframeMaterial?.dispose();
    }

    this.mesh.children.forEach(child => {
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      if ((child as THREE.Mesh).material) {
        ((child as THREE.Mesh).material as THREE.Material).dispose();
      }
    });

    this.mesh.parent?.remove(this.mesh);
  }
}
