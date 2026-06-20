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
  private accumulator = 0;
  private fixedTimeStep = 1 / 60;
  private frameCount = 0;
  private fpsAccumulator = 0;
  private hoveredBuildingId: string | null = null;
  private originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

  private readonly targetFPS = 60;
  private readonly maxFrameTime = 1 / 30;
  private frameThrottleTimer = 0;

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
      failIfMajorPerformanceCaveat: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x0a0e1a, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.info.autoReset = true;

    this.container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 250;
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
    this.setupPerformanceHints();

    void this.initialize();
  }

  private setupPerformanceHints(): void {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      this.fixedTimeStep = 1 / 30;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }

    let hidden = false;
    document.addEventListener('visibilitychange', () => {
      hidden = document.hidden;
      if (hidden) {
        this.renderer.setAnimationLoop(null);
      } else {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        document.exitPointerLock?.();
      }
    });
  }

  private async initialize(): Promise<void> {
    try {
      await this.sceneBuilder.build((loaded, total, stage) => {
        this.ui.setProgress(loaded, total, stage);
      });
      this.buildings = this.sceneBuilder.getBuildings();
      this.ui.hideLoading(500);
      this.lastTime = performance.now();
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

    dom.addEventListener('dblclick', () => {
      if (this.cameraCtrl.getMode() === 'firstPerson') {
        dom.requestPointerLock?.();
      } else if (!document.fullscreenElement) {
        dom.requestFullscreen?.().catch(() => {});
      }
    });

    dom.addEventListener('pointerleave', () => {
      this.clearHoverHighlight();
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#info-card') && !target.closest('canvas')) {
        this.ui.hideCard();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR') {
        this.resetCamera();
      }
      if (e.code === 'KeyF') {
        this.toggleFullscreen();
      }
    });
  }

  private bindResizeEvent(): void {
    let resizeTimeout: number | null = null;
    window.addEventListener('resize', () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }, 100);
    });
  }

  private resetCamera(): void {
    if (this.cameraCtrl.getMode() === 'firstPerson') {
      this.cameraCtrl['firstPersonPos'].set(0, 1.75, 45);
      this.cameraCtrl['firstPersonYaw'] = Math.PI;
      this.cameraCtrl['firstPersonPitch'] = -0.08;
    } else {
      this.cameraCtrl['overheadTarget'].set(0, 0, 0);
      this.cameraCtrl['overheadDistance'] = 95;
      this.cameraCtrl['overheadYaw'] = -0.55;
      this.cameraCtrl['overheadPitch'] = 0.95;
    }
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
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
        const isDragging = (this.cameraCtrl as any).isDragging;
        this.renderer.domElement.style.cursor =
          this.cameraCtrl.getMode() === 'overhead' && isDragging
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

    if ((this.cameraCtrl as any).isDragging) return;

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
    if (document.hidden) return;

    const rawDt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    const dt = Math.min(rawDt, this.maxFrameTime);
    this.accumulator += dt;

    while (this.accumulator >= this.fixedTimeStep) {
      this.cameraCtrl.update(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    this.sceneBuilder.updateLOD(this.camera);

    const stars = this.scene.getObjectByName('stars');
    if (stars) {
      stars.rotation.y += dt * 0.008;
    }

    this.renderer.render(this.scene, this.camera);

    this.frameCount++;
    this.fpsAccumulator += dt;
    if (this.fpsAccumulator >= 0.5) {
      const fps = this.frameCount / this.fpsAccumulator;
      this.ui.updateFPS(fps);
      this.frameCount = 0;
      this.fpsAccumulator = 0;

      if (fps < 25 && this.renderer.getPixelRatio() > 1.25) {
        this.renderer.setPixelRatio(1.25);
      }
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new CampusWalkthrough();
});
