import { eventBus } from '../utils/EventBus';

export class CameraHandler {
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D;
  private stream: MediaStream | null = null;
  private isRunning: boolean = false;
  private captureInterval: number | null = null;
  private captureRate: number = 100;
  private frameWidth: number = 120;
  private frameHeight: number = 90;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.width = this.frameWidth;
    this.canvasElement.height = this.frameHeight;
    this.canvasContext = this.canvasElement.getContext('2d', { willReadFrequently: true })!;
  }

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      const videoWidth = this.videoElement.videoWidth;
      const videoHeight = this.videoElement.videoHeight;
      const aspectRatio = videoWidth / videoHeight;

      if (aspectRatio > this.frameWidth / this.frameHeight) {
        this.frameHeight = Math.round(this.frameWidth / aspectRatio);
      } else {
        this.frameWidth = Math.round(this.frameHeight * aspectRatio);
      }

      this.canvasElement.width = this.frameWidth;
      this.canvasElement.height = this.frameHeight;

      this.isRunning = true;
      this.startCaptureLoop();
      eventBus.emit('camera:started');

      return true;
    } catch (error) {
      console.error('Camera start failed:', error);
      eventBus.emit('camera:error', error);
      return false;
    }
  }

  stop(): void {
    this.isRunning = false;

    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.videoElement.srcObject = null;
    eventBus.emit('camera:stopped');
  }

  private startCaptureLoop(): void {
    const capture = () => {
      if (!this.isRunning) return;

      this.captureFrame();
      this.captureInterval = window.setTimeout(capture, this.captureRate);
    };

    capture();
  }

  private captureFrame(): void {
    if (!this.videoElement.videoWidth || !this.videoElement.videoHeight) return;

    this.canvasContext.drawImage(
      this.videoElement,
      0, 0,
      this.frameWidth, this.frameHeight
    );

    const imageData = this.canvasContext.getImageData(
      0, 0,
      this.frameWidth, this.frameHeight
    );

    eventBus.emit('camera:frame', imageData, this.videoElement);
  }

  getFrameSize(): { width: number; height: number } {
    return { width: this.frameWidth, height: this.frameHeight };
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }
}
