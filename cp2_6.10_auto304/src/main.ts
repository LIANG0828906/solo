import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#0b0f2a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: 'matter',
    matter: {
      enableSleeping: false,
      gravity: { x: 0, y: 0.5 },
      debug: false,
      positionIterations: 6,
      velocityIterations: 4
    }
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  scene: [GameScene],
  render: {
    antialias: true,
    pixelArt: false,
    clearBeforeRender: true
  }
};

const game = new Phaser.Game(config);

game.events.once('ready', () => {
  console.log('星轨弹珠游戏已加载完成！');
  console.log('操作说明：在屏幕上拖动鼠标瞄准，松开发射弹珠');
});

window.addEventListener('resize', () => {
  if (game.scale) {
    game.scale.resize(window.innerWidth, window.innerHeight);
  }
});
