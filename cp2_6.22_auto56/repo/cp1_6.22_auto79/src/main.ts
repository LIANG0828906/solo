import * as THREE from 'three';
import { SceneManager } from './sceneManager';
import { HandTracker, HandData, GestureType } from './handTracker';
import { ParticleSystem } from './particleSystem';
import { UIController } from './uiController';

class App {
  private canvasContainer: HTMLElement;
  private videoEl: HTMLVideoElement;
  private panelEl: HTMLElement;
  private sceneManager: SceneManager;
  private handTracker: HandTracker;
  private particleSystem: ParticleSystem;
  private uiController: UIController;
  private lastGesture: GestureType = 'none';
  private lastDragTip: THREE.Vector3 | null = null;
  private smoothingFactor = 0.18;
  private smoothedTip = new THREE.Vector3();
  private hasSmoothed = false;
  private clock = new THREE.Clock();
  private frameCount = 0;

  constructor() {
    this.canvasContainer = document.getElementById('canvas-container') as HTMLElement;
    this.videoEl = document.getElementById('video-hidden') as HTMLVideoElement;
    this.panelEl = document.getElementById('control-panel') as HTMLElement;
    const canvas = document.createElement('canvas');
    this.canvasContainer.appendChild(canvas);
    this.sceneManager = new SceneManager(canvas);
    this.handTracker = new HandTracker(this.videoEl);
    this.particleSystem = new ParticleSystem(this.sceneManager.getScene());
    this.uiController = new UIController(this.panelEl, {
      onColorChange: (c) => this.particleSystem.setBrush({ color: c, size: this.uiController.getSize() }),
      onSizeChange: (s) => this.particleSystem.setBrush({ color: this.uiController.getColor(), size: s }),
      onClear: () => this.particleSystem.clear(true),
    });
  }

  async start(): Promise<void> {
    this.uiController.init();
    this.uiController.showLoading('正在初始化3D场景...');
    this.sceneManager.init();
    this.uiController.updateLoading('正在加载手势识别模型...');
    this.particleSystem.setBrush({ color: this.uiController.getColor(), size: this.uiController.getSize() });
    try {
      await this.uiController.showPermissionPrompt();
      await this.handTracker.init();
    } catch (err) {
      console.warn('摄像头或模型加载失败:', err);
      this.uiController.updateLoading('⚠️ 摄像头访问受限，以演示模式运行');
      await new Promise((r) => setTimeout(r, 1500));
    }
    this.handTracker.setOnHandDetected((data) => this.handleHand(data));
    this.handTracker.start();
    this.uiController.hideLoading();
    this.animate();
  }

  private handleHand(data: HandData | null): void {
    const cursor = this.particleSystem.getCursorMesh();
    if (data && data.gesture !== 'none') {
      if (!this.hasSmoothed) {
        this.smoothedTip.copy(data.indexTip3D);
        this.hasSmoothed = true;
      } else {
        this.smoothedTip.lerp(data.indexTip3D, this.smoothingFactor);
      }
      cursor.position.copy(this.smoothedTip);
      cursor.visible = true;
      this.uiController.updateStatus(true, data.gesture);
      switch (data.gesture) {
        case 'open':
          this.particleSystem.setCursorOpacity(1.0);
          this.particleSystem.emit(this.smoothedTip);
          this.lastDragTip = null;
          break;
        case 'fist':
          this.particleSystem.setCursorOpacity(0.3);
          this.lastDragTip = null;
          break;
        case 'pinch':
          if (this.lastGesture !== 'pinch') {
            this.particleSystem.clear(true);
          }
          this.lastDragTip = null;
          break;
        case 'drag': {
          this.particleSystem.setCursorOpacity(0.85);
          const dragCenter = new THREE.Vector3()
            .addVectors(data.indexTip3D, data.middleTip3D)
            .multiplyScalar(0.5);
          if (this.lastDragTip) {
            const dx = dragCenter.x - this.lastDragTip.x;
            const dy = dragCenter.y - this.lastDragTip.y;
            this.sceneManager.rotateScene(dx * 0.6, dy * 0.6);
          }
          this.lastDragTip = dragCenter.clone();
          break;
        }
      }
      this.lastGesture = data.gesture;
    } else {
      cursor.visible = false;
      this.hasSmoothed = false;
      this.lastDragTip = null;
      this.lastGesture = 'none';
      this.uiController.updateStatus(false, 'none');
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.frameCount++;
    this.particleSystem.update(delta);
    if (this.frameCount % 180 === 0) {
      this.sceneManager.setAutoRotate(true);
    }
    this.sceneManager.render();
  };
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.start().catch((err) => console.error('启动失败:', err));
});
