import * as THREE from 'three';

interface CameraState {
  target: THREE.Vector3;
  distance: number;
  theta: number;
  phi: number;
}

export class CameraControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  private state: CameraState;
  private targetState: CameraState;

  private isDragging: boolean = false;
  private previousPosition: { x: number; y: number } = { x: 0, y: 0 };

  private isZooming: boolean = false;
  private initialPinchDistance: number = 0;
  private initialDistance: number = 0;

  private minDistance: number = 0.5;
  private maxDistance: number = 3;

  private zoomTransitionTime: number = 0;
  private zoomTransitionDuration: number = 0.4;
  private zoomStartDistance: number = 0;
  private zoomTargetDistance: number = 0;
  private isZoomTransitioning: boolean = false;

  private rotationSpeed: number = 0.005;
  private touchRotationSpeed: number = 0.008;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.state = {
      target: new THREE.Vector3(0, 0, 0),
      distance: 2.5,
      theta: Math.PI * 0.3,
      phi: Math.PI * 0.4,
    };

    this.targetState = { ...this.state };

    this.updateCamera();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('mouseleave', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel);

    this.domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', this.onTouchEnd);

    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;

    this.isDragging = true;
    this.previousPosition = { x: e.clientX, y: e.clientY };
    this.domElement.style.cursor = 'grabbing';
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousPosition.x;
    const deltaY = e.clientY - this.previousPosition.y;

    this.targetState.theta -= deltaX * this.rotationSpeed;
    this.targetState.phi += deltaY * this.rotationSpeed;

    this.targetState.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.targetState.phi));

    this.previousPosition = { x: e.clientX, y: e.clientY };
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
    this.domElement.style.cursor = 'grab';
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    this.startZoomTransition(this.targetState.distance * zoomFactor);
  };

  private startZoomTransition(targetDistance: number): void {
    this.zoomStartDistance = this.targetState.distance;
    this.zoomTargetDistance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, targetDistance)
    );
    this.zoomTransitionTime = 0;
    this.isZoomTransitioning = true;
  }

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();

    if (e.touches.length === 1) {
      this.isDragging = true;
      this.previousPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      this.isZooming = true;
      this.isDragging = false;
      this.initialPinchDistance = this.getPinchDistance(e.touches);
      this.initialDistance = this.targetState.distance;
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();

    if (this.isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - this.previousPosition.x;
      const deltaY = e.touches[0].clientY - this.previousPosition.y;

      this.targetState.theta -= deltaX * this.touchRotationSpeed;
      this.targetState.phi += deltaY * this.touchRotationSpeed;

      this.targetState.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.targetState.phi));

      this.previousPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (this.isZooming && e.touches.length === 2) {
      const currentDistance = this.getPinchDistance(e.touches);
      const scale = this.initialPinchDistance / currentDistance;
      const newDistance = this.initialDistance * scale;

      this.targetState.distance = Math.max(
        this.minDistance,
        Math.min(this.maxDistance, newDistance)
      );
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length === 0) {
      this.isDragging = false;
      this.isZooming = false;
    } else if (e.touches.length === 1) {
      this.isZooming = false;
      this.isDragging = true;
      this.previousPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  private getPinchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public update(deltaTime: number): void {
    if (this.isZoomTransitioning) {
      this.zoomTransitionTime += deltaTime;
      const t = Math.min(1, this.zoomTransitionTime / this.zoomTransitionDuration);
      const easeT = this.easeOut(t);

      this.targetState.distance =
        this.zoomStartDistance + (this.zoomTargetDistance - this.zoomStartDistance) * easeT;

      if (t >= 1) {
        this.isZoomTransitioning = false;
        this.targetState.distance = this.zoomTargetDistance;
      }
    }

    const lerpFactor = 0.1;
    this.state.theta += (this.targetState.theta - this.state.theta) * lerpFactor;
    this.state.phi += (this.targetState.phi - this.state.phi) * lerpFactor;
    this.state.distance += (this.targetState.distance - this.state.distance) * lerpFactor;

    this.updateCamera();
  }

  private updateCamera(): void {
    const x =
      this.state.distance *
      Math.sin(this.state.phi) *
      Math.sin(this.state.theta);
    const y = this.state.distance * Math.cos(this.state.phi);
    const z =
      this.state.distance *
      Math.sin(this.state.phi) *
      Math.cos(this.state.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.state.target);
  }

  public setDistance(distance: number): void {
    this.startZoomTransition(distance);
  }

  public dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('mouseleave', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);

    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);

    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
  }
}
