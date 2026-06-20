import { CanvasEngine } from './canvasEngine';
import { EffectManager, EffectName } from './effectManager';

const GRID_SIZE = 30;
const PIXEL_SIZE = 24;

const PALETTE_COLORS: string[] = [];
for (let i = 0; i < 32; i++) {
  const hue = (i / 32) * 360;
  PALETTE_COLORS.push(`hsl(${hue}, 80%, 55%)`);
}

interface EffectConfig {
  name: EffectName;
  label: string;
}

const EFFECT_CONFIGS: EffectConfig[] = [
  { name: 'water', label: '水波流动' },
  { name: 'star', label: '闪烁星点' },
  { name: 'fire', label: '渐变火焰' },
  { name: 'snow', label: '飘落雪花' }
];

let currentColor = PALETTE_COLORS[0];
let isDrawing = false;
let drawMode: 'fill' | 'clear' = 'fill';

const canvas = document.getElementById('pixel-canvas') as HTMLCanvasElement;
const paletteEl = document.getElementById('palette') as HTMLDivElement;
const effectsPanel = document.getElementById('effects-panel') as HTMLDivElement;
const fpsMonitor = document.getElementById('fps-monitor') as HTMLDivElement;
const customColorInput = document.getElementById('custom-color') as HTMLInputElement;

const canvasEngine = new CanvasEngine(canvas, GRID_SIZE, PIXEL_SIZE);
const effectManager = new EffectManager();

effectManager.setSize(canvas.width, canvas.height);

canvasEngine.drawGrid();

effectManager.setGetBaseImageDataCallback(() => {
  canvasEngine.drawGrid();
  return canvasEngine.getPixelData();
});

effectManager.setOnRenderCallback((imageData) => {
  canvasEngine.putImageData(imageData);
});

effectManager.start();

function buildPalette(): void {
  PALETTE_COLORS.forEach((color, index) => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    if (index === 0) {
      swatch.classList.add('selected');
    }
    swatch.addEventListener('click', () => selectColor(color, swatch));
    paletteEl.appendChild(swatch);
  });
}

function selectColor(color: string, swatchEl: HTMLDivElement): void {
  currentColor = color;
  document.querySelectorAll('.color-swatch').forEach((el) => {
    el.classList.remove('selected');
  });
  swatchEl.classList.add('selected');
  effectManager.markActivity();
}

customColorInput.addEventListener('input', (e) => {
  const target = e.target as HTMLInputElement;
  currentColor = target.value;
  document.querySelectorAll('.color-swatch').forEach((el) => {
    el.classList.remove('selected');
  });
  effectManager.markActivity();
});

function handlePixelAction(clientX: number, clientY: number): void {
  const { x, y } = canvasEngine.screenToGrid(clientX, clientY);
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

  if (drawMode === 'fill') {
    canvasEngine.fillPixel(x, y, currentColor);
  } else {
    canvasEngine.clearPixel(x, y);
  }

  if (!effectManager.hasAnyActive()) {
    canvasEngine.drawGrid();
  }
  effectManager.markActivity();
}

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    drawMode = 'fill';
    isDrawing = true;
    handlePixelAction(e.clientX, e.clientY);
  } else if (e.button === 2) {
    drawMode = 'clear';
    isDrawing = true;
    handlePixelAction(e.clientX, e.clientY);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    handlePixelAction(e.clientX, e.clientY);
  }
});

window.addEventListener('mouseup', () => {
  isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
  isDrawing = false;
});

function buildEffectsPanel(): void {
  EFFECT_CONFIGS.forEach((config) => {
    const card = document.createElement('div');
    card.className = 'effect-card';
    card.dataset.effect = config.name;

    const header = document.createElement('div');
    header.className = 'effect-header';

    const nameLabel = document.createElement('div');
    nameLabel.className = 'effect-name';
    nameLabel.textContent = config.label;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.type = 'button';
    toggleBtn.dataset.effect = config.name;
    toggleBtn.addEventListener('click', () => {
      const active = effectManager.toggle(config.name);
      toggleBtn.classList.toggle('active', active);
      card.classList.toggle('active', active);
    });

    header.appendChild(nameLabel);
    header.appendChild(toggleBtn);

    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'slider-wrapper';

    const sliderLabel = document.createElement('div');
    sliderLabel.className = 'slider-label';

    const labelText = document.createElement('span');
    labelText.textContent = '强度';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'slider-value';
    valueSpan.textContent = String(effectManager.getIntensity(config.name));

    sliderLabel.appendChild(labelText);
    sliderLabel.appendChild(valueSpan);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = String(effectManager.getIntensity(config.name));
    slider.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      effectManager.setIntensity(config.name, val);
      valueSpan.textContent = String(val);
    });

    sliderWrapper.appendChild(sliderLabel);
    sliderWrapper.appendChild(slider);

    card.appendChild(header);
    card.appendChild(sliderWrapper);
    effectsPanel.appendChild(card);
  });
}

buildPalette();
buildEffectsPanel();

let frameCount = 0;
let lastFpsTime = performance.now();

function updateFps(): void {
  frameCount++;
  const now = performance.now();
  const elapsed = now - lastFpsTime;
  if (elapsed >= 1000) {
    const fps = Math.round((frameCount * 1000) / elapsed);
    fpsMonitor.textContent = `${fps} FPS`;
    frameCount = 0;
    lastFpsTime = now;
  }
  requestAnimationFrame(updateFps);
}
requestAnimationFrame(updateFps);

function markGlobalActivity(): void {
  effectManager.markActivity();
}

window.addEventListener('mousemove', markGlobalActivity);
window.addEventListener('keydown', markGlobalActivity);
window.addEventListener('mousedown', markGlobalActivity);
