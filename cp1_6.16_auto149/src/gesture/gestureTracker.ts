import { Hands, Results, NormalizedLandmark, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export interface GestureData {
  fingerTip: { x: number; y: number; z: number } | null;
  landmarks: NormalizedLandmark[] | null;
  timestamp: number;
  isHandDetected: boolean;
}

export type GestureCallback = (data: GestureData) => void;

export class GestureTracker {
  private videoElement: HTMLVideoElement;
  private overlayCanvas: HTMLCanvasElement;
  private overlayCtx: CanvasRenderingContext2D | null;
  private hands: Hands | null = null;
  private camera: Camera | null = null;
  private callback: GestureCallback;
  private isInitialized = false;
  private lastFrameTime = 0;
  private targetFPS = 60;

  constructor(
    videoElement: HTMLVideoElement,
    overlayCanvas: HTMLCanvasElement,
    callback: GestureCallback
  ) {
    this.videoElement = videoElement;
    this.overlayCanvas = overlayCanvas;
    this.overlayCtx = overlayCanvas.getContext('2d');
    this.callback = callback;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      this.hands.onResults((results: Results) => {
        this.processResults(results);
      });

      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          const now = performance.now();
          const minInterval = 1000 / this.targetFPS;
          if (now - this.lastFrameTime >= minInterval) {
            this.lastFrameTime = now;
            if (this.hands) {
              await this.hands.send({ image: this.videoElement });
            }
          }
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.isInitialized = true;
      console.log('[GestureTracker] 初始化成功');
    } catch (error) {
      console.error('[GestureTracker] 初始化失败:', error);
      throw error;
    }
  }

  private processResults(results: Results): void {
    const timestamp = performance.now();
    const overlayCtx = this.overlayCtx;

    if (overlayCtx) {
      this.overlayCanvas.width = this.overlayCanvas.clientWidth;
      this.overlayCanvas.height = this.overlayCanvas.clientHeight;
      overlayCtx.save();
      overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const fingerTip = landmarks[8];

      if (overlayCtx) {
        overlayCtx.globalAlpha = 0.8;
        drawConnectors(overlayCtx, landmarks, HAND_CONNECTIONS, {
          color: '#00FF88',
          lineWidth: 2
        });
        drawLandmarks(overlayCtx, landmarks, {
          color: '#FF4444',
          lineWidth: 1,
          radius: 2
        });

        overlayCtx.fillStyle = '#FFD700';
        overlayCtx.beginPath();
        overlayCtx.arc(
          fingerTip.x * this.overlayCanvas.width,
          fingerTip.y * this.overlayCanvas.height,
          6, 0, 2 * Math.PI
        );
        overlayCtx.fill();
        overlayCtx.restore();
      }

      this.callback({
        fingerTip: { x: fingerTip.x, y: fingerTip.y, z: fingerTip.z },
        landmarks: landmarks,
        timestamp,
        isHandDetected: true
      });
    } else {
      if (overlayCtx) {
        overlayCtx.restore();
      }
      this.callback({
        fingerTip: null,
        landmarks: null,
        timestamp,
        isHandDetected: false
      });
    }
  }

  destroy(): void {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
    this.isInitialized = false;
  }
}
