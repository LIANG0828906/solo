import { ParticleSystem } from './ParticleSystem';
import { LightManager } from './LightManager';

const canvas = document.getElementById('sandCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const particleSystem = new ParticleSystem();
const lightManager = new LightManager();

const PRESET_COLORS: { hex: string; rgb: [number, number, number] }[] = [
  { hex: '#D4A373', rgb: [212, 163, 115] },
  { hex: '#6A4C93', rgb: [106, 76, 147] },
  { hex: '#2A9D8F', rgb: [42, 157, 143] },
  { hex: '#E76F51', rgb: [231, 111, 81] },
  { hex: '#F4A261', rgb: [244, 162, 97] },
  { hex: '#264653', rgb: [38, 70, 83] },
  { hex: '#8ECAE6', rgb: [142, 202, 230] },
  { hex: '#FFB703', rgb: [255, 183, 3] },
];

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let lastMoveTime = 0;
let lastInteractionTime = Date.now();
let lowPowerMode = false;
let frameCount = 0;
let lastFpsTime = Date.now();
let currentFps = 60;

function initColorPicker(): void {
  const picker = document.getElementById('colorPicker')!;
  PRESET_COLORS.forEach((color, index) => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (index === 0 ? ' active' : '');
    swatch.style.backgroundColor = color.hex;
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      particleSystem.setColor(color.rgb[0], color.rgb[1], color.rgb[2]);
    });
    picker.appendChild(swatch);
  });
}

function initControls(): void {
  const angleSlider = document.getElementById('lightAngle') as HTMLInputElement;
  const intensitySlider = document.getElementById('lightIntensity') as HTMLInputElement;
  const speedSlider = document.getElementById('flowSpeed') as HTMLInputElement;
  const angleValue = document.getElementById('angleValue')!;
  const intensityValue = document.getElementById('intensityValue')!;
  const speedValue = document.getElementById('speedValue')!;

  angleSlider.addEventListener('input', () => {
    const val = parseInt(angleSlider.value);
    lightManager.setAngle(val);
    angleValue.textContent = val + '°';
    lastInteractionTime = Date.now();
  });

  intensitySlider.addEventListener('input', () => {
    const val = parseInt(intensitySlider.value);
    lightManager.setIntensity(val);
    intensityValue.textContent = val.toString();
    lastInteractionTime = Date.now();
  });

  speedSlider.addEventListener('input', () => {
    const val = parseInt(speedSlider.value);
    particleSystem.flowSpeed = val;
    particleSystem.updateAllLifetimes();
    const labels = ['慢', '中', '快'];
    speedValue.textContent = labels[val - 1];
    lastInteractionTime = Date.now();
  });
}

function initClearButton(): void {
  const btn = document.getElementById('clearBtn')!;
  btn.addEventListener('click', (e) => {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    particleSystem.clearAll();
    lastInteractionTime = Date.now();
  });
}

function initExportButton(): void {
  const btn = document.getElementById('exportBtn')!;
  btn.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1920;
    exportCanvas.height = 1080;
    const ectx = exportCanvas.getContext('2d')!;
    ectx.fillStyle = '#ffffff';
    ectx.fillRect(0, 0, 1920, 1080);

    const canvasAspect = 800 / 600;
    const exportAspect = 1920 / 1080;
    let drawW: number, drawH: number, drawX: number, drawY: number;

    if (canvasAspect > exportAspect) {
      drawW = 1920;
      drawH = 1920 / canvasAspect;
      drawX = 0;
      drawY = (1080 - drawH) / 2;
    } else {
      drawH = 1080;
      drawW = 1080 * canvasAspect;
      drawX = (1920 - drawW) / 2;
      drawY = 0;
    }

    ectx.drawImage(canvas, drawX, drawY, drawW, drawH);

    const link = document.createElement('a');
    link.download = 'sand-art-' + Date.now() + '.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  });
}

function getCanvasPos(e: MouseEvent): [number, number] {
  const rect = canvas.getBoundingClientRect();
  const scaleX = 800 / rect.width;
  const scaleY = 600 / rect.height;
  return [
    (e.clientX - rect.left) * scaleX,
    (e.clientY - rect.top) * scaleY,
  ];
}

function initCanvasEvents(): void {
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    const [x, y] = getCanvasPos(e);
    lastMouseX = x;
    lastMouseY = y;
    lastMoveTime = Date.now();
    lastInteractionTime = Date.now();
    particleSystem.createParticle(x, y, 10);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const [x, y] = getCanvasPos(e);
    const now = Date.now();
    const dt = now - lastMoveTime;
    const dx = x - lastMouseX;
    const dy = y - lastMouseY;
    const speed = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / (dt / 16.67) : 0;

    particleSystem.createParticle(x, y, speed);

    lastMouseX = x;
    lastMouseY = y;
    lastMoveTime = now;
    lastInteractionTime = Date.now();
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const [x, y] = getCanvasPos(touch as unknown as MouseEvent);
    isDragging = true;
    lastMouseX = x;
    lastMouseY = y;
    lastMoveTime = Date.now();
    lastInteractionTime = Date.now();
    particleSystem.createParticle(x, y, 10);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDragging) return;
    const touch = e.touches[0];
    const [x, y] = getCanvasPos(touch as unknown as MouseEvent);
    const now = Date.now();
    const dt = now - lastMoveTime;
    const dx = x - lastMouseX;
    const dy = y - lastMouseY;
    const speed = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / (dt / 16.67) : 0;
    particleSystem.createParticle(x, y, speed);
    lastMouseX = x;
    lastMouseY = y;
    lastMoveTime = now;
    lastInteractionTime = Date.now();
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });
}

function drawBackground(): void {
  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, '#EDC9AF');
  gradient.addColorStop(1, '#C9A27C');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);
}

function drawParticles(): void {
  for (const p of particleSystem.particles) {
    const [lr, lg, lb] = lightManager.applyLighting(p.r, p.g, p.b, p.x, p.y, 800, 600);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${lr},${lg},${lb},${p.opacity})`;
    ctx.fill();
  }
}

let lastFrameTime = 0;
let skipFrame = false;

function animate(timestamp: number): void {
  const now = Date.now();
  const timeSinceInteraction = now - lastInteractionTime;

  if (timeSinceInteraction > 5000 && !lowPowerMode) {
    lowPowerMode = true;
    particleSystem.lowPowerMode = true;
  } else if (timeSinceInteraction <= 5000 && lowPowerMode) {
    lowPowerMode = false;
    particleSystem.lowPowerMode = false;
  }

  if (lowPowerMode) {
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < 33.33) {
      requestAnimationFrame(animate);
      return;
    }
  }

  const dt = Math.min((timestamp - lastFrameTime) / 16.67, 3);
  lastFrameTime = timestamp;

  drawBackground();
  particleSystem.update(dt);
  drawParticles();

  lightManager.drawLightIndicator(ctx, 770, 570, 22);

  frameCount++;
  if (now - lastFpsTime >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    lastFpsTime = now;
    const fpsDisplay = document.getElementById('fpsDisplay')!;
    fpsDisplay.textContent = currentFps + ' FPS | ' + particleSystem.getParticleCount() + ' particles';
  }

  requestAnimationFrame(animate);
}

function init(): void {
  initColorPicker();
  initControls();
  initClearButton();
  initExportButton();
  initCanvasEvents();
  requestAnimationFrame(animate);
}

init();
