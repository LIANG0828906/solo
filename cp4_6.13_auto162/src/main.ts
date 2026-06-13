import { Ecosystem } from './ecosystem.js';
import { Renderer } from './renderer.js';
import { UiController } from './uiController.js';
import { TARGET_FPS } from './config.js';

const TARGET_FRAME_MS = 1000 / TARGET_FPS;

function bootstrap(): void {
  const canvas = document.getElementById('simulation-canvas') as HTMLCanvasElement;
  const chartCanvas = document.getElementById('chart-canvas') as HTMLCanvasElement;

  if (!canvas || !chartCanvas) {
    console.error('Canvas elements not found');
    return;
  }

  const ecosystem = new Ecosystem();
  const renderer = new Renderer(canvas, chartCanvas);
  const uiController = new UiController(ecosystem);

  ecosystem.initialize();
  uiController.bindEvents();

  let isRunning = false;
  let lastTime = performance.now();
  let accumulator = 0;
  let rafId: number | null = null;
  let lastUiUpdate = 0;

  const handlePlayPause = (): void => {
    isRunning = !isRunning;
    ecosystem.isRunning = isRunning;
    uiController.togglePlayPauseUI(isRunning);

    if (isRunning) {
      lastTime = performance.now();
      accumulator = 0;
      if (rafId === null) {
        rafId = requestAnimationFrame(gameLoop);
      }
    }
  };

  const handleReset = (): void => {
    isRunning = false;
    ecosystem.isRunning = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    ecosystem.initialize();
    uiController.togglePlayPauseUI(false);
    updateAllUi(0);
    renderer.render(ecosystem);
  };

  uiController.onPlayPause = handlePlayPause;
  uiController.onReset = handleReset;

  const updateAllUi = (_timestamp: number): void => {
    const counts = ecosystem.getCounts();
    uiController.updateCounts(counts);
    uiController.updateTimer(ecosystem.simulationTime);
    uiController.updateBarChart();
  };

  const gameLoop = (timestamp: number): void => {
    if (!isRunning) {
      rafId = null;
      renderer.render(ecosystem);
      return;
    }

    const frameDelta = timestamp - lastTime;
    lastTime = timestamp;
    accumulator += frameDelta;

    while (accumulator >= TARGET_FRAME_MS) {
      ecosystem.update(TARGET_FRAME_MS);
      accumulator -= TARGET_FRAME_MS;
    }

    renderer.render(ecosystem);

    if (timestamp - lastUiUpdate >= 100) {
      updateAllUi(timestamp);
      lastUiUpdate = timestamp;
    }

    const extinctionWarning = ecosystem.checkExtinction(ecosystem.simulationTime);
    if (extinctionWarning) {
      uiController.showWarning(extinctionWarning);
    }

    rafId = requestAnimationFrame(gameLoop);
  };

  updateAllUi(0);
  renderer.render(ecosystem);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
