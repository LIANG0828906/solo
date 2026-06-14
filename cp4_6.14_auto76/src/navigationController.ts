import * as THREE from 'three';
import { PointCloudLoader } from './pointCloudLoader';

export class NavigationController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private pointCloudLoader: PointCloudLoader;

  private keys: Set<string> = new Set();
  private yaw: number = 0;
  private pitch: number = -0.15;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private smoothYaw: number = 0;
  private smoothPitch: number = -0.15;
  private readonly smoothFactor: number = 0.8;

  private velocity: THREE.Vector3 = new THREE.Vector3();
  private readonly moveSpeed: number = 20;
  private readonly minZoom: number = 0.5;
  private readonly maxZoom: number = 50;

  private initialPosition: THREE.Vector3 = new THREE.Vector3(0, 15, 35);
  private initialYaw: number = 0;
  private initialPitch: number = -0.3;

  private collisionRadius: number = 2.5;
  private minPointDistance: number = 1.5;

  private collisionGrid: Map<string, boolean> = new Map();
  private gridCellSize: number = 2;
  private collisionHeightMargin: number = 1.0;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    pointCloudLoader: PointCloudLoader
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.pointCloudLoader = pointCloudLoader;

    this.camera.position.copy(this.initialPosition);
    this.updateCameraRotation();

    this.bindEvents();
    this.buildCollisionGrid();
  }

  public getInitialPosition(): THREE.Vector3 {
    return this.initialPosition.clone();
  }

  public getCameraPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  public getYaw(): number {
    return this.yaw;
  }

  public setInitialState(pos: THREE.Vector3, yaw: number, pitch: number): void {
    this.initialPosition.copy(pos);
    this.initialYaw = yaw;
    this.initialPitch = pitch;
  }

  public resetToInitial(duration: number = 600): Promise<void> {
    return new Promise((resolve) => {
      const startPos = this.camera.position.clone();
      const startYaw = this.yaw;
      const startPitch = this.pitch;
      const endPos = this.initialPosition.clone();
      const endYaw = this.initialYaw;
      const endPitch = this.initialPitch;
      const startTime = performance.now();

      const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOut(t);

        this.camera.position.lerpVectors(startPos, endPos, eased);
        this.yaw = startYaw + (endYaw - startYaw) * eased;
        this.pitch = startPitch + (endPitch - startPitch) * eased;
        this.smoothYaw = this.yaw;
        this.smoothPitch = this.pitch;

        this.updateCameraRotation();

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  private buildCollisionGrid(): void {
    const data = this.pointCloudLoader.getData();
    if (!data) return;

    const { positions, pointCount } = data;
    this.collisionGrid.clear();

    for (let i = 0; i < pointCount; i++) {
      const x = Math.floor(positions[i * 3] / this.gridCellSize);
      const y = Math.floor(positions[i * 3 + 1] / this.gridCellSize);
      const z = Math.floor(positions[i * 3 + 2] / this.gridCellSize);
      const key = `${x},${y},${z}`;
      this.collisionGrid.set(key, true);
    }
  }

  private isPositionBlocked(pos: THREE.Vector3): boolean {
    const data = this.pointCloudLoader.getData();
    if (!data) return false;

    const { boundingBox } = data;
    const margin = this.collisionRadius;
    if (
      pos.x < boundingBox.min.x - margin ||
      pos.x > boundingBox.max.x + margin ||
      pos.z < boundingBox.min.z - margin ||
      pos.z > boundingBox.max.z + margin
    ) {
      return true;
    }

    const checks: THREE.Vector3[] = [
      pos,
      new THREE.Vector3(pos.x + this.minPointDistance * 0.5, pos.y, pos.z),
      new THREE.Vector3(pos.x - this.minPointDistance * 0.5, pos.y, pos.z),
      new THREE.Vector3(pos.x, pos.y, pos.z + this.minPointDistance * 0.5),
      new THREE.Vector3(pos.x, pos.y, pos.z - this.minPointDistance * 0.5),
    ];

    const cs = this.gridCellSize;
    for (const checkPos of checks) {
      const cx = Math.floor(checkPos.x / cs);
      const cz = Math.floor(checkPos.z / cs);

      for (let dy = -1; dy <= 2; dy++) {
        const cy = Math.floor((checkPos.y + dy * cs * 0.5) / cs);
        const key = `${cx},${cy},${cz}`;
        if (this.collisionGrid.has(key)) {
          const gridCenter = new THREE.Vector3(
            (cx + 0.5) * cs,
            (cy + 0.5) * cs,
            (cz + 0.5) * cs
          );
          const dx = checkPos.x - gridCenter.x;
          const dz = checkPos.z - gridCenter.z;
          const dyCheck = checkPos.y - gridCenter.y;
          const distXZ = Math.sqrt(dx * dx + dz * dz);
          const minDist = this.minPointDistance;
          if (distXZ < minDist && Math.abs(dyCheck) < this.collisionHeightMargin) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private resolveCollision(
    oldPos: THREE.Vector3,
    newPos: THREE.Vector3
  ): THREE.Vector3 {
    if (!this.isPositionBlocked(newPos)) {
      return newPos.clone();
    }

    const result = oldPos.clone();

    const testX = new THREE.Vector3(newPos.x, oldPos.y, oldPos.z);
    if (!this.isPositionBlocked(testX)) {
      result.x = newPos.x;
    }

    const testZ = new THREE.Vector3(result.x, oldPos.y, newPos.z);
    if (!this.isPositionBlocked(testZ)) {
      result.z = newPos.z;
    }

    return result;
  }

  private bindEvents(): void {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('#control-panel') || target.closest('#annotation-panel') || target.closest('#minimap-container')) {
      return;
    }
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    this.isDragging = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;

    this.yaw -= dx * 0.0035;
    this.pitch -= dy * 0.0035;

    this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = -e.deltaY * 0.01;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.length() > 0) forward.normalize();

    const currentDistance = this.camera.position.length();
    const clampedDelta = Math.max(-10, Math.min(10, delta * 2));
    const newDistance = Math.max(this.minZoom, Math.min(this.maxZoom, currentDistance + clampedDelta));
    const moveAmount = newDistance - currentDistance;

    const oldPos = this.camera.position.clone();
    const testPos = oldPos.clone().add(forward.multiplyScalar(moveAmount));
    const resolvedPos = this.resolveCollision(oldPos, testPos);
    this.camera.position.copy(resolvedPos);
  };

  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private updateCameraRotation(): void {
    this.smoothYaw = this.smoothFactor * this.smoothYaw + (1 - this.smoothFactor) * this.yaw;
    this.smoothPitch = this.smoothFactor * this.smoothPitch + (1 - this.smoothFactor) * this.pitch;

    const euler = new THREE.Euler(this.smoothPitch, this.smoothYaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  public update(deltaTime: number): void {
    this.updateCameraRotation();

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.length() > 0) forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (this.keys.has('KeyW')) move.add(forward);
    if (this.keys.has('KeyS')) move.sub(forward);
    if (this.keys.has('KeyD')) move.add(right);
    if (this.keys.has('KeyA')) move.sub(right);

    if (move.length() > 0) {
      move.normalize().multiplyScalar(this.moveSpeed * deltaTime);

      const oldPos = this.camera.position.clone();
      const newPos = oldPos.clone().add(move);
      const resolvedPos = this.resolveCollision(oldPos, newPos);
      this.camera.position.copy(resolvedPos);
    }
  }
}
