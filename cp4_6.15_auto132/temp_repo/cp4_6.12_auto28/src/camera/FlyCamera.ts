import * as THREE from 'three';

export interface FlyCameraState {
  position: THREE.Vector3;
  speed: number;
}

export class FlyCamera {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private keys: Set<string>;
  private isMouseDown: boolean;
  private lastMouseX: number;
  private lastMouseY: number;
  private euler: THREE.Euler;
  private velocity: THREE.Vector3;
  private movementSpeed: number;
  private minSpeed: number;
  private maxSpeed: number;
  private smoothFactor: number;
  private sceneBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  private speedValueSpan: HTMLElement | null;
  private coordValueSpan: HTMLElement | null;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.keys = new Set();
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();
    this.movementSpeed = 5.0;
    this.minSpeed = 0.5;
    this.maxSpeed = 20.0;
    this.smoothFactor = 0.1;
    this.sceneBounds = {
      minX: -150,
      maxX: 150,
      minY: 0,
      maxY: 100,
      minZ: -150,
      maxZ: 150
    };

    this.speedValueSpan = document.getElementById('speed-value');
    this.coordValueSpan = document.getElementById('coord-value');

    this.bindEvents();
    this.initCameraPosition();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.isMouseDown = false;
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isMouseDown) return;

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= deltaX * 0.002;
    this.euler.x -= deltaY * 0.002;
    this.euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = -e.deltaY * 0.01;
    this.movementSpeed = Math.max(this.minSpeed, Math.min(this.maxSpeed, this.movementSpeed + delta));
  };

  private initCameraPosition(): void {
    this.camera.position.set(50, 40, 50);
    this.camera.lookAt(0, 0, 0);
  }

  public setSceneBounds(halfSize: number, maxHeight: number): void {
    const padding = 5;
    this.sceneBounds = {
      minX: -halfSize + padding,
      maxX: halfSize - padding,
      minY: 2,
      maxY: maxHeight + 30,
      minZ: -halfSize + padding,
      maxZ: halfSize - padding
    };
  }

  public update(deltaTime: number): void {
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    this.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    right.crossVectors(direction, up).normalize();

    const moveVector = new THREE.Vector3();

    if (this.keys.has('KeyW')) {
      moveVector.add(direction);
    }
    if (this.keys.has('KeyS')) {
      moveVector.sub(direction);
    }
    if (this.keys.has('KeyD')) {
      moveVector.add(right);
    }
    if (this.keys.has('KeyA')) {
      moveVector.sub(right);
    }
    if (this.keys.has('Space')) {
      moveVector.add(up);
    }
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) {
      moveVector.sub(up);
    }

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(this.movementSpeed * deltaTime);
    }

    this.velocity.lerp(moveVector, this.smoothFactor);

    this.camera.position.add(this.velocity);

    this.camera.position.x = Math.max(
      this.sceneBounds.minX,
      Math.min(this.sceneBounds.maxX, this.camera.position.x)
    );
    this.camera.position.y = Math.max(
      this.sceneBounds.minY,
      Math.min(this.sceneBounds.maxY, this.camera.position.y)
    );
    this.camera.position.z = Math.max(
      this.sceneBounds.minZ,
      Math.min(this.sceneBounds.maxZ, this.camera.position.z)
    );

    this.updateUI();
  }

  private updateUI(): void {
    if (this.speedValueSpan) {
      this.speedValueSpan.textContent = this.movementSpeed.toFixed(1);
    }
    if (this.coordValueSpan) {
      this.coordValueSpan.textContent = `${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)}`;
    }
  }

  public getSpeed(): number {
    return this.movementSpeed;
  }

  public getPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
  }
}
