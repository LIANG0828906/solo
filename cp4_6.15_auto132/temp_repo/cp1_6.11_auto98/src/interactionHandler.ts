import * as THREE from 'three';
import gsap from 'gsap';

export class InteractionHandler {
  public targetPoint: THREE.Vector3;
  public gatheringRadius: number;
  public isActive: boolean;

  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouseNDC: THREE.Vector2;
  private idleTimer: number;
  private hintElement: HTMLElement | null;

  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.camera = camera;
    this.renderer = renderer;
    this.targetPoint = new THREE.Vector3(0, 0, 0);
    this.gatheringRadius = 15;
    this.isActive = false;
    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2(0, 0);
    this.idleTimer = 0;
    this.hintElement = document.getElementById('hint');

    this.bindEvents();
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      this.onMouseMove(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.onMouseMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.02;
      this.setGatheringRadius(this.gatheringRadius + delta);
    }, { passive: false });

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        this.onPinchStart(e);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        this.onPinchMove(e);
      }
    }, { passive: true });
  }

  private onMouseMove(clientX: number, clientY: number): void {
    this.isActive = true;
    this.resetIdleTimer();

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const direction = this.raycaster.ray.direction.clone();
    const origin = this.raycaster.ray.origin.clone();
    const t = -origin.y / direction.y;
    let worldPoint: THREE.Vector3;
    if (t > 0 && isFinite(t)) {
      worldPoint = origin.add(direction.multiplyScalar(t));
      worldPoint.y = THREE.MathUtils.clamp(worldPoint.y, -10, 10);
    } else {
      worldPoint = this.raycaster.ray.direction.clone().multiplyScalar(40).add(this.raycaster.ray.origin);
    }
    worldPoint.x = THREE.MathUtils.clamp(worldPoint.x, -45, 45);
    worldPoint.z = THREE.MathUtils.clamp(worldPoint.z, -45, 45);

    this.targetPoint.lerp(worldPoint, 0.1);
  }

  private pinchStartDist: number = 0;

  private onPinchStart(e: TouchEvent): void {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    this.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
  }

  private onPinchMove(e: TouchEvent): void {
    if (this.pinchStartDist === 0) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scale = dist / this.pinchStartDist;
    this.pinchStartDist = dist;
    this.setGatheringRadius(this.gatheringRadius * scale);
  }

  private setGatheringRadius(value: number): void {
    const clamped = THREE.MathUtils.clamp(value, 5, 30);
    gsap.to(this, {
      gatheringRadius: clamped,
      duration: 0.5,
      ease: 'power2.out',
    });
  }

  private resetIdleTimer(): void {
    this.idleTimer = 0;
    if (this.hintElement) {
      this.hintElement.classList.remove('dim');
    }
  }

  update(deltaTime: number): void {
    this.idleTimer += deltaTime;
    if (this.idleTimer > 3 && this.hintElement) {
      this.hintElement.classList.add('dim');
    }
  }
}
