import { FluidSimulator } from './fluidSim';
import { ColorPalette, type ColorSwatch } from './colorPalette';

interface ReleaseRecord {
  name: string;
  timestamp: string;
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const colorGrid = document.getElementById('color-grid') as HTMLElement;
const colorPicker = document.getElementById('color-picker') as HTMLInputElement;
const recordLayer = document.getElementById('record-layer') as HTMLElement;
const particleCountSlider = document.getElementById('particle-count') as HTMLInputElement;
const particleCountVal = document.getElementById('particle-count-val') as HTMLElement;
const viscositySlider = document.getElementById('viscosity') as HTMLInputElement;
const viscosityVal = document.getElementById('viscosity-val') as HTMLElement;
const vortexSlider = document.getElementById('vortex') as HTMLInputElement;
const vortexVal = document.getElementById('vortex-val') as HTMLElement;
const diffusionSlider = document.getElementById('diffusion') as HTMLInputElement;
const diffusionVal = document.getElementById('diffusion-val') as HTMLElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;

const palette = new ColorPalette();
palette.bind(colorGrid);

let sim = new FluidSimulator(canvas.width, canvas.height);

let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

let baseParticleCount = parseInt(particleCountSlider.value, 10);
let currentParticleCount = baseParticleCount;
let viscosity = parseFloat(viscositySlider.value);
let vortexStrength = parseFloat(vortexSlider.value);
let diffusionRate = parseFloat(diffusionSlider.value);

const records: ReleaseRecord[] = [];
let lastRecordUpdate = 0;
let lastReleaseColor: ColorSwatch | null = null;
let hasReleasedThisStroke = false;

let frameCount = 0;
let lastFpsTime = performance.now();
let lowFpsStreak = 0;

function getCanvasPos(e: MouseEvent | Touch): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function updateParticleCountVal(): void {
  particleCountVal.textContent = particleCountSlider.value;
}

function updateViscosityVal(): void {
  viscosityVal.textContent = parseFloat(viscositySlider.value).toFixed(1);
}

function updateVortexVal(): void {
  vortexVal.textContent = parseFloat(vortexSlider.value).toFixed(1);
}

function updateDiffusionVal(): void {
  diffusionVal.textContent = parseFloat(diffusionSlider.value).toFixed(1);
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function addRecord(color: ColorSwatch): void {
  const now = new Date();
  records.push({
    name: color.name,
    timestamp: formatTime(now),
  });
  if (records.length > 5) records.shift();
}

function renderRecords(): void {
  recordLayer.innerHTML = records.map(r => `${r.name} ${r.timestamp}`).join('<br/>');
}

function clearCanvas(): void {
  sim.clear();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function saveSnapshot(): void {
  const outCanvas = document.createElement('canvas');
  outCanvas.width = 1920;
  outCanvas.height = 1080;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.fillStyle = '#000';
  outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
  const scaleX = outCanvas.width / canvas.width;
  const scaleY = outCanvas.height / canvas.height;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (outCanvas.width - canvas.width * scale) / 2;
  const offsetY = (outCanvas.height - canvas.height * scale) / 2;
  outCtx.drawImage(canvas, offsetX, offsetY, canvas.width * scale, canvas.height * scale);
  const link = document.createElement('a');
  link.download = `fluid-snapshot-${Date.now()}.png`;
  link.href = outCanvas.toDataURL('image/png');
  link.click();
}

function onMouseDown(e: MouseEvent): void {
  isMouseDown = true;
  hasReleasedThisStroke = false;
  const pos = getCanvasPos(e);
  lastMouseX = pos.x;
  lastMouseY = pos.y;
  lastReleaseColor = palette.getSelectedColor();
}

function onMouseMove(e: MouseEvent): void {
  const pos = getCanvasPos(e);
  if (isMouseDown) {
    const color = palette.getSelectedColor();
    sim.addParticles(pos.x, pos.y, currentParticleCount, color);
    const dx = pos.x - lastMouseX;
    const dy = pos.y - lastMouseY;
    const speed = Math.hypot(dx, dy);
    if (speed > 0.1) {
      sim.addVelocity(pos.x, pos.y, dx, dy, 40, vortexStrength);
    }
    lastReleaseColor = color;
    hasReleasedThisStroke = true;
  }
  lastMouseX = pos.x;
  lastMouseY = pos.y;
}

function onMouseUp(): void {
  if (isMouseDown && hasReleasedThisStroke && lastReleaseColor) {
    addRecord(lastReleaseColor);
    renderRecords();
  }
  isMouseDown = false;
  hasReleasedThisStroke = false;
}

function onTouchStart(e: TouchEvent): void {
  if (e.touches.length > 0) {
    e.preventDefault();
    isMouseDown = true;
    hasReleasedThisStroke = false;
    const pos = getCanvasPos(e.touches[0]);
    lastMouseX = pos.x;
    lastMouseY = pos.y;
    lastReleaseColor = palette.getSelectedColor();
  }
}

function onTouchMove(e: TouchEvent): void {
  if (e.touches.length > 0) {
    e.preventDefault();
    const pos = getCanvasPos(e.touches[0]);
    if (isMouseDown) {
      const color = palette.getSelectedColor();
      sim.addParticles(pos.x, pos.y, currentParticleCount, color);
      const dx = pos.x - lastMouseX;
      const dy = pos.y - lastMouseY;
      const speed = Math.hypot(dx, dy);
      if (speed > 0.1) {
        sim.addVelocity(pos.x, pos.y, dx, dy, 40, vortexStrength);
      }
      lastReleaseColor = color;
      hasReleasedThisStroke = true;
    }
    lastMouseX = pos.x;
    lastMouseY = pos.y;
  }
}

function onTouchEnd(e: TouchEvent): void {
  e.preventDefault();
  if (isMouseDown && hasReleasedThisStroke && lastReleaseColor) {
    addRecord(lastReleaseColor);
    renderRecords();
  }
  isMouseDown = false;
  hasReleasedThisStroke = false;
}

function resizeCanvas(): void {
  const panelWidth = 260;
  const paletteArea = 260;
  const maxW = window.innerWidth - panelWidth - paletteArea - 40;
  const maxH = window.innerHeight - 40;
  const aspect = 800 / 600;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  w = Math.max(400, Math.floor(w));
  h = Math.max(300, Math.floor(h));
  canvas.width = w;
  canvas.height = h;
  sim.resize(w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, w, h);
}

particleCountSlider.addEventListener('input', () => {
  baseParticleCount = parseInt(particleCountSlider.value, 10);
  currentParticleCount = baseParticleCount;
  lowFpsStreak = 0;
  updateParticleCountVal();
});
viscositySlider.addEventListener('input', () => {
  viscosity = parseFloat(viscositySlider.value);
  updateViscosityVal();
});
vortexSlider.addEventListener('input', () => {
  vortexStrength = parseFloat(vortexSlider.value);
  updateVortexVal();
});
diffusionSlider.addEventListener('input', () => {
  diffusionRate = parseFloat(diffusionSlider.value);
  updateDiffusionVal();
});

colorPicker.addEventListener('change', () => {
  palette.addCustomColor(colorPicker.value);
});

btnClear.addEventListener('click', () => {
  if (window.confirm('确定要清除画布上的所有颜料吗？')) {
    clearCanvas();
    records.length = 0;
    renderRecords();
  }
});

btnSave.addEventListener('click', saveSnapshot);

canvas.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);

canvas.addEventListener('touchstart', onTouchStart, { passive: false });
canvas.addEventListener('touchmove', onTouchMove, { passive: false });
canvas.addEventListener('touchend', onTouchEnd, { passive: false });

window.addEventListener('resize', resizeCanvas);

updateParticleCountVal();
updateViscosityVal();
updateVortexVal();
updateDiffusionVal();
resizeCanvas();
clearCanvas();

let lastTime = performance.now();

function animate(): void {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  frameCount++;
  if (frameCount % 30 === 0) {
    const fps = (30 * 1000) / (now - lastFpsTime);
    console.warn(`FPS: ${fps.toFixed(1)}`);
    if (fps < 25) {
      lowFpsStreak++;
      if (lowFpsStreak >= 2) {
        currentParticleCount = Math.max(5, Math.floor(baseParticleCount * 0.7));
      }
    } else {
      lowFpsStreak = 0;
      currentParticleCount = baseParticleCount;
    }
    lastFpsTime = now;
  }

  if (now - lastRecordUpdate > 200) {
    renderRecords();
    lastRecordUpdate = now;
  }

  sim.step(viscosity, diffusionRate, dt);
  sim.render(ctx);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
