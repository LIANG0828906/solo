import * as handpose from '@tensorflow-models/handpose';
import * as tf from '@tensorflow/tfjs';
import * as THREE from 'three';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type GestureType = 'open' | 'fist' | 'pinch' | 'drag' | 'none';

export interface HandData {
  landmarks: HandLandmark[];
  gesture: GestureType;
  indexTip3D: THREE.Vector3;
  middleTip3D: THREE.Vector3;
}

type OnHandDetectedCallback = (data: HandData | null) => void;

const HAND_MODEL_CONFIG = {
  detectionConfidence: 0.6,
  maxContinuousChecks: 3,
};

export class HandTracker {
  private video: HTMLVideoElement;
  private model: handpose.HandPose | null = null;
  private onHandDetected: OnHandDetectedCallback | null = null;
  private running = false;
  private rafId: number | null = null;
  private frameCount = 0;
  private detectEveryNFrames = 1;
  private lastIndexTip = new THREE.Vector3();
  private hasLastTip = false;

  constructor(videoElement: HTMLVideoElement) {
    this.video = videoElement;
  }

  async init(): Promise<void> {
    await tf.setBackend('webgl');
    await tf.ready();
    this.model = await handpose.load(HAND_MODEL_CONFIG);
    await this.startCamera();
  }

  private async startCamera(): Promise<void> {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
      audio: false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = stream;
    return new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        resolve();
      };
    });
  }

  setOnHandDetected(cb: OnHandDetectedCallback): void {
    this.onHandDetected = cb;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.detectLoop();
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private detectLoop = (): void => {
    if (!this.running) return;
    this.frameCount++;
    if (this.frameCount % this.detectEveryNFrames === 0) {
      this.detectHand();
    }
    this.rafId = requestAnimationFrame(this.detectLoop);
  };

  private async detectHand(): Promise<void> {
    if (!this.model) return;
    if (this.video.readyState < 2) return;
    try {
      const predictions = await this.model.estimateHands(this.video, false);
      if (predictions && predictions.length > 0) {
        const prediction = predictions[0];
        const landmarks = prediction.landmarks as HandLandmark[];
        const gesture = this.classifyGesture(landmarks);
        const indexTip3D = this.landmarkTo3D(landmarks[8], landmarks);
        const middleTip3D = this.landmarkTo3D(landmarks[12], landmarks);
        this.hasLastTip = true;
        this.lastIndexTip.copy(indexTip3D);
        if (this.onHandDetected) {
          this.onHandDetected({ landmarks, gesture, indexTip3D, middleTip3D });
        }
      } else {
        this.hasLastTip = false;
        if (this.onHandDetected) {
          this.onHandDetected(null);
        }
      }
    } catch (e) {
    }
  }

  private landmarkTo3D(lm: HandLandmark, all: HandLandmark[]): THREE.Vector3 {
    const videoW = this.video.videoWidth || 640;
    const videoH = this.video.videoHeight || 480;
    const nx = 1 - lm.x / videoW;
    const ny = 1 - lm.y / videoH;
    const wrist = all[0];
    const middleMcp = all[9];
    const handSize = Math.sqrt(
      Math.pow((wrist.x - middleMcp.x) / videoW, 2) +
      Math.pow((wrist.y - middleMcp.y) / videoH, 2)
    );
    const z = THREE.MathUtils.clamp((handSize - 0.08) * 8, -2.5, 2.5);
    return new THREE.Vector3(
      (nx - 0.5) * 7,
      (ny - 0.5) * 5,
      z
    );
  }

  private dist(a: HandLandmark, b: HandLandmark): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
  }

  private classifyGesture(lms: HandLandmark[]): GestureType {
    const wrist = lms[0];
    const thumbTip = lms[4];
    const indexTip = lms[8];
    const indexPip = lms[6];
    const indexMcp = lms[5];
    const middleTip = lms[12];
    const middlePip = lms[10];
    const middleMcp = lms[9];
    const ringTip = lms[16];
    const ringPip = lms[14];
    const pinkyTip = lms[20];
    const pinkyPip = lms[18];
    const handRefDist = this.dist(wrist, middleMcp);
    if (handRefDist < 1) return 'none';
    const indexExtended = this.dist(indexTip, wrist) > this.dist(indexPip, wrist) * 1.15;
    const middleExtended = this.dist(middleTip, wrist) > this.dist(middlePip, wrist) * 1.15;
    const ringExtended = this.dist(ringTip, wrist) > this.dist(ringPip, wrist) * 1.15;
    const pinkyExtended = this.dist(pinkyTip, wrist) > this.dist(pinkyPip, wrist) * 1.15;
    const thumbIndexDist = this.dist(thumbTip, indexTip) / handRefDist;
    const thumbMiddleDist = this.dist(thumbTip, middleTip) / handRefDist;
    const thumbRingDist = this.dist(thumbTip, ringTip) / handRefDist;
    const thumbPinkyDist = this.dist(thumbTip, pinkyTip) / handRefDist;
    const pinchThreshold = 0.55;
    if (
      thumbIndexDist < pinchThreshold &&
      thumbMiddleDist < pinchThreshold + 0.1 &&
      thumbRingDist < pinchThreshold + 0.15 &&
      thumbPinkyDist < pinchThreshold + 0.2
    ) {
      return 'pinch';
    }
    const indexMiddleDist = this.dist(indexTip, middleTip) / handRefDist;
    if (indexExtended && middleExtended && indexMiddleDist < 0.35 && !ringExtended && !pinkyExtended) {
      return 'drag';
    }
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      return 'open';
    }
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return 'fist';
    }
    return 'open';
  }

  getLastIndexTip(): THREE.Vector3 | null {
    return this.hasLastTip ? this.lastIndexTip.clone() : null;
  }

  dispose(): void {
    this.stop();
    if (this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
  }
}
