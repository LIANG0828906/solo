import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import SceneRenderer from './Renderer';
import { rayTracer } from './RayTracer';
import UIPanel from './UIPanel';
import { eventBus } from './EventBus';

class LightRayExplorer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private sceneRenderer: SceneRenderer;
  private uiPanel: UIPanel;
  private animationId: number = 0;
  private clock: THREE.Clock;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container "${containerId}" not found`);
    }
    this.container = container;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.camera.position.set(0, 6, 10);
    this.camera.lookAt(0, 6, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a14, 1);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 6, 0);
    this.controls.minDistance = 3;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI * 0.85;

    this.sceneRenderer = new SceneRenderer({
      container: this.container,
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
    });

    this.uiPanel = new UIPanel();

    this.setupEventListeners();
    rayTracer.calculateRays();

    this.animate();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onResize());

    eventBus.on('dragStart', () => {
      this.controls.enabled = false;
    });

    eventBus.on('dragEnd', () => {
      this.controls.enabled = true;
    });
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.sceneRenderer.onResize();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    this.controls.update();
    this.sceneRenderer.update(delta);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.controls.dispose();
    this.renderer.dispose();
  }
}

let app: LightRayExplorer | null = null;

document.addEventListener('DOMContentLoaded', () => {
  app = new LightRayExplorer('canvas-container');
});

export default LightRayExplorer;
