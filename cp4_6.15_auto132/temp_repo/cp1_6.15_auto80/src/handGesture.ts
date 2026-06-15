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
type FingerKey = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

interface FingerCache {
  tipToMcp: number;
  pipToMcp: number;
  extended: boolean;
}

export class HandGestureRecognition {
  private videoElement: HTMLVideoElement;
  private callback: GestureCallback | null = null;
  private isRunning: boolean = false;
  private lastProcessTime: number = 0;
  private lastGesture: GestureType = 'none';
  private smoothedPalmX: number = 0;
  private smoothedPalmY: number = 0;
  private handsModule: any = null;
  private cameraModule: any = null;

  private fingerCache: Map<FingerKey, FingerCache> = new Map();
  private cacheLandmarkId: number = -1;
  private readonly FRAME_INTERVAL: number = 1000 / 30;

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
    if (this.isRunning) return Promise.resolve();

    try {
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      this.handsModule = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.handsModule.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      this.handsModule.onResults((results: any) => {
        const now = performance.now();
        if (now - this.lastProcessTime >= this.FRAME_INTERVAL) {
          this.lastProcessTime = now;
          this.processResults(results, now);
        }
      });

      this.cameraModule = new Camera(this.videoElement, {
        onFrame: async () => {
          await this.handsModule.send({ image: this.videoElement });
        },
        width: 640,
        height: 480
      });

      await this.cameraModule.start();
      this.isRunning = true;
      console.log('Hand gesture recognition started (30 FPS)');
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

  private processResults(results: any, now: number): void {
    let gesture: GestureType = 'none';
    let palmX = this.smoothedPalmX;
    let palmY = this.smoothedPalmY;
    let indexTipX = 0;
    let indexTipY = 0;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const lm: Landmark[] = results.multiHandLandmarks[0];
      const cacheId = Math.floor(now / 16);

      if (cacheId !== this.cacheLandmarkId) {
        this.fingerCache.clear();
        this.cacheLandmarkId = cacheId;
      }

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

      const thumbExtended = this.getThumbExtended(thumbTip, thumbIp, indexMcp, wrist);
      const indexExtended = this.getFingerExtended('index', indexTip, indexDip, indexPip, indexMcp);
      const middleExtended = this.getFingerExtended('middle', middleTip, middleDip, middlePip, middleMcp);
      const ringExtended = this.getFingerExtended('ring', ringTip, ringDip, ringPip, ringMcp);
      const pinkyExtended = this.getFingerExtended('pinky', pinkyTip, pinkyDip, pinkyPip, pinkyMcp);

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

  private getFingerExtended(
    key: FingerKey, tip: Landmark, _dip: Landmark, pip: Landmark, mcp: Landmark
  ): boolean {
    const cached = this.fingerCache.get(key);
    if (cached) return cached.extended;

    const tipToMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
    const pipToMcp = Math.hypot(pip.x - mcp.x, pip.y - mcp.y);
    const extended = tipToMcp > pipToMcp * 0.9 && tip.y < pip.y;

    this.fingerCache.set(key, { tipToMcp, pipToMcp, extended });
    return extended;
  }

  private getThumbExtended(
    thumbTip: Landmark, thumbIp: Landmark, indexMcp: Landmark, wrist: Landmark
  ): boolean {
    const tipDist = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);
    const ipDist = Math.hypot(thumbIp.x - wrist.x, thumbIp.y - wrist.y);
    const lateralDist = Math.abs(thumbTip.x - indexMcp.x);
    return tipDist > ipDist && lateralDist > 0.04;
  }
}
