import { useState, useEffect, useCallback } from 'react';
import GameBoard from '@/components/GameBoard';
import Player from '@/components/Player';
import Note from '@/components/Note';
import HUD from '@/components/HUD';
import CompletionOverlay from '@/components/CompletionOverlay';
import { useGameStore } from '@/store/gameStore';
import { CELL_SIZE, CELL_SIZE_SMALL } from '@/constants';

export default function App() {
  const initializeGame = useGameStore((state) => state.initializeGame);
  const cleanUpWallWaves = useGameStore((state) => state.cleanUpWallWaves);
  const grid = useGameStore((state) => state.grid);

  const [cellSize, setCellSize] = useState(CELL_SIZE);

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    setCellSize(width < 900 ? CELL_SIZE_SMALL : CELL_SIZE);
  }, []);

  useEffect(() => {
    initializeGame();
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [initializeGame, handleResize]);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanUpWallWaves();
    }, 1000);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [cleanUpWallWaves]);

  const isSmallScreen = cellSize === CELL_SIZE_SMALL;

  if (!grid || grid.length === 0) {
    return (
      <div className="app-container">
        <div style={{ color: '#FFFFFF', fontSize: 20 }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="game-wrapper">
        <header
          style={{
            width: '100%',
            marginBottom: 20,
            textAlign: isSmallScreen ? 'center' : 'left',
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#E0E0E0',
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            音律迷宫
          </h1>
          <p
            style={{
              fontSize: 14,
              color: '#888',
              marginTop: 4,
              margin: isSmallScreen ? '4px auto 0' : '4px 0 0',
            }}
          >
            收集音符，触发墙壁波动，奏响完整旋律
          </p>
        </header>

        <div
          className="game-layout"
          style={{
            display: 'flex',
            flexDirection: isSmallScreen ? 'column' : 'row',
            gap: 24,
            alignItems: isSmallScreen ? 'center' : 'flex-start',
            width: '100%',
            maxWidth: isSmallScreen ? '100%' : 'none',
            justifyContent: 'center',
          }}
        >
          <div
            className="game-board-wrapper"
            style={{
              position: 'relative',
              flexShrink: 0,
              maxWidth: '100%',
              overflow: 'visible',
            }}
          >
            <GameBoard cellSize={cellSize} />
            <Note cellSize={cellSize} />
            <Player cellSize={cellSize} />
          </div>

          <div
            className="hud-wrapper"
            style={{
              position: isSmallScreen ? 'relative' : 'sticky',
              top: isSmallScreen ? 'auto' : 20,
              width: isSmallScreen ? '100%' : 240,
              flexShrink: 0,
            }}
          >
            <HUD />
          </div>
        </div>
      </div>

      <CompletionOverlay />
    </div>
  );
}
