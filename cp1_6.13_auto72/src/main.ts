import * as THREE from 'three';
import { AudioEngine, AudioFrameData } from './audioEngine';
import { OrbitCameraController, ParticleSystem } from './particleSystem';
import { UIController } from './uiController';

class EchoDriftApp {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private audioEngine: AudioEngine;
  private particleSystem: ParticleSystem;
  private cameraController: OrbitCameraController;
  private uiController: UIController;

  private latestAudioData: AudioFrameData | null = null;
  private animationFrameId: number | null = null;
  private lastPerformanceCheck: number = 0;
  private performanceCheckInterval: number = 5000;

  constructor() {
    this.container = document.getElementById('app')!;
    this.clock = new THREE.Clock();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.container.appendChild(this.renderer.domElement);

    this.audioEngine = new AudioEngine();
    this.particleSystem = new ParticleSystem(this.camera, 2000);
    this.scene.add(this.particleSystem.group);

    this.cameraController = new OrbitCameraController(this.camera, this.renderer.domElement);
    this.renderer.domElement.style.cursor = 'grab';

    this.uiController = new UIController(
      this.container,
      this.audioEngine,
      this.cameraController,
      this.particleSystem,
      {
        onResetCamera: () => this.cameraController.triggerReset(1500),
        onResetParticles: () => this.animateResetParticles()
      }
    );

    this.audioEngine.onFrame((data) => {
      this.latestAudioData = { ...data };
    });

    this.setupWindowEvents();
    this.injectAnimationsCSS();
    this.start();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#080812');
    gradient.addColorStop(1, '#05050a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const bgTexture = new THREE.CanvasTexture(canvas);
    bgTexture.needsUpdate = true;
    scene.background = bgTexture;

    scene.fog = new THREE.FogExp2(0x050508, 0.008);

    const ambient = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambient);

    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  }

  private animateResetParticles(): void {
    const duration = 1000;
    const startTime = performance.now();
    const positions = this.particleSystem.points.geometry.attributes.position.array as Float32Array;
    const startPositions = new Float32Array(positions.length);
    startPositions.set(positions);

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = t * t * (3 - 2 * t);

      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;
        const particle = (this.particleSystem as any).particles[i];
        if (!particle) continue;

        const baseR = particle.baseRadius;
        const theta = particle.baseTheta;
        const phi = particle.basePhi;
        const targetX = baseR * Math.sin(phi) * Math.cos(theta);
        const targetY = baseR * Math.cos(phi);
        const targetZ = baseR * Math.sin(phi) * Math.sin(theta);

        positions[i3] = THREE.MathUtils.lerp(startPositions[i3], targetX, eased);
        positions[i3 + 1] = THREE.MathUtils.lerp(startPositions[i3 + 1], targetY, eased);
        positions[i3 + 2] = THREE.MathUtils.lerp(startPositions[i3 + 2], targetZ, eased);
      }
      this.particleSystem.points.geometry.attributes.position.needsUpdate = true;

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.particleSystem.resetParticles();
      }
    };
    animate();
  }

  private setupWindowEvents(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  private injectAnimationsCSS(): void {
    if (document.getElementById('echodrift-animations')) return;
    const style = document.createElement('style');
    style.id = 'echodrift-animations';
    style.textContent = `
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
  }

  private start(): void {
    this.animate();
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const deltaTime = Math.min(0.1, this.clock.getDelta());

    this.cameraController.update(deltaTime);

    const frameTime = this.particleSystem.update(this.latestAudioData, deltaTime);

    this.checkPerformance(frameTime);

    this.renderer.render(this.scene, this.camera);
  };

  private checkPerformance(frameTime: number): void {
    const now = performance.now();
    if (now - this.lastPerformanceCheck < this.performanceCheckInterval) return;
    this.lastPerformanceCheck = now;

    const avgFrameTime = this.particleSystem.getAverageFrameTime();
    
    if (avgFrameTime > 10) {
      const reduced = this.particleSystem.reduceParticleCount(200);
      if (reduced) {
        this.uiController.showPerformanceWarning(true);
      }
    } else if (avgFrameTime < 3) {
      this.uiController.showPerformanceWarning(false);
    }
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    this.audioEngine.stop();
    this.particleSystem.dispose();
    this.cameraController.dispose();
    this.uiController.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  (window as any).echodrift = new EchoDriftApp();
});
