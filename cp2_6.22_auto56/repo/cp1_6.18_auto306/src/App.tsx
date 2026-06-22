import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { GameScene } from '@/game/GameScene';
import HUD from '@/ui/HUD';
import { useGameStore } from '@/store/gameStore';
import { AREA_NAMES } from '@/types';

const App = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const gameSceneRef = useRef<GameScene | null>(null);
  const { gameStatus, currentArea } = useGameStore();

  const [gameSize, setGameSize] = useState({ width: 960, height: 640 });

  useEffect(() => {
    if (!gameRef.current) return;

    const baseWidth = 960;
    const baseHeight = 640;

    const updateSize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const scaleX = windowWidth / baseWidth;
      const scaleY = windowHeight / baseHeight;
      const scale = Math.min(scaleX, scaleY);

      const displayWidth = baseWidth * scale;
      const displayHeight = baseHeight * scale;

      setGameSize({
        width: Math.floor(displayWidth),
        height: Math.floor(displayHeight),
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      width: baseWidth,
      height: baseHeight,
      parent: gameRef.current,
      backgroundColor: '#1A1A2E',
      scene: [GameScene],
      pixelArt: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    phaserGameRef.current = new Phaser.Game(config);

    phaserGameRef.current.events.once('ready', () => {
      const scene = phaserGameRef.current?.scene.getScene('GameScene') as GameScene;
      if (scene) {
        gameSceneRef.current = scene;
      }
    });

    return () => {
      window.removeEventListener('resize', updateSize);
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  const handleRestart = () => {
    if (gameSceneRef.current) {
      gameSceneRef.current.restart();
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100vh',
        }}
      >
        <div
          ref={gameRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        <HUD />

        {gameStatus === 'gameover' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              fontFamily: 'Microsoft YaHei, sans-serif',
            }}
          >
            <h1
              style={{
                color: '#E53935',
                fontSize: '48px',
                marginBottom: '20px',
                textShadow: '0 0 20px rgba(229, 57, 53, 0.5)',
              }}
            >
              游戏结束
            </h1>
            <p style={{ color: '#FFFFFF', fontSize: '18px', marginBottom: '30px' }}>
              你在{currentArea}被暗影吞噬了...
            </p>
            <button
              onClick={handleRestart}
              style={{
                padding: '12px 32px',
                fontSize: '18px',
                backgroundColor: '#FFD700',
                color: '#1A1A2E',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              重新开始
            </button>
          </div>
        )}

        {gameStatus === 'victory' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              fontFamily: 'Microsoft YaHei, sans-serif',
            }}
          >
            <h1
              style={{
                color: '#FFD700',
                fontSize: '48px',
                marginBottom: '20px',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
              }}
            >
              地牢苏醒
            </h1>
            <p style={{ color: '#FFFFFF', fontSize: '18px', marginBottom: '30px', textAlign: 'center', maxWidth: '500px' }}>
              你收集了所有的回声碎片，地牢的记忆已经恢复。
              <br />
              光明再次降临这片被遗忘的土地...
            </p>
            <button
              onClick={handleRestart}
              style={{
                padding: '12px 32px',
                fontSize: '18px',
                backgroundColor: '#FFD700',
                color: '#1A1A2E',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              再次挑战
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
