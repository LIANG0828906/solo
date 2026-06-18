import { GameManager } from './GameManager';

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;

function init() {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element not found');

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  const resize = () => {
    const windowWidth = window.innerWidth;
    if (windowWidth < 700) {
      const scale = 0.8;
      canvas.style.width = `${GAME_WIDTH * scale}px`;
      canvas.style.height = `${GAME_HEIGHT * scale}px`;
    } else {
      canvas.style.width = `${GAME_WIDTH}px`;
      canvas.style.height = `${GAME_HEIGHT}px`;
    }
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.imageRendering = 'pixelated';
  };

  window.addEventListener('resize', resize);
  resize();

  const game = new GameManager(canvas);
  game.start();
}

init();
