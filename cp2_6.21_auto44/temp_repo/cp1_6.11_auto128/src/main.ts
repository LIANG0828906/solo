import { FlowField } from './flowField';
import { ParticleSystem } from './particles';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface AppState {
  backgroundColor: string;
  particleCount: number;
  particleSize: number;
  flowSpeed: number;
}

const state: AppState = {
  backgroundColor: '#0A192F',
  particleCount: 1000,
  particleSize: 2,
  flowSpeed: 1.0
};

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let flowField: FlowField;
let particleSystem: ParticleSystem;
let fpsCounter: HTMLElement;
let lastTime = 0;
let frameCount = 0;
let fps = 60;
let lastFpsUpdate = 0;

let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let lastMouseMoveTime = 0;

function init(): void {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    console.error('Could not get 2D context');
    return;
  }
  ctx = context;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  fpsCounter = document.getElementById('fpsCounter') as HTMLElement;

  flowField = new FlowField(CANVAS_WIDTH, CANVAS_HEIGHT);
  particleSystem = new ParticleSystem(CANVAS_WIDTH, CANVAS_HEIGHT, flowField);

  setupEventListeners();
  setupControls();

  requestAnimationFrame(animate);
}

function setupEventListeners(): void {
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseLeave);
}

function getCanvasCoords(e: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function handleMouseDown(e: MouseEvent): void {
  const { x, y } = getCanvasCoords(e);
  isMouseDown = true;
  lastMouseX = x;
  lastMouseY = y;
  lastMouseMoveTime = Date.now();

  flowField.createVortex(x, y);
  flowField.createRipple(x, y);
}

function handleMouseMove(e: MouseEvent): void {
  const { x, y } = getCanvasCoords(e);
  const now = Date.now();

  if (isMouseDown) {
    const dx = x - lastMouseX;
    const dy = y - lastMouseY;
    const dt = now - lastMouseMoveTime;

    if (dt > 0) {
      const speed = Math.sqrt(dx * dx + dy * dy) / (dt / 16);
      const vx = dx / (dt / 16);
      const vy = dy / (dt / 16);

      flowField.addFlowPoint(x, y, vx, vy, speed);
    }

    lastMouseX = x;
    lastMouseY = y;
    lastMouseMoveTime = now;
  }
}

function handleMouseUp(_e: MouseEvent): void {
  isMouseDown = false;
  flowField.releaseVortexes();
}

function handleMouseLeave(_e: MouseEvent): void {
  if (isMouseDown) {
    isMouseDown = false;
    flowField.releaseVortexes();
  }
}

function setupControls(): void {
  const particleCountSlider = document.getElementById('particleCount') as HTMLInputElement;
  const particleCountValue = document.getElementById('particleCountValue') as HTMLElement;

  const particleSizeSlider = document.getElementById('particleSize') as HTMLInputElement;
  const particleSizeValue = document.getElementById('particleSizeValue') as HTMLElement;

  const flowSpeedSlider = document.getElementById('flowSpeed') as HTMLInputElement;
  const flowSpeedValue = document.getElementById('flowSpeedValue') as HTMLElement;

  const backgroundColorSelect = document.getElementById('backgroundColor') as HTMLSelectElement;

  const updateSliderFill = (slider: HTMLInputElement) => {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--value', `${percentage}%`);
  };

  particleCountSlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    state.particleCount = value;
    particleCountValue.textContent = value.toString();
    particleSystem.setParticleCount(value);
    updateSliderFill(particleCountSlider);
  });

  particleSizeSlider.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    state.particleSize = value;
    particleSizeValue.textContent = value.toString();
    particleSystem.setParticleSize(value);
    updateSliderFill(particleSizeSlider);
  });

  flowSpeedSlider.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    state.flowSpeed = value;
    flowSpeedValue.textContent = value.toFixed(1);
    flowField.setFlowSpeedMultiplier(value);
    updateSliderFill(flowSpeedSlider);
  });

  backgroundColorSelect.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value;
    state.backgroundColor = value;
    updateBodyBackground();
  });

  updateSliderFill(particleCountSlider);
  updateSliderFill(particleSizeSlider);
  updateSliderFill(flowSpeedSlider);
}

function updateBodyBackground(): void {
  document.body.style.background = `linear-gradient(135deg, ${state.backgroundColor} 0%, #172A45 100%)`;
}

function updateFPS(currentTime: number): void {
  frameCount++;
  if (currentTime - lastFpsUpdate >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsUpdate = currentTime;
    if (fpsCounter) {
      fpsCounter.textContent = `FPS: ${fps}`;
    }
  }
}

function animate(currentTime: number): void {
  requestAnimationFrame(animate);

  const deltaTime = currentTime - lastTime;
  if (deltaTime < 16) return;
  lastTime = currentTime;

  updateFPS(currentTime);

  flowField.update();
  particleSystem.update();

  ctx.fillStyle = state.backgroundColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  flowField.drawDebug(ctx);
  particleSystem.draw(ctx);
}

window.addEventListener('DOMContentLoaded', init);
