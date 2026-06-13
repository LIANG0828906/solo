import { applyFilter, blendImageData, type FilterType } from './filterEngine';
import { UIController } from './uiController';

const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 720;
const TRANSITION_DURATION = 500;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

let video: HTMLVideoElement;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let uiController: UIController;

let currentFilter: FilterType = 'original';
let brightness = 0;
let contrast = 1;

let isTransitioning = false;
let transitionStart = 0;
let transitionFromFilter: FilterType = 'original';
let transitionToFilter: FilterType = 'original';
let transitionImageData: ImageData | null = null;

let lastFrameTime = 0;
let animationId: number;

async function init(): Promise<void> {
  video = document.getElementById('video') as HTMLVideoElement;
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  uiController = new UIController({
    onFilterChange: handleFilterChange,
    onBrightnessChange: handleBrightnessChange,
    onContrastChange: handleContrastChange,
    onCapture: handleCapture
  });

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'user'
      },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    setupCanvas();
    uiController.showControls();
    startRenderLoop();
  } catch (error) {
    console.error('Failed to access camera:', error);
    const loading = document.getElementById('loading')!;
    loading.textContent = '无法访问摄像头，请检查权限设置';
  }
}

function setupCanvas(): void {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const videoAspect = videoWidth / videoHeight;

  let targetWidth = TARGET_WIDTH;
  let targetHeight = TARGET_HEIGHT;

  if (videoAspect > 16 / 9) {
    targetHeight = TARGET_HEIGHT;
    targetWidth = Math.round(targetHeight * videoAspect);
  } else {
    targetWidth = TARGET_WIDTH;
    targetHeight = Math.round(targetWidth / videoAspect);
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const displayAspect = 16 / 9;
  const canvasAspect = canvas.width / canvas.height;

  if (canvasAspect > displayAspect) {
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
  } else {
    canvas.style.height = '100%';
    canvas.style.width = 'auto';
  }
}

function startRenderLoop(): void {
  function render(timestamp: number): void {
    if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
      processFrame();
      uiController.updateFps();
      lastFrameTime = timestamp;
    }
    animationId = requestAnimationFrame(render);
  }

  animationId = requestAnimationFrame(render);
}

function processFrame(): void {
  if (video.readyState < 2) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  const options = { brightness, contrast };

  if (isTransitioning) {
    const elapsed = performance.now() - transitionStart;
    const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
    const t = easeInOutQuad(progress);

    const fromData = copyImageData(
      applyFilter(ctx, copyImageData(imageData), transitionFromFilter, options)
    );
    const toData = applyFilter(ctx, copyImageData(imageData), transitionToFilter, options);

    const blended = blendImageData(fromData, toData, t);
    ctx.putImageData(blended, 0, 0);

    if (progress >= 1) {
      isTransitioning = false;
      currentFilter = transitionToFilter;
      transitionImageData = null;
    }
  } else {
    const filtered = applyFilter(ctx, imageData, currentFilter, options);
    ctx.putImageData(filtered, 0, 0);
  }
}

function copyImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function handleFilterChange(filter: FilterType): void {
  if (isTransitioning) {
    transitionFromFilter = transitionToFilter;
  } else {
    transitionFromFilter = currentFilter;
  }

  transitionToFilter = filter;
  transitionStart = performance.now();
  isTransitioning = true;
}

function handleBrightnessChange(value: number): void {
  brightness = value;
}

function handleContrastChange(value: number): void {
  contrast = value;
}

function handleCapture(): void {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `photo-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}

document.addEventListener('DOMContentLoaded', init);
