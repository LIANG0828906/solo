import * as THREE from 'three';
import { Worker, Predator, WorkerState } from './types';
import { PheromoneSystem } from './PheromoneSystem';

export class WorkerAI {
  private pheromoneSystem: PheromoneSystem;
  private nestPosition: THREE.Vector3;
  private terrainHeightFunction: (x: number, z: number) => number;
  private readonly BASE_SPEED: number = 2.0;
  private readonly BOOSTED_SPEED: number = 3.0;
  private readonly EVACUATE_SPEED: number = 3.0;
  private readonly PREDATOR_DETECTION_RADIUS: number = 5;
  private readonly COLLECT_DURATION: number = 1000;
  private readonly EVACUATE_DURATION: number = 1000;

  constructor(
    pheromoneSystem: PheromoneSystem,
    nestPosition: THREE.Vector3,
    terrainHeightFunction: (x: number, z: number) => number
  ) {
    this.pheromoneSystem = pheromoneSystem;
    this.nestPosition = nestPosition;
    this.terrainHeightFunction = terrainHeightFunction;
  }

  public updateWorker(worker: Worker, deltaTime: number, predators: Array<Predator>, now: number): void {
    if (worker.state === WorkerState.DEAD) return;

    const detectedPredator = this.detectNearbyPredator(worker.position, predators);
    
    if (detectedPredator && worker.state !== WorkerState.EVACUATING) {
      this.triggerEvacuation(worker, detectedPredator.position, now);
    }

    switch (worker.state) {
      case WorkerState.IDLE:
        this.handleIdle(worker);
        break;
      case WorkerState.MOVING_TO_TARGET:
        this.handleMovingToTarget(worker, deltaTime, predators);
        break;
      case WorkerState.COLLECTING:
        this.handleCollecting(worker, now);
        break;
      case WorkerState.RETURNING_TO_NEST:
        this.handleReturningToNest(worker, deltaTime, predators);
        break;
      case WorkerState.EVACUATING:
        this.handleEvacuating(worker, deltaTime, now);
        break;
    }

    this.updateTerrainHeight(worker);
    this.updateWorkerVisual(worker);
  }

  private detectNearbyPredator(position: THREE.Vector3, predators: Array<Predator>): Predator | null {
    for (const predator of predators) {
      const dist = position.distanceTo(predator.position);
      if (dist < this.PREDATOR_DETECTION_RADIUS) {
        return predator;
      }
    }
    return null;
  }

  private triggerEvacuation(worker: Worker, predatorPosition: THREE.Vector3, now: number): void {
    const direction = new THREE.Vector3()
      .subVectors(worker.position, predatorPosition)
      .normalize();
    
    worker.evacuateDirection = direction;
    worker.evacuateEndTime = now + this.EVACUATE_DURATION;
    worker.state = WorkerState.EVACUATING;
    worker.target = null;
  }

  private handleIdle(worker: Worker): void {
    const toNest = new THREE.Vector3().subVectors(this.nestPosition, worker.position);
    toNest.y = 0;
    if (toNest.length() > 0.5) {
      toNest.normalize().multiplyScalar(0.1);
      worker.position.add(toNest);
    }
  }

  private handleMovingToTarget(worker: Worker, deltaTime: number, predators: Array<Predator>): void {
    if (!worker.target) {
      worker.state = WorkerState.IDLE;
      return;
    }

    let direction = this.computeMovementDirection(worker, worker.target, false);
    this.avoidPredators(worker, direction, predators);
    
    this.moveWorker(worker, direction, deltaTime);

    const arrivedDist = worker.carryingFood ? 0.5 : 0.8;
    if (worker.position.distanceTo(worker.target) < arrivedDist) {
      worker.state = WorkerState.COLLECTING;
      worker.collectStartTime = performance.now();
    }
  }

  private handleCollecting(worker: Worker, now: number): void {
    if (now - worker.collectStartTime >= this.COLLECT_DURATION) {
      worker.carryingFood = true;
      worker.state = WorkerState.RETURNING_TO_NEST;
      worker.target = this.nestPosition.clone();
    }
  }

  private handleReturningToNest(worker: Worker, deltaTime: number, predators: Array<Predator>): void {
    let direction = this.computeMovementDirection(worker, this.nestPosition, true);
    this.avoidPredators(worker, direction, predators);

    this.moveWorker(worker, direction, deltaTime);

    if (worker.position.distanceTo(this.nestPosition) < 1.2) {
      if (worker.carryingFood) {
        worker.carryingFood = false;
      }
      worker.state = WorkerState.IDLE;
      worker.target = null;
    }
  }

  private handleEvacuating(worker: Worker, deltaTime: number, now: number): void {
    const speed = this.EVACUATE_SPEED * deltaTime;
    const moveDir = worker.evacuateDirection.clone().multiplyScalar(speed);
    worker.position.add(moveDir);

    if (now >= worker.evacuateEndTime) {
      if (worker.carryingFood) {
        worker.state = WorkerState.RETURNING_TO_NEST;
        worker.target = this.nestPosition.clone();
      } else if (worker.target) {
        worker.state = WorkerState.MOVING_TO_TARGET;
      } else {
        worker.state = WorkerState.IDLE;
      }
    }
  }

  private computeMovementDirection(worker: Worker, target: THREE.Vector3, usePheromone: boolean): THREE.Vector3 {
    if (usePheromone) {
      const pheromoneDir = this.pheromoneSystem.getDirectionToNest(worker.position, this.nestPosition);
      if (pheromoneDir.length() > 0.1) {
        return pheromoneDir.normalize();
      }
    }

    const direction = new THREE.Vector3().subVectors(target, worker.position);
    direction.y = 0;
    return direction.normalize();
  }

  private avoidPredators(worker: Worker, direction: THREE.Vector3, predators: Array<Predator>): void {
    for (const predator of predators) {
      const dist = worker.position.distanceTo(predator.position);
      if (dist < this.PREDATOR_DETECTION_RADIUS) {
        const avoidDir = new THREE.Vector3()
          .subVectors(worker.position, predator.position)
          .normalize();
        const strength = 1 - (dist / this.PREDATOR_DETECTION_RADIUS);
        direction.lerp(avoidDir, strength * 0.8);
        direction.normalize();
      }
    }
  }

  private moveWorker(worker: Worker, direction: THREE.Vector3, deltaTime: number): void {
    const nearBoost = this.pheromoneSystem.checkAndApplyStackEffect(worker.position);
    const pheromoneIntensity = this.pheromoneSystem.getPheromoneIntensityAt(worker.position, 2);
    const boosted = nearBoost || pheromoneIntensity > 2.0;
    
    worker.speed = boosted ? this.BOOSTED_SPEED : this.BASE_SPEED;
    worker.baseSpeed = worker.speed;

    const moveAmount = direction.multiplyScalar(worker.speed * deltaTime);
    worker.position.add(moveAmount);

    worker.mesh.position.copy(worker.position);
    if (moveAmount.length() > 0.001) {
      worker.mesh.rotation.y = Math.atan2(moveAmount.x, moveAmount.z);
    }
  }

  private updateTerrainHeight(worker: Worker): void {
    const height = this.terrainHeightFunction(worker.position.x, worker.position.z);
    worker.position.y = height + 0.15;
    worker.mesh.position.y = worker.position.y;
  }

  private updateWorkerVisual(worker: Worker): void {
    worker.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const targetColor = worker.carryingFood ? 0xFFD700 : 0x222222;
        child.material.color.lerp(new THREE.Color(targetColor), 0.2);
        
        if (worker.state === WorkerState.EVACUATING) {
          child.material.emissive = new THREE.Color(0xFF0000);
          child.material.emissiveIntensity = 0.3 + Math.sin(performance.now() * 0.02) * 0.2;
        } else {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }
}
