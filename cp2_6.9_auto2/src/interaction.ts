import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TopologicalSurface } from './surface';

export class InteractionManager {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private surface: TopologicalSurface;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isRightDragging: boolean = false;
  private isControlPointSelected: boolean = false;
  private lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private readonly rotationSpeed: number = 1.5;
  private readonly damping: number = 0.9;
  private readonly minZoom: number = 0.5;
  private readonly maxZoom: number = 5;
  private readonly deformationRadius: number = 0.8;
  private readonly maxDeformation: number = 0.5;
  private infoPanel: HTMLElement;
  private twistSlider: HTMLInputElement;
  private twistValue: HTMLElement;
  private resetBtn: HTMLElement;
  private onTwistChange: (value: number) => void;
  private energyThreshold: number = 50;
  private isFlashing: boolean = false;

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    surface: TopologicalSurface,
    onTwistChange: (value: number) => void
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.surface = surface;
    this.onTwistChange = onTwistChange;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.infoPanel = document.getElementById('info-panel')!;
    this.twistSlider = document.getElementById('twist-slider') as HTMLInputElement;
    this.twistValue = document.getElementById('twist-value')!;
    this.resetBtn = document.getElementById('reset-btn')!;

    this.controls = this.setupOrbitControls();
    this.setupEventListeners();
    this.setupGUI();
  }

  private setupOrbitControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    controls.enableDamping = true;
    controls.dampingFactor = this.damping;
    controls.rotateSpeed = this.rotationSpeed / 50;
    controls.zoomSpeed = 1.0;
    controls.minDistance = this.minZoom * 3;
    controls.maxDistance = this.maxZoom * 3;
    controls.enablePan = false;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null as any
    };

    return controls;
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => this.onResize());
  }

  private setupGUI(): void {
    this.twistSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.twistValue.textContent = value.toFixed(1);
      this.onTwistChange(value);
    });

    this.resetBtn.addEventListener('click', () => {
      this.surface.reset();
      this.twistSlider.value = '0';
      this.twistValue.textContent = '0.0';
    });
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isRightDragging && this.isControlPointSelected) {
      this.updateControlPointPosition(e);
    }

    this.lastMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 2) {
      e.preventDefault();
      this.checkControlPointSelection();
      if (this.isControlPointSelected) {
        this.isRightDragging = true;
        this.surface.startDragging();
        this.controls.enabled = false;
      }
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 2 && this.isRightDragging) {
      this.isRightDragging = false;
      this.surface.stopDragging();
      this.controls.enabled = true;
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const currentDistance = this.camera.position.length();
    const newDistance = currentDistance * zoomDelta;
    
    const clampedDistance = Math.max(
      this.minZoom * 3,
      Math.min(this.maxZoom * 3, newDistance)
    );
    
    const direction = this.camera.position.clone().normalize();
    this.camera.position.copy(direction.multiplyScalar(clampedDistance));
    
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private onResize(): void {
    const container = document.getElementById('canvas-container')!;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  private checkControlPointSelection(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const controlPoint = this.surface.getControlPoint();
    
    if (controlPoint) {
      const intersects = this.raycaster.intersectObject(controlPoint);
      this.isControlPointSelected = intersects.length > 0;
    }
  }

  private updateControlPointPosition(e: MouseEvent): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const planeNormal = new THREE.Vector3();
    this.camera.getWorldDirection(planeNormal);
    
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal.negate(),
      this.surface.getControlPoint()?.position || new THREE.Vector3()
    );
    
    const intersectionPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersectionPoint);
    
    if (intersectionPoint) {
      const controlPointPos = this.surface.getControlPoint()?.position || new THREE.Vector3();
      const displacement = intersectionPoint.clone().sub(controlPointPos);
      const strength = Math.max(-this.maxDeformation, Math.min(this.maxDeformation, displacement.length() * 0.5));
      const direction = displacement.length() > 0.001 ? displacement.normalize() : new THREE.Vector3(0, 1, 0);
      
      const applyPoint = controlPointPos.clone().add(direction.multiplyScalar(strength));
      this.surface.applyDeformation(applyPoint, strength);
    }
  }

  public updateInfoPanel(
    topologyType: string,
    particleCount: number,
    avgVelocity: number,
    deformationEnergy: number
  ): void {
    document.getElementById('topology-type')!.textContent = topologyType;
    document.getElementById('particle-count')!.textContent = particleCount.toString();
    document.getElementById('avg-velocity')!.textContent = avgVelocity.toFixed(2);
    document.getElementById('deformation-energy')!.textContent = deformationEnergy.toFixed(2);

    if (deformationEnergy > this.energyThreshold) {
      this.infoPanel.classList.add('warning');
      if (!this.isFlashing) {
        this.triggerFlash();
      }
    } else {
      this.infoPanel.classList.remove('warning');
    }
  }

  private triggerFlash(): void {
    this.isFlashing = true;
    this.infoPanel.classList.add('flashing');
    
    setTimeout(() => {
      this.infoPanel.classList.remove('flashing');
      this.isFlashing = false;
    }, 600);
  }

  public update(): void {
    this.controls.update();
  }

  public getControls(): OrbitControls {
    return this.controls;
  }

  public dispose(): void {
    this.controls.dispose();
  }
}
