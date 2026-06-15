import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { DataVisualizer } from './DataVisualizer';

export class MainLoop {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private visualizer: DataVisualizer;

  private animationId: number | null = null;
  private lastTime = 0;
  private autoRotate = false;
  private autoRotateSpeed = 0.3;

  private fpsFrames = 0;
  private fpsTime = 0;
  private currentFps = 60;

  private fpsElement: HTMLElement | null;
  private barsElement: HTMLElement | null;
  private particlesElement: HTMLElement | null;

  onFrame: ((deltaTime: number) => void) | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    visualizer: DataVisualizer
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.visualizer = visualizer;

    this.fpsElement = document.getElementById('fps-value');
    this.barsElement = document.getElementById('bars-value');
    this.particlesElement = document.getElementById('particles-value');
  }

  start() {
    this.lastTime = performance.now();
    this.fpsTime = this.lastTime;
    this.fpsFrames = 0;
    this.tick(this.lastTime);
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  setAutoRotate(enabled: boolean) {
    this.autoRotate = enabled;
    this.controls.autoRotate = enabled;
    this.controls.autoRotateSpeed = this.autoRotateSpeed;
  }

  private tick = (time: number) => {
    this.animationId = requestAnimationFrame(this.tick);

    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.fpsFrames++;
    if (time - this.fpsTime >= 1000) {
      this.currentFps = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsTime = time;
      this.updateStats();
    }

    this.visualizer.update(deltaTime);

    if (this.onFrame) {
      this.onFrame(deltaTime);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private updateStats() {
    if (this.fpsElement) this.fpsElement.textContent = this.currentFps.toString();
    if (this.barsElement) this.barsElement.textContent = this.visualizer.getBarCount().toString();
    if (this.particlesElement) this.particlesElement.textContent = this.visualizer.getParticleCount().toString();
  }

  showStats() {
    const statsEl = document.getElementById('stats');
    if (statsEl) statsEl.classList.remove('hidden');
  }

  dispose() {
    this.stop();
  }
}
