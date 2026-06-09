import * as THREE from 'three';
import { TopologicalSurface } from './surface';
import { ParticleSystem } from './particles';
import { InteractionManager } from './interaction';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private surface: TopologicalSurface;
  private particleSystem: ParticleSystem;
  private interactionManager: InteractionManager;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private readonly targetFPS: number = 45;

  constructor() {
    this.clock = new THREE.Clock();
    
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    
    this.surface = new TopologicalSurface(this.scene);
    this.particleSystem = new ParticleSystem(this.scene, this.surface);
    this.interactionManager = new InteractionManager(
      this.camera,
      this.renderer,
      this.surface,
      (value) => this.surface.setTwistFactor(value)
    );

    this.setupLighting();
    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d1117');
    scene.fog = new THREE.Fog('#0d1117', 10, 30);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const container = document.getElementById('canvas-container')!;
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const container = document.getElementById('canvas-container')!;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    
    container.appendChild(renderer.domElement);
    
    return renderer;
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6a0dad, 2, 20);
    pointLight1.position.set(5, 5, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00bfff, 2, 20);
    pointLight2.position.set(-5, -5, -5);
    this.scene.add(pointLight2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(3, 10, 5);
    this.scene.add(directionalLight);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    this.updateFPS();
    
    const maxDelta = 1 / this.targetFPS;
    const clampedDelta = Math.min(deltaTime, maxDelta * 2);

    this.surface.update(clampedDelta);
    this.particleSystem.update(clampedDelta);
    this.interactionManager.update();

    this.updateInfoPanel();

    this.renderer.render(this.scene, this.camera);
  };

  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  private updateInfoPanel(): void {
    const topologyType = this.surface.getTopologyType();
    const particleCount = this.particleSystem.getParticleCount();
    const avgVelocity = this.particleSystem.getAverageVelocity();
    const deformationEnergy = this.surface.getDeformationEnergy();

    this.interactionManager.updateInfoPanel(
      topologyType,
      particleCount,
      avgVelocity,
      deformationEnergy
    );
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.particleSystem.dispose();
    this.interactionManager.dispose();
    this.renderer.dispose();
  }

  public getFPS(): number {
    return this.fps;
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
  }
});

export { App };
