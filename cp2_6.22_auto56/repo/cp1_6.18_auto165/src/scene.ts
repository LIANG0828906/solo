import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleStorm, ParticleParams } from './particleStorm';

interface FlarePoint {
  mesh: THREE.Points;
  position: THREE.Vector3;
  flickerPhase: number;
  flickerSpeed: number;
}

const DEFAULT_PARAMS: ParticleParams = {
  vortexStrength: 1.0,
  particleSpeed: 2.0,
  particleSize: 0.3,
  windForce: 0.0,
  backgroundColor: '#0D0D1A',
};

const FLARE_COUNT = 5;
const FLARE_AREA_RADIUS = 3;
const FLARE_CENTER_HEIGHT = 3;

export class SceneManager {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private particleStorm!: ParticleStorm;
  private params: ParticleParams;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private flarePoints: FlarePoint[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onBurstCallback: ((center: THREE.Vector3) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.params = { ...DEFAULT_PARAMS };
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.init();
  }

  private init(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.params.backgroundColor);

    const { clientWidth, clientHeight } = this.container;
    this.camera = new THREE.PerspectiveCamera(60, clientWidth / clientHeight, 0.1, 1000);
    this.camera.position.set(25, 15, 25);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 60;
    this.controls.target.set(0, 0, 0);

    this.particleStorm = new ParticleStorm(this.scene, 8000);
    this.createFlarePoints();
    this.setupEventListeners();
    this.animate();
  }

  private createFlarePoints(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < FLARE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * FLARE_AREA_RADIUS;
      const heightOffset = (Math.random() - 0.5) * 2;

      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        FLARE_CENTER_HEIGHT + heightOffset,
        Math.sin(angle) * radius
      );

      const flareGeometry = geometry.clone();
      const flarePositions = flareGeometry.attributes.position.array as Float32Array;
      flarePositions[0] = position.x;
      flarePositions[1] = position.y;
      flarePositions[2] = position.z;
      flareGeometry.attributes.position.needsUpdate = true;

      const flareMaterial = material.clone();
      const mesh = new THREE.Points(flareGeometry, flareMaterial);
      mesh.userData.isFlare = true;
      mesh.userData.flareIndex = i;

      this.scene.add(mesh);

      this.flarePoints.push({
        mesh,
        position,
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: 1.5 + Math.random() * 2,
      });
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.addEventListener('dblclick', this.onDoubleClick.bind(this));
  }

  private onWindowResize(): void {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  private onDoubleClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const flareMeshes = this.flarePoints.map((f) => f.mesh);
    const intersects = this.raycaster.intersectObjects(flareMeshes, false);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.triggerBurst(point);
    }
  }

  private triggerBurst(center: THREE.Vector3): void {
    this.particleStorm.triggerBurst(center);
    if (this.onBurstCallback) {
      this.onBurstCallback(center);
    }
  }

  private updateFlares(deltaTime: number): void {
    for (const flare of this.flarePoints) {
      flare.flickerPhase += deltaTime * flare.flickerSpeed;
      const flicker = 0.5 + 0.5 * Math.sin(flare.flickerPhase);
      const material = flare.mesh.material as THREE.PointsMaterial;
      material.opacity = 0.4 + flicker * 0.5;
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    this.particleStorm.update(deltaTime, this.params);
    this.updateFlares(deltaTime);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public updateParams(newParams: Partial<ParticleParams>): void {
    this.params = { ...this.params, ...newParams };

    if (newParams.backgroundColor !== undefined) {
      this.scene.background = new THREE.Color(this.params.backgroundColor);
    }
  }

  public getParams(): ParticleParams {
    return { ...this.params };
  }

  public resetParams(): void {
    this.params = { ...DEFAULT_PARAMS };
    this.scene.background = new THREE.Color(this.params.backgroundColor);
  }

  public getDefaultParams(): ParticleParams {
    return { ...DEFAULT_PARAMS };
  }

  public setOnBurstCallback(callback: (center: THREE.Vector3) => void): void {
    this.onBurstCallback = callback;
  }

  public captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.removeEventListener('dblclick', this.onDoubleClick.bind(this));

    this.particleStorm.dispose();

    for (const flare of this.flarePoints) {
      this.scene.remove(flare.mesh);
      flare.mesh.geometry.dispose();
      (flare.mesh.material as THREE.Material).dispose();
    }
    this.flarePoints = [];

    this.controls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
