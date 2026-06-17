import { GameLoop } from './game/gameLoop';
import { Renderer } from './ui/renderer';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const renderer = new Renderer(ctx, canvas);
const game = new GameLoop(canvas, renderer);

game.start();
