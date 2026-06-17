import { GameEngine } from './engine/gameEngine';

function initGame() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const engine = new GameEngine(canvas);
  engine.init();
  engine.start();

  console.log('%c像素拓荒记', 'color: #4ecdc4; font-size: 24px; font-weight: bold;');
  console.log('%c操作说明:', 'color: #f4d35e; font-size: 14px; font-weight: bold;');
  console.log('  WASD / 方向键 - 移动');
  console.log('  E (长按) - 采集资源');
  console.log('  B - 打开/关闭建造菜单');
  console.log('  I - 打开/关闭背包');
  console.log('  Ctrl + S - 保存游戏');
  console.log('  Ctrl + L - 加载游戏');
  console.log('  ESC - 关闭当前菜单');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
