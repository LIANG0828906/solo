import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { StarData } from './starField';

export interface PickedStar {
  starData: StarData;
  index: number;
  point: THREE.Vector3;
}

type StarClickCallback = (picked: PickedStar | null) => void;

export class Interaction {
  private container: HTMLElement;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private starsMesh: THREE.Points;

  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private onStarClickCallback: StarClickCallback | null = null;

  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private dragStartTime: number = 0;

  private initialCameraPosition: THREE.Vector3;
  private initialTarget: THREE.Vector3;

  private autoRotate: boolean = false;
  private autoRotateSpeed: number = 0.003;

  constructor(
    container: HTMLElement,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    starsMesh: THREE.Points
  ) {
    this.container = container;
    this.camera = camera;
    this.renderer = renderer;
    this.starsMesh = starsMesh;

    this.initialCameraPosition = camera.position.clone();
    this.initialTarget = new THREE.Vector3(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.setupControls();

    this.bindEvents();
  }

  private setupControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 1200;
    this.controls.zoomSpeed = 0.8;
    this.controls.rotateSpeed = 0.5;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
  }

  private bindEvents(): void {
    const domElement = this.renderer.domElement;

    domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    domElement.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: true });

    domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    domElement.addEventListener('touchend', this.onTouchEnd.bind(this));

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = false;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    this.dragStartTime = performance.now();
    this.container.style.cursor = 'grabbing';
  }

  private onMouseMove(event: MouseEvent): void {
    if (event.buttons === 1) {
      const dx = Math.abs(event.clientX - this.lastMouseX);
      const dy = Math.abs(event.clientY - this.lastMouseY);
      if (dx > 3 || dy > 3) {
        this.isDragging = true;
      }
    }

    this.updateMousePosition(event.clientX, event.clientY);
    this.updateHoverState();
  }

  private onMouseUp(event: MouseEvent): void {
    this.container.style.cursor = 'grab';

    const dragDuration = performance.now() - this.dragStartTime;
    const dx = Math.abs(event.clientX - this.lastMouseX);
    const dy = Math.abs(event.clientY - this.lastMouseY);

    if (!this.isDragging && dragDuration < 300 && dx < 5 && dy < 5) {
      this.handleClick(event.clientX, event.clientY);
    }

    this.isDragging = false;
  }

  private onMouseLeave(): void {
    this.container.style.cursor = 'grab';
    this.isDragging = false;
  }

  private onWheel(): void {
    this.controls.update();
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.isDragging = false;
      this.lastMouseX = event.touches[0].clientX;
      this.lastMouseY = event.touches[0].clientY;
      this.dragStartTime = performance.now();
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      event.preventDefault();
      const dx = Math.abs(event.touches[0].clientX - this.lastMouseX);
      const dy = Math.abs(event.touches[0].clientY - this.lastMouseY);
      if (dx > 5 || dy > 5) {
        this.isDragging = true;
      }
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length === 1 && !this.isDragging) {
      const touch = event.changedTouches[0];
      const dragDuration = performance.now() - this.dragStartTime;
      const dx = Math.abs(touch.clientX - this.lastMouseX);
      const dy = Math.abs(touch.clientY - this.lastMouseY);

      if (dragDuration < 400 && dx < 10 && dy < 10) {
        this.handleClick(touch.clientX, touch.clientY);
      }
    }
    this.isDragging = false;
  }

  private onResize(): void {
    const rect = this.container.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }

  private updateMousePosition(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private updateHoverState(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.starsMesh);

    if (intersects.length > 0) {
      this.container.style.cursor = 'pointer';
    } else {
      this.container.style.cursor = 'grab';
    }
  }

  private handleClick(clientX: number, clientY: number): void {
    this.updateMousePosition(clientX, clientY);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObject(this.starsMesh);

    if (intersects.length > 0 && intersects[0].index !== undefined) {
      const starDataList: StarData[] = this.starsMesh.userData.starData || [];
      const starData = starDataList[intersects[0].index];

      if (starData) {
        this.onStarClickCallback?.({
          starData,
          index: intersects[0].index,
          point: intersects[0].point.clone()
        });
        return;
      }
    }

    this.onStarClickCallback?.(null);
  }

  public onStarClick(callback: StarClickCallback): void {
    this.onStarClickCallback = callback;
  }

  public resetView(): void {
    this.disableAutoRotate();

    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = this.initialCameraPosition.clone();
    const endTarget = this.initialTarget.clone();

    const duration = 800;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      const eased = this.easeInOutCubic(progress);

      this.camera.position.lerpVectors(startPos, endPos, eased);
      this.controls.target.lerpVectors(startTarget, endTarget, eased);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public enableAutoRotate(): void {
    this.autoRotate = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = this.autoRotateSpeed * 60;
  }

  public disableAutoRotate(): void {
    this.autoRotate = false;
    this.controls.autoRotate = false;
  }

  public toggleAutoRotate(): boolean {
    if (this.autoRotate) {
      this.disableAutoRotate();
      return false;
    } else {
      this.enableAutoRotate();
      return true;
    }
  }

  public isAutoRotating(): boolean {
    return this.autoRotate;
  }

  public update(): void {
    this.controls.update();
  }

  public dispose(): void {
    this.controls.dispose();

    const domElement = this.renderer.domElement;
    domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
    domElement.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
    domElement.removeEventListener('wheel', this.onWheel.bind(this));
    domElement.removeEventListener('touchstart', this.onTouchStart.bind(this));
    domElement.removeEventListener('touchmove', this.onTouchMove.bind(this));
    domElement.removeEventListener('touchend', this.onTouchEnd.bind(this));

    window.removeEventListener('resize', this.onResize.bind(this));
  }
}
