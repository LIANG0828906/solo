import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: 'game-container',
  width: '100%',
  height: '100%',
  backgroundColor: '#0a0e27',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 1024,
      height: 768
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  fps: {
    target: 60,
    forceSetTimeOut: false
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: false,
    gamepad: false
  },
  scene: [BootScene, GameScene]
};

new Phaser.Game(config);
