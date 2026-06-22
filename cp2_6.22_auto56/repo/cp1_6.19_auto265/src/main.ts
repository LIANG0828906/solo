import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PaperScene } from './scene';
import { FoldingEngine } from './foldEngine';
import { UIManager } from './ui';
import { ScreenshotManager } from './screenshot';
import type { Crease } from './scene';
import type { FoldProgressEvent } from './foldEngine';

class OrigamiApp {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private paperScene: PaperScene;
  private foldingEngine: FoldingEngine;
  private uiManager: UIManager;
  private screenshotManager: ScreenshotManager;

  private previewScene: THREE.Scene;
  private previewCamera: THREE.OrthographicCamera;
  private previewRenderer: THREE.WebGLRenderer;
  private previewPaper: THREE.Mesh | null = null;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private isDrawingCrease: boolean = false;
  private firstPoint: THREE.Vector2 | null = null;
  private isFolding: boolean = false;
  private isClicking: boolean = false;
  private clickStartTime: number = 0;
  private clickStartPos: { x: number; y: number } = { x: 0, y: 0 };

  private clock: THREE.Clock;
  private animationId: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1A1A2E);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(8, 8, 8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.set(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.clock = new THREE.Clock();

    this.previewScene = new THREE.Scene();
    this.previewScene.background = new THREE.Color(0x0A0A1A);

    const aspect = 1;
    const frustumSize = 12;
    this.previewCamera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      100
    );
    this.previewCamera.position.set(6, 6, 6);
    this.previewCamera.lookAt(0, 0, 0);

    const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: previewCanvas,
      antialias: true
    });
    this.previewRenderer.setSize(200, 200);
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.setupLights();

    this.paperScene = new PaperScene(this.scene);
    this.foldingEngine = new FoldingEngine();
    this.foldingEngine.setGeometry(this.paperScene.getGeometry());

    this.screenshotManager = new ScreenshotManager();
    this.screenshotManager.setRenderer(this.renderer);

    this.uiManager = new UIManager({
      onFold: () => this.startFolding(),
      onReset: () => this.reset(),
      onScreenshot: () => this.takeScreenshot()
    });
    this.uiManager.setMaxCreases(this.paperScene.maxCreases);
    this.uiManager.setFaceCount(this.paperScene.getFaceCount());

    this.setupPreview();
    this.setupEventListeners();
    this.setupFoldListener();

    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-5, 3, -5);
    this.scene.add(fillLight);

    const previewAmbient = new THREE.AmbientLight(0xffffff, 0.4);
    this.previewScene.add(previewAmbient);

    const previewDir = new THREE.DirectionalLight(0xffffff, 0.7);
    previewDir.position.set(5, 10, 7);
    this.previewScene.add(previewDir);
  }

  private setupPreview(): void {
    const paperGeo = this.paperScene.getGeometry();
    const previewGeo = paperGeo.clone();

    const previewMat = new THREE.MeshStandardMaterial({
      color: 0xF5E6C8,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9
    });

    this.previewPaper = new THREE.Mesh(previewGeo, previewMat);
    this.previewScene.add(this.previewPaper);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());

    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.renderer.domElement.addEventListener('pointerup', (e) => this.onPointerUp(e));
  }

  private setupFoldListener(): void {
    this.foldingEngine.onProgress((event: FoldProgressEvent) => {
      this.uiManager.updateProgress(event);
      this.paperScene.updateCreaseVisuals();
      this.updatePreviewGeometry();

      if (event.state === 'complete') {
        this.isFolding = false;
        this.uiManager.setScreenshotEnabled(true);
        setTimeout(() => {
          this.startUnfolding();
        }, 1500);
      }

      if (event.state === 'idle' && this.isFolding) {
        this.isFolding = false;
        this.uiManager.setFoldingEnabled(true);
      }
    });
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    if (this.isFolding) return;
    if (this.paperScene.getCreaseCount() >= this.paperScene.maxCreases) return;

    this.isClicking = true;
    this.clickStartTime = performance.now();
    this.clickStartPos = { x: event.clientX, y: event.clientY };
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isDrawingCrease || !this.firstPoint) {
      if (this.isDrawingCrease) {
        const point = this.getIntersectionPoint(event);
        if (point && this.firstPoint) {
          this.paperScene.showPreview(this.firstPoint, point);
        }
      }
      return;
    }

    const point = this.getIntersectionPoint(event);
    if (point && this.firstPoint) {
      this.paperScene.showPreview(this.firstPoint, point);
    }
  }

  private onPointerUp(event: PointerEvent): void {
    if (event.button !== 0) return;

    if (this.isClicking) {
      const clickDuration = performance.now() - this.clickStartTime;
      const moveDistance = Math.sqrt(
        Math.pow(event.clientX - this.clickStartPos.x, 2) +
        Math.pow(event.clientY - this.clickStartPos.y, 2)
      );

      if (clickDuration < 300 && moveDistance < 5) {
        this.handleClick(event);
      }

      this.isClicking = false;
    }
  }

  private handleClick(event: PointerEvent): void {
    if (this.isFolding) return;
    if (this.paperScene.getCreaseCount() >= this.paperScene.maxCreases) return;

    const point = this.getIntersectionPoint(event);
    if (!point) return;

    if (!this.isDrawingCrease) {
      this.firstPoint = point.clone();
      this.isDrawingCrease = true;
      this.controls.enabled = false;
      this.paperScene.showPreview(point, point);
    } else {
      if (this.firstPoint && point.distanceTo(this.firstPoint) > 0.3) {
        const crease = this.paperScene.addCrease(this.firstPoint, point);
        if (crease) {
          this.uiManager.addCrease(crease);
        }
      }

      this.firstPoint = null;
      this.isDrawingCrease = false;
      this.controls.enabled = true;
      this.paperScene.hidePreview();
    }
  }

  private getIntersectionPoint(event: PointerEvent): THREE.Vector2 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const paperMesh = this.paperScene.getPaperMesh();
    const intersects = this.raycaster.intersectObject(paperMesh);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      return this.paperScene.pointToFaceLocal(point);
    }

    return null;
  }

  private startFolding(): void {
    console.log('startFolding called');
    if (this.isFolding) {
      console.log('Already folding, returning');
      return;
    }
    if (this.paperScene.getCreaseCount() === 0) {
      console.log('No creases, returning');
      return;
    }

    console.log('Starting fold with', this.paperScene.getCreaseCount(), 'creases');
    this.isFolding = true;
    this.uiManager.setFoldingEnabled(false);
    this.uiManager.setScreenshotEnabled(false);

    const creases = this.paperScene.getCreases();
    console.log('Creases:', creases);
    this.foldingEngine.setCreases(creases);
    this.foldingEngine.startFold();
    console.log('Fold engine state:', this.foldingEngine.getState());
  }

  private startUnfolding(): void {
    this.foldingEngine.startUnfold();
  }

  private reset(): void {
    this.isFolding = false;
    this.isDrawingCrease = false;
    this.firstPoint = null;
    this.controls.enabled = true;

    this.paperScene.reset();
    this.foldingEngine.reset();
    this.uiManager.reset();
    this.uiManager.setFaceCount(this.paperScene.getFaceCount());

    this.paperScene.hidePreview();
    this.updatePreviewGeometry();
  }

  private takeScreenshot(): void {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const filename = `origami_${timestamp}.png`;

    this.screenshotManager.downloadScreenshot(
      this.scene,
      this.camera,
      1920,
      1080,
      filename
    );
  }

  private updatePreviewGeometry(): void {
    if (!this.previewPaper) return;

    const sourceGeo = this.paperScene.getGeometry();
    const sourcePos = sourceGeo.attributes.position.array as Float32Array;
    const sourceNormals = sourceGeo.attributes.normal.array as Float32Array;

    const previewPos = this.previewPaper.geometry.attributes.position.array as Float32Array;
    const previewNormals = this.previewPaper.geometry.attributes.normal.array as Float32Array;

    previewPos.set(sourcePos);
    previewNormals.set(sourceNormals);

    this.previewPaper.geometry.attributes.position.needsUpdate = true;
    this.previewPaper.geometry.attributes.normal.needsUpdate = true;
    this.previewPaper.geometry.computeVertexNormals();
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    this.controls.update();

    if (this.isFolding || this.foldingEngine.getState() !== 'idle') {
      this.foldingEngine.update(delta);
      this.uiManager.setFaceCount(this.paperScene.getFaceCount());

      const state = this.foldingEngine.debugState();
      if (this.isFolding && Math.random() < 0.02) {
        console.log('Folding state:', state);
      }
    }

    this.renderer.render(this.scene, this.camera);

    this.previewRenderer.render(this.previewScene, this.previewCamera);
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.previewRenderer.dispose();
    this.controls.dispose();
  }
}

let app: OrigamiApp | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new OrigamiApp();
});

export { OrigamiApp };
