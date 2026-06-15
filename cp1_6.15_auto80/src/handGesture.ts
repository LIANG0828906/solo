import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export type GestureType = 'open' | 'fist' | 'pointing' | 'none';

export interface GestureData {
  type: GestureType;
  palmX: number;
  palmY: number;
  indexTipX: number;
  indexTipY: number;
  timestamp: number;
}

type GestureCallback = (data: GestureData) => void;

export class HandGestureRecognition {
  private hands: Hands;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement;
  private lastGesture: GestureType = 'none';
  private lastPalmX: number = 0;
  private lastPalmY: number = 0;
  private lastIndexTipX: number = 0;
  private lastIndexTipY: number = 0;
  private callback: GestureCallback | null = null;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private targetPalmX: number = 0;
  private targetPalmY: number = 0;

  constructor() {
    this.videoElement = document.getElementById('video-feed') as HTMLVideoElement;
    
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults(this.onResults.bind(this));
  }

  onGesture(callback: GestureCallback): void {
    this.callback = callback;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    try {
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          const now = performance.now();
          if (now - this.lastFrameTime >= 33) {
            this.lastFrameTime = now;
            await this.hands.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.isRunning = true;
      console.log('Hand gesture recognition started');
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  }

  stop(): void {
    if (this.camera) {
      this.camera.stop();
      this.isRunning = false;
    }
  }

  private onResults(results: Results): void {
    const now = performance.now();
    let gesture: GestureType = 'none';
    let palmX = this.lastPalmX;
    let palmY = this.lastPalmY;
    let indexTipX = this.lastIndexTipX;
    let indexTipY = this.lastIndexTipY;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const indexPip = landmarks[6];
      const middleTip = landmarks[12];
      const middlePip = landmarks[10];
      const ringTip = landmarks[16];
      const ringPip = landmarks[14];
      const pinkyTip = landmarks[20];
      const pinkyPip = landmarks[18];
      const middleMcp = landmarks[9];

      const gameWidth = window.innerWidth;
      const gameHeight = window.innerHeight;

      this.targetPalmX = (1 - middleMcp.x) * gameWidth;
      this.targetPalmY = middleMcp.y * gameHeight;

      const lerpFactor = 0.1;
      palmX = this.lastPalmX + (this.targetPalmX - this.lastPalmX) * lerpFactor;
      palmY = this.lastPalmY + (this.targetPalmY - this.lastPalmY) * lerpFactor;

      indexTipX = (1 - indexTip.x) * gameWidth;
      indexTipY = indexTip.y * gameHeight;

      const thumbExtended = this.isFingerExtended(thumbTip, wrist, indexPip, true);
      const indexExtended = this.isFingerExtended(indexTip, indexPip, middleMcp);
      const middleExtended = this.isFingerExtended(middleTip, middlePip, middleMcp);
      const ringExtended = this.isFingerExtended(ringTip, ringPip, middleMcp);
      const pinkyExtended = this.isFingerExtended(pinkyTip, pinkyPip, middleMcp);

      const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

      if (extendedCount >= 3 && thumbExtended) {
        gesture = 'open';
      } else if (extendedCount === 0) {
        gesture = 'fist';
      } else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        gesture = 'pointing';
      } else {
        gesture = this.lastGesture;
      }
    }

    this.lastGesture = gesture;
    this.lastPalmX = palmX;
    this.lastPalmY = palmY;
    this.lastIndexTipX = indexTipX;
    this.lastIndexTipY = indexTipY;

    if (this.callback) {
      this.callback({
        type: gesture,
        palmX,
        palmY,
        indexTipX,
        indexTipY,
        timestamp: now
      });
    }
  }

  private isFingerExtended(
    tip: { x: number; y: number; z: number },
    pip: { x: number; y: number; z: number },
    mcp: { x: number; y: number; z: number },
    isThumb: boolean = false
  ): boolean {
    if (isThumb) {
      const distTipToIndex = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
      return distTipToIndex > 0.15;
    }
    
    const tipToMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
    const pipToMcp = Math.hypot(pip.x - mcp.x, pip.y - mcp.y);
    
    return tipToMcp > pipToMcp * 1.1;
  }
}
