import * as THREE from 'three';

export class ScreenshotManager {
  private renderer: THREE.WebGLRenderer | null = null;

  constructor() {}

  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  public capturePNG(
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number = 1920,
    height: number = 1080
  ): string | null {
    if (!this.renderer) return null;

    const originalSize = new THREE.Vector2();
    this.renderer.getSize(originalSize);

    const originalPixelRatio = this.renderer.getPixelRatio();

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);

    this.renderer.render(scene, camera);

    const dataURL = this.renderer.domElement.toDataURL('image/png');

    this.renderer.setPixelRatio(originalPixelRatio);
    this.renderer.setSize(originalSize.x, originalSize.y, false);

    return dataURL;
  }

  public downloadScreenshot(
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number = 1920,
    height: number = 1080,
    filename: string = 'origami-screenshot.png'
  ): void {
    if (!this.renderer) return;

    const originalSize = new THREE.Vector2();
    this.renderer.getSize(originalSize);

    const originalPixelRatio = this.renderer.getPixelRatio();

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);

    this.renderer.render(scene, camera);

    const dataURL = this.renderer.domElement.toDataURL('image/png');

    this.renderer.setPixelRatio(originalPixelRatio);
    this.renderer.setSize(originalSize.x, originalSize.y, false);

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
  }

  public captureCurrentView(filename: string = 'origami-screenshot.png'): void {
    if (!this.renderer) return;

    const dataURL = this.renderer.domElement.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
  }
}
