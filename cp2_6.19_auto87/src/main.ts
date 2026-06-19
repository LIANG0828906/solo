import { Board } from './game/board';
import { PlayerManager } from './game/player';
import { Renderer } from './render/renderer';
import { Animator } from './render/animator';
import { AudioManager } from './utils/audio';

function initGame(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const playerManager = new PlayerManager();
  const board = new Board(playerManager);
  const animator = new Animator();
  const audio = new AudioManager();
  const renderer = new Renderer(canvas, board, playerManager, animator, audio);

  renderer.start();

  (window as any).gameRenderer = renderer;
  (window as any).gameBoard = board;
  (window as any).gamePlayerManager = playerManager;

  console.log('Card Battle Game initialized');
  console.log('红方手牌数:', playerManager.getPlayer('red').getHand().length);
  console.log('蓝方手牌数:', playerManager.getPlayer('blue').getHand().length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
