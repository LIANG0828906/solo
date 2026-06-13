import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TerrainEngine } from './TerrainEngine';
import { ParticleSystem } from './ParticleSystem';
import { InputController } from './InputController';

class Renderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private terrainEngine: TerrainEngine;
  private particleSystem: ParticleSystem;
  private inputController: InputController;

  private directionalLight: THREE.DirectionalLight;
  private hemisphereLight: THREE.HemisphereLight;

  private clock: THREE.Clock;
  private elapsedTime = 0;

  private frameCount = 0;
  private fpsTime = 0;
  private currentFps = 60;

  private uiOpacity = 1;
  private uiIdleTimer = 0;
  private uiIdleThreshold = 3;

  private speedFill: HTMLElement | null;
  private speedValue: HTMLElement | null;
  private fpsCounter: HTMLElement | null;
  private uiOverlay: HTMLElement | null;

  constructor() {
    this.container = document.getElementById('canvas-container') || document.body;

    this.speedFill = document.getElementById('speed-fill');
    this.speedValue = document.getElementById('speed-value');
    this.fpsCounter = document.getElementById('fps-counter');
    this.uiOverlay = document.getElementById('ui-overlay');

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.FogExp2(0x1a1a1a, 0.02);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(25, 20, 25);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.8;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.enablePan = false;
    this.controls.mouseButtons = {
      LEFT: null as any,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.directionalLight.shadow.camera.left = -30;
    this.directionalLight.shadow.camera.right = 30;
    this.directionalLight.shadow.camera.top = 30;
    this.directionalLight.shadow.camera.bottom = -30;
    this.scene.add(this.directionalLight);

    this.hemisphereLight = new THREE.HemisphereLight(0xff6633, 0x1a0500, 0.8);
    this.scene.add(this.hemisphereLight);

    const ambientLight = new THREE.AmbientLight(0xff3300, 0.4);
    this.scene.add(ambientLight);

    this.terrainEngine = new TerrainEngine(50, 64);
    this.scene.add(this.terrainEngine.mesh);

    this.particleSystem = new ParticleSystem(this.scene, this.terrainEngine, 1500);

    this.inputController = new InputController(
      this.renderer.domElement,
      this.camera,
      this.terrainEngine,
      this.particleSystem,
      this.controls
    );

    this.inputController.onSpeedChange = (speed: number) => {
      this.updateSpeedUI(speed);
    };

    this.inputController.onMouseActivity = () => {
      this.uiIdleTimer = 0;
      this.uiOpacity = 1;
      if (this.uiOverlay) {
        this.uiOverlay.style.opacity = '1';
      }
    };

    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  private updateSpeedUI(speed: number): void {
    if (this.speedFill) {
      this.speedFill.style.width = `${speed * 100}%`;
    }
    if (this.speedValue) {
      this.speedValue.textContent = speed.toFixed(2);
    }
  }

  private updateFPS(delta: number): void {
    this.frameCount++;
    this.fpsTime += delta;

    if (this.fpsTime >= 0.5) {
      this.currentFps = Math.round(this.frameCount / this.fpsTime);
      if (this.fpsCounter) {
        this.fpsCounter.textContent = `FPS: ${this.currentFps}`;
      }
      this.frameCount = 0;
      this.fpsTime = 0;
    }
  }

  private updateUI(delta: number): void {
    this.uiIdleTimer += delta;
    if (this.uiIdleTimer > this.uiIdleThreshold) {
      const targetOpacity = 0.2;
      this.uiOpacity += (targetOpacity - this.uiOpacity) * delta * 0.5;
      if (this.uiOverlay) {
        this.uiOverlay.style.opacity = this.uiOpacity.toString();
      }
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const delta = Math.min(0.05, this.clock.getDelta());
    this.elapsedTime += delta;

    this.controls.update();

    const forces = this.inputController.consumePendingForces();
    for (const force of forces) {
      this.terrainEngine.addForce(force);
    }

    this.inputController.broadcastEvents();

    this.terrainEngine.update(delta, this.elapsedTime);
    this.particleSystem.update(delta, this.terrainEngine.getHeightModifiers());

    this.terrainEngine.smooth(0.02);

    this.updateFPS(delta);
    this.updateUI(delta);

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.inputController.dispose();
    this.particleSystem.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

new Renderer();
