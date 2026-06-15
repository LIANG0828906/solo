import * as THREE from 'three';
import { SceneBuilder, type BuildingEntry, type BuildingInfo } from './sceneBuilder';
import { CameraController } from './cameraControl';
import { UIManager } from './uiManager';

class CampusWalkthrough {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sceneBuilder: SceneBuilder;
  private cameraCtrl: CameraController;
  private ui: UIManager;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private buildings: BuildingEntry[] = [];

  private lastTime = 0;
  private frameCount = 0;
  private fpsAccumulator = 0;
  private hoveredBuildingId: string | null = null;
  private originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.scene = new THREE.Scene();
    this.scene.name = 'CampusScene';

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 1200);
    this.camera.position.set(0, 1.75, 45);
    this.camera.lookAt(0, 3, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x0a0e1a, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.ui = new UIManager();
    this.cameraCtrl = new CameraController(this.camera, this.renderer.domElement);
    this.sceneBuilder = new SceneBuilder(this.scene);

    this.cameraCtrl.onModeChange = (mode) => {
      this.ui.setMode(mode);
      this.clearHoverHighlight();
    };
    this.ui.setMode(this.cameraCtrl.getMode());

    this.bindInteractionEvents();
    this.bindResizeEvent();

    void this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.sceneBuilder.build((loaded, total, stage) => {
        this.ui.setProgress(loaded, total, stage);
      });
      this.buildings = this.sceneBuilder.getBuildings();
      this.ui.hideLoading(500);
      requestAnimationFrame((t) => this.loop(t));
    } catch (err) {
      console.error('场景初始化失败:', err);
      this.ui.hideLoading(200);
    }
  }

  private bindInteractionEvents(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointermove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.handleHover();
    });

    dom.addEventListener('click', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.handleClick();
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#info-card') && !target.closest('canvas')) {
        this.ui.hideCard();
      }
    });
  }

  private bindResizeEvent(): void {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  private handleHover(): void {
    if (this.cameraCtrl.getMode() === 'firstPerson' && document.pointerLockElement) {
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.buildings.flatMap((b) => b.clickableMeshes);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const bid = hit.userData.buildingId as string | undefined;
      if (bid && this.hoveredBuildingId !== bid) {
        this.clearHoverHighlight();
        this.hoveredBuildingId = bid;
        this.applyHoverHighlight(bid);
      }
      if (bid) {
        this.renderer.domElement.style.cursor =
          this.cameraCtrl.getMode() === 'overhead' && this.cameraCtrl['isDragging']
            ? 'grabbing'
            : 'pointer';
      }
    } else {
      this.clearHoverHighlight();
      this.renderer.domElement.style.cursor =
        this.cameraCtrl.getMode() === 'overhead' ? 'grab' : 'default';
    }
  }

  private applyHoverHighlight(buildingId: string): void {
    const entry = this.buildings.find((b) => b.info.id === buildingId);
    if (!entry) return;

    for (const mesh of entry.clickableMeshes) {
      if (!this.originalMaterials.has(mesh)) {
        this.originalMaterials.set(mesh, mesh.material);
      }
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        for (const m of mat) {
          const sm = m as THREE.MeshStandardMaterial;
          if (sm.emissive) {
            sm.userData._origEmissiveIntensity = sm.emissiveIntensity;
            sm.emissiveIntensity = Math.min(1.5, (sm.emissiveIntensity || 0) + 0.45);
          }
        }
      } else {
        const sm = mat as THREE.MeshStandardMaterial;
        if (sm.emissive) {
          sm.userData._origEmissiveIntensity = sm.emissiveIntensity;
          sm.emissiveIntensity = Math.min(1.5, (sm.emissiveIntensity || 0) + 0.45);
        }
      }
    }
  }

  private clearHoverHighlight(): void {
    if (!this.hoveredBuildingId) return;

    const entry = this.buildings.find((b) => b.info.id === this.hoveredBuildingId);
    if (entry) {
      for (const mesh of entry.clickableMeshes) {
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          for (const m of mat) {
            const sm = m as THREE.MeshStandardMaterial;
            if (sm.userData._origEmissiveIntensity !== undefined) {
              sm.emissiveIntensity = sm.userData._origEmissiveIntensity;
              delete sm.userData._origEmissiveIntensity;
            }
          }
        } else {
          const sm = mat as THREE.MeshStandardMaterial;
          if (sm.userData._origEmissiveIntensity !== undefined) {
            sm.emissiveIntensity = sm.userData._origEmissiveIntensity;
            delete sm.userData._origEmissiveIntensity;
          }
        }
      }
    }
    this.hoveredBuildingId = null;
  }

  private handleClick(): void {
    if (this.cameraCtrl.getMode() === 'firstPerson') {
      const meshes = this.buildings.flatMap((b) => b.clickableMeshes);
      const intersects = this.raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const bid = (intersects[0].object as THREE.Mesh).userData.buildingId as string | undefined;
        if (bid) this.showBuildingInfo(bid);
      }
      return;
    }

    if (this.cameraCtrl['isDragging']) return;

    const meshes = this.buildings.flatMap((b) => b.clickableMeshes);
    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const bid = (intersects[0].object as THREE.Mesh).userData.buildingId as string | undefined;
      if (bid) this.showBuildingInfo(bid);
    } else {
      this.ui.hideCard();
    }
  }

  private showBuildingInfo(buildingId: string): void {
    const entry = this.buildings.find((b) => b.info.id === buildingId);
    if (entry) {
      this.ui.showCard(entry.info as BuildingInfo);
    }
  }

  private loop(time: number): void {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.frameCount++;
    this.fpsAccumulator += dt;
    if (this.fpsAccumulator >= 0.5) {
      const fps = this.frameCount / this.fpsAccumulator;
      this.ui.updateFPS(fps);
      this.frameCount = 0;
      this.fpsAccumulator = 0;
    }

    this.cameraCtrl.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new CampusWalkthrough();
});
