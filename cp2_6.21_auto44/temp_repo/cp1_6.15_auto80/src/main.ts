import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { BattleScene } from './scenes/BattleScene';
import { HandGestureRecognition, GestureData } from './handGesture';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a0a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MenuScene, BattleScene]
};

const game = new Phaser.Game(config);

const gestureCallback = (data: GestureData) => {
  const battleScene = game.scene.getScene('BattleScene');
  if (battleScene && battleScene.scene.isActive()) {
    (battleScene as BattleScene).handleGesture(data);
  }
};

const handGesture = new HandGestureRecognition();
handGesture.onGesture(gestureCallback);
handGesture.start();

(window as any).handGesture = handGesture;

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

export { game };
