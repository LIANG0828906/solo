import * as THREE from 'three';

export class CameraControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  private theta: number = Math.PI / 4;
  private phi: number = Math.PI / 3;
  private radius: number = 15;
  private minRadius: number = 5;
  private maxRadius: number = 30;

  private isDragging: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private rotateSpeed: number = 0.003;

  public autoRotate: boolean = false;
  private autoRotateSpeed: number = 0.2;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.setupEvents();
    this.updateCamera();

    const autoRotateCheckbox = document.getElementById('auto-rotate') as HTMLInputElement;
    if (autoRotateCheckbox) {
      autoRotateCheckbox.addEventListener('change', () => {
        this.autoRotate = autoRotateCheckbox.checked;
      });
    }
  }

  private setupEvents(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.onWheel.bind(this));

    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.lastX;
    const deltaY = e.clientY - this.lastY;
    this.theta -= deltaX * this.rotateSpeed;
    this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi - deltaY * this.rotateSpeed));
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.updateCamera();
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius + e.deltaY * 0.01));
    this.updateCamera();
  }

  private touchStartDist: number = 0;

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchStartDist = Math.sqrt(dx * dx + dy * dy);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1 && this.isDragging) {
      const deltaX = e.touches[0].clientX - this.lastX;
      const deltaY = e.touches[0].clientY - this.lastY;
      this.theta -= deltaX * this.rotateSpeed;
      this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi - deltaY * this.rotateSpeed));
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
      this.updateCamera();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = this.touchStartDist - dist;
      this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius + delta * 0.05));
      this.touchStartDist = dist;
      this.updateCamera();
    }
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  private updateCamera(): void {
    const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  update(dt: number): void {
    if (this.autoRotate && !this.isDragging) {
      this.theta += this.autoRotateSpeed * dt;
      this.updateCamera();
    }
  }
}
