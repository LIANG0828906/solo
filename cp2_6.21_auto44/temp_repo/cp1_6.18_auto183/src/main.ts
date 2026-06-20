import { GameEngine } from './core/GameEngine';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error('找不到游戏画布元素');
}

const game = new GameEngine(canvas);
game.start();
