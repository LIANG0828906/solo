import * as THREE from 'three';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  filename?: string;
}

export function captureScreenshot(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: ScreenshotOptions = {}
): void {
  const { width = 1920, height = 1080, filename = 'nebula-screenshot.png' } = options;

  const originalSize = new THREE.Vector2();
  const originalPixelRatio = renderer.getPixelRatio();
  renderer.getSize(originalSize);

  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  renderer.render(scene, camera);

  const dataURL = renderer.domElement.toDataURL('image/png');

  renderer.setSize(originalSize.x, originalSize.y);
  renderer.setPixelRatio(originalPixelRatio);

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function captureScreenshotWithUiToggle(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  setUiVisible: (visible: boolean) => void,
  options: ScreenshotOptions = {}
): Promise<void> {
  const { width = 1920, height = 1080, filename = 'nebula-screenshot.png' } = options;

  setUiVisible(false);

  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const originalSize = new THREE.Vector2();
  const originalPixelRatio = renderer.getPixelRatio();
  renderer.getSize(originalSize);

  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  });

  const currentRenderTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(currentRenderTarget);

  const pixelBuffer = new Uint8Array(width * height * 4);
  renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixelBuffer);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);

  for (let i = 0; i < pixelBuffer.length; i += 4) {
    const y = Math.floor(i / 4 / width);
    const x = (i / 4) % width;
    const targetY = height - y - 1;
    const targetIdx = (targetY * width + x) * 4;
    imageData.data[targetIdx] = pixelBuffer[i];
    imageData.data[targetIdx + 1] = pixelBuffer[i + 1];
    imageData.data[targetIdx + 2] = pixelBuffer[i + 2];
    imageData.data[targetIdx + 3] = pixelBuffer[i + 3];
  }

  ctx.putImageData(imageData, 0, 0);

  const dataURL = canvas.toDataURL('image/png');

  renderTarget.dispose();

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setUiVisible(true);
}
