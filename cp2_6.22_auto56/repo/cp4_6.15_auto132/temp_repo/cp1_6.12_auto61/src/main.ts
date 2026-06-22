import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#05051a',
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
    },
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
    },
    scene: [GameScene],
    fps: {
        target: 60,
        forceSetTimeOut: false,
    },
};

new Phaser.Game(config);
