import * as THREE from 'three';
import { DrawManager } from './drawManager.js';
import { ExtrusionManager } from './extrusionManager.js';
import { ControlsManager } from './controls.js';
import { UIManager } from './uiManager.js';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private drawManager: DrawManager;
  private extrusionManager: ExtrusionManager;
  private controlsManager: ControlsManager;
  private uiManager: UIManager;

  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private animationId: number = 0;

  constructor() {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      throw new Error('Cannot find #app element');
    }

    this.uiManager = new UIManager(appContainer);

    const threeContainer = document.getElementById('threeContainer') as HTMLElement;
    const drawCanvas = document.getElementById('drawCanvas') as HTMLCanvasElement;

    if (!threeContainer || !drawCanvas) {
      throw new Error('Cannot find required DOM elements');
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f1a);

    this.camera = new THREE.PerspectiveCamera(
      45,
      threeContainer.clientWidth / threeContainer.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(8, 8, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threeContainer.appendChild(this.renderer.domElement);

    this.setupLights();
    this.setupGrid();

    this.extrusionManager = new ExtrusionManager(this.scene);

    this.controlsManager = new ControlsManager(this.camera, this.renderer.domElement);
    this.controlsManager.setDefaultView(
      new THREE.Vector3(8, 8, 8),
      new THREE.Vector3(0, 0, 0)
    );

    this.drawManager = new DrawManager(drawCanvas, (points) => {
      const depth = this.uiManager.getDepthSliderValue();
      this.extrusionManager.extrude(points, depth);
      this.uiManager.updateGeometryInfo(this.extrusionManager.getGeometryInfo());
      this.uiManager.setSmoothToggleState(this.extrusionManager.getIsSmooth());
    });

    this.bindUIEvents();
    this.setupResizeHandler(threeContainer);

    this.lastFrameTime = performance.now();
    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x88ccee, 0.6, 30);
    pointLight.position.set(-5, 5, -5);
    this.scene.add(pointLight);

    const fillLight = new THREE.DirectionalLight(0xe0b354, 0.25);
    fillLight.position.set(-3, -2, -4);
    this.scene.add(fillLight);
  }

  private setupGrid(): void {
    const gridHelper = new THREE.GridHelper(20, 20, 0x2a2a3e, 0x1a1a2e);
    gridHelper.position.y = -3;
    this.scene.add(gridHelper);

    const planeGeo = new THREE.PlaneGeometry(20, 20);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x12121f,
      transparent: true,
      opacity: 0.3
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -3;
    this.scene.add(plane);
  }

  private bindUIEvents(): void {
    this.uiManager.onDepthChange((depth) => {
      if (this.extrusionManager.hasGeometry()) {
        this.extrusionManager.updateDepth(depth);
        this.uiManager.updateGeometryInfo(this.extrusionManager.getGeometryInfo());
      }
    });

    this.uiManager.onShadingToggle((smooth) => {
      this.extrusionManager.setSmoothShading(smooth, 500);
    });

    this.uiManager.onResetView(() => {
      this.controlsManager.resetView(300);
    });

    this.uiManager.onClear(() => {
      this.drawManager.clear();
      this.extrusionManager.clear();
      this.uiManager.updateGeometryInfo(null);
    });
  }

  private setupResizeHandler(container: HTMLElement): void {
    window.addEventListener('resize', () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const fps = 1000 / delta;
    this.frameTimes.push(fps);
    if (this.frameTimes.length > 10) {
      this.frameTimes.shift();
    }
    const avgFps = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    this.controlsManager.update();
    this.extrusionManager.updateTransitions();

    this.renderer.render(this.scene, this.camera);

    const drawPoints = this.drawManager.getPointCount();
    this.uiManager.updateStatus(avgFps, drawPoints);
  };

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.drawManager.dispose();
    this.extrusionManager.dispose();
    this.controlsManager.dispose();
    this.uiManager.dispose();
    this.renderer.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
