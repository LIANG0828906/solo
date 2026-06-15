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
type Landmark = { x: number; y: number; z: number };

export class HandGestureRecognition {
  private videoElement: HTMLVideoElement;
  private callback: GestureCallback | null = null;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private lastGesture: GestureType = 'none';
  private smoothedPalmX: number = 0;
  private smoothedPalmY: number = 0;
  private handsModule: any = null;
  private cameraModule: any = null;

  constructor() {
    this.videoElement = document.getElementById('video-feed') as HTMLVideoElement;
    if (!this.videoElement) {
      console.error('Video element #video-feed not found');
    }
  }

  onGesture(callback: GestureCallback): void {
    this.callback = callback;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      this.handsModule = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.handsModule.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      this.handsModule.onResults((results: any) => this.onResults(results));

      this.cameraModule = new Camera(this.videoElement, {
        onFrame: async () => {
          const now = performance.now();
          if (now - this.lastFrameTime >= 33) {
            this.lastFrameTime = now;
            await this.handsModule.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.cameraModule.start();
      this.isRunning = true;
      console.log('Hand gesture recognition started (30+ FPS target)');
    } catch (error) {
      console.error('Failed to initialize hand gesture recognition:', error);
      this.startFallback();
    }
  }

  private startFallback(): void {
    console.log('Starting fallback: gesture via keyboard simulation');
    document.addEventListener('keydown', (e) => {
      if (!this.callback) return;
      let gesture: GestureType = 'none';
      switch (e.key) {
        case 'a': case 'A': gesture = 'open'; break;
        case 's': case 'S': gesture = 'fist'; break;
        case 'd': case 'D': gesture = 'pointing'; break;
      }
      if (gesture !== 'none') {
        this.callback({
          type: gesture,
          palmX: window.innerWidth / 2, palmY: window.innerHeight / 2,
          indexTipX: window.innerWidth / 2, indexTipY: window.innerHeight / 2,
          timestamp: performance.now()
        });
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.callback) return;
      const lerpFactor = 0.1;
      this.smoothedPalmX += (e.clientX - this.smoothedPalmX) * lerpFactor;
      this.smoothedPalmY += (e.clientY - this.smoothedPalmY) * lerpFactor;
      if (this.lastGesture !== 'none') {
        this.callback({
          type: this.lastGesture,
          palmX: this.smoothedPalmX,
          palmY: this.smoothedPalmY,
          indexTipX: e.clientX,
          indexTipY: e.clientY,
          timestamp: performance.now()
        });
      }
    });
    this.isRunning = true;
  }

  stop(): void {
    if (this.cameraModule) {
      this.cameraModule.stop();
      this.isRunning = false;
    }
  }

  private onResults(results: any): void {
    const now = performance.now();
    let gesture: GestureType = 'none';
    let palmX = this.smoothedPalmX;
    let palmY = this.smoothedPalmY;
    let indexTipX = 0;
    let indexTipY = 0;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const lm: Landmark[] = results.multiHandLandmarks[0];

      const wrist = lm[0];
      const thumbTip = lm[4];
      const thumbIp = lm[3];
      const indexTip = lm[8];
      const indexDip = lm[7];
      const indexPip = lm[6];
      const indexMcp = lm[5];
      const middleTip = lm[12];
      const middleDip = lm[11];
      const middlePip = lm[10];
      const middleMcp = lm[9];
      const ringTip = lm[16];
      const ringDip = lm[15];
      const ringPip = lm[14];
      const ringMcp = lm[13];
      const pinkyTip = lm[20];
      const pinkyDip = lm[19];
      const pinkyPip = lm[18];
      const pinkyMcp = lm[17];

      const gw = window.innerWidth;
      const gh = window.innerHeight;

      const rawPalmX = (1 - middleMcp.x) * gw;
      const rawPalmY = middleMcp.y * gh;

      const lerpFactor = 0.1;
      palmX = this.smoothedPalmX + (rawPalmX - this.smoothedPalmX) * lerpFactor;
      palmY = this.smoothedPalmY + (rawPalmY - this.smoothedPalmY) * lerpFactor;

      indexTipX = (1 - indexTip.x) * gw;
      indexTipY = indexTip.y * gh;

      const thumbExtended = this.detectThumbExtended(thumbTip, thumbIp, indexMcp, wrist);
      const indexExtended = this.detectFingerExtended(indexTip, indexDip, indexPip, indexMcp);
      const middleExtended = this.detectFingerExtended(middleTip, middleDip, middlePip, middleMcp);
      const ringExtended = this.detectFingerExtended(ringTip, ringDip, ringPip, ringMcp);
      const pinkyExtended = this.detectFingerExtended(pinkyTip, pinkyDip, pinkyPip, pinkyMcp);

      const extendedFingers = [indexExtended, middleExtended, ringExtended, pinkyExtended];
      const extendedCount = extendedFingers.filter(Boolean).length;

      if (extendedCount >= 3 && thumbExtended) {
        gesture = 'open';
      } else if (extendedCount === 0 && !thumbExtended) {
        gesture = 'fist';
      } else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        gesture = 'pointing';
      } else {
        gesture = this.lastGesture;
      }
    }

    this.lastGesture = gesture;
    this.smoothedPalmX = palmX;
    this.smoothedPalmY = palmY;

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

  private detectThumbExtended(
    thumbTip: Landmark, thumbIp: Landmark, indexMcp: Landmark, wrist: Landmark
  ): boolean {
    const tipDist = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);
    const ipDist = Math.hypot(thumbIp.x - wrist.x, thumbIp.y - wrist.y);
    const lateralDist = Math.abs(thumbTip.x - indexMcp.x);
    return tipDist > ipDist && lateralDist > 0.04;
  }

  private detectFingerExtended(
    tip: Landmark, _dip: Landmark, pip: Landmark, mcp: Landmark
  ): boolean {
    const tipToMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
    const pipToMcp = Math.hypot(pip.x - mcp.x, pip.y - mcp.y);
    const tipYPivot = tip.y < pip.y;
    return tipToMcp > pipToMcp * 0.9 && tipYPivot;
  }
}
