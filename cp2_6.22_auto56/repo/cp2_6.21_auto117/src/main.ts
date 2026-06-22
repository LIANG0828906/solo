import { Engine, Plant } from './engine';
import { Renderer } from './renderer';

const simCanvas = document.getElementById('simCanvas') as HTMLCanvasElement;
const chartCanvas = document.getElementById('chartCanvas') as HTMLCanvasElement;

const lightSlider = document.getElementById('lightDensity') as HTMLInputElement;
const waterSlider = document.getElementById('waterDensity') as HTMLInputElement;
const regenSlider = document.getElementById('regenRate') as HTMLInputElement;

const lightVal = document.getElementById('lightVal')!;
const waterVal = document.getElementById('waterVal')!;
const regenVal = document.getElementById('regenVal')!;

const statCount = document.getElementById('statCount')!;
const statFrame = document.getElementById('statFrame')!;
const statGrowth = document.getElementById('statGrowth')!;
const statRadius = document.getElementById('statRadius')!;

const btnToggle = document.getElementById('btnToggle') as HTMLButtonElement;
const btnReset = document.getElementById('btnReset') as HTMLButtonElement;

const tooltip = document.getElementById('tooltip')!;
const selectedEmpty = document.getElementById('selectedEmpty')!;
const selectedContent = document.getElementById('selectedContent')!;
const selResources = document.getElementById('selResources')!;
const selGrowth = document.getElementById('selGrowth')!;
const selRadius = document.getElementById('selRadius')!;
const selPref = document.getElementById('selPref')!;
const selRepInt = document.getElementById('selRepInt')!;
const selFrames = document.getElementById('selFrames')!;

const engine = new Engine();
const renderer = new Renderer(simCanvas, chartCanvas);

let running = false;
let animFrameId: number | null = null;
let hoveredPlant: Plant | null = null;

function syncConfig(): void {
  engine.config.lightDensity = Number(lightSlider.value);
  engine.config.waterDensity = Number(waterSlider.value);
  engine.config.regenRate = Number(regenSlider.value) / 100;

  lightVal.textContent = lightSlider.value;
  waterVal.textContent = waterSlider.value;
  regenVal.textContent = (Number(regenSlider.value) / 100).toFixed(2);
}

lightSlider.addEventListener('input', syncConfig);
waterSlider.addEventListener('input', syncConfig);
regenSlider.addEventListener('input', syncConfig);

syncConfig();

btnToggle.addEventListener('click', () => {
  running = !running;
  btnToggle.textContent = running ? '暂停' : '开始';
  if (running) {
    loop();
  } else {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }
});

btnReset.addEventListener('click', () => {
  running = false;
  btnToggle.textContent = '开始';
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  engine.reset();
  renderer.clearChart();
  hoveredPlant = null;
  updateSelectedPanel(null);
  hideTooltip();
  renderFrame();
});

function getCanvasCoords(e: MouseEvent): { x: number; y: number } {
  const rect = simCanvas.getBoundingClientRect();
  const scaleX = simCanvas.width / rect.width;
  const scaleY = simCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function findPlantAt(x: number, y: number): Plant | null {
  for (let i = engine.plants.length - 1; i >= 0; i--) {
    const p = engine.plants[i];
    if (!p.alive) continue;
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy <= p.radius * p.radius) {
      return p;
    }
  }
  return null;
}

function updateTooltip(plant: Plant, clientX: number, clientY: number): void {
  const wrapper = simCanvas.parentElement!;
  const wrapperRect = wrapper.getBoundingClientRect();
  const px = clientX - wrapperRect.left + 14;
  const py = clientY - wrapperRect.top + 14;

  tooltip.innerHTML =
    `<div class="tooltip-title">🌱 植物详情</div>` +
    `<div class="tooltip-row"><span class="tooltip-label">当前资源</span><span class="tooltip-value">${plant.resources.toFixed(1)}</span></div>` +
    `<div class="tooltip-row"><span class="tooltip-label">生长速度</span><span class="tooltip-value">${plant.growthSpeed.toFixed(2)}</span></div>` +
    `<div class="tooltip-row"><span class="tooltip-label">采集半径</span><span class="tooltip-value">${plant.collectionRadius.toFixed(1)}</span></div>` +
    `<div class="tooltip-row"><span class="tooltip-label">光照偏好</span><span class="tooltip-value">${(plant.lightPreference * 100).toFixed(0)}%</span></div>` +
    `<div class="tooltip-row"><span class="tooltip-label">水分偏好</span><span class="tooltip-value">${((1 - plant.lightPreference) * 100).toFixed(0)}%</span></div>` +
    `<div class="tooltip-row"><span class="tooltip-label">繁殖间隔</span><span class="tooltip-value">${Math.round(plant.reproductionInterval)}</span></div>` +
    `<div class="tooltip-row"><span class="tooltip-label">存活帧数</span><span class="tooltip-value">${engine.frameCount - plant.birthFrame}</span></div>`;

  tooltip.style.left = px + 'px';
  tooltip.style.top = py + 'px';
  tooltip.style.display = 'block';
}

function hideTooltip(): void {
  tooltip.style.display = 'none';
}

function updateSelectedPanel(plant: Plant | null): void {
  if (!plant || !plant.alive) {
    selectedEmpty.style.display = 'block';
    selectedContent.style.display = 'none';
    return;
  }
  selectedEmpty.style.display = 'none';
  selectedContent.style.display = 'flex';
  selResources.textContent = plant.resources.toFixed(1);
  selGrowth.textContent = plant.growthSpeed.toFixed(2);
  selRadius.textContent = plant.collectionRadius.toFixed(1);
  selPref.textContent = `${(plant.lightPreference * 100).toFixed(0)}% / ${((1 - plant.lightPreference) * 100).toFixed(0)}%`;
  selRepInt.textContent = String(Math.round(plant.reproductionInterval));
  selFrames.textContent = String(engine.frameCount - plant.birthFrame);
}

simCanvas.addEventListener('mousemove', (e) => {
  const { x, y } = getCanvasCoords(e);
  const plant = findPlantAt(x, y);
  hoveredPlant = plant;
  if (plant) {
    updateTooltip(plant, e.clientX, e.clientY);
    updateSelectedPanel(plant);
  } else {
    hideTooltip();
    updateSelectedPanel(null);
  }
  if (!running) renderFrame();
});

simCanvas.addEventListener('mouseleave', () => {
  hoveredPlant = null;
  hideTooltip();
  updateSelectedPanel(null);
  if (!running) renderFrame();
});

function renderFrame(): void {
  renderer.render(engine.plants, engine.lightPoints, engine.waterPoints, hoveredPlant);

  const count = engine.getPlantCount();
  const growth = engine.getAvgGrowthSpeed();
  const radius = engine.getAvgCollectionRadius();

  statCount.textContent = String(count);
  statFrame.textContent = String(engine.frameCount);
  statGrowth.textContent = growth.toFixed(2);
  statRadius.textContent = radius.toFixed(1);

  if (hoveredPlant && hoveredPlant.alive) {
    updateSelectedPanel(hoveredPlant);
  }
}

function loop(): void {
  if (!running) return;

  engine.update();

  if (engine.frameCount % 3 === 0) {
    renderer.pushChartData(
      engine.getPlantCount(),
      engine.getAvgGrowthSpeed(),
      engine.getAvgCollectionRadius()
    );
  }

  renderFrame();

  animFrameId = requestAnimationFrame(loop);
}

renderFrame();
