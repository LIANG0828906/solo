import * as THREE from 'three';

export interface CaptureOptions {
  width?: number;
  height?: number;
  filename?: string;
}

export class ScreenshotTool {
  static async capture(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    options: CaptureOptions = {},
  ): Promise<void> {
    const width = options.width ?? 1500;
    const height = options.height ?? 1500;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.filename ?? `scene_snapshot_${timestamp}.png`;

    const originalSize = new THREE.Vector2();
    renderer.getSize(originalSize);
    const originalPixelRatio = renderer.getPixelRatio();

    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    const dataURL = renderer.domElement.toDataURL('image/png');

    renderer.setPixelRatio(originalPixelRatio);
    renderer.setSize(originalSize.x, originalSize.y, false);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = originalSize.x / originalSize.y;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
