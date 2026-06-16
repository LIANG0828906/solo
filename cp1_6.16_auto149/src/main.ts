import { GestureTracker, GestureData } from './gesture/gestureTracker';
import { PaintScene } from './render/paintScene';
import { ControlPanel } from './ui/controlPanel';
import { CameraPreview } from './ui/cameraPreview';
import { useAppStore } from './store/appStore';

const DEV_MODE = false;

class App {
  private gestureTracker: GestureTracker | null = null;
  private paintScene!: PaintScene;
  private controlPanel!: ControlPanel;
  private cameraPreview!: CameraPreview;
  private fpsCounter!: HTMLElement;
  private frameLatencies: number[] = [];

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const canvasContainer = document.getElementById('canvas-container')!;
    this.fpsCounter = document.getElementById('fps-counter')!;
    this.cameraPreview = new CameraPreview();

    this.paintScene = new PaintScene(canvasContainer, (fps) => {
      useAppStore.getState().setFps(fps);
      this.updateFpsDisplay();
    });
    this.paintScene.setDevMode(DEV_MODE);

    this.controlPanel = new ControlPanel(canvasContainer, {
      onClear: () => this.handleClear(),
      onSave: () => this.handleSave(),
      onModeChange: (mode) => this.handleModeChange(mode)
    });

    const store = useAppStore.getState();
    store.setDrawMode('gesture');

    await this.initGestureTracking();

    this.startLatencyMonitoring();

    console.log('[App] 初始化完成');
  }

  private async initGestureTracking(): Promise<void> {
    try {
      const videoEl = this.cameraPreview.getVideoElement();
      const overlayEl = this.cameraPreview.getOverlayCanvas();

      this.gestureTracker = new GestureTracker(
        videoEl,
        overlayEl,
        (data: GestureData) => this.onGestureData(data)
      );

      await this.gestureTracker.init();
      this.cameraPreview.markInitialized();
      this.cameraPreview.show();

      console.log('[App] 手势追踪模块启动成功');
    } catch (error) {
      console.error('[App] 手势追踪初始化失败，将使用鼠标模式:', error);
      this.controlPanel.setMode('mouse');
      useAppStore.getState().setDrawMode('mouse');
      alert('摄像头初始化失败，将自动切换到鼠标绘制模式。请检查摄像头权限后刷新页面。');
    }
  }

  private onGestureData(data: GestureData): void {
    const store = useAppStore.getState();
    const mode = store.drawMode;

    const now = performance.now();
    const latency = now - data.timestamp;
    this.recordLatency(latency);

    store.setHandDetected(data.isHandDetected);
    this.cameraPreview.setHandDetected(data.isHandDetected);

    if (data.isHandDetected && data.fingerTip) {
      store.addFingerPoint({
        x: data.fingerTip.x,
        y: data.fingerTip.y,
        z: data.fingerTip.z,
        timestamp: data.timestamp
      });

      if (mode === 'gesture') {
        this.paintScene.updateFingerPosition({
          x: data.fingerTip.x,
          y: data.fingerTip.y,
          z: data.fingerTip.z,
          timestamp: data.timestamp
        });
      }
    } else {
      if (mode === 'gesture') {
        this.paintScene.updateFingerPosition(null);
      }
    }
  }

  private handleClear(): void {
    console.log('[App] 清空画布');
    this.paintScene.triggerClearAnimation();
  }

  private handleSave(): void {
    console.log('[App] 保存截图');
    const dataUrl = this.paintScene.captureScreenshot();
    if (!dataUrl) return;

    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `ink-painting-${timestamp}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private handleModeChange(mode: 'gesture' | 'mouse'): void {
    console.log(`[App] 切换模式: ${mode}`);
    useAppStore.getState().setDrawMode(mode);
    if (mode === 'gesture') {
      this.paintScene.updateFingerPosition(
        useAppStore.getState().latestFingerPoint
      );
    }
  }

  private recordLatency(latency: number): void {
    this.frameLatencies.push(latency);
    if (this.frameLatencies.length > 60) {
      this.frameLatencies.shift();
    }
  }

  private getAverageLatency(): number {
    if (this.frameLatencies.length === 0) return 0;
    const sum = this.frameLatencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frameLatencies.length);
  }

  private updateFpsDisplay(): void {
    const fps = useAppStore.getState().fps;
    const latency = this.getAverageLatency();
    useAppStore.getState().setGestureLatency(latency);
    this.fpsCounter.textContent = `FPS: ${fps} | Latency: ${latency}ms`;
  }

  private startLatencyMonitoring(): void {
    setInterval(() => {
      this.updateFpsDisplay();
    }, 500);
  }

  public dispose(): void {
    this.gestureTracker?.destroy();
    this.paintScene.dispose();
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});

window.addEventListener('beforeunload', () => {
  app?.dispose();
});
