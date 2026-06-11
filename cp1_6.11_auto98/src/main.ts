import * as THREE from 'three';
import { SceneManager } from './sceneManager';
import { FishManager } from './fishManager';
import { InteractionHandler } from './interactionHandler';

class App {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private sceneManager: SceneManager;
  private fishManager: FishManager;
  private interactionHandler: InteractionHandler;
  private clock: THREE.Clock;
  private animationId: number;

  constructor() {
    const container = document.getElementById('canvas-container')!;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500,
    );
    this.camera.position.set(0, 35, 65);
    this.camera.lookAt(0, 0, 0);

    this.sceneManager = new SceneManager(this.camera, this.renderer);
    this.fishManager = new FishManager(this.sceneManager.scene);
    this.interactionHandler = new InteractionHandler(this.camera, this.renderer);

    this.clock = new THREE.Clock();
    this.animationId = 0;

    window.addEventListener('resize', this.onResize.bind(this));

    this.hideLoading();
    this.animate();
  }

  private hideLoading(): void {
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      const canvasContainer = document.getElementById('canvas-container');
      if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 1000);
      }
      if (canvasContainer) {
        canvasContainer.classList.add('visible');
      }
    }, 800);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.interactionHandler.update(delta);
    this.fishManager.update(
      delta,
      this.interactionHandler.targetPoint,
      this.interactionHandler.gatheringRadius,
    );

    this.renderer.render(this.sceneManager.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
