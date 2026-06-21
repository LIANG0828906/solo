import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  GRID, CAMERA, DAMPING, ANIMATION, HIGHLIGHT_COLOR,
  BACKGROUND_COLOR, GRID_COLOR
} from './config';
import { grid, VoxelData } from './grid';

type CameraView = 'free' | 'front' | 'side' | 'top' | 'perspective' | 'bookmark';

interface VoxelMesh {
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
}

export class SceneManager {
  container: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  gridHelper!: THREE.GridHelper;

  private groundPlane!: THREE.Mesh;
  private voxelMeshes: Map<string, VoxelMesh> = new Map();
  private highlightMesh!: THREE.Mesh;
  private highlightVisible: boolean = false;
  private highlightHideTimeout: number | null = null;

  private errorEl!: HTMLDivElement;
  private errorTimeout: number | null = null;

  private cameraShakeActive: boolean = false;
  private cameraShakeStart: number = 0;
  private originalCamPos: THREE.Vector3 = new THREE.Vector3();
  private originalTarget: THREE.Vector3 = new THREE.Vector3();

  private currentView: CameraView = 'free';
  private animatingVoxels: Set<string> = new Set();
  private removingVoxels: Set<string> = new Set();

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BACKGROUND_COLOR);

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(CAMERA.FREE.x, CAMERA.FREE.y, CAMERA.FREE.z);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = DAMPING;
    this.controls.target.set(0, -128, 0);
    this.controls.minDistance = 100;
    this.controls.maxDistance = 800;

    this.setupLights();
    this.setupGrid();
    this.setupHighlight();
    this.setupErrorMessage();

    window.addEventListener('resize', this.handleResize);
    grid.onChange(this.handleGridChange);

    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(150, 200, 150);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -300;
    dirLight.shadow.camera.right = 300;
    dirLight.shadow.camera.top = 300;
    dirLight.shadow.camera.bottom = -300;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 600;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(-100, 80, -100);
    this.scene.add(fillLight);
  }

  private setupGrid(): void {
    const size = GRID.CELL_SIZE * (GRID.GRID_MAX - GRID.GRID_MIN);
    const divisions = GRID.GRID_MAX - GRID.GRID_MIN;

    this.gridHelper = new THREE.GridHelper(size, divisions, GRID_COLOR, GRID_COLOR);
    this.gridHelper.position.y = GRID.GRID_MIN * GRID.CELL_SIZE;
    this.scene.add(this.gridHelper);

    const planeGeo = new THREE.PlaneGeometry(size, size);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x1a1a1a,
      side: THREE.DoubleSide
    });
    this.groundPlane = new THREE.Mesh(planeGeo, planeMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = GRID.GRID_MIN * GRID.CELL_SIZE;
    this.groundPlane.name = 'groundPlane';
    this.scene.add(this.groundPlane);
  }

  private setupHighlight(): void {
    const geometry = new THREE.PlaneGeometry(GRID.CELL_SIZE * 0.98, GRID.CELL_SIZE * 0.98);
    const material = new THREE.MeshBasicMaterial({
      color: HIGHLIGHT_COLOR,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.highlightMesh = new THREE.Mesh(geometry, material);
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);
  }

  private setupErrorMessage(): void {
    this.errorEl = document.createElement('div');
    this.errorEl.textContent = '无法放置';
    this.errorEl.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 14px 28px;
      background: rgba(255, 68, 68, 0.9);
      color: white;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 100;
      letter-spacing: 1px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      box-shadow: 0 4px 20px rgba(255, 68, 68, 0.4);
    `;
    this.container.appendChild(this.errorEl);
  }

  showHighlight(faceCenter: THREE.Vector3, normal: THREE.Vector3): void {
    if (this.highlightHideTimeout !== null) {
      clearTimeout(this.highlightHideTimeout);
      this.highlightHideTimeout = null;
    }

    this.highlightMesh.position.copy(faceCenter);
    this.highlightMesh.lookAt(
      faceCenter.x + normal.x,
      faceCenter.y + normal.y,
      faceCenter.z + normal.z
    );
    this.highlightMesh.visible = true;
    this.highlightVisible = true;

    (this.highlightMesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
  }

  hideHighlight(delay: number = ANIMATION.HIGHLIGHT_FADE_DELAY): void {
    if (this.highlightHideTimeout !== null) {
      clearTimeout(this.highlightHideTimeout);
    }

    this.highlightHideTimeout = window.setTimeout(() => {
      this.highlightMesh.visible = false;
      this.highlightVisible = false;
      this.highlightHideTimeout = null;
    }, delay);
  }

  isHighlightVisible(): boolean {
    return this.highlightVisible;
  }

  getGroundPlane(): THREE.Mesh {
    return this.groundPlane;
  }

  private handleGridChange = (voxels: Map<string, VoxelData>): void => {
    const currentKeys = new Set(this.voxelMeshes.keys());
    const newKeys = new Set(voxels.keys());

    for (const key of newKeys) {
      if (!currentKeys.has(key)) {
        const voxel = voxels.get(key)!;
        this.createVoxelMesh(voxel, true);
      }
    }

    for (const key of currentKeys) {
      if (!newKeys.has(key)) {
        this.removeVoxelMesh(key);
      }
    }
  };

  private createVoxelMesh(voxel: VoxelData, animate: boolean = false): void {
    const key = `${voxel.x},${voxel.y},${voxel.z}`;
    if (this.voxelMeshes.has(key)) return;

    const half = GRID.CELL_SIZE / 2;
    const boxSize = GRID.CELL_SIZE * 0.92;
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(voxel.color),
      metalness: 0.15,
      roughness: 0.55
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      voxel.x * GRID.CELL_SIZE + half,
      voxel.y * GRID.CELL_SIZE + half,
      voxel.z * GRID.CELL_SIZE + half
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { voxelX: voxel.x, voxelY: voxel.y, voxelZ: voxel.z };

    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    mesh.add(edges);

    const flashGeo = new THREE.BoxGeometry(boxSize * 1.1, boxSize * 1.1, boxSize * 1.1);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.name = 'flash';
    mesh.add(flashMesh);

    this.scene.add(mesh);
    this.voxelMeshes.set(key, { mesh, edges });

    if (animate) {
      this.animatePlaceVoxel(key, mesh, flashMesh);
    }
  }

  private animatePlaceVoxel(key: string, mesh: THREE.Mesh, flashMesh: THREE.Mesh): void {
    this.animatingVoxels.add(key);
    const startTime = performance.now();
    const duration = ANIMATION.PLACE_DURATION;

    mesh.scale.set(0.8, 0.8, 0.8);

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      const scale = this.easeOutBack(t);
      mesh.scale.set(scale, scale, scale);

      const flashOpacity = t < 0.4 ? 0.6 * (1 - t / 0.4) : 0;
      (flashMesh.material as THREE.MeshBasicMaterial).opacity = flashOpacity;

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        mesh.scale.set(1, 1, 1);
        (flashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        this.animatingVoxels.delete(key);
      }
    };
    animate();
  }

  private easeOutBack(t: number): number {
    const c1 = 1.065;
    const c3 = c1 + 1;
    const result = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    return result;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private removeVoxelMesh(key: string): void {
    const voxelMesh = this.voxelMeshes.get(key);
    if (!voxelMesh) return;

    if (this.removingVoxels.has(key)) return;
    this.removingVoxels.add(key);

    const { mesh } = voxelMesh;
    const startTime = performance.now();
    const duration = ANIMATION.REMOVE_DURATION;

    const material = mesh.material as THREE.MeshStandardMaterial;
    material.transparent = true;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(t);

      const scale = 1 - eased;
      mesh.scale.set(scale, scale, scale);
      mesh.rotation.y = (Math.PI / 2) * eased;
      material.opacity = 1 - eased;

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.voxelMeshes.delete(key);
        this.removingVoxels.delete(key);
      }
    };
    animate();
  }

  flashVoxelsForRemove(voxels: VoxelData[]): Promise<void> {
    return new Promise((resolve) => {
      let flashCount = 0;
      const totalFlashes = 6;
      const flashDuration = 100;

      const flash = () => {
        flashCount++;
        const isOn = flashCount % 2 === 1;

        for (const v of voxels) {
          const key = `${v.x},${v.y},${v.z}`;
          const voxelMesh = this.voxelMeshes.get(key);
          if (voxelMesh) {
            const flashMesh = voxelMesh.mesh.getObjectByName('flash') as THREE.Mesh;
            if (flashMesh) {
              (flashMesh.material as THREE.MeshBasicMaterial).opacity = isOn ? 0.7 : 0;
            }
          }
        }

        if (flashCount < totalFlashes) {
          setTimeout(flash, flashDuration);
        } else {
          for (const v of voxels) {
            const key = `${v.x},${v.y},${v.z}`;
            const voxelMesh = this.voxelMeshes.get(key);
            if (voxelMesh) {
              const flashMesh = voxelMesh.mesh.getObjectByName('flash') as THREE.Mesh;
              if (flashMesh) {
                (flashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
              }
            }
          }
          resolve();
        }
      };

      flash();
    });
  }

  showError(): void {
    if (this.errorTimeout !== null) {
      clearTimeout(this.errorTimeout);
    }

    this.errorEl.style.opacity = '1';
    this.triggerCameraShake();

    this.errorTimeout = window.setTimeout(() => {
      this.errorEl.style.opacity = '0';
      this.errorTimeout = null;
    }, ANIMATION.ERROR_MESSAGE_DURATION);
  }

  private triggerCameraShake(): void {
    if (this.cameraShakeActive) return;

    this.cameraShakeActive = true;
    this.cameraShakeStart = performance.now();
    this.originalCamPos.copy(this.camera.position);
    this.originalTarget.copy(this.controls.target);
  }

  private updateCameraShake(): void {
    if (!this.cameraShakeActive) return;

    const elapsed = performance.now() - this.cameraShakeStart;
    const t = Math.min(elapsed / ANIMATION.CAMERA_SHAKE_DURATION, 1);

    if (t >= 1) {
      this.cameraShakeActive = false;
      this.camera.position.copy(this.originalCamPos);
      this.controls.target.copy(this.originalTarget);
      return;
    }

    const shakeIntensity = ANIMATION.CAMERA_SHAKE_INTENSITY * (1 - t);
    const offsetX = (Math.random() - 0.5) * shakeIntensity * 2;
    const offsetY = (Math.random() - 0.5) * shakeIntensity * 2;
    const offsetZ = (Math.random() - 0.5) * shakeIntensity * 2;

    this.camera.position.x = this.originalCamPos.x + offsetX;
    this.camera.position.y = this.originalCamPos.y + offsetY;
    this.camera.position.z = this.originalCamPos.z + offsetZ;
  }

  setView(view: CameraView): void {
    this.currentView = view;

    let target: THREE.Vector3;
    switch (view) {
      case 'free':
        target = new THREE.Vector3(CAMERA.FREE.x, CAMERA.FREE.y, CAMERA.FREE.z);
        break;
      case 'front':
        target = new THREE.Vector3(CAMERA.FRONT.x, CAMERA.FRONT.y, CAMERA.FRONT.z);
        break;
      case 'side':
        target = new THREE.Vector3(CAMERA.SIDE.x, CAMERA.SIDE.y, CAMERA.SIDE.z);
        break;
      case 'top':
        target = new THREE.Vector3(CAMERA.TOP.x, CAMERA.TOP.y, CAMERA.TOP.z);
        break;
      case 'perspective':
        target = new THREE.Vector3(CAMERA.PERSPECTIVE.x, CAMERA.PERSPECTIVE.y, CAMERA.PERSPECTIVE.z);
        break;
      case 'bookmark':
        target = new THREE.Vector3(CAMERA.FREE.x, CAMERA.FREE.y * 1.5, CAMERA.FREE.z * 1.5);
        break;
      default:
        return;
    }

    this.animateCameraTo(target);
  }

  private animateCameraTo(targetPos: THREE.Vector3): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endTarget = new THREE.Vector3(0, 0, 0);
    const startTime = performance.now();
    const duration = 600;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(t);

      this.camera.position.lerpVectors(startPos, targetPos, eased);
      this.controls.target.lerpVectors(startTarget, endTarget, eased);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  getRaycaster(): THREE.Raycaster {
    return this.raycaster;
  }

  getMouseVector(): THREE.Vector2 {
    return this.mouse;
  }

  getVoxelMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    for (const { mesh } of this.voxelMeshes.values()) {
      meshes.push(mesh);
    }
    return meshes;
  }

  getGridHelper(): THREE.GridHelper {
    return this.gridHelper;
  }

  getRendererDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  getCurrentView(): CameraView {
    return this.currentView;
  }

  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.updateCameraShake();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  updateMouse(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}

let sceneManager: SceneManager | null = null;

export function initScene(container: HTMLElement): SceneManager {
  sceneManager = new SceneManager(container);
  (window as any).__scene = sceneManager;
  return sceneManager;
}

export function getScene(): SceneManager | null {
  return sceneManager;
}

export type { CameraView };
