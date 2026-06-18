import { CameraHandler } from './camera/CameraHandler';
import { ParticleEngine } from './particle/ParticleEngine';
import { GestureDetector } from './gesture/GestureDetector';
import { Renderer } from './render/Renderer';
import { UIManager } from './ui/UIManager';
import { eventBus } from './utils/EventBus';
import { StyleType, STYLE_CONFIGS } from './types';

class ParticleCameraApp {
  private cameraHandler: CameraHandler | null = null;
  private particleEngine: ParticleEngine | null = null;
  private gestureDetector: GestureDetector | null = null;
  private renderer: Renderer | null = null;
  private uiManager: UIManager | null = null;

  private videoElement: HTMLVideoElement | null = null;
  private canvasContainer: HTMLElement | null = null;
  private permissionOverlay: HTMLElement | null = null;
  private startBtn: HTMLButtonElement | null = null;

  private isInitialized: boolean = false;
  private currentStyle: StyleType = 'neon';

  constructor() {
    this.initElements();
    this.setupEventListeners();
  }

  private initElements(): void {
    this.videoElement = document.getElementById('video-element') as HTMLVideoElement;
    this.canvasContainer = document.getElementById('app') as HTMLElement;
    this.permissionOverlay = document.getElementById('permission-overlay') as HTMLElement;
    this.startBtn = document.getElementById('start-btn') as HTMLButtonElement;

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        this.start();
      });
    }
  }

  private setupEventListeners(): void {
    eventBus.on('camera:toggle', (enabled: boolean) => {
      if (enabled) {
        this.startCamera();
      } else {
        this.stopCamera();
      }
    });

    eventBus.on('style:change', (style: StyleType) => {
      this.handleStyleChange(style);
    });

    eventBus.on('render:update', (deltaTime: number) => {
      if (this.particleEngine) {
        this.particleEngine.update(deltaTime);
      }
    });
  }

  async start(): Promise<void> {
    if (this.isInitialized) {
      this.startCamera();
      return;
    }

    this.initModules();
    this.renderer?.start();
    this.hidePermissionOverlay();

    try {
      await this.initCamera();
      this.initGestureDetector();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Camera not available, running in demo mode:', error);
      this.isInitialized = true;
    }
  }

  private initModules(): void {
    this.particleEngine = new ParticleEngine();

    if (this.canvasContainer) {
      this.renderer = new Renderer(this.canvasContainer);
      this.uiManager = new UIManager(this.canvasContainer);
    }

    this.gestureDetector = new GestureDetector();
  }

  private async initCamera(): Promise<void> {
    if (!this.videoElement) return;

    this.cameraHandler = new CameraHandler(this.videoElement);
    const success = await this.cameraHandler.start();

    if (!success) {
      throw new Error('Camera initialization failed');
    }
  }

  private async initGestureDetector(): Promise<void> {
    if (!this.gestureDetector) return;

    const success = await this.gestureDetector.init();
    if (success) {
      this.gestureDetector.start();
    } else {
      console.warn('Gesture detection not available');
    }
  }

  private startCamera(): void {
    if (this.cameraHandler && !this.cameraHandler.getIsRunning()) {
      this.cameraHandler.start();
    }
  }

  private stopCamera(): void {
    if (this.cameraHandler && this.cameraHandler.getIsRunning()) {
      this.cameraHandler.stop();
    }
  }

  private handleStyleChange(style: StyleType): void {
    this.currentStyle = style;
    const config = STYLE_CONFIGS[style];

    if (this.renderer) {
      this.renderer.setBloomEnabled(config.bloom);
      this.renderer.setBloomIntensity(config.bloomIntensity);
    }
  }

  private hidePermissionOverlay(): void {
    if (this.permissionOverlay) {
      this.permissionOverlay.classList.add('hidden');
    }
  }

  private showPermissionError(): void {
    const desc = this.permissionOverlay?.querySelector('.permission-desc') as HTMLElement;
    if (desc) {
      desc.innerHTML = '无法访问摄像头。<br/>请检查权限设置并刷新页面重试。';
      desc.style.color = '#FF6B6B';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ParticleCameraApp();
});
