import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createDefaultConfig, type SharedConfig } from './sharedConfig';
import { ImageParser } from './imageParser';
import { ParticleCloud } from './particleCloud';
import { UIController } from './uiController';

class AuraBloomApp {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  
  private config: SharedConfig;
  private particleCloud: ParticleCloud;
  private uiController: UIController;
  
  private isDragging = false;
  private lastDragTime = 0;
  private baseCameraDistance = 6;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.config = createDefaultConfig();
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.setupBackground();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    this.adjustCameraForMobile();
    this.camera.position.set(0, 0, this.baseCameraDistance);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.rotateSpeed = 1;
    this.controls.enablePan = false;
    this.controls.minDistance = this.baseCameraDistance * 0.5;
    this.controls.maxDistance = this.baseCameraDistance * 5;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    this.particleCloud = new ParticleCloud(this.scene, this.config);

    this.uiController = new UIController(
      this.config,
      (file) => this.handleImageUpload(file),
      () => this.handleScreenshot(),
      () => this.handleParamChange()
    );

    this.setupEventListeners();
    this.animate();
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 2, 2);
    gradient.addColorStop(0, '#0D0B1E');
    gradient.addColorStop(1, '#1A143A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  private adjustCameraForMobile(): void {
    if (window.innerWidth < 768) {
      this.baseCameraDistance = 6 * 0.7;
    } else {
      this.baseCameraDistance = 6;
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    
    this.renderer.domElement.addEventListener('mousedown', () => {
      this.isDragging = true;
    });
    this.renderer.domElement.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    this.renderer.domElement.addEventListener('touchstart', () => {
      this.isDragging = true;
    });
    this.renderer.domElement.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  private async handleImageUpload(file: File): Promise<void> {
    try {
      const particles = await ImageParser.parse(file, this.config);
      this.particleCloud.loadParticles(particles);
      this.uiController.hideUploadPanel();
    } catch (error) {
      console.error('Failed to parse image:', error);
      alert('图片解析失败，请尝试其他图片');
    }
  }

  private handleParamChange(): void {
    this.particleCloud.updateSize();
    this.particleCloud.updateColorMode();
  }

  private async handleScreenshot(): Promise<void> {
    if (this.config.isScreenshotting) return;
    
    this.config.isScreenshotting = true;
    this.particleCloud.pauseAnimation();

    await this.uiController.triggerFlashEffect();

    this.renderer.render(this.scene, this.camera);
    
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `aurabloom_${timestamp}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
    
    this.particleCloud.resumeAnimation();
    this.config.isScreenshotting = false;
  }

  private onWindowResize(): void {
    const wasMobile = this.baseCameraDistance < 6;
    this.adjustCameraForMobile();
    const isMobile = this.baseCameraDistance < 6;

    if (wasMobile !== isMobile) {
      this.camera.position.z = this.baseCameraDistance;
      this.controls.minDistance = this.baseCameraDistance * 0.5;
      this.controls.maxDistance = this.baseCameraDistance * 5;
      this.controls.update();
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    
    if (!this.isDragging || performance.now() - this.lastDragTime > 16) {
      this.particleCloud.update(deltaTime);
      this.lastDragTime = performance.now();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

new AuraBloomApp();
