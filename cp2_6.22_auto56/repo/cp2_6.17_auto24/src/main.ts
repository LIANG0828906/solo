import { Game } from './game';
import { Renderer } from './render';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('无法获取Canvas 2D上下文');
}

const game = new Game(CANVAS_WIDTH, CANVAS_HEIGHT);
const renderer = new Renderer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

let gameOverAnimTimer = 0;
let gameOverAnimDuration = 24;
let hoverRestart = false;
let restartBounds: { restartX: number; restartY: number; restartW: number; restartH: number } | null = null;

const getCanvasMousePosition = (e: MouseEvent): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
};

canvas.addEventListener('mousemove', (e) => {
  const pos = getCanvasMousePosition(e);
  game.setMousePosition(pos.x, pos.y);

  if (game.status === 'gameover' && restartBounds) {
    const { restartX, restartY, restartW, restartH } = restartBounds;
    const isInside = pos.x >= restartX && pos.x <= restartX + restartW &&
                     pos.y >= restartY && pos.y <= restartY + restartH;
    if (isInside !== hoverRestart) {
      hoverRestart = isInside;
      canvas.style.cursor = hoverRestart ? 'pointer' : 'none';
    }
  }
});

canvas.addEventListener('click', (e) => {
  if (game.status !== 'gameover') return;
  if (!restartBounds) return;

  const pos = getCanvasMousePosition(e);
  const { restartX, restartY, restartW, restartH } = restartBounds;
  const isInside = pos.x >= restartX && pos.x <= restartX + restartW &&
                   pos.y >= restartY && pos.y <= restartY + restartH;
  if (isInside) {
    game.reset();
    gameOverAnimTimer = 0;
    hoverRestart = false;
    canvas.style.cursor = 'none';
  }
});

const gameLoop = (): void => {
  game.update();

  let showOffset = 0;
  let showAlpha = 0;

  if (game.status === 'gameover') {
    if (gameOverAnimTimer < gameOverAnimDuration) {
      gameOverAnimTimer += 1;
    }
    const t = gameOverAnimTimer / gameOverAnimDuration;
    showOffset = (1 - t) * 20;
    showAlpha = t;
  }

  restartBounds = renderer.render(game, showOffset, showAlpha, hoverRestart);

  requestAnimationFrame(gameLoop);
};

requestAnimationFrame(gameLoop);
