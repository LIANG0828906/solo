import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { GameScene } from './GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#2C3E50',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false
    }
  },
  scene: [BootScene, GameScene]
};

new Phaser.Game(config);

window.addEventListener('resize', () => {
  if (window.game && window.game.scale) {
    window.game.scale.resize(window.innerWidth, window.innerHeight);
  }
});

declare global {
  interface Window {
    game?: Phaser.Game;
  }
}
