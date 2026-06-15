import * as THREE from 'three';
import { OpticalFlow } from './opticalFlow';
import { ParticleSystem } from './particleSystem';
import { UIController } from './ui';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private video: HTMLVideoElement;
  private canvasContainer: HTMLDivElement;
  private opticalFlow: OpticalFlow;
  private particleSystem: ParticleSystem;
  private ui: UIController;
  private clock: THREE.Clock;
  private cameraAngle: number = 0;
  private cameraRadius: number = 6;
  private animationId: number | null = null;
  private lastVideoFrameTime: number = 0;
  private videoFrameInterval: number = 1000 / 30;
  private cameraReady: boolean = false;

  private frameTimestamps: number[] = [];
  private estimatedFps: number = 30;
  private lastFrameProcessed: number = 0;

  constructor() {
    this.canvasContainer = document.getElementById('canvas-container') as HTMLDivElement;
    this.video = document.getElementById('video-element') as HTMLVideoElement;
    this.clock = new THREE.Clock();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.createGridGround();
    this.addLighting();

    const initialConfig = {
      sensitivity: 0.5,
      particleCount: 2000
    };

    this.opticalFlow = new OpticalFlow(this.video);
    this.opticalFlow.sensitivity = initialConfig.sensitivity;
    this.particleSystem = new ParticleSystem(this.scene, initialConfig.particleCount);

    this.ui = new UIController({
      onSensitivityChange: (value: number) => {
        this.opticalFlow.sensitivity = value;
      },
      onParticleCountChange: (value: number) => {
        this.particleSystem.resizeParticleCount(value);
      },
      onReset: () => {
        this.resetSystem();
      }
    });

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.video.addEventListener('playing', () => {
      this.detectCameraFps();
    });

    this.initCamera();
    this.requestCameraAccess();

    console.log('[App] 应用初始化完成');
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    return camera;
  }

  private initCamera(): void {
    const angle = this.cameraAngle;
    const height = this.cameraRadius;
    this.camera.position.set(
      Math.cos(angle) * this.cameraRadius * 0.7,
      Math.sin(angle) * this.cameraRadius * 0.7,
      height
    );
    this.camera.lookAt(0, 0, 0);
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    this.canvasContainer.appendChild(renderer.domElement);
    return renderer;
  }

  private createGridGround(): void {
    const gridHelper = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -1.5;

    const material = gridHelper.material as THREE.Material;
    material.transparent = true;
    material.opacity = 0.1;

    this.scene.add(gridHelper);
  }

  private addLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x1e90ff, 0.5, 20);
    pointLight.position.set(0, 0, 5);
    this.scene.add(pointLight);
  }

  private detectCameraFps(): void {
    const stream = this.video.srcObject as MediaStream | null;
    if (stream && stream.getVideoTracks().length > 0) {
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      if (settings.frameRate) {
        this.estimatedFps = settings.frameRate;
        this.videoFrameInterval = 1000 / this.estimatedFps * 0.95;
        console.log(`[App] 从Track检测到摄像头帧率: ${this.estimatedFps}FPS, 节流间隔: ${this.videoFrameInterval.toFixed(1)}ms`);
        return;
      }
    }

    this.startFpsEstimation();
  }

  private startFpsEstimation(): void {
    const detect = () => {
      if (!this.cameraReady || this.frameTimestamps.length >= 30) {
        if (this.frameTimestamps.length >= 10) {
          const avgInterval = (this.frameTimestamps[this.frameTimestamps.length - 1] - this.frameTimestamps[0]) / (this.frameTimestamps.length - 1);
          this.estimatedFps = Math.max(10, 1000 / avgInterval);
          this.videoFrameInterval = 1000 / this.estimatedFps * 0.95;
          console.log(`[App] 实测估算摄像头帧率: ${this.estimatedFps.toFixed(1)}FPS, 节流间隔: ${this.videoFrameInterval.toFixed(1)}ms`);
        }
        this.frameTimestamps = [];
        return;
      }
      this.frameTimestamps.push(performance.now());
      setTimeout(detect, 0);
    };
    detect();
  }

  private async requestCameraAccess(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        },
        audio: false
      });
      this.video.srcObject = stream;
      this.cameraReady = true;
      this.ui.hidePermissionPrompt();
      console.log('[App] 摄像头权限已获取, 视频流启动');
      this.start();
    } catch (err) {
      console.warn('[App] 摄像头权限被拒绝或不可用:', err);
      this.cameraReady = false;
      this.ui.showPermissionPrompt();
      this.ui.onPermissionRequest(() => {
        this.requestCameraAccess();
      });
      this.start();
    }
  }

  private resetSystem(): void {
    this.opticalFlow.reset();
    this.particleSystem.reset();
    this.lastVideoFrameTime = 0;
    this.lastFrameProcessed = 0;
    console.log('[App] 系统已重置');
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private start(): void {
    this.animate();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const currentTime = performance.now();

    this.ui.updateFps(currentTime);

    this.cameraAngle += 0.2 * deltaTime;
    const height = this.cameraRadius;
    this.camera.position.set(
      Math.cos(this.cameraAngle) * this.cameraRadius * 0.7,
      Math.sin(this.cameraAngle) * this.cameraRadius * 0.7,
      height
    );
    this.camera.lookAt(0, 0, 0);

    const shouldProcessFrame = this.cameraReady && (
      currentTime - this.lastVideoFrameTime >= this.videoFrameInterval ||
      this.lastVideoFrameTime === 0
    );

    if (shouldProcessFrame) {
      const videoFrame = (this.video as any).webkitDecodedFrameCount || (this.video as any).mozDecodedFrameCount || (this.video as any).decodedFrameCount;

      if (videoFrame === undefined || videoFrame !== this.lastFrameProcessed) {
        if (this.lastVideoFrameTime === 0) {
          this.lastVideoFrameTime = currentTime;
        } else {
          const drift = (currentTime - this.lastVideoFrameTime) % this.videoFrameInterval;
          this.lastVideoFrameTime = currentTime - drift;
        }
        this.lastFrameProcessed = videoFrame ?? (this.lastFrameProcessed + 1);

        const vectors = this.opticalFlow.calculate();
        this.particleSystem.update(vectors, deltaTime);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('[App] DOM加载完成, 启动应用...');
  new App();
});
