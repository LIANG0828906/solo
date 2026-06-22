import * as THREE from 'three';

export interface PlayerState {
  position: THREE.Vector3;
  rotation: { yaw: number; pitch: number };
  velocity: THREE.Vector3;
  isMoving: boolean;
}

export type PlayerStateListener = (state: PlayerState) => void;

export class PlayerController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private keys: Set<string> = new Set();
  private yaw = 0;
  private pitch = 0;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private velocity = new THREE.Vector3();
  private baseSpeed = 6;
  private fastSpeed = 12;
  private mouseSensitivity = 0.0025;
  private playerHeight = 1.7;
  private listeners: PlayerStateListener[] = [];
  private bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  private prevCameraOffset = new THREE.Vector3();

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.bounds = bounds;
    this.setupEventListeners();

    this.camera.position.set(0, this.playerHeight, 20);
    this.yaw = Math.PI;
    this.updateCameraRotation();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0 || e.button === 2) {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;

    this.yaw -= deltaX * this.mouseSensitivity;
    this.pitch -= deltaY * this.mouseSensitivity;

    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.updateCameraRotation();
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
  };

  private updateCameraRotation(): void {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  public update(deltaTime: number): void {
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );
    const right = new THREE.Vector3(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    );

    const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
      ? this.fastSpeed
      : this.baseSpeed;

    const move = new THREE.Vector3();

    if (this.keys.has('KeyW')) move.add(forward);
    if (this.keys.has('KeyS')) move.sub(forward);
    if (this.keys.has('KeyA')) move.sub(right);
    if (this.keys.has('KeyD')) move.add(right);

    const isMoving = move.lengthSq() > 0;

    if (isMoving) {
      move.normalize().multiplyScalar(speed * deltaTime);

      const newX = THREE.MathUtils.clamp(
        this.camera.position.x + move.x,
        this.bounds.minX,
        this.bounds.maxX
      );
      const newZ = THREE.MathUtils.clamp(
        this.camera.position.z + move.z,
        this.bounds.minZ,
        this.bounds.maxZ
      );

      this.camera.position.x = newX;
      this.camera.position.z = newZ;
      this.velocity.copy(move).divideScalar(deltaTime);
    } else {
      this.velocity.multiplyScalar(0.9);
    }

    const bobAmount = isMoving ? 0.03 : 0;
    const bobSpeed = isMoving ? 10 : 0;
    const time = performance.now() * 0.001;
    this.camera.position.y = this.playerHeight + Math.sin(time * bobSpeed) * bobAmount;

    this.applyParallax(isMoving, time);

    this.notifyListeners();
  }

  private applyParallax(isMoving: boolean, time: number): void {
    const parallaxStrength = 0.015;
    const speedFactor = Math.min(this.velocity.length() / this.baseSpeed, 1);

    const targetOffset = new THREE.Vector3(
      Math.sin(time * 2) * parallaxStrength * speedFactor,
      0,
      Math.cos(time * 1.5) * parallaxStrength * speedFactor * 0.5
    );

    this.prevCameraOffset.lerp(targetOffset, 0.05);
  }

  public getState(): PlayerState {
    return {
      position: this.camera.position.clone(),
      rotation: { yaw: this.yaw, pitch: this.pitch },
      velocity: this.velocity.clone(),
      isMoving: this.velocity.lengthSq() > 0.5
    };
  }

  public onStateChange(listener: PlayerStateListener): void {
    this.listeners.push(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }
}
