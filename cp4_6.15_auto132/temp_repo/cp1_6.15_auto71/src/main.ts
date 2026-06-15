import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MenuScene, GameScene],
  input: {
    touch: {
      capture: true
    }
  },
  render: {
    antialias: true,
    pixelArt: false
  }
};

declare global {
  interface Window {
    game: Phaser.Game;
  }
}

window.game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  if (window.game && window.game.scale) {
    window.game.scale.resize(window.innerWidth, window.innerHeight);
  }
});
