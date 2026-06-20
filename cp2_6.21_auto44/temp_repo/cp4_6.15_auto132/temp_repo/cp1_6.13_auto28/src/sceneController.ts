import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { analyzeEmotion, EmotionResult } from './emotionAnalyzer';
import { ParticleSystem, EmotionParams } from './particleSystem';

export class SceneController {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem;
  private clock: THREE.Clock;
  private animationId: number = 0;
  private container: HTMLElement;
  private onResult: ((result: EmotionResult) => void) | null = null;
  private fpsFrames: number = 0;
  private fpsTime: number = 0;
  private fpsDisplay: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.003);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 150);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a1a, 1);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 400;
    this.controls.minPolarAngle = 0.1;
    this.controls.maxPolarAngle = Math.PI - 0.1;
    this.controls.enablePan = false;

    this.particleSystem = new ParticleSystem(this.scene);

    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    this.fpsDisplay = document.getElementById('fpsCounter');

    window.addEventListener('resize', this.onResize.bind(this));
  }

  setOnResult(cb: (result: EmotionResult) => void): void {
    this.onResult = cb;
  }

  processText(text: string): EmotionResult | null {
    if (!text || !text.trim()) return null;
    const result = analyzeEmotion(text);
    const params: EmotionParams = { score: result.score, keywords: result.keywords };
    this.particleSystem.setEmotion(params);
    if (this.onResult) this.onResult(result);
    return result;
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  start(): void {
    this.clock.start();
    this.animate();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.particleSystem.update(delta);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this.fpsFrames++;
    this.fpsTime += delta;
    if (this.fpsTime >= 1.0) {
      const fps = Math.round(this.fpsFrames / this.fpsTime);
      if (this.fpsDisplay) this.fpsDisplay.textContent = `${fps} fps`;
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
  }

  dispose(): void {
    this.stop();
    this.particleSystem.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}
