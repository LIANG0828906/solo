import * as THREE from 'three';
import { ForceField, hexToRgb } from './particle';

export interface InteractionState {
  isDragging: boolean;
  isRotating: boolean;
  mouseX: number;
  mouseY: number;
  lastMouseX: number;
  lastMouseY: number;
  rotationVelocityX: number;
  rotationVelocityY: number;
  theta: number;
  phi: number;
  cameraDistance: number;
  forceFieldActive: boolean;
  forceFieldPosition: THREE.Vector3;
  repulsionStrength: number;
  selectedColorKey: number;
}

export class InteractionManager {
  private state: InteractionState;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onForceFieldChange: (field: ForceField | null) => void;
  private onAddParticle: (
    x: number,
    y: number,
    z: number,
    color: { r: number; g: number; b: number }
  ) => void;
  private readonly DAMPING = 0.85;
  private readonly MIN_DISTANCE = 3;
  private readonly MAX_DISTANCE = 20;
  private readonly MIN_PHI = -Math.PI / 2 + 0.01;
  private readonly MAX_PHI = Math.PI / 2 - 0.01;
  private readonly COLORS: { [key: number]: { r: number; g: number; b: number } } = {
    1: hexToRgb('#FF4B4B'),
    2: hexToRgb('#4B9EFF'),
    3: hexToRgb('#4BFF4B'),
  };
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: () => void;
  private boundWheel: (e: WheelEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private boundContextMenu: (e: MouseEvent) => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    onForceFieldChange: (field: ForceField | null) => void,
    onAddParticle: (
      x: number,
      y: number,
      z: number,
      color: { r: number; g: number; b: number }
    ) => void
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.onForceFieldChange = onForceFieldChange;
    this.onAddParticle = onAddParticle;

    this.state = {
      isDragging: false,
      isRotating: false,
      mouseX: 0,
      mouseY: 0,
      lastMouseX: 0,
      lastMouseY: 0,
      rotationVelocityX: 0,
      rotationVelocityY: 0,
      theta: 0,
      phi: Math.atan2(5, 10),
      cameraDistance: Math.sqrt(0 * 0 + 5 * 5 + 10 * 10),
      forceFieldActive: false,
      forceFieldPosition: new THREE.Vector3(),
      repulsionStrength: 2,
      selectedColorKey: 0,
    };

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundWheel = this.onWheel.bind(this);
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundClick = this.onClick.bind(this);
    this.boundContextMenu = (e: MouseEvent) => e.preventDefault();

    this.bindEvents();
    this.updateCameraPosition();
  }

  private bindEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.boundMouseDown);
    canvas.addEventListener('mousemove', this.boundMouseMove);
    canvas.addEventListener('mouseup', this.boundMouseUp);
    canvas.addEventListener('mouseleave', this.boundMouseUp);
    canvas.addEventListener('wheel', this.boundWheel, { passive: false });
    canvas.addEventListener('contextmenu', this.boundContextMenu);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('click', this.boundClick);
  }

  private onMouseDown(e: MouseEvent) {
    this.state.isDragging = true;
    this.state.lastMouseX = e.clientX;
    this.state.lastMouseY = e.clientY;
    this.state.rotationVelocityX = 0;
    this.state.rotationVelocityY = 0;

    if (e.button === 2) {
      this.state.isRotating = true;
      this.state.forceFieldActive = false;
      this.onForceFieldChange(null);
    } else if (e.button === 0) {
      this.state.forceFieldActive = true;
      this.updateForceFieldPosition(e);
    }
  }

  private onMouseMove(e: MouseEvent) {
    const deltaX = e.clientX - this.state.lastMouseX;
    const deltaY = e.clientY - this.state.lastMouseY;

    if (this.state.isRotating) {
      this.state.theta -= deltaX * 0.005;
      this.state.phi -= deltaY * 0.005;
      this.state.phi = Math.max(this.MIN_PHI, Math.min(this.MAX_PHI, this.state.phi));
      this.state.rotationVelocityX = -deltaX * 0.005;
      this.state.rotationVelocityY = -deltaY * 0.005;
    }

    this.state.lastMouseX = e.clientX;
    this.state.lastMouseY = e.clientY;
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;

    if (this.state.forceFieldActive) {
      this.updateForceFieldPosition(e);
    }
  }

  private onMouseUp() {
    this.state.isDragging = false;
    this.state.isRotating = false;
    if (this.state.forceFieldActive) {
      this.state.forceFieldActive = false;
      this.onForceFieldChange(null);
    }
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const scale = 1 + e.deltaY * 0.001;
    this.state.cameraDistance = Math.max(
      this.MIN_DISTANCE,
      Math.min(this.MAX_DISTANCE, this.state.cameraDistance * scale)
    );
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      this.state.selectedColorKey = parseInt(e.key);
    }
  }

  private onClick(e: MouseEvent) {
    if (e.target !== this.renderer.domElement) return;
    if (this.state.selectedColorKey > 0) {
      const color = this.COLORS[this.state.selectedColorKey];
      if (color) {
        const pos = this.getWorldPositionFromScreen(e.clientX, e.clientY);
        if (pos) {
          this.onAddParticle(pos.x, pos.y, pos.z, color);
        }
      }
      this.state.selectedColorKey = 0;
    }
  }

  private getWorldPositionFromScreen(
    screenX: number,
    screenY: number
  ): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const planeNormal = new THREE.Vector3(0, 0, 1);
    const planePoint = new THREE.Vector3(0, 0, 0);
    const ray = this.raycaster.ray;
    const denom = planeNormal.dot(ray.direction);
    if (Math.abs(denom) > 0.0001) {
      const t = planePoint.clone().sub(ray.origin).dot(planeNormal) / denom;
      if (t > 0) {
        return ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
      }
    }

    const dir = this.raycaster.ray.direction.clone();
    const origin = this.raycaster.ray.origin.clone();
    return origin.add(dir.multiplyScalar(5));
  }

  private updateForceFieldPosition(e: MouseEvent) {
    const pos = this.getWorldPositionFromScreen(e.clientX, e.clientY);
    if (pos) {
      this.state.forceFieldPosition.copy(pos);
      this.onForceFieldChange({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        radius: 1,
        strength: this.state.repulsionStrength,
        active: true,
      });
    }
  }

  public setRepulsionStrength(strength: number) {
    this.state.repulsionStrength = strength;
  }

  public update() {
    if (
      !this.state.isRotating &&
      (Math.abs(this.state.rotationVelocityX) > 0.0001 ||
        Math.abs(this.state.rotationVelocityY) > 0.0001)
    ) {
      this.state.theta += this.state.rotationVelocityX;
      this.state.phi += this.state.rotationVelocityY;
      this.state.phi = Math.max(this.MIN_PHI, Math.min(this.MAX_PHI, this.state.phi));
      this.state.rotationVelocityX *= this.DAMPING;
      this.state.rotationVelocityY *= this.DAMPING;
    }
    this.updateCameraPosition();
  }

  private updateCameraPosition() {
    const r = this.state.cameraDistance;
    const x = r * Math.cos(this.state.phi) * Math.sin(this.state.theta);
    const y = r * Math.sin(this.state.phi);
    const z = r * Math.cos(this.state.phi) * Math.cos(this.state.theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  public getSphericalCoords(): { theta: number; phi: number } {
    return {
      theta: (this.state.theta * 180) / Math.PI,
      phi: (this.state.phi * 180) / Math.PI,
    };
  }

  public getForceFieldPosition(): THREE.Vector3 {
    return this.state.forceFieldPosition.clone();
  }

  public isForceFieldActive(): boolean {
    return this.state.forceFieldActive;
  }

  public destroy() {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.boundMouseDown);
    canvas.removeEventListener('mousemove', this.boundMouseMove);
    canvas.removeEventListener('mouseup', this.boundMouseUp);
    canvas.removeEventListener('mouseleave', this.boundMouseUp);
    canvas.removeEventListener('wheel', this.boundWheel);
    canvas.removeEventListener('contextmenu', this.boundContextMenu);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('click', this.boundClick);
  }
}
