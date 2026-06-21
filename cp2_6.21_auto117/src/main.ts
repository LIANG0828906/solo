import { Engine } from './engine';
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

const engine = new Engine();
const renderer = new Renderer(simCanvas, chartCanvas);

let running = false;
let animFrameId: number | null = null;

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
  renderFrame();
});

function renderFrame(): void {
  renderer.render(engine.plants, engine.lightPoints, engine.waterPoints);

  const count = engine.getPlantCount();
  const growth = engine.getAvgGrowthSpeed();
  const radius = engine.getAvgCollectionRadius();

  statCount.textContent = String(count);
  statFrame.textContent = String(engine.frameCount);
  statGrowth.textContent = growth.toFixed(2);
  statRadius.textContent = radius.toFixed(1);
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
