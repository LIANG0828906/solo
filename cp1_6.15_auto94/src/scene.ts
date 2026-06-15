import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FernModel } from './fernModel.js';
import * as api from './api.js';
import type { PlantConfig, StageMorphology, GrowthStage, LightAngle } from './types.js';

type DoubleClickCallback = (plantId: string | null, worldPoint: THREE.Vector3, screenX: number, screenY: number) => void;
type ProgressCallback = (progress: number) => void;

interface PlantTransition {
  oldFern: FernModel | null;
  newFern: FernModel | null;
  progress: number;
  duration: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  directionalLight: THREE.DirectionalLight;
  hemisphereLight: THREE.HemisphereLight;
  fillLight: THREE.PointLight;

  currentFern: FernModel | null;
  currentPlantId: string | null;
  currentStage: GrowthStage;

  private container: HTMLElement | null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private clock: THREE.Clock;
  private animationId: number;
  private onDoubleClick: DoubleClickCallback | null;
  private onLoadProgress: ProgressCallback | null;
  private disposed: boolean;
  private transition: PlantTransition | null;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.directionalLight = new THREE.DirectionalLight(0xFFF5D6, 1.2);
    this.hemisphereLight = new THREE.HemisphereLight(0xA3D9A5, 0x3D2817, 0.45);
    this.fillLight = new THREE.PointLight(0xA3D9A5, 0.3, 20);

    this.currentFern = null;
    this.currentPlantId = null;
    this.currentStage = 'mature';

    this.container = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.animationId = 0;
    this.onDoubleClick = null;
    this.onLoadProgress = null;
    this.disposed = false;
    this.transition = null;
  }

  init(
    containerId: string,
    onPlantDoubleClick: DoubleClickCallback | null,
    onLoadProgress: ProgressCallback | null
  ): void {
    this.onDoubleClick = onPlantDoubleClick;
    this.onLoadProgress = onLoadProgress;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`SceneManager: container #${containerId} not found`);
      return;
    }
    this.container = container;

    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLights();
    this.setupGround();
    this.setupEventListeners();
    this.resize();

    this.animate();
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x1B3A2D);
    this.scene.fog = new THREE.FogExp2(0x1B3A2D, 0.08);
  }

  private setupCamera(): void {
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 1.2, 0);
  }

  private setupRenderer(): void {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);

    if (this.container) {
      this.container.appendChild(this.renderer.domElement);
    }

    this.renderer.domElement.style.touchAction = 'none';
  }

  private setupControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 15;
    this.controls.maxPolarAngle = Math.PI * 0.85 / 2;
    this.controls.target.set(0, 1.2, 0);
    this.controls.enablePan = false;
  }

  private setupLights(): void {
    this.scene.add(this.hemisphereLight);

    this.directionalLight.position.set(5, 8, 5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.directionalLight.shadow.camera.left = -8;
    this.directionalLight.shadow.camera.right = 8;
    this.directionalLight.shadow.camera.top = 8;
    this.directionalLight.shadow.camera.bottom = -6;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 30;
    this.directionalLight.shadow.bias = -0.0005;
    this.directionalLight.shadow.normalBias = 0.02;
    this.scene.add(this.directionalLight);

    this.fillLight.position.set(-3, 2, -4);
    this.scene.add(this.fillLight);
  }

  private setupGround(): void {
    const geometry = new THREE.CircleGeometry(12, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1F3B2A,
      roughness: 0.95,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = 0;
    this.scene.add(ground);
  }

  private setupEventListeners(): void {
    if (!this.renderer.domElement) return;

    this.renderer.domElement.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
  }

  handleDoubleClick(event: MouseEvent): void {
    if (!this.renderer.domElement || !this.container || !this.onDoubleClick) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    let hitPoint = new THREE.Vector3(0, 1, 0);
    let hit = false;

    if (this.currentFern) {
      const meshes: THREE.Object3D[] = [];
      this.currentFern.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          meshes.push(obj);
        }
      });

      const intersects = this.raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        hitPoint = intersects[0].point.clone();
        hit = true;
      }
    }

    this.onDoubleClick(
      hit ? this.currentPlantId : null,
      hitPoint,
      event.clientX,
      event.clientY
    );
  }

  async loadPlant(id: string): Promise<void> {
    if (this.onLoadProgress) this.onLoadProgress(0.1);

    try {
      const [config, morphology] = await Promise.all([
        api.getPlantConfig(id),
        api.getPlantStage(id, this.currentStage)
      ]);

      if (this.onLoadProgress) this.onLoadProgress(0.6);

      const oldFern = this.currentFern;
      const newFern = new FernModel(config);

      newFern.buildAllSporangia();
      newFern.updateMorphology(morphology, false);
      newFern.scale.setScalar(0);
      this.scene.add(newFern);

      this.transition = {
        oldFern: oldFern,
        newFern: newFern,
        progress: 0,
        duration: 0.6
      };

      this.currentPlantId = id;
      this.currentFern = newFern;

      if (this.onLoadProgress) this.onLoadProgress(1.0);
    } catch (error) {
      console.error(`[SceneManager] Failed to load plant ${id}:`, error);
      if (this.onLoadProgress) this.onLoadProgress(1.0);
      throw error;
    }
  }

  private disposeFern(fern: FernModel): void {
    fern.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (mat) {
        if (Array.isArray(mat)) {
          mat.forEach(m => m.dispose());
        } else {
          mat.dispose();
        }
      }
    });
  }

  async setGrowthStage(stage: GrowthStage): Promise<void> {
    if (!this.currentPlantId || !this.currentFern) return;
    this.currentStage = stage;

    try {
      const morphology = await api.getPlantStage(this.currentPlantId, stage);
      this.currentFern.updateMorphology(morphology, true);
    } catch (error) {
      console.error(`[SceneManager] Failed to set stage ${stage}:`, error);
    }
  }

  setLightAngle(azimuth: number, elevation: number): void {
    const r = 15;
    const elevationRad = (elevation * Math.PI) / 180;
    const azimuthRad = (azimuth * Math.PI) / 180;

    const x = r * Math.sin(elevationRad) * Math.cos(azimuthRad);
    const y = r * Math.cos(elevationRad);
    const z = r * Math.sin(elevationRad) * Math.sin(azimuthRad);

    this.directionalLight.position.set(x, y, z);
    this.directionalLight.target.position.set(0, 1, 0);
  }

  resize(): void {
    if (!this.container) return;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  tick(): void {
    const delta = this.clock.getDelta();

    this.controls.update();

    if (this.transition) {
      this.transition.progress = Math.min(1, this.transition.progress + delta / this.transition.duration);
      const t = this.transition.progress;
      const totalT = this.transition.progress * this.transition.duration;

      const fadeOutT = Math.min(1, totalT / 0.3);
      const fadeInStart = 0.15;
      const fadeInT = Math.max(0, Math.min(1, (totalT - fadeInStart) / 0.3));

      if (this.transition.oldFern) {
        const scaleT = easeOutCubic(fadeOutT);
        const scale = 1 - scaleT;
        this.transition.oldFern.scale.setScalar(Math.max(0, scale));
      }

      if (this.transition.newFern) {
        const scaleT = easeOutCubic(fadeInT);
        const scale = scaleT;
        this.transition.newFern.scale.setScalar(scale);
      }

      if (this.transition.progress >= 1) {
        if (this.transition.oldFern) {
          this.scene.remove(this.transition.oldFern);
          this.disposeFern(this.transition.oldFern);
        }
        if (this.transition.newFern) {
          this.transition.newFern.scale.setScalar(1);
        }
        this.transition = null;
      }
    }

    if (this.currentFern) {
      this.currentFern.tick(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private animate(): void {
    if (this.disposed) return;

    this.animationId = requestAnimationFrame(() => this.animate());
    this.tick();
  }

  dispose(): void {
    this.disposed = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.currentFern) {
      this.disposeFern(this.currentFern);
    }

    this.renderer.dispose();
    this.controls.dispose();
  }
}
