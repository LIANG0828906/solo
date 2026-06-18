import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SoundWave } from './soundWave';
import { ParticleSystem } from './particleSystem';
import { InteractionManager } from './interaction';
import { VisualEffects } from './visualEffects';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;

  private soundWave: SoundWave;
  private particleSystem: ParticleSystem;
  private interactionManager: InteractionManager;
  private visualEffects: VisualEffects;

  private clock: THREE.Clock;
  private animationId: number = 0;
  private fps: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container')!;

    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 180);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 400;

    this.soundWave = new SoundWave(440, 0.5, 'sine');
    this.particleSystem = new ParticleSystem(10000);
    this.particleSystem.addToScene(this.scene);

    this.interactionManager = new InteractionManager(this.soundWave);

    this.visualEffects = new VisualEffects(this.scene, this.camera, this.renderer);

    window.addEventListener('resize', this.onResize.bind(this));

    this.start();
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.visualEffects.resize(window.innerWidth, window.innerHeight);
  }

  private start(): void {
    this.animate();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.soundWave.update(deltaTime);

    this.particleSystem.update(this.soundWave.getData(), deltaTime);

    const avgAmp = this.particleSystem.getAverageAmplitudeResponse();
    this.visualEffects.update(avgAmp, deltaTime);

    this.controls.update();

    this.visualEffects.render(deltaTime);

    this.frameCount++;
    if (elapsedTime - this.lastTime >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = elapsedTime;
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.particleSystem.dispose();
    this.visualEffects.dispose();
    this.interactionManager.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}

let app: App;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});
