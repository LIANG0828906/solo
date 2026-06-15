import * as THREE from 'three';

export type CameraMode = 'firstPerson' | 'overhead';

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private rendererDom: HTMLElement;
  private mode: CameraMode = 'firstPerson';

  private keys = new Set<string>();
  private firstPersonPos = new THREE.Vector3(0, 1.75, 45);
  private firstPersonYaw = Math.PI;
  private firstPersonPitch = -0.08;

  private overheadTarget = new THREE.Vector3(0, 0, 0);
  private overheadDistance = 95;
  private overheadYaw = -0.55;
  private overheadPitch = 0.95;

  private isDragging = false;
  private lastX = 0;
  private lastY = 0;

  private readonly fpMoveSpeed = 14;
  private readonly fpMouseSensitivity = 0.0022;
  private readonly ohDragSensitivity = 0.006;
  private readonly smoothing = 0.12;

  private readonly boundaryMin = new THREE.Vector3(-95, 0, -95);
  private readonly boundaryMax = new THREE.Vector3(95, 0, 95);

  public onModeChange?: (mode: CameraMode) => void;

  constructor(camera: THREE.PerspectiveCamera, rendererDom: HTMLElement) {
    this.camera = camera;
    this.rendererDom = rendererDom;
    this.bindEvents();
    this.applyMode(true);
  }

  getMode(): CameraMode {
    return this.mode;
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      const k = e.code;
      this.keys.add(k);

      if (k === 'KeyV') {
        this.toggleMode();
      }

      if (this.mode === 'firstPerson' && !document.pointerLockElement) {
        const tags = (e.target as HTMLElement)?.tagName;
        if (tags !== 'INPUT' && tags !== 'TEXTAREA' && tags !== 'BUTTON') {
          this.rendererDom.requestPointerLock?.();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && this.mode === 'firstPerson') {
        this.keys.delete('KeyW');
        this.keys.delete('KeyA');
        this.keys.delete('KeyS');
        this.keys.delete('KeyD');
      }
    });

    this.rendererDom.addEventListener('mousedown', (e) => {
      if (this.mode === 'overhead' && e.button === 0) {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.rendererDom.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this.isDragging) {
        this.isDragging = false;
        this.rendererDom.style.cursor =
          this.mode === 'overhead' ? 'grab' : 'default';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (
        this.mode === 'firstPerson' &&
        document.pointerLockElement === this.rendererDom
      ) {
        this.firstPersonYaw -= e.movementX * this.fpMouseSensitivity;
        this.firstPersonPitch -= e.movementY * this.fpMouseSensitivity;
        const limit = Math.PI / 2 - 0.05;
        this.firstPersonPitch = Math.max(-limit, Math.min(limit, this.firstPersonPitch));
      }

      if (this.mode === 'overhead' && this.isDragging) {
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        this.overheadYaw -= dx * this.ohDragSensitivity;
        this.overheadPitch -= dy * this.ohDragSensitivity;
        const minPitch = 0.18;
        const maxPitch = Math.PI / 2 - 0.04;
        this.overheadPitch = Math.max(minPitch, Math.min(maxPitch, this.overheadPitch));
        this.lastX = e.clientX;
        this.lastY = e.clientY;
      }
    });

    this.rendererDom.addEventListener('wheel', (e) => {
      if (this.mode === 'overhead') {
        e.preventDefault();
        this.overheadDistance += e.deltaY * 0.06;
        this.overheadDistance = Math.max(18, Math.min(180, this.overheadDistance));
      }
    }, { passive: false });

    this.rendererDom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  toggleMode(): void {
    this.mode = this.mode === 'firstPerson' ? 'overhead' : 'firstPerson';
    document.exitPointerLock?.();
    this.applyMode(false);
    this.onModeChange?.(this.mode);
  }

  private applyMode(initial: boolean): void {
    if (this.mode === 'firstPerson') {
      this.rendererDom.style.cursor = 'default';
      if (!initial) {
        const currTarget = new THREE.Vector3();
        this.camera.getWorldDirection(currTarget);
        const flatDir = new THREE.Vector3(currTarget.x, 0, currTarget.z).normalize();
        this.firstPersonYaw = Math.atan2(-flatDir.x, -flatDir.z);
        this.firstPersonPitch = Math.max(-0.35, Math.min(0.35, -currTarget.y * 0.5));
      }
    } else {
      this.rendererDom.style.cursor = 'grab';
      if (!initial) {
        const p = this.camera.position.clone();
        const dirToOrigin = new THREE.Vector3(-p.x, -p.y, -p.z);
        this.overheadTarget.set(p.x + dirToOrigin.x * 0.4, 0, p.z + dirToOrigin.z * 0.4);
        const dx = p.x - this.overheadTarget.x;
        const dy = p.y;
        const dz = p.z - this.overheadTarget.z;
        this.overheadDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        this.overheadYaw = Math.atan2(dx, dz);
        this.overheadPitch = Math.acos(dy / this.overheadDistance);
        this.overheadDistance = Math.max(40, Math.min(150, this.overheadDistance));
      }
    }
  }

  update(dt: number): void {
    if (this.mode === 'firstPerson') {
      this.updateFirstPerson(dt);
    } else {
      this.updateOverhead(dt);
    }
  }

  private updateFirstPerson(dt: number): void {
    const move = this.fpMoveSpeed * dt;
    const forward = new THREE.Vector3(
      -Math.sin(this.firstPersonYaw) * Math.cos(this.firstPersonPitch),
      0,
      -Math.cos(this.firstPersonYaw) * Math.cos(this.firstPersonPitch)
    ).normalize();
    const right = new THREE.Vector3(
      Math.cos(this.firstPersonYaw),
      0,
      -Math.sin(this.firstPersonYaw)
    ).normalize();

    const delta = new THREE.Vector3();
    if (this.keys.has('KeyW')) delta.add(forward);
    if (this.keys.has('KeyS')) delta.sub(forward);
    if (this.keys.has('KeyD')) delta.add(right);
    if (this.keys.has('KeyA')) delta.sub(right);

    if (delta.lengthSq() > 0) {
      delta.normalize().multiplyScalar(move);
    }

    const boost = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 1.7 : 1;
    delta.multiplyScalar(boost);

    this.firstPersonPos.add(delta);
    this.firstPersonPos.x = Math.max(this.boundaryMin.x, Math.min(this.boundaryMax.x, this.firstPersonPos.x));
    this.firstPersonPos.z = Math.max(this.boundaryMin.z, Math.min(this.boundaryMax.z, this.firstPersonPos.z));
    this.firstPersonPos.y = 1.75;

    const lookDir = new THREE.Vector3(
      -Math.sin(this.firstPersonYaw) * Math.cos(this.firstPersonPitch),
      Math.sin(this.firstPersonPitch),
      -Math.cos(this.firstPersonYaw) * Math.cos(this.firstPersonPitch)
    );
    const targetPos = this.firstPersonPos.clone().add(lookDir);

    this.camera.position.lerp(this.firstPersonPos, this.smoothing * 3);
    const currentLook = new THREE.Vector3();
    this.camera.getWorldDirection(currentLook).multiplyScalar(15).add(this.camera.position);
    currentLook.lerp(targetPos, this.smoothing * 3);
    this.camera.lookAt(currentLook);
  }

  private updateOverhead(dt: number): void {
    const panSpeed = 35 * dt;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) this.overheadTarget.z -= panSpeed;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) this.overheadTarget.z += panSpeed;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) this.overheadTarget.x -= panSpeed;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) this.overheadTarget.x += panSpeed;

    this.overheadTarget.x = Math.max(this.boundaryMin.x, Math.min(this.boundaryMax.x, this.overheadTarget.x));
    this.overheadTarget.z = Math.max(this.boundaryMin.z, Math.min(this.boundaryMax.z, this.overheadTarget.z));

    const desiredPos = new THREE.Vector3(
      this.overheadTarget.x + this.overheadDistance * Math.sin(this.overheadPitch) * Math.sin(this.overheadYaw),
      this.overheadDistance * Math.cos(this.overheadPitch),
      this.overheadTarget.z + this.overheadDistance * Math.sin(this.overheadPitch) * Math.cos(this.overheadYaw)
    );

    this.camera.position.lerp(desiredPos, this.smoothing);

    const currentTarget = new THREE.Vector3();
    const mat = new THREE.Matrix4();
    mat.copy(this.camera.matrixWorld).invert();
    const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(this.camera.matrixWorld).normalize();
    const t = -this.camera.position.y / dir.y;
    if (isFinite(t) && t > 0) {
      currentTarget.copy(this.camera.position).addScaledVector(dir, t);
    } else {
      currentTarget.copy(this.overheadTarget);
    }
    currentTarget.lerp(this.overheadTarget, this.smoothing);
    this.camera.lookAt(currentTarget);
  }

  getWorldFromScreen(
    ndcX: number,
    ndcY: number,
    targetPlaneY = 0
  ): THREE.Vector3 {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const y = targetPlaneY;
    const origin = raycaster.ray.origin;
    const dir = raycaster.ray.direction;
    const t = (y - origin.y) / dir.y;
    if (!isFinite(t) || t < 0) {
      return origin.clone().addScaledVector(dir, 20);
    }
    return origin.clone().addScaledVector(dir, t);
  }
}
