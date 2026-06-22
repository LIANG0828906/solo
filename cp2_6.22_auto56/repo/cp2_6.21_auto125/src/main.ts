import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Crystal, type CrystalParams } from './crystal';
import { ControlPanel } from './control';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private crystal: Crystal;
  private controlPanel: ControlPanel;
  private clock: THREE.Clock;
  private animationId: number;
  private lastUserInteraction: number = 0;
  private autoRotateEnabled: boolean = false;
  private readonly AUTO_ROTATE_SPEED: number = (Math.PI * 2) / 10;
  private readonly IDLE_DELAY: number = 5000;
  private readonly ROTATION_TARGET = new THREE.Vector3(0, 0, 0);
  private autoRotateAngle: number = 0;
  private autoRotateRadius: number = 0;
  private autoRotateHeight: number = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a2e);
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('app')!.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 30;
    this.setupUserInteractionListeners();
    this.setupLights();
    this.clock = new THREE.Clock();
    const guiContainer = document.getElementById('gui-container')!;
    this.controlPanel = new ControlPanel(guiContainer);
    const initialParams = this.controlPanel.getParams();
    this.crystal = new Crystal(initialParams);
    this.scene.add(this.crystal.group);
    this.crystal.onStatsUpdate = (stats) => this.updateStats(stats);
    this.controlPanel.onChange((params: CrystalParams) => {
      this.crystal.setParams(params);
    });
    this.crystal.start();
    this.setupEventListeners();
    this.animationId = 0;
    this.animate();
  }

  private setupLights(): void {
    const hemiLight = new THREE.HemisphereLight(0x88ccff, 0x4444aa, 0.6);
    this.scene.add(hemiLight);
    const ambientLight = new THREE.AmbientLight(0x404080, 0.4);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    this.scene.add(dirLight);
    const pointLight = new THREE.PointLight(0xff88ff, 0.5, 20);
    pointLight.position.set(-5, 3, -5);
    this.scene.add(pointLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e: KeyboardEvent) => this.onKeyDown(e));
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportOBJ());
    }
  }

  private setupUserInteractionListeners(): void {
    const canvas = this.renderer.domElement;
    const onInteract = () => {
      this.lastUserInteraction = performance.now();
      this.autoRotateEnabled = false;
    };
    canvas.addEventListener('pointerdown', onInteract);
    canvas.addEventListener('pointermove', onInteract);
    canvas.addEventListener('wheel', onInteract);
    canvas.addEventListener('touchstart', onInteract);
    canvas.addEventListener('touchmove', onInteract);
    this.controls.addEventListener('start', onInteract);
    this.controls.addEventListener('change', onInteract);
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.lastUserInteraction = performance.now();
    this.autoRotateEnabled = false;
    if (e.code === 'Space') {
      e.preventDefault();
      const paused = this.crystal.togglePause();
      const statusEl = document.getElementById('growthStatus');
      if (statusEl) {
        statusEl.textContent = paused ? '已暂停' : '进行中';
      }
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateStats(stats: {
    faceCount: number;
    vertexCount: number;
    progress: number;
  }): void {
    const faceEl = document.getElementById('faceCount');
    const vertexEl = document.getElementById('vertexCount');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (faceEl) faceEl.textContent = stats.faceCount.toString();
    if (vertexEl) vertexEl.textContent = stats.vertexCount.toString();
    if (progressFill) progressFill.style.width = `${stats.progress.toFixed(1)}%`;
    if (progressText) progressText.textContent = `${stats.progress.toFixed(1)}%`;
  }

  private exportOBJ(): void {
    const objContent = this.crystal.exportOBJ();
    if (!objContent) return;
    const blob = new Blob([objContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `crystal_${timestamp}.obj`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    const deltaMs = delta * 1000;
    this.controlPanel.update(deltaMs);
    this.crystal.update(deltaMs);
    this.updateAutoRotate(delta);
    if (!this.autoRotateEnabled) {
      this.controls.update();
    }
    this.crystal.group.rotation.y += delta * 0.05;
    this.renderer.render(this.scene, this.camera);
  }

  private shouldAutoRotate(): boolean {
    const isGrowthComplete = this.crystal.getProgress() >= 1;
    const isPaused = this.crystal.getPaused();
    const now = performance.now();
    const idleTime = now - this.lastUserInteraction;
    const isIdle = idleTime >= this.IDLE_DELAY;
    return (isGrowthComplete || isPaused) && isIdle;
  }

  private updateAutoRotate(delta: number): void {
    const shouldRotate = this.shouldAutoRotate();
    if (!this.autoRotateEnabled && shouldRotate) {
      this.autoRotateEnabled = true;
      this.initAutoRotateParams();
    } else if (this.autoRotateEnabled && !shouldRotate) {
      this.autoRotateEnabled = false;
      return;
    }
    if (this.autoRotateEnabled) {
      this.autoRotateAngle += this.AUTO_ROTATE_SPEED * delta;
      const x = Math.cos(this.autoRotateAngle) * this.autoRotateRadius;
      const z = Math.sin(this.autoRotateAngle) * this.autoRotateRadius;
      const y = this.autoRotateHeight;
      this.camera.position.set(x, y, z);
      this.camera.lookAt(this.ROTATION_TARGET);
    }
  }

  private initAutoRotateParams(): void {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const offset = this.camera.position.clone().sub(this.ROTATION_TARGET);
    this.autoRotateRadius = Math.sqrt(offset.x * offset.x + offset.z * offset.z);
    this.autoRotateHeight = offset.y;
    this.autoRotateAngle = Math.atan2(offset.z, offset.x);
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.controlPanel.dispose();
    this.crystal.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
