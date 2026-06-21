import { generatePattern, PatternParams } from './generator';
import { Controls } from './controls';
import { exportSVG } from './export';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const defaultParams: PatternParams = {
  depth: 4,
  angle: 0,
  scale: 0.8,
  theme: 'ocean'
};

let currentParams: PatternParams = { ...defaultParams };
let renderFrameId: number | null = null;
let lastRenderTime: number = 0;

const svgCanvas = document.getElementById('svg-canvas') as unknown as SVGSVGElement;
const fpsText = document.getElementById('fps-text') as HTMLElement;
const fpsWarning = document.getElementById('fps-warning') as HTMLElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnRandom = document.getElementById('btn-random') as HTMLButtonElement;
const controlPanel = document.getElementById('control-panel') as HTMLElement;

let frameCount = 0;
let fpsLastTime = performance.now();
let currentFps = 60;

const controls = new Controls(controlPanel, defaultParams, (params) => {
  currentParams = { ...params };
  scheduleRender();
});

function scheduleRender(): void {
  const now = performance.now();
  const elapsed = now - lastRenderTime;

  if (renderFrameId !== null) {
    cancelAnimationFrame(renderFrameId);
  }

  if (elapsed < 16) {
    renderFrameId = requestAnimationFrame(() => {
      render();
    });
  } else {
    render();
  }
}

function render(): void {
  const shapes = generatePattern(currentParams, CANVAS_WIDTH, CANVAS_HEIGHT);

  while (svgCanvas.firstChild) {
    svgCanvas.removeChild(svgCanvas.firstChild);
  }

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svgCanvas.appendChild(defs);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = shapes;
  svgCanvas.appendChild(g);

  lastRenderTime = performance.now();
  renderFrameId = null;

  frameCount++;
  const now = performance.now();
  if (now - fpsLastTime >= 1000) {
    currentFps = Math.round(frameCount * 1000 / (now - fpsLastTime));
    frameCount = 0;
    fpsLastTime = now;
    updateFpsDisplay();
  }
}

function updateFpsDisplay(): void {
  fpsText.textContent = `FPS: ${currentFps}`;
  if (currentFps < 30) {
    fpsWarning.classList.add('show');
  } else {
    fpsWarning.classList.remove('show');
  }
}

function fpsMonitorLoop(): void {
  frameCount++;
  const now = performance.now();
  if (now - fpsLastTime >= 500) {
    currentFps = Math.round(frameCount * 1000 / (now - fpsLastTime));
    frameCount = 0;
    fpsLastTime = now;
    updateFpsDisplay();
  }
  requestAnimationFrame(fpsMonitorLoop);
}

function randomParams(): PatternParams {
  const themes = ['ocean', 'sunset', 'aurora', 'vintage'];
  return {
    depth: Math.floor(Math.random() * 5) + 2,
    angle: Math.floor(Math.random() * 360),
    scale: 0.5 + Math.random(),
    theme: themes[Math.floor(Math.random() * themes.length)]
  };
}

btnSave.addEventListener('click', () => {
  exportSVG(svgCanvas);
});

btnRandom.addEventListener('click', () => {
  const newParams = randomParams();
  currentParams = { ...newParams };
  controls.updateParams(newParams);
  scheduleRender();
});

svgCanvas.setAttribute('width', String(CANVAS_WIDTH));
svgCanvas.setAttribute('height', String(CANVAS_HEIGHT));

render();
requestAnimationFrame(fpsMonitorLoop);
