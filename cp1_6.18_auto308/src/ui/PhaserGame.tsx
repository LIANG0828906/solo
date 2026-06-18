import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GardenScene } from '../game/gridRenderer';
import { useGameStore } from '../store/gameStore';
import { executeCommands } from '../game/commandExecutor';

const PhaserGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GardenScene | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initGame = () => {
      const container = document.getElementById('phaser-container');
      if (!container) {
        setTimeout(initGame, 100);
        return;
      }

      if (gameRef.current) return;

      const scene = new GardenScene();
      sceneRef.current = scene;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: container,
        width: 420,
        height: 420,
        backgroundColor: '#0F3460',
        scene: scene,
        fps: {
          target: 30,
          forceSetTimeOut: true,
        },
      };

      gameRef.current = new Phaser.Game(config);
    };

    initGame();

    const handleRun = () => {
      const store = useGameStore.getState();
      if (store.isRunning) return;

      const scene = sceneRef.current;
      if (!scene) return;

      scene.reset();

      const result = executeCommands(store.commands, store.functionDef);

      if (result.recursionError) {
        useGameStore.getState().setShowRecursionError(true);
        useGameStore.getState().setErrorMessage(result.errorMessage || '递归太深啦！');
      }

      useGameStore.getState().setRunning(true);

      scene.animatePath(result.path).then(() => {
        useGameStore.getState().setRunning(false);
      });
    };

    window.addEventListener('game-run', handleRun);

    return () => {
      window.removeEventListener('game-run', handleRun);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return null;
};

export default PhaserGame;
