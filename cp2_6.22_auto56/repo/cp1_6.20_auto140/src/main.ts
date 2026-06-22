import * as THREE from 'three';
import { NebulaSystem, DEFAULT_PARAMS, NebulaParams } from './nebulaSystem';
import { ControlsUI, PRESETS } from './controls';

class CameraController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private target: THREE.Vector3;

  private spherical: { radius: number; theta: number; phi: number };
  private targetSpherical: { radius: number; theta: number; phi: number };

  private isDragging: boolean = false;
  private lastMouse: { x: number; y: number } = { x: 0, y: 0 };

  private keys: { [key: string]: boolean } = {};
  private movementSpeed: number = 2.0;
  private damping: number = 0.1;

  private initialSpherical: { radius: number; theta: number; phi: number };
  private initialTarget: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);

    const pos = camera.position.clone();
    const diff = pos.clone().sub(this.target);
    this.spherical = {
      radius: diff.length(),
      theta: Math.atan2(diff.x, diff.z),
      phi: Math.acos(THREE.MathUtils.clamp(diff.y / diff.length(), -1, 1)),
    };
    this.targetSpherical = { ...this.spherical };

    this.initialSpherical = { ...this.spherical };
    this.initialTarget = this.target.clone();

    this.bindEvents();
  }

  private bindEvents(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.lastMouse = { x: e.clientX, y: e.clientY };
    this.domElement.style.cursor = 'grabbing';
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    this.lastMouse = { x: e.clientX, y: e.clientY };

    this.targetSpherical.theta -= dx * 0.005;
    this.targetSpherical.phi = THREE.MathUtils.clamp(
      this.targetSpherical.phi - dy * 0.005,
      0.1,
      Math.PI - 0.1
    );
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.domElement.style.cursor = 'grab';
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    this.targetSpherical.radius = THREE.MathUtils.clamp(
      this.targetSpherical.radius * factor,
      5,
      200
    );
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys[e.key.toLowerCase()] = true;
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys[e.key.toLowerCase()] = false;
  }

  public setMovementSpeed(speed: number): void {
    this.movementSpeed = speed;
  }

  public reset(): void {
    this.targetSpherical = { ...this.initialSpherical };
    this.target.copy(this.initialTarget);
  }

  public update(deltaTime: number): void {
    this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * this.damping;
    this.spherical.theta += (this.targetSpherical.theta - this.spherical.theta) * this.damping;
    this.spherical.phi += (this.targetSpherical.phi - this.spherical.phi) * this.damping;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveSpeed = this.movementSpeed * deltaTime * 5;

    if (this.keys['w']) this.target.add(forward.clone().multiplyScalar(moveSpeed));
    if (this.keys['s']) this.target.add(forward.clone().multiplyScalar(-moveSpeed));
    if (this.keys['a']) this.target.add(right.clone().multiplyScalar(-moveSpeed));
    if (this.keys['d']) this.target.add(right.clone().multiplyScalar(moveSpeed));

    const { radius, theta, phi } = this.spherical;
    const sinPhi = Math.sin(phi);

    this.camera.position.set(
      this.target.x + radius * sinPhi * Math.sin(theta),
      this.target.y + radius * Math.cos(phi),
      this.target.z + radius * sinPhi * Math.cos(theta)
    );

    this.camera.lookAt(this.target);
  }
}

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private nebulaSystem: NebulaSystem;
  private controls: ControlsUI;
  private cameraController: CameraController;
  private clock: THREE.Clock;
  private canvasContainer: HTMLElement;

  constructor() {
    this.canvasContainer = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(DEFAULT_PARAMS.backgroundColor);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 35);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(DEFAULT_PARAMS.backgroundColor, 1);
    this.canvasContainer.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cursor = 'grab';

    this.nebulaSystem = new NebulaSystem(this.scene, DEFAULT_PARAMS);

    this.cameraController = new CameraController(this.camera, this.renderer.domElement);

    this.controls = new ControlsUI(
      document.getElementById('controls-panel')!,
      {
        onParamsChange: this.onParamsChange.bind(this),
        onPreset: this.onPreset.bind(this),
        onResetCamera: this.onResetCamera.bind(this),
        onMovementSpeedChange: this.onMovementSpeedChange.bind(this),
        onBackgroundColorChange: this.onBackgroundColorChange.bind(this),
      },
      DEFAULT_PARAMS
    );

    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  private onParamsChange(params: Partial<NebulaParams>): void {
    this.nebulaSystem.setParams(params, false);
  }

  private onPreset(presetName: string): void {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (preset) {
      this.nebulaSystem.setParams(preset.params as Partial<NebulaParams>, true);
      this.controls.setParams({ ...this.nebulaSystem.getParams(), ...preset.params } as NebulaParams);

      if (preset.params.backgroundColor) {
        this.onBackgroundColorChange(preset.params.backgroundColor);
      }
    }
  }

  private onResetCamera(): void {
    this.cameraController.reset();
  }

  private onMovementSpeedChange(speed: number): void {
    this.cameraController.setMovementSpeed(speed);
  }

  private onBackgroundColorChange(color: string): void {
    const threeColor = new THREE.Color(color);
    this.scene.background = threeColor;
    this.renderer.setClearColor(threeColor, 1);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    const deltaTime = this.clock.getDelta();

    this.nebulaSystem.update(deltaTime);
    this.cameraController.update(deltaTime);

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
