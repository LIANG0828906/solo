import * as THREE from 'three';
import { FoodSource, Predator, PheromonePoint } from './types';
import { PheromoneSystem } from './PheromoneSystem';

class SimplexNoise {
  private perm: number[];

  constructor(seed: number = Math.random()) {
    this.perm = [];
    const random = this.seededRandom(seed);
    for (let i = 0; i < 256; i++) {
      this.perm[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
    }
    for (let i = 0; i < 256; i++) {
      this.perm[i + 256] = this.perm[i];
    }
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;
    return this.lerp(
      this.lerp(this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y), u),
      this.lerp(this.grad(this.perm[A + 1], x, y - 1), this.grad(this.perm[B + 1], x - 1, y - 1), u),
      v
    );
  }
}

export class Map3D {
  private scene: THREE.Scene;
  private noise: SimplexNoise;
  private readonly MAP_SIZE: number = 50;
  private readonly NOISE_FREQUENCY: number = 0.02;
  private readonly NOISE_AMPLITUDE: number = 2.0;
  private terrainMesh!: THREE.Mesh;
  private nestPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private nestMesh!: THREE.Mesh;
  private foodSources: Map<number, FoodSource> = new Map();
  private predators: Map<number, Predator> = new Map();
  private nextFoodId: number = 0;
  private nextPredatorId: number = 0;
  private pheromoneOverlay!: THREE.Mesh;
  private overlayTexture!: THREE.CanvasTexture;
  private overlayCanvas!: HTMLCanvasElement;
  private lastPredatorSpawnTime: number = 0;
  private readonly PREDATOR_SPAWN_INTERVAL: number = 15000;
  private readonly MAX_PREDATORS: number = 3;
  private readonly FOOD_COUNT: number = 12;
  private onPredatorSpawnCallback: ((time: string) => void) | null = null;
  private onPredatorDetectCallback: (() => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.noise = new SimplexNoise(42);
  }

  public build(): void {
    this.createTerrain();
    this.createNest();
    this.createFoodSources();
    this.createPheromoneOverlay();
    this.createLighting();
  }

  private createLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x88AA66, 0x332211, 0.4);
    this.scene.add(hemisphereLight);
  }

  private createTerrain(): void {
    const segments = 128;
    const geometry = new THREE.PlaneGeometry(this.MAP_SIZE, this.MAP_SIZE, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors: number[] = [];

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = this.computeTerrainHeight(x, z);
      positions.setY(i, height);

      const normalizedHeight = (height + this.NOISE_AMPLITUDE) / (this.NOISE_AMPLITUDE * 2);
      const r = 0.15 + normalizedHeight * 0.15;
      const g = 0.3 + normalizedHeight * 0.3;
      const b = 0.1 + normalizedHeight * 0.05;
      colors.push(r, g, b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  private createNest(): void {
    const height = this.computeTerrainHeight(0, 0);
    this.nestPosition.set(0, height, 0);

    const geometry = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      transparent: true,
      opacity: 0.7,
      roughness: 0.8,
    });

    this.nestMesh = new THREE.Mesh(geometry, material);
    this.nestMesh.position.copy(this.nestPosition);
    this.nestMesh.castShadow = true;
    this.scene.add(this.nestMesh);

    const glowGeometry = new THREE.RingGeometry(1, 2, 64);
    glowGeometry.rotateX(-Math.PI / 2);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(this.nestPosition);
    glow.position.y += 0.01;
    this.scene.add(glow);
  }

  private createFoodSources(): void {
    for (let i = 0; i < this.FOOD_COUNT; i++) {
      this.spawnFoodSource();
    }
  }

  private spawnFoodSource(): void {
    const id = this.nextFoodId++;
    const margin = 5;
    let x: number, z: number;
    let attempts = 0;
    do {
      x = (Math.random() - 0.5) * (this.MAP_SIZE - margin * 2);
      z = (Math.random() - 0.5) * (this.MAP_SIZE - margin * 2);
      attempts++;
    } while (Math.sqrt(x * x + z * z) < 8 && attempts < 50);

    const height = this.computeTerrainHeight(x, z);
    const position = new THREE.Vector3(x, height + 0.3, z);

    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: 0x00AA00,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.foodSources.set(id, {
      id,
      position,
      mesh,
      amount: 100,
    });
  }

  private createPheromoneOverlay(): void {
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = 256;
    this.overlayCanvas.height = 256;
    const ctx = this.overlayCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);

    this.overlayTexture = new THREE.CanvasTexture(this.overlayCanvas);
    this.overlayTexture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(this.MAP_SIZE, this.MAP_SIZE);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.overlayTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    this.pheromoneOverlay = new THREE.Mesh(geometry, material);
    this.pheromoneOverlay.position.y = 0.1;
    this.scene.add(this.pheromoneOverlay);
  }

  public updatePheromoneOverlay(pheromoneSystem: PheromoneSystem): void {
    const ctx = this.overlayCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);

    const scale = 256 / this.MAP_SIZE;
    const halfSize = this.MAP_SIZE / 2;

    for (let x = 0; x < 256; x += 4) {
      for (let z = 0; z < 256; z += 4) {
        const worldX = (x / scale) - halfSize;
        const worldZ = (z / scale) - halfSize;
        const pos = new THREE.Vector3(worldX, 0, worldZ);
        const intensity = pheromoneSystem.getPheromoneIntensityAt(pos, 1.5);
        
        if (intensity > 0.05) {
          const clampedIntensity = Math.min(intensity, 3.0) / 3.0;
          const r = Math.floor(0);
          const g = Math.floor(255 * clampedIntensity);
          const b = Math.floor(255 * clampedIntensity * (intensity > 1.5 ? 1 : 0));
          ctx.fillStyle = `rgba(${r},${g},${b},${clampedIntensity * 0.6})`;
          ctx.fillRect(x, z, 4, 4);
        }
      }
    }
    this.overlayTexture.needsUpdate = true;
  }

  public computeTerrainHeight(x: number, z: number): number {
    const noiseValue = this.noise.noise2D(
      x * this.NOISE_FREQUENCY,
      z * this.NOISE_FREQUENCY
    );
    return noiseValue * this.NOISE_AMPLITUDE;
  }

  public getTerrainHeight(x: number, z: number): number {
    const half = this.MAP_SIZE / 2;
    if (x < -half || x > half || z < -half || z > half) {
      return 0;
    }
    return this.computeTerrainHeight(x, z);
  }

  public getNestPosition(): THREE.Vector3 {
    return this.nestPosition.clone();
  }

  public getMapSize(): number {
    return this.MAP_SIZE;
  }

  public findNearestFoodSource(position: THREE.Vector3, radius: number = 2): FoodSource | null {
    let nearest: FoodSource | null = null;
    let nearestDist = Infinity;

    for (const food of this.foodSources.values()) {
      const dist = food.position.distanceTo(position);
      if (dist < radius && dist < nearestDist) {
        nearest = food;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  public collectFood(foodId: number, amount: number = 1): void {
    const food = this.foodSources.get(foodId);
    if (food) {
      food.amount -= amount;
      if (food.amount <= 0) {
        this.scene.remove(food.mesh);
        food.mesh.geometry.dispose();
        (food.mesh.material as THREE.Material).dispose();
        this.foodSources.delete(foodId);
        setTimeout(() => this.spawnFoodSource(), 5000);
      } else {
        const scale = 0.5 + (food.amount / 100) * 0.5;
        food.mesh.scale.setScalar(scale);
      }
    }
  }

  public getFoodSources(): Array<FoodSource> {
    return Array.from(this.foodSources.values());
  }

  public getPredators(): Array<Predator> {
    return Array.from(this.predators.values());
  }

  public spawnPredator(): void {
    if (this.predators.size >= this.MAX_PREDATORS) return;

    const id = this.nextPredatorId++;
    const half = this.MAP_SIZE / 2 - 1;
    const side = Math.floor(Math.random() * 4);
    let x: number, z: number;

    switch (side) {
      case 0: x = -half; z = (Math.random() - 0.5) * this.MAP_SIZE; break;
      case 1: x = half; z = (Math.random() - 0.5) * this.MAP_SIZE; break;
      case 2: x = (Math.random() - 0.5) * this.MAP_SIZE; z = -half; break;
      default: x = (Math.random() - 0.5) * this.MAP_SIZE; z = half; break;
    }

    const height = this.computeTerrainHeight(x, z);
    const position = new THREE.Vector3(x, height + 0.5, z);

    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xAA0000,
      emissiveIntensity: 0.3,
      roughness: 0.4,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    this.scene.add(mesh);

    const direction = new THREE.Vector3(
      Math.random() - 0.5,
      0,
      Math.random() - 0.5
    ).normalize();

    this.predators.set(id, {
      id,
      mesh,
      position,
      velocity: direction,
      state: 'patrolling',
      chaseStartTime: 0,
      currentTarget: null,
    });

    if (this.onPredatorSpawnCallback) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      this.onPredatorSpawnCallback(timeStr);
    }

    if (this.onPredatorDetectCallback) {
      this.onPredatorDetectCallback();
    }
  }

  public updatePredators(deltaTime: number, workerPositions: Array<{ id: number; position: THREE.Vector3 }>, now: number): { capturedWorkerIds: Array<number> } {
    const capturedWorkerIds: Array<number> = [];

    if (now - this.lastPredatorSpawnTime >= this.PREDATOR_SPAWN_INTERVAL) {
      this.spawnPredator();
      this.lastPredatorSpawnTime = now;
    }

    const patrolSpeed = 1.5;
    const chaseSpeed = 2.5;
    const chaseDuration = 5000;
    const detectionRadius = 5;
    const captureRadius = 0.3;

    for (const predator of this.predators.values()) {
      let nearestWorker: { id: number; position: THREE.Vector3 } | null = null;
      let nearestDist = Infinity;

      for (const wp of workerPositions) {
        const dist = predator.position.distanceTo(wp.position);
        if (dist < detectionRadius && dist < nearestDist) {
          nearestWorker = wp;
          nearestDist = dist;
        }
      }

      if (nearestWorker) {
        if (predator.state !== 'chasing') {
          predator.state = 'chasing';
          predator.chaseStartTime = now;
        }
        predator.currentTarget = nearestWorker.id;
        predator.velocity.copy(nearestWorker.position).sub(predator.position).normalize();

        if (nearestDist < captureRadius) {
          capturedWorkerIds.push(nearestWorker.id);
        }
      } else if (predator.state === 'chasing') {
        if (now - predator.chaseStartTime >= chaseDuration) {
          predator.state = 'patrolling';
          predator.currentTarget = null;
        }
      } else {
        if (Math.random() < 0.01) {
          predator.velocity.set(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
          ).normalize();
        }
      }

      const speed = predator.state === 'chasing' ? chaseSpeed : patrolSpeed;
      const move = predator.velocity.clone().multiplyScalar(speed * deltaTime);
      predator.position.add(move);

      const half = this.MAP_SIZE / 2 - 1;
      if (predator.position.x < -half) { predator.position.x = -half; predator.velocity.x *= -1; }
      if (predator.position.x > half) { predator.position.x = half; predator.velocity.x *= -1; }
      if (predator.position.z < -half) { predator.position.z = -half; predator.velocity.z *= -1; }
      if (predator.position.z > half) { predator.position.z = half; predator.velocity.z *= -1; }

      predator.position.y = this.computeTerrainHeight(predator.position.x, predator.position.z) + 0.5;
      predator.mesh.position.copy(predator.position);

      if (predator.state === 'chasing') {
        predator.mesh.rotation.y = Math.atan2(predator.velocity.x, predator.velocity.z);
      }
    }

    return { capturedWorkerIds };
  }

  public setOnPredatorSpawnCallback(callback: (time: string) => void): void {
    this.onPredatorSpawnCallback = callback;
  }

  public setOnPredatorDetectCallback(callback: () => void): void {
    this.onPredatorDetectCallback = callback;
  }

  public dispose(): void {
    for (const food of this.foodSources.values()) {
      this.scene.remove(food.mesh);
      food.mesh.geometry.dispose();
      (food.mesh.material as THREE.Material).dispose();
    }
    this.foodSources.clear();

    for (const predator of this.predators.values()) {
      this.scene.remove(predator.mesh);
      predator.mesh.geometry.dispose();
      (predator.mesh.material as THREE.Material).dispose();
    }
    this.predators.clear();

    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
    }
    if (this.nestMesh) {
      this.scene.remove(this.nestMesh);
      this.nestMesh.geometry.dispose();
      (this.nestMesh.material as THREE.Material).dispose();
    }
    if (this.pheromoneOverlay) {
      this.scene.remove(this.pheromoneOverlay);
      this.pheromoneOverlay.geometry.dispose();
      (this.pheromoneOverlay.material as THREE.Material).dispose();
      this.overlayTexture.dispose();
    }
  }
}
