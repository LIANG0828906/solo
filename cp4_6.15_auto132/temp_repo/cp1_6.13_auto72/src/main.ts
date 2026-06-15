import * as THREE from 'three';
import { AudioEngine, AudioFrameData } from './audioEngine';
import { OrbitCameraController, ParticleSystem, DisplayMode } from './particleSystem';
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
  private performanceCheckInterval: number = 2000;
  private performanceWarningActive: boolean = false;
  private lastRestoreTime: number = 0;
  private restoreCooldown: number = 5000;

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

    this.uiController = new UIController(this.container, {
      onMicClick: async () => {
        const active = this.audioEngine.getCurrentSource() === 'mic';
        if (active) {
          await this.audioEngine.stop();
          this.uiController.setMicActive(false);
        } else {
          try {
            const ok = await this.audioEngine.startMicrophone();
            if (ok) {
              this.uiController.setMicActive(true);
            }
          } catch (e) {
            console.error('麦克风启动失败:', e);
          }
        }
      },
      onFileChange: async (file: File) => {
        try {
          await this.audioEngine.loadAudioFile(file);
          this.uiController.setMicActive(false);
        } catch (e) {
          console.error('音频加载失败:', e);
        }
      },
      onModeChange: (mode: DisplayMode) => {
        this.particleSystem.setDisplayMode(mode);
      },
      onResetCamera: () => {
        this.cameraController.triggerReset(1500);
      },
      onResetParticles: () => {
        this.particleSystem.triggerResetParticles(1000);
      }
    });

    this.audioEngine.onFrame((data) => {
      this.latestAudioData = {
        ...data,
        frequencyData: new Float32Array(data.frequencyData),
        timeDomainData: new Float32Array(data.timeDomainData)
      };
    });

    this.setupWindowEvents();
    this.injectAnimationsCSS();
    this.start();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#0a0a10');
    gradient.addColorStop(0.4, '#08080e');
    gradient.addColorStop(0.7, '#06060a');
    gradient.addColorStop(1, '#040408');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 1024);

    const bgTexture = new THREE.CanvasTexture(canvas);
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    bgTexture.needsUpdate = true;
    scene.background = bgTexture;

    scene.fog = new THREE.FogExp2(0x040408, 0.008);

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
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x05050a, 1);
    return renderer;
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
        50% { opacity: 0.35; }
      }
      @keyframes mic-pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
        50% { transform: scale(1.18); box-shadow: 0 0 16px 4px rgba(34, 197, 94, 0.25); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
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

    this.checkPerformance();

    this.renderer.render(this.scene, this.camera);
  };

  private checkPerformance(): void {
    const now = performance.now();
    if (now - this.lastPerformanceCheck < this.performanceCheckInterval) return;
    this.lastPerformanceCheck = now;

    const avgFrameTime = this.particleSystem.getAverageFrameTime();
    const reduced = this.particleSystem.getPerformanceReduced();

    if (avgFrameTime > 10 && reduced < 1500) {
      const didReduce = this.particleSystem.reduceParticleCount(200);
      if (didReduce) {
        this.performanceWarningActive = true;
        this.uiController.showPerformanceWarning();
      }
    } else if (avgFrameTime < 4 && reduced > 0) {
      if (now - this.lastRestoreTime > this.restoreCooldown) {
        const didRestore = this.particleSystem.restoreParticleCount(200);
        if (didRestore) {
          this.lastRestoreTime = now;
        }
        if (this.particleSystem.getPerformanceReduced() <= 0) {
          this.performanceWarningActive = false;
          this.uiController.hidePerformanceWarning();
        }
      }
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
