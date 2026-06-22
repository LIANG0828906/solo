import * as THREE from 'three';
import { Worker, WorkerState, CollectionTask, GameStats, Predator } from './types';
import { PheromoneSystem } from './PheromoneSystem';
import { WorkerAI } from './WorkerAI';
import { Map3D } from './Map3D';

export class AntColony {
  private scene: THREE.Scene;
  private pheromoneSystem: PheromoneSystem;
  private workerAI: WorkerAI;
  private map3D: Map3D;
  private workers: Map<number, Worker> = new Map();
  private tasks: Map<number, CollectionTask> = new Map();
  private nextWorkerId: number = 0;
  private nextTaskId: number = 0;
  private readonly MAX_WORKERS: number = 30;
  private readonly INITIAL_WORKERS: number = 10;
  private foodCollected: number = 0;
  private nestPosition: THREE.Vector3;
  private onStatsUpdateCallback: ((stats: GameStats) => void) | null = null;
  private onFoodCollectedCallback: (() => void) | null = null;

  constructor(scene: THREE.Scene, pheromoneSystem: PheromoneSystem, map3D: Map3D) {
    this.scene = scene;
    this.pheromoneSystem = pheromoneSystem;
    this.map3D = map3D;
    this.nestPosition = map3D.getNestPosition();
    this.workerAI = new WorkerAI(
      this.pheromoneSystem,
      this.nestPosition,
      (x, z) => this.map3D.getTerrainHeight(x, z)
    );

    this.spawnInitialWorkers();
  }

  private spawnInitialWorkers(): void {
    for (let i = 0; i < this.INITIAL_WORKERS; i++) {
      this.spawnWorker();
    }
  }

  private spawnWorker(): Worker | null {
    if (this.workers.size >= this.MAX_WORKERS) return null;

    const id = this.nextWorkerId++;
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2
    );
    const position = this.nestPosition.clone().add(offset);
    position.y = this.map3D.getTerrainHeight(position.x, position.z) + 0.15;

    const mesh = this.createWorkerMesh();
    mesh.position.copy(position);
    this.scene.add(mesh);

    const worker: Worker = {
      id,
      mesh,
      state: WorkerState.IDLE,
      position,
      target: null,
      carryingFood: false,
      speed: 2.0,
      baseSpeed: 2.0,
      lastPheromoneTime: 0,
      collectStartTime: 0,
      evacuateDirection: new THREE.Vector3(),
      evacuateEndTime: 0,
    };

    this.workers.set(id, worker);
    return worker;
  }

  private createWorkerMesh(): THREE.Group {
    const group = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.7,
      metalness: 0.1,
    });

    const abdomenGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const abdomen = new THREE.Mesh(abdomenGeo, bodyMaterial);
    abdomen.position.z = 0.08;
    group.add(abdomen);

    const thoraxGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const thorax = new THREE.Mesh(thoraxGeo, bodyMaterial);
    thorax.position.z = -0.02;
    group.add(thorax);

    const headGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const head = new THREE.Mesh(headGeo, bodyMaterial);
    head.position.z = -0.12;
    group.add(head);

    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
    });

    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 3; i++) {
        const legGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 4);
        const leg = new THREE.Mesh(legGeo, legMaterial);
        leg.rotation.z = Math.PI / 4 * side;
        leg.position.set(
          side * 0.06,
          -0.05,
          -0.05 + i * 0.05
        );
        group.add(leg);
      }
    }

    const antennaGeo = new THREE.CylinderGeometry(0.005, 0.003, 0.1, 4);
    const antenna1 = new THREE.Mesh(antennaGeo, legMaterial);
    antenna1.rotation.z = -0.5;
    antenna1.position.set(-0.03, 0.05, -0.18);
    group.add(antenna1);

    const antenna2 = new THREE.Mesh(antennaGeo, legMaterial);
    antenna2.rotation.z = 0.5;
    antenna2.position.set(0.03, 0.05, -0.18);
    group.add(antenna2);

    group.scale.setScalar(1.5);
    return group;
  }

  public createCollectionTask(position: THREE.Vector3): void {
    const food = this.map3D.findNearestFoodSource(position, 2);
    const targetPos = food ? food.position.clone() : position.clone();
    targetPos.y = this.map3D.getTerrainHeight(targetPos.x, targetPos.z);

    const id = this.nextTaskId++;
    this.tasks.set(id, {
      id,
      position: targetPos,
      assignedWorkerId: null,
      createdAt: performance.now(),
    });

    this.assignNearestIdleWorker(id);
  }

  private assignNearestIdleWorker(taskId: number): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    let nearestWorker: Worker | null = null;
    let nearestDist = Infinity;

    for (const worker of this.workers.values()) {
      if (worker.state !== WorkerState.IDLE || worker.carryingFood) continue;
      const dist = worker.position.distanceTo(task.position);
      if (dist < nearestDist) {
        nearestWorker = worker;
        nearestDist = dist;
      }
    }

    if (nearestWorker) {
      task.assignedWorkerId = nearestWorker.id;
      nearestWorker.target = task.position.clone();
      nearestWorker.state = WorkerState.MOVING_TO_TARGET;
    }
  }

  public update(deltaTime: number, now: number): void {
    const predators = this.map3D.getPredators();
    const workerPositions = Array.from(this.workers.values())
      .filter(w => w.state !== WorkerState.DEAD)
      .map(w => ({ id: w.id, position: w.position.clone() }));

    const { capturedWorkerIds } = this.map3D.updatePredators(deltaTime, workerPositions, now);
    
    for (const capturedId of capturedWorkerIds) {
      this.handleWorkerCaptured(capturedId, predators, now);
    }

    const workersArray = Array.from(this.workers.values());
    for (const worker of workersArray) {
      if (worker.state === WorkerState.DEAD) continue;

      const prevState = worker.state;
      const prevCarrying = worker.carryingFood;

      this.workerAI.updateWorker(worker, deltaTime, predators, now);

      if (prevCarrying && !worker.carryingFood && prevState === WorkerState.RETURNING_TO_NEST) {
        this.foodCollected++;
        if (this.onFoodCollectedCallback) {
          this.onFoodCollectedCallback();
        }
        this.completeWorkerTask(worker);
        this.tryRespawnWorker();
      }

      if (worker.state === WorkerState.IDLE && !worker.carryingFood && !worker.target) {
        this.assignPendingTask(worker);
      }
    }

    this.pheromoneSystem.update(deltaTime, workersArray);
    this.notifyStatsUpdate();
    this.cleanupDeadWorkers();
  }

  private handleWorkerCaptured(workerId: number, predators: Predator[], now: number): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    const workerPos = worker.position.clone();
    for (const w of this.workers.values()) {
      if (w.state === WorkerState.DEAD) continue;
      if (w.position.distanceTo(workerPos) < 3) {
        let nearestPredator = predators[0];
        let nearestDist = Infinity;
        for (const p of predators) {
          const d = p.position.distanceTo(w.position);
          if (d < nearestDist) {
            nearestDist = d;
            nearestPredator = p;
          }
        }
        if (nearestPredator) {
          const direction = new THREE.Vector3()
            .subVectors(w.position, nearestPredator.position)
            .normalize();
          w.evacuateDirection = direction;
          w.evacuateEndTime = now + 1000;
          w.state = WorkerState.EVACUATING;
          w.target = null;
        }
      }
    }

    worker.state = WorkerState.DEAD;
    this.scene.remove(worker.mesh);
    this.releaseWorkerTask(worker);
  }

  private completeWorkerTask(worker: Worker): void {
    for (const [taskId, task] of this.tasks) {
      if (task.assignedWorkerId === worker.id) {
        this.tasks.delete(taskId);
        break;
      }
    }
  }

  private releaseWorkerTask(worker: Worker): void {
    for (const [taskId, task] of this.tasks) {
      if (task.assignedWorkerId === worker.id) {
        task.assignedWorkerId = null;
        this.assignNearestIdleWorker(taskId);
        break;
      }
    }
  }

  private assignPendingTask(worker: Worker): void {
    for (const [taskId, task] of this.tasks) {
      if (task.assignedWorkerId === null) {
        task.assignedWorkerId = worker.id;
        worker.target = task.position.clone();
        worker.state = WorkerState.MOVING_TO_TARGET;
        return;
      }
    }
  }

  private tryRespawnWorker(): void {
    const aliveCount = Array.from(this.workers.values()).filter(w => w.state !== WorkerState.DEAD).length;
    if (aliveCount < this.INITIAL_WORKERS) {
      this.spawnWorker();
    }
  }

  private cleanupDeadWorkers(): void {
    const toRemove: number[] = [];
    for (const [id, worker] of this.workers) {
      if (worker.state === WorkerState.DEAD) {
        worker.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.workers.delete(id);
    }
  }

  public getWorkerPositions(): Array<{ id: number; position: THREE.Vector3 }> {
    return Array.from(this.workers.values())
      .filter(w => w.state !== WorkerState.DEAD)
      .map(w => ({ id: w.id, position: w.position.clone() }));
  }

  public getWorkersCount(): number {
    return Array.from(this.workers.values()).filter(w => w.state !== WorkerState.DEAD).length;
  }

  public getCarryingCount(): number {
    return Array.from(this.workers.values()).filter(w => w.carryingFood && w.state !== WorkerState.DEAD).length;
  }

  public getFoodCollected(): number {
    return this.foodCollected;
  }

  public setOnStatsUpdateCallback(callback: (stats: GameStats) => void): void {
    this.onStatsUpdateCallback = callback;
  }

  public setOnFoodCollectedCallback(callback: () => void): void {
    this.onFoodCollectedCallback = callback;
  }

  private notifyStatsUpdate(): void {
    if (this.onStatsUpdateCallback) {
      this.onStatsUpdateCallback({
        totalWorkers: this.getWorkersCount(),
        carryingFood: this.getCarryingCount(),
        foodCollected: this.foodCollected,
        pheromoneCount: this.pheromoneSystem.getActiveCount(),
        predatorCount: this.map3D.getPredators().length,
      });
    }
  }

  public dispose(): void {
    for (const worker of this.workers.values()) {
      this.scene.remove(worker.mesh);
      worker.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    this.workers.clear();
    this.tasks.clear();
  }
}
