import { GameLoop } from './gameLoop';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const game = new GameLoop(canvas);
game.start();
