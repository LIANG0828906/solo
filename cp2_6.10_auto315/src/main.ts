import Phaser from 'phaser';
import RaceScene from './scenes/RaceScene';
import GameOverScene from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#0a0a0f',
  fps: {
    target: 60,
    forceSetTimeOut: false
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [RaceScene, GameOverScene]
};

new Phaser.Game(config);
