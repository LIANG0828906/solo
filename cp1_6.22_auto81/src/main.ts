import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const MAX_REWIND_TIME = 5000;
export const REWIND_FRAME_INTERVAL = 16;
export const MAX_REWIND_CHARGES = 3;
export const MAX_PARTICLES = 200;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a2e',
  pixelArt: false,
  antialias: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
      fixedStep: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  scene: [MenuScene, GameScene],
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false
  },
  fps: {
    target: 60,
    forceSetTimeOut: false
  }
};

new Phaser.Game(config);
