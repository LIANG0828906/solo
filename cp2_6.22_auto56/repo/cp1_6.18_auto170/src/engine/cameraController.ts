import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private domElement: HTMLElement;
  private rotationSensitivity: number = 0.005;
  private defaultPosition: THREE.Vector3;
  private defaultTarget: THREE.Vector3;
  private autoRotateEnabled: boolean = false;
  private autoRotateSpeed: number = 0.5;
  private isAnimating: boolean = false;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 30;
    this.controls.rotateSpeed = 1;
    this.controls.zoomSpeed = 1;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    
    this.defaultPosition = camera.position.clone();
    this.defaultTarget = this.controls.target.clone();
    
    this.setupTouchEvents();
  }

  private setupTouchEvents(): void {
    let touchStartDistance = 0;
    let initialZoom = 0;

    this.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        initialZoom = this.camera.position.distanceTo(this.controls.target);
      }
    }, { passive: false });

    this.domElement.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const scale = touchStartDistance / currentDistance;
        const newDistance = initialZoom * scale;
        const clampedDistance = Math.max(3, Math.min(30, newDistance));
        const direction = this.camera.position.clone().sub(this.controls.target).normalize();
        this.camera.position.copy(this.controls.target.clone().add(direction.multiplyScalar(clampedDistance)));
      }
    }, { passive: false });
  }

  setRotationSensitivity(sensitivity: number): void {
    this.rotationSensitivity = sensitivity;
    this.controls.rotateSpeed = sensitivity * 200;
  }

  setZoomRange(min: number, max: number): void {
    this.controls.minDistance = min;
    this.controls.maxDistance = max;
  }

  setDefaultView(position: THREE.Vector3, target: THREE.Vector3): void {
    this.defaultPosition = position.clone();
    this.defaultTarget = target.clone();
  }

  animateTo(position: THREE.Vector3, target: THREE.Vector3, duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        resolve();
        return;
      }
      
      this.isAnimating = true;
      this.controls.enabled = false;
      
      const startPosition = this.camera.position.clone();
      const startTarget = this.controls.target.clone();
      const startTime = performance.now();
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        this.camera.position.lerpVectors(startPosition, position, eased);
        this.controls.target.lerpVectors(startTarget, target, eased);
        this.controls.update();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          if (!this.autoRotateEnabled) {
            this.controls.enabled = true;
          }
          resolve();
        }
      };
      
      animate();
    });
  }

  resetView(duration: number = 500): Promise<void> {
    return this.animateTo(this.defaultPosition, this.defaultTarget, duration);
  }

  centerOnTarget(target: THREE.Vector3, distance: number = 5, duration: number = 500): Promise<void> {
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    const newPosition = target.clone().add(direction.multiplyScalar(distance));
    return this.animateTo(newPosition, target.clone(), duration);
  }

  setAutoRotate(enabled: boolean, speed: number = 0.5): void {
    this.autoRotateEnabled = enabled;
    this.autoRotateSpeed = speed;
    this.controls.autoRotate = enabled;
    this.controls.autoRotateSpeed = speed;
    this.controls.enabled = !enabled;
  }

  update(): void {
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  getIsAnimating(): boolean {
    return this.isAnimating;
  }
}
