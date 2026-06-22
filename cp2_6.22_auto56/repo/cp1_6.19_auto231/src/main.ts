import {
  initStarfield,
  updateStars,
  projectStars,
  drawStars,
  getStarAtPosition,
  getStars,
  Camera,
} from './starfield';
import { addTrail, updateTrails, drawTrails, clearTrails } from './trail';
import { initControls, getSettings } from './controls';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let lastTime: number = 0;
let backgroundCanvas: HTMLCanvasElement;
let backgroundCtx: CanvasRenderingContext2D;

const camera: Camera = {
  rotationX: -0.3,
  rotationY: 0,
  zoom: 1,
  focalLength: 500,
};

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let touchStartDistance = 0;
let initialZoom = 1;

let frameCount = 0;
let fpsLastTime = performance.now();
let currentFPS = 60;

function init(): void {
  const app = document.getElementById('app');
  if (!app) return;

  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d')!;
  app.appendChild(canvas);

  backgroundCanvas = document.createElement('canvas');
  backgroundCtx = backgroundCanvas.getContext('2d')!;

  resize();
  const settings = getSettings();
  initStarfield(settings.starCount);
  renderBackground();

  initControls(app, handleSettingsChange);

  bindEvents();

  lastTime = performance.now();
  animate(lastTime);
}

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);

  backgroundCanvas.width = window.innerWidth;
  backgroundCanvas.height = window.innerHeight;
  renderBackground();
}

function renderBackground(): void {
  const gradient = backgroundCtx.createRadialGradient(
    backgroundCanvas.width / 2,
    backgroundCanvas.height / 2,
    0,
    backgroundCanvas.width / 2,
    backgroundCanvas.height / 2,
    Math.max(backgroundCanvas.width, backgroundCanvas.height) * 0.7
  );
  gradient.addColorStop(0, '#0B1D3A');
  gradient.addColorStop(1, '#000000');
  backgroundCtx.fillStyle = gradient;
  backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
}

function bindEvents(): void {
  window.addEventListener('resize', resize);

  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  canvas.addEventListener('click', handleClick);

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd);
}

function handleMouseDown(e: MouseEvent): void {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}

function handleMouseMove(e: MouseEvent): void {
  if (!isDragging) return;

  const deltaX = e.clientX - lastMouseX;
  const deltaY = e.clientY - lastMouseY;

  camera.rotationY += deltaX * 0.005;
  camera.rotationX += deltaY * 0.005;
  camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotationX));

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}

function handleMouseUp(): void {
  isDragging = false;
}

function handleWheel(e: WheelEvent): void {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  camera.zoom = Math.max(0.3, Math.min(3, camera.zoom * delta));
}

function handleClick(e: MouseEvent): void {
  if (isDragging) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const star = getStarAtPosition(x, y);
  if (star) {
    const settings = getSettings();
    addTrail(star, settings);
  }
}

function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function handleTouchStart(e: TouchEvent): void {
  e.preventDefault();
  if (e.touches.length === 1) {
    isDragging = true;
    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    touchStartDistance = getTouchDistance(e.touches);
    initialZoom = camera.zoom;
  }
}

function handleTouchMove(e: TouchEvent): void {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    const deltaX = e.touches[0].clientX - lastMouseX;
    const deltaY = e.touches[0].clientY - lastMouseY;

    camera.rotationY += deltaX * 0.005;
    camera.rotationX += deltaY * 0.005;
    camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotationX));

    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    const currentDistance = getTouchDistance(e.touches);
    const scale = currentDistance / touchStartDistance;
    camera.zoom = Math.max(0.3, Math.min(3, initialZoom * scale));
  }
}

function handleTouchEnd(e: TouchEvent): void {
  if (e.touches.length === 0) {
    isDragging = false;
  }
}

function handleSettingsChange(): void {
  const newSettings = getSettings();
  const currentStars = getStars();
  
  if (newSettings.starCount !== currentStars.length) {
    clearTrails();
    initStarfield(newSettings.starCount);
  }
}

function animate(currentTime: number): void {
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  frameCount++;
  if (currentTime - fpsLastTime >= 1000) {
    currentFPS = frameCount;
    frameCount = 0;
    fpsLastTime = currentTime;
  }

  const settings = getSettings();
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  updateStars(deltaTime, settings);
  updateTrails(currentTime, settings);
  projectStars(camera, centerX, centerY, settings);

  ctx.drawImage(backgroundCanvas, 0, 0);

  drawStars(ctx, camera, settings);
  drawTrails(ctx, camera, centerX, centerY, settings);

  if (currentFPS < 45) {
    const currentStars = getStars();
    if (settings.starCount === currentStars.length && settings.starCount > 10000) {
      const newCount = Math.floor(settings.starCount * 0.9);
      initStarfield(newCount);
    }
  }

  requestAnimationFrame(animate);
}

init();
