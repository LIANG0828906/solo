import * as THREE from 'three';
import { ExplosionController } from './explosionController';
import { UIController } from './uiController';
import { loadModelFromFile } from './modelLoader';
import type { GroupInfo } from './types';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  private uiController: UIController;
  private explosionController: ExplosionController;

  private modelRoot: THREE.Object3D | null = null;
  private groups: GroupInfo[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private isDragging: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;
  private cameraTheta: number = 0;
  private cameraPhi: number = Math.PI / 4;
  private cameraRadius: number = 30;
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  private constMinPhi: number = (30 * Math.PI) / 180;
  private constMaxPhi: number = (120 * Math.PI) / 180;
  private constMinRadius: number = 10;
  private constMaxRadius: number = 200;

  constructor() {
    this.canvas = document.getElementById('viewport') as HTMLCanvasElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.uiController = new UIController();
    this.explosionController = new ExplosionController();

    this.setupLights();
    this.setupGrid();
    this.setupEventListeners();
    this.setupUICallbacks();
    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 20, 10);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00a3ff, 0.3);
    dirLight2.position.set(-10, 10, -10);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x00cfff, 0.5, 100);
    pointLight.position.set(0, 15, 0);
    this.scene.add(pointLight);
  }

  private setupGrid(): void {
    const gridHelper = new THREE.GridHelper(50, 50, 0x1e3a5f, 0x14233a);
    gridHelper.position.y = -6;
    this.scene.add(gridHelper);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onResize());

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
  }

  private setupUICallbacks(): void {
    this.uiController.setHandlers({
      onFileUpload: (file) => this.handleFileUpload(file),
      onDistanceChange: (distance) => {
        this.explosionController.setExplosionDistance(distance);
      },
      onExplode: () => {
        this.explosionController.explode(() => {
          this.uiController.setExplodedState(true);
        });
      },
      onReset: () => {
        this.explosionController.reset(() => {
          this.uiController.setExplodedState(false);
        });
      },
      onScreenshotRequest: () => this.takeScreenshot(),
      onGroupSelectionChange: (_groupId, _selected) => {}
    });
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMouseX;
    const deltaY = e.clientY - this.previousMouseY;

    this.cameraTheta -= deltaX * 0.005;
    this.cameraPhi = Math.max(
      this.constMinPhi,
      Math.min(this.constMaxPhi, this.cameraPhi + deltaY * 0.005)
    );

    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
    this.updateCameraPosition();
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    this.cameraRadius = Math.max(
      this.constMinRadius,
      Math.min(this.constMaxRadius, this.cameraRadius * zoomFactor)
    );
    this.updateCameraPosition();
  }

  private onCanvasClick(e: MouseEvent): void {
    if (this.groups.length === 0) return;
    if (this.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.groups.map((g) => g.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let hitMesh: THREE.Mesh | null = null;
      for (const intersect of intersects) {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          const group = this.groups.find((g) => g.mesh === obj);
          if (group) {
            hitMesh = group.mesh;
            this.uiController.showInfoPopup(group, e.clientX, e.clientY);
            this.uiController.highlightMesh(group.mesh);
            break;
          }
          obj = obj.parent;
        }
        if (hitMesh) break;
      }
    } else {
      this.uiController.hideInfoPopup();
    }
  }

  private updateCameraPosition(): void {
    const sinPhi = Math.sin(this.cameraPhi);
    const x = this.cameraRadius * sinPhi * Math.sin(this.cameraTheta);
    const y = this.cameraRadius * Math.cos(this.cameraPhi);
    const z = this.cameraRadius * sinPhi * Math.cos(this.cameraTheta);

    this.camera.position.set(x + this.target.x, y + this.target.y, z + this.target.z);
    this.camera.lookAt(this.target);
  }

  private async handleFileUpload(file: File): Promise<void> {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('文件大小超过10MB限制');
      return;
    }

    const validExtensions = ['.gltf', '.glb', '.obj'];
    const fileName = file.name.toLowerCase();
    if (!validExtensions.some((ext) => fileName.endsWith(ext))) {
      alert('不支持的文件格式，请上传 GLTF、GLB 或 OBJ 文件');
      return;
    }

    this.uiController.showLoading();
    this.uiController.hideInfoPopup();

    try {
      if (this.modelRoot) {
        this.scene.remove(this.modelRoot);
        this.disposeObject(this.modelRoot);
        this.modelRoot = null;
      }
      this.groups = [];

      const { groups, root } = await loadModelFromFile(file);
      this.modelRoot = root;
      this.groups = groups;

      this.scene.add(root);
      this.explosionController.setGroups(groups);
      this.uiController.setGroups(groups);

      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      this.target.copy(center);
      this.cameraRadius = Math.max(size.x, size.y, size.z) * 2.5;
      this.cameraRadius = Math.max(this.constMinRadius, Math.min(this.constMaxRadius, this.cameraRadius));
      this.cameraTheta = 0;
      this.cameraPhi = Math.PI / 4;
      this.updateCameraPosition();
    } catch (err) {
      console.error('Model loading error:', err);
      alert('模型加载失败：' + (err as Error).message);
    } finally {
      this.uiController.hideLoading();
    }
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  private takeScreenshot(): string | null {
    if (!this.modelRoot) return null;

    const originalSize = {
      width: this.renderer.domElement.width,
      height: this.renderer.domElement.height
    };
    const originalPixelRatio = this.renderer.getPixelRatio();

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(1280, 720, false);
    this.camera.aspect = 1280 / 720;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);

    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    this.renderer.setPixelRatio(originalPixelRatio);
    this.renderer.setSize(originalSize.width, originalSize.height, false);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    return dataUrl;
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.explosionController.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
