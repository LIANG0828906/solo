import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { BattleScene } from './scenes/BattleScene';
import { GameOverScene } from './scenes/GameOverScene';

const getGameConfig = (): Phaser.Types.Core.GameConfig => {
  const width = Math.min(window.innerWidth, 900);
  const height = Math.min(window.innerHeight, 700);

  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: width,
    height: height,
    backgroundColor: '#0d1117',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      min: {
        width: 320,
        height: 480
      },
      max: {
        width: 1200,
        height: 900
      }
    },
    scene: [TitleScene, BattleScene, GameOverScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    input: {
      activePointers: 2,
      touch: {
        capture: true
      }
    },
    fps: {
      target: 60,
      forceSetTimeOut: false
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true
    }
  };
};

const game = new Phaser.Game(getGameConfig());

window.addEventListener('resize', () => {
  if (game.scale) {
    game.scale.resize(window.innerWidth, window.innerHeight);
  }
});

export default game;
