import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { UI } from './UI';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  scene: [GameScene],
  pixelArt: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  fps: {
    target: 60,
    forceSetTimeOut: false
  },
  render: {
    antialias: true,
    powerPreference: 'high-performance'
  }
};

const game = new Phaser.Game(config);

export { game, UI };
