import { eventBus } from '../utils/EventBus';
import { GestureState } from '../types';

export class GestureDetector {
  private isRunning: boolean = false;
  private hands: any = null;
  private lastState: GestureState = {
    leftHand: false,
    rightHand: false,
    bothHands: false
  };
  private debounceFrames: number = 3;
  private leftHandCounter: number = 0;
  private rightHandCounter: number = 0;
  private leftHandRaised: boolean = false;
  private rightHandRaised: boolean = false;
  private handRaiseThreshold: number = 0.3;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on('camera:frame', (_imageData: ImageData, videoElement: HTMLVideoElement) => {
      if (this.isRunning && this.hands) {
        this.detect(videoElement);
      }
    });
  }

  async init(): Promise<boolean> {
    try {
      const { Hands } = await import('@mediapipe/hands');

      this.hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults((results: any) => {
        this.processResults(results);
      });

      return true;
    } catch (error) {
      console.warn('GestureDetector init failed:', error);
      return false;
    }
  }

  start(): void {
    if (this.hands) {
      this.isRunning = true;
    }
  }

  stop(): void {
    this.isRunning = false;
  }

  private async detect(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.hands || !this.isRunning) return;

    try {
      await this.hands.send({ image: videoElement });
    } catch (error) {
      // Silently ignore detection errors
    }
  }

  private processResults(results: any): void {
    const landmarks = results.multiHandLandmarks || [];
    const handedness = results.multiHandedness || [];

    let leftDetected = false;
    let rightDetected = false;

    for (let i = 0; i < landmarks.length; i++) {
      const handLandmarks = landmarks[i];
      const hand = handedness[i]?.label || 'Right';

      const isLeft = hand === 'Left';
      const isRaised = this.isHandRaised(handLandmarks);

      if (isLeft) {
        leftDetected = isRaised;
      } else {
        rightDetected = isRaised;
      }
    }

    if (leftDetected) {
      this.leftHandCounter = Math.min(this.debounceFrames, this.leftHandCounter + 1);
    } else {
      this.leftHandCounter = Math.max(0, this.leftHandCounter - 1);
    }

    if (rightDetected) {
      this.rightHandCounter = Math.min(this.debounceFrames, this.rightHandCounter + 1);
    } else {
      this.rightHandCounter = Math.max(0, this.rightHandCounter - 1);
    }

    const newLeftRaised = this.leftHandCounter >= this.debounceFrames;
    const newRightRaised = this.rightHandCounter >= this.debounceFrames;

    if (newLeftRaised !== this.leftHandRaised || newRightRaised !== this.rightHandRaised) {
      this.leftHandRaised = newLeftRaised;
      this.rightHandRaised = newRightRaised;

      const newState: GestureState = {
        leftHand: this.leftHandRaised,
        rightHand: this.rightHandRaised,
        bothHands: this.leftHandRaised && this.rightHandRaised
      };

      if (
        newState.leftHand !== this.lastState.leftHand ||
        newState.rightHand !== this.lastState.rightHand ||
        newState.bothHands !== this.lastState.bothHands
      ) {
        this.lastState = { ...newState };
        eventBus.emit('gesture:change', newState);
      }
    }
  }

  private isHandRaised(landmarks: any[]): boolean {
    const wrist = landmarks[0];
    const middleFingerTip = landmarks[12];

    if (!wrist || !middleFingerTip) return false;

    const wristY = wrist.y;
    const middleTipY = middleFingerTip.y;

    const handHeight = Math.abs(wristY - middleTipY);
    const isRaised = middleTipY < wristY - this.handRaiseThreshold * handHeight;

    return isRaised;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getCurrentState(): GestureState {
    return { ...this.lastState };
  }
}
