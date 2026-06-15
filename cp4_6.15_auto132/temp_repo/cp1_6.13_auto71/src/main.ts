import Phaser from 'phaser';
import { GameScene } from './gameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#0a0a1a',
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: {
    target: 60,
    min: 30,
    forceSetTimeOut: false,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    powerPreference: 'high-performance',
  },
};

let game: Phaser.Game | null = null;

function createGame(): void {
  const parent = document.getElementById('game');
  if (!parent) {
    console.error('Game container #game not found');
    return;
  }

  game = new Phaser.Game({
    ...config,
    parent,
  });

  window.addEventListener('resize', () => {
    if (game) {
      game.scale.refresh();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createGame);
} else {
  createGame();
}

export { game, config };
