export class CameraPreview {
  private container: HTMLElement;
  private videoElement: HTMLVideoElement;
  private overlayCanvas: HTMLCanvasElement;
  private hintElement: HTMLElement;
  private isVisible: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.container = document.getElementById('camera-preview') as HTMLElement;
    this.videoElement = document.getElementById('video') as HTMLVideoElement;
    this.overlayCanvas = document.getElementById('overlay-canvas') as HTMLCanvasElement;
    this.hintElement = document.getElementById('gesture-hint') as HTMLElement;
  }

  public getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  public getOverlayCanvas(): HTMLCanvasElement {
    return this.overlayCanvas;
  }

  public show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.container.classList.add('visible');
      this.hintElement.classList.add('visible');
    }
  }

  public hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.container.classList.remove('visible');
      this.hintElement.classList.remove('visible');
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public setHandDetected(detected: boolean): void {
    if (detected) {
      this.show();
      this.hintElement.textContent = '正在作画...';
    } else {
      if (this.isInitialized) {
        this.hintElement.textContent = '请举手开始作画...';
      }
    }
  }

  public markInitialized(): void {
    this.isInitialized = true;
  }
}
