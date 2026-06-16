import { GameEngine } from './modules/core/GameEngine';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new GameEngine(canvas);
game.start();
