import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Forest } from './Forest';
import { Firefly } from './Firefly';
import { UIController } from './UIController';

class FireflyForestApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private forest: Forest;
  private fireflies: Firefly[] = [];
  private fireflyMeshes: THREE.Mesh[] = [];
  private uiController: UIController;

  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;

  private params = {
    fireflyCount: 200,
    speedMultiplier: 0.2 / 0.2,
    intensityMultiplier: 2 / 2,
    moonlightIntensity: 0.5
  };

  private readonly DEFAULT_CAMERA_POS = new THREE.Vector3(12, 8, 12);
  private readonly IDLE_THRESHOLD = 5000;
  private readonly AUTO_ROTATE_SPEED = 0.05;

  private lastInteractionTime: number = 0;
  private isAutoRotating: boolean = false;
  private cameraAngle: number = 0;
  private cameraRadius: number = 0;
  private cameraHeight: number = 8;

  private globalTime: number = 0;

  private animationFrameId: number = 0;
  private isRunning: boolean = false;

  constructor() {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    this.forest = new Forest(this.scene);

    this.uiController = new UIController({
      onFireflyCountChange: this.handleFireflyCountChange.bind(this),
      onSpeedChange: this.handleSpeedChange.bind(this),
      onIntensityChange: this.handleIntensityChange.bind(this),
      onMoonlightChange: this.handleMoonlightChange.bind(this)
    });

    this.cameraRadius = this.DEFAULT_CAMERA_POS.distanceTo(new THREE.Vector3(0, 0, 0));
    this.cameraAngle = Math.atan2(this.DEFAULT_CAMERA_POS.z, this.DEFAULT_CAMERA_POS.x);
    this.cameraHeight = this.DEFAULT_CAMERA_POS.y;

    this.createFireflies(this.params.fireflyCount);
    this.setupEventListeners();
    this.updateLastInteraction();
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.copy(this.DEFAULT_CAMERA_POS);
    camera.lookAt(0, 2, 0);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.style.display = 'block';
    document.body.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 1.5, 0);
    controls.update();
    return controls;
  }

  private createFireflies(count: number): void {
    for (let i = 0; i < count; i++) {
      const firefly = this.createSingleFirefly();
      this.fireflies.push(firefly);
      this.fireflyMeshes.push(firefly.getCoreMesh());
    }
  }

  private createSingleFirefly(): Firefly {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 16;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.8 + Math.random() * 4.5;
    const position = new THREE.Vector3(x, y, z);
    return new Firefly(this.scene, position);
  }

  private removeFireflies(count: number): void {
    const toRemove = Math.min(count, this.fireflies.length);
    for (let i = 0; i < toRemove; i++) {
      const firefly = this.fireflies.pop()!;
      this.fireflyMeshes.pop();
      firefly.dispose();
    }
  }

  private handleFireflyCountChange(count: number): void {
    const target = Math.round(count);
    const current = this.fireflies.length;
    const diff = target - current;

    if (diff > 0) {
      this.createFireflies(diff);
    } else if (diff < 0) {
      this.removeFireflies(-diff);
    }
  }

  private handleSpeedChange(speed: number): void {
    this.params.speedMultiplier = speed / 0.2;
  }

  private handleIntensityChange(intensity: number): void {
    this.params.intensityMultiplier = intensity / 2;
  }

  private handleMoonlightChange(intensity: number): void {
    this.params.moonlightIntensity = intensity;
    this.forest.setMoonlightIntensity(intensity);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));

    this.controls.addEventListener('start', this.updateLastInteraction.bind(this));
    this.controls.addEventListener('change', this.updateLastInteraction.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.updateLastInteraction();
  }

  private onPointerMove(event: PointerEvent): void {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.updateLastInteraction();
  }

  private onPointerDown(): void {
    this.updateLastInteraction();
  }

  private updateLastInteraction(): void {
    this.lastInteractionTime = performance.now();
    if (this.isAutoRotating) {
      this.isAutoRotating = false;
      this.controls.enabled = true;
    }
  }

  private onClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).tagName !== 'CANVAS') return;

    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.fireflyMeshes, false);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object as THREE.Mesh;
      const firefly = hitObject.userData.firefly as Firefly | undefined;
      if (firefly && this.fireflies.includes(firefly)) {
        firefly.triggerClickChain(this.fireflies);
      }
    }
  }

  private checkIdleAndRotate(delta: number): void {
    const now = performance.now();
    if (!this.isAutoRotating && now - this.lastInteractionTime > this.IDLE_THRESHOLD) {
      this.isAutoRotating = true;
      this.controls.enabled = false;

      const camPos = this.camera.position;
      this.cameraRadius = Math.sqrt(camPos.x * camPos.x + camPos.z * camPos.z);
      this.cameraAngle = Math.atan2(camPos.z, camPos.x);
      this.cameraHeight = camPos.y;
    }

    if (this.isAutoRotating) {
      this.cameraAngle += this.AUTO_ROTATE_SPEED * delta;
      this.camera.position.x = Math.cos(this.cameraAngle) * this.cameraRadius;
      this.camera.position.z = Math.sin(this.cameraAngle) * this.cameraRadius;
      this.camera.position.y = this.cameraHeight;
      this.camera.lookAt(0, 1.5, 0);
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  private animate(): void {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.globalTime += delta;

    if (!this.isAutoRotating) {
      this.controls.update();
    }

    this.checkIdleAndRotate(delta);

    for (let i = 0; i < this.fireflies.length; i++) {
      this.fireflies[i].update(
        delta,
        this.params.speedMultiplier,
        this.params.intensityMultiplier,
        this.globalTime
      );
    }

    this.renderer.render(this.scene, this.camera);
    this.uiController.updateFPS(performance.now());
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== 0) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  public dispose(): void {
    this.stop();

    window.removeEventListener('resize', this.onWindowResize.bind(this));
    window.removeEventListener('pointermove', this.onPointerMove.bind(this));
    window.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    this.renderer.domElement.removeEventListener('click', this.onClick.bind(this));

    this.fireflies.forEach(f => f.dispose());
    this.fireflies = [];
    this.fireflyMeshes = [];

    this.forest.dispose();
    this.controls.dispose();
    this.uiController.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}

let app: FireflyForestApp | null = null;

function init(): void {
  app = new FireflyForestApp();
  app.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
