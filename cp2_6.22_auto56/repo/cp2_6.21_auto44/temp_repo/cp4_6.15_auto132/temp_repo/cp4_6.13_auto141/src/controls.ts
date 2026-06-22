import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ControlsManager {
  private controls: OrbitControls;
  private camera: THREE.PerspectiveCamera;
  private defaultPosition: THREE.Vector3 = new THREE.Vector3(8, 8, 8);
  private defaultTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  private animating: boolean = false;
  private animStartTime: number = 0;
  private animDuration: number = 300;
  private animStartPos: THREE.Vector3 = new THREE.Vector3();
  private animEndPos: THREE.Vector3 = new THREE.Vector3();
  private animStartTarget: THREE.Vector3 = new THREE.Vector3();
  private animEndTarget: THREE.Vector3 = new THREE.Vector3();



  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;

    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.85;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 40;
    this.controls.screenSpacePanning = true;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 5;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    this.resetView(0);
  }

  public setZoomRange(min: number, max: number): void {
    this.controls.minDistance = min;
    this.controls.maxDistance = max;
  }

  public setDampingFactor(factor: number): void {
    this.controls.dampingFactor = factor;
  }

  public resetView(durationMs: number = 300): void {
    if (durationMs <= 0) {
      this.camera.position.copy(this.defaultPosition);
      this.controls.target.copy(this.defaultTarget);
      this.controls.update();
      return;
    }

    this.animStartTime = performance.now();
    this.animDuration = durationMs;
    this.animStartPos.copy(this.camera.position);
    this.animEndPos.copy(this.defaultPosition);
    this.animStartTarget.copy(this.controls.target);
    this.animEndTarget.copy(this.defaultTarget);
    this.animating = true;
  }

  public setDefaultView(position: THREE.Vector3, target: THREE.Vector3): void {
    this.defaultPosition.copy(position);
    this.defaultTarget.copy(target);
  }

  public update(): void {
    if (this.animating) {
      const now = performance.now();
      const progress = Math.min((now - this.animStartTime) / this.animDuration, 1);
      const eased = this.easeOutCubic(progress);

      this.camera.position.lerpVectors(this.animStartPos, this.animEndPos, eased);
      this.controls.target.lerpVectors(this.animStartTarget, this.animEndTarget, eased);

      if (progress >= 1) {
        this.animating = false;
        this.controls.update();
      }
    } else {
      this.controls.update();
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public getControls(): OrbitControls {
    return this.controls;
  }

  public dispose(): void {
    this.controls.dispose();
  }
}
