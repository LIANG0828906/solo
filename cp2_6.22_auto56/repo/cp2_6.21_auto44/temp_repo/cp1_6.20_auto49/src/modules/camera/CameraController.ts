import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Building, CameraMode } from '../../types';

interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

class CameraController {
  private camera: THREE.PerspectiveCamera | null = null;
  private domElement: HTMLElement | null = null;
  private orbitControls: OrbitControls | null = null;
  private pointerLockControls: PointerLockControls | null = null;
  private currentMode: CameraMode = 'orbit';
  private targetMode: CameraMode = 'orbit';
  private transitionProgress: number = 1;
  private transitionDuration: number = 0.8;
  private transitionStartPosition: THREE.Vector3 = new THREE.Vector3();
  private transitionTargetPosition: THREE.Vector3 = new THREE.Vector3();
  private transitionStartQuaternion: THREE.Quaternion = new THREE.Quaternion();
  private transitionTargetQuaternion: THREE.Quaternion = new THREE.Quaternion();

  private keys: Record<string, boolean> = {};
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private moveSpeed: number = 50;
  private playerRadius: number = 2;
  private playerHeight: number = 1.7;

  public init(camera: THREE.PerspectiveCamera, domElement: HTMLElement): void {
    this.camera = camera;
    this.domElement = domElement;

    this.orbitControls = new OrbitControls(camera, domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 10;
    this.orbitControls.maxDistance = 500;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.01;
    this.orbitControls.target.set(0, 10, 0);

    this.pointerLockControls = new PointerLockControls(camera, domElement);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.domElement) return;

    document.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;
    });

    document.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });

    this.domElement.addEventListener('click', () => {
      if (this.currentMode === 'firstPerson' && this.pointerLockControls) {
        this.pointerLockControls.lock();
      }
    });
  }

  public setMode(mode: CameraMode): void {
    if (this.targetMode === mode || !this.camera) return;

    this.targetMode = mode;
    this.transitionProgress = 0;

    this.transitionStartPosition.copy(this.camera.position);
    this.transitionStartQuaternion.copy(this.camera.quaternion);

    if (this.orbitControls) {
      this.orbitControls.enabled = false;
    }

    if (mode === 'orbit') {
      if (this.pointerLockControls) {
        this.pointerLockControls.unlock();
      }
      this.transitionTargetPosition.set(0, 100, 150);
      this.transitionTargetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    } else {
      this.transitionTargetPosition.set(0, this.playerHeight, 30);
      const lookAt = new THREE.Vector3(0, this.playerHeight, 0);
      this.transitionTargetQuaternion.setFromRotationMatrix(
        new THREE.Matrix4().lookAt(this.transitionTargetPosition, lookAt, new THREE.Vector3(0, 1, 0))
      );
    }
  }

  public update(delta: number, buildings: Building[]): void {
    if (!this.camera) return;

    if (this.transitionProgress < 1) {
      this.updateTransition(delta);
      return;
    }

    if (this.currentMode === 'orbit') {
      this.orbitControls?.update();
    } else if (this.currentMode === 'firstPerson') {
      this.updateFirstPerson(delta, buildings);
    }
  }

  private updateTransition(delta: number): void {
    if (!this.camera) return;

    this.transitionProgress = Math.min(1, this.transitionProgress + delta / this.transitionDuration);
    const t = this.easeInOutCubic(this.transitionProgress);

    this.camera.position.lerpVectors(
      this.transitionStartPosition,
      this.transitionTargetPosition,
      t
    );

    this.camera.quaternion.slerpQuaternions(
      this.transitionStartQuaternion,
      this.transitionTargetQuaternion,
      t
    );

    if (this.transitionProgress >= 1) {
      this.currentMode = this.targetMode;
      if (this.currentMode === 'orbit' && this.orbitControls) {
        this.orbitControls.enabled = true;
        this.orbitControls.update();
      }
    }
  }

  private updateFirstPerson(delta: number, buildings: Building[]): void {
    if (!this.pointerLockControls || !this.camera) return;

    if (!this.pointerLockControls.isLocked) return;

    const damping = Math.exp(-delta * 10);
    this.velocity.multiplyScalar(damping);

    this.direction.set(0, 0, 0);

    if (this.keys['KeyW']) this.direction.z -= 1;
    if (this.keys['KeyS']) this.direction.z += 1;
    if (this.keys['KeyA']) this.direction.x -= 1;
    if (this.keys['KeyD']) this.direction.x += 1;

    if (this.direction.length() > 0) {
      this.direction.normalize();
      const moveVector = new THREE.Vector3();
      this.camera.getWorldDirection(moveVector);
      moveVector.y = 0;
      moveVector.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(moveVector, new THREE.Vector3(0, 1, 0)).normalize();

      const displacement = new THREE.Vector3();
      displacement.addScaledVector(moveVector, -this.direction.z);
      displacement.addScaledVector(right, this.direction.x);

      const oldPosition = this.camera.position.clone();
      const newPosition = oldPosition.clone();
      const step = displacement.multiplyScalar(this.moveSpeed * delta);

      newPosition.x += step.x;
      if (!this.checkCollision(newPosition, buildings)) {
        oldPosition.x = newPosition.x;
      }

      newPosition.copy(oldPosition);
      newPosition.z += step.z;
      if (!this.checkCollision(newPosition, buildings)) {
        oldPosition.z = newPosition.z;
      }

      this.camera.position.copy(oldPosition);
    }
  }

  private checkCollision(position: THREE.Vector3, buildings: Building[]): boolean {
    const playerAABB: AABB = {
      minX: position.x - this.playerRadius,
      maxX: position.x + this.playerRadius,
      minY: position.y - this.playerHeight,
      maxY: position.y,
      minZ: position.z - this.playerRadius,
      maxZ: position.z + this.playerRadius,
    };

    for (const building of buildings) {
      const halfSize = 5;
      const buildingAABB: AABB = {
        minX: building.position.x - halfSize,
        maxX: building.position.x + halfSize,
        minY: building.position.y,
        maxY: building.position.y + building.height,
        minZ: building.position.z - halfSize,
        maxZ: building.position.z + halfSize,
      };

      if (this.intersectAABB(playerAABB, buildingAABB)) {
        return true;
      }
    }

    return false;
  }

  private intersectAABB(a: AABB, b: AABB): boolean {
    return (
      a.minX <= b.maxX &&
      a.maxX >= b.minX &&
      a.minY <= b.maxY &&
      a.maxY >= b.minY &&
      a.minZ <= b.maxZ &&
      a.maxZ >= b.minZ
    );
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public getMode(): CameraMode {
    return this.currentMode;
  }

  public getPosition(): THREE.Vector3 {
    if (!this.camera) return new THREE.Vector3();
    return this.camera.position.clone();
  }
}

export default CameraController;
