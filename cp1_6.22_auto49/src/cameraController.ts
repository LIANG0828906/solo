import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

export type ViewType = 'top' | 'side' | 'front' | 'free';

interface ViewTarget {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isAnimating: boolean = false;
  private animationStart: number = 0;
  private animationDuration: number = 800;
  private startPosition: THREE.Vector3 = new THREE.Vector3();
  private startTarget: THREE.Vector3 = new THREE.Vector3();
  private endPosition: THREE.Vector3 = new THREE.Vector3();
  private endTarget: THREE.Vector3 = new THREE.Vector3();
  private bezierControl: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;
    this.controls.zoomSpeed = 0.8;
    this.controls.rotateSpeed = 0.5;
  }

  public getControls(): OrbitControls {
    return this.controls;
  }

  public update(): void {
    if (this.isAnimating) {
      this.updateAnimation();
    }
    this.controls.update();
  }

  private getViewTarget(view: ViewType): ViewTarget {
    const center = this.controls.target.clone();
    const distance = this.camera.position.distanceTo(center);

    switch (view) {
      case 'top':
        return {
          position: new THREE.Vector3(center.x, center.y + distance, center.z),
          target: center.clone()
        };
      case 'side':
        return {
          position: new THREE.Vector3(center.x + distance, center.y, center.z),
          target: center.clone()
        };
      case 'front':
        return {
          position: new THREE.Vector3(center.x, center.y, center.z + distance),
          target: center.clone()
        };
      default:
        return {
          position: this.camera.position.clone(),
          target: center.clone()
        };
    }
  }

  public switchView(view: ViewType): void {
    const target = this.getViewTarget(view);

    this.startPosition.copy(this.camera.position);
    this.startTarget.copy(this.controls.target);
    this.endPosition.copy(target.position);
    this.endTarget.copy(target.target);

    const midPoint = new THREE.Vector3().addVectors(this.startPosition, this.endPosition).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(this.endPosition, this.startTarget).normalize();
    const offset = direction.multiplyScalar(this.startPosition.distanceTo(this.endPosition) * 0.3);
    this.bezierControl.copy(midPoint).add(offset);

    this.isAnimating = true;
    this.animationStart = performance.now();
  }

  private updateAnimation(): void {
    const now = performance.now();
    const elapsed = now - this.animationStart;
    const t = Math.min(elapsed / this.animationDuration, 1);

    const easedT = this.easeInOutCubic(t);

    const newPosition = this.bezierCurve(this.startPosition, this.bezierControl, this.endPosition, easedT);
    const newTarget = new THREE.Vector3().lerpVectors(this.startTarget, this.endTarget, easedT);

    this.camera.position.copy(newPosition);
    this.controls.target.copy(newTarget);

    if (t >= 1) {
      this.isAnimating = false;
    }
  }

  private bezierCurve(
    start: THREE.Vector3,
    control: THREE.Vector3,
    end: THREE.Vector3,
    t: number
  ): THREE.Vector3 {
    const mt = 1 - t;
    const result = new THREE.Vector3();

    result.x = mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x;
    result.y = mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y;
    result.z = mt * mt * start.z + 2 * mt * t * control.z + t * t * end.z;

    return result;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public setZoomLimits(min: number, max: number): void {
    this.controls.minDistance = min;
    this.controls.maxDistance = max;
  }

  public getZoom(): number {
    return this.camera.position.distanceTo(this.controls.target);
  }
}
