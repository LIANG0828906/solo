import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#0a0414',
  pixelArt: false,
  antialias: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, GameScene],
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  render: {
    transparent: false,
    clearBeforeRender: true,
    pixelArt: false,
    roundPixels: false,
    antialias: true,
    antialiasGL: true
  }
};

new Phaser.Game(config);
