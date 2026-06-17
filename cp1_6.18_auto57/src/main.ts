import { GameLoop } from './game/GameLoop';

function init(): void {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) return;

  function setCanvasSize(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  setCanvasSize();

  const gameLoop = new GameLoop(canvas);

  const bpmSlider = document.getElementById('bpmSlider') as HTMLInputElement;
  const bpmValue = document.getElementById('bpmValue');
  const resetBtn = document.getElementById('resetBtn');
  const beatCounter = document.getElementById('beatCounter');
  const fpsDisplay = document.getElementById('fpsDisplay');

  if (bpmSlider) {
    bpmSlider.addEventListener('input', () => {
      const bpm = parseInt(bpmSlider.value, 10);
      gameLoop.getBeatManager().setBpm(bpm);
      if (bpmValue) bpmValue.textContent = String(bpm);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      gameLoop.reset();
      if (beatCounter) beatCounter.textContent = '节拍: 0';
    });
  }

  gameLoop.setOnBeatUpdate((count: number) => {
    if (beatCounter) beatCounter.textContent = `节拍: ${count}`;
  });

  gameLoop.setOnFpsUpdate((fps: number) => {
    if (fpsDisplay) fpsDisplay.textContent = `FPS: ${fps}`;
  });

  window.addEventListener('resize', () => {
    setCanvasSize();
    gameLoop.resize(window.innerWidth, window.innerHeight);
  });

  gameLoop.start();
}

document.addEventListener('DOMContentLoaded', init);
