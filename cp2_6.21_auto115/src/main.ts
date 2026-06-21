import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParticleSystem, createParticleMaterial } from './particleSystem';
import { ControlPanel, FPSCounter } from './controls';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem;
  private particles: THREE.Points;
  private _controlPanel: ControlPanel;
  private fpsCounter: FPSCounter;
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container: HTMLElement;
  private qualityLevel: number = 1;
  private mouseDown: boolean = false;
  private mouseWorldPos: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.particleSystem = new ParticleSystem(5000);
    this.particles = new THREE.Points(
      this.particleSystem.getGeometry(),
      createParticleMaterial()
    );
    this._controlPanel = new ControlPanel({
      onParamChange: (params) => this.particleSystem.setParams(params)
    });
    this.fpsCounter = new FPSCounter();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
  }

  private init(): void {
    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupScene();
    this.setupEventListeners();
    this.animate();
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0b0e2a, 0);
    this.container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    this.camera.position.set(0, 30, 80);
    this.camera.lookAt(0, 0, 0);
  }

  private setupControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 200;
    this.controls.enablePan = false;
  }

  private setupScene(): void {
    this.scene.add(this.particles);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    this._controlPanel.setParams(this.particleSystem.getParams());
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    
    this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
    this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    
    this.renderer.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.renderer.domElement.addEventListener('touchend', () => this.onTouchEnd());
    this.renderer.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.mouseDown = true;
      this.updateMousePosition(event.clientX, event.clientY);
      this.applyMouseForce();
    }
  }

  private onMouseUp(): void {
    this.mouseDown = false;
    this.particleSystem.setMouseForce(null);
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    if (this.mouseDown) {
      this.updateMousePosition(event.clientX, event.clientY);
      this.applyMouseForce();
    }
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.mouseDown = true;
      const touch = event.touches[0];
      this.updateMousePosition(touch.clientX, touch.clientY);
      this.applyMouseForce();
    }
  }

  private onTouchEnd(): void {
    this.mouseDown = false;
    this.particleSystem.setMouseForce(null);
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.mouseDown) {
      const touch = event.touches[0];
      this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      this.updateMousePosition(touch.clientX, touch.clientY);
      this.applyMouseForce();
    }
  }

  private updateMousePosition(clientX: number, clientY: number): void {
    this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
  }

  private applyMouseForce(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const sphereRadius = this.particleSystem.getSphereRadius();
    const direction = new THREE.Vector3();
    this.raycaster.ray.direction.normalize();
    
    const cameraDistance = this.camera.position.length();
    const targetDistance = cameraDistance * 0.6;
    
    this.mouseWorldPos.copy(this.raycaster.ray.origin);
    direction.copy(this.raycaster.ray.direction);
    this.mouseWorldPos.add(direction.multiplyScalar(targetDistance));
    
    const dist = this.mouseWorldPos.length();
    if (dist > sphereRadius * 0.9) {
      this.mouseWorldPos.normalize().multiplyScalar(sphereRadius * 0.8);
    }
    
    this.particleSystem.setMouseForce(this.mouseWorldPos);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    this.controls.update();
    this.particleSystem.update(delta);

    const fps = this.fpsCounter.update();
    this.handlePerformance(fps);

    this.renderer.render(this.scene, this.camera);
  };

  private handlePerformance(fps: number): void {
    const isLow = this.fpsCounter.isLowFPS(55);
    
    if (isLow && this.qualityLevel > 0.3) {
      this.qualityLevel = Math.max(0.3, this.qualityLevel - 0.1);
      this.particleSystem.setQualityLevel(this.qualityLevel);
      this.fpsCounter.setColor('#ffaa00');
    } else if (!isLow && fps > 58 && this.qualityLevel < 1) {
      this.qualityLevel = Math.min(1, this.qualityLevel + 0.05);
      this.particleSystem.setQualityLevel(this.qualityLevel);
      if (this.qualityLevel >= 0.95) {
        this.fpsCounter.setColor('#00ff88');
      }
    }
  }
}

new App();
