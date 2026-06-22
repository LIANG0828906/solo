import Phaser from 'phaser';
import { EditorScene } from './EditorScene';
import { GamePreviewScene } from './GamePreviewScene';
import { GAME_WIDTH, GAME_HEIGHT, ElementType } from './config';
import { EditorUI } from './EditorUI';

const editorUI = new EditorUI('toolbar', {
  onElementSelect: (type: ElementType | null) => {
    const scene = game.scene.getScene('EditorScene') as EditorScene;
    if (scene) scene.setSelectedElement(type);
  },
  onPlatformLengthChange: (length: number) => {
    const scene = game.scene.getScene('EditorScene') as EditorScene;
    if (scene) scene.setPlatformLength(length);
  },
  onPreview: () => {
    const scene = game.scene.getScene('EditorScene') as EditorScene;
    if (scene) scene.startPreview();
  },
  onSave: () => {
    const scene = game.scene.getScene('EditorScene') as EditorScene;
    if (scene) scene.saveLevel();
  },
  onLoad: () => {
    const scene = game.scene.getScene('EditorScene') as EditorScene;
    if (scene) scene.loadLevel();
  },
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scene: [EditorScene, GamePreviewScene],
  backgroundColor: '#1A1A2E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  callbacks: {
    postBoot: (gameInstance: Phaser.Game) => {
      gameInstance.registry.set('editorUI', editorUI);
    },
  },
});
