import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BoardRenderer } from './BoardRenderer';
import { RhythmPanel } from './RhythmPanel';
import { GameOverPanel } from './GameOverPanel';
import { useGameStore } from './store/useGameStore';
import { PLACEMENTS_PER_TURN } from './types';

const App: React.FC = () => {
  const { gameEngine, initEngines } = useGameStore();
  const [, forceUpdate] = useState(0);
  const animationRef = useRef<number>();
  const [beatOffset, setBeatOffset] = useState(0);
  const [beatProgress, setBeatProgress] = useState(0);

  useEffect(() => {
    initEngines();
  }, [initEngines]);

  useEffect(() => {
    if (!gameEngine) return;

    gameEngine.getAudioEngine().start();

    const unsubscribe = gameEngine.subscribe(() => {
      forceUpdate((prev) => prev + 1);
    });

    const gameLoop = (now: number) => {
      gameEngine.update(now);
      setBeatOffset(gameEngine.getBeatOffset());
      setBeatProgress(gameEngine.getAudioEngine().getBeatProgress());
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      unsubscribe();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameEngine]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameEngine) {
        e.preventDefault();
        gameEngine.handleSpacePress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameEngine]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!gameEngine) return;
      gameEngine.selectCell(row, col);
    },
    [gameEngine]
  );

  const handleRestart = useCallback(() => {
    if (!gameEngine) return;
    gameEngine.reset();
  }, [gameEngine]);

  const canPlace = useCallback(
    (row: number, col: number): boolean => {
      if (!gameEngine) return false;
      return gameEngine.canPlace(row, col);
    },
    [gameEngine]
  );

  if (!gameEngine) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A0E1A 0%, #1A1E2E 100%)',
          color: '#FFFFFF',
        }}
      >
        加载中...
      </div>
    );
  }

  const board = gameEngine.getBoard();
  const currentPlayer = gameEngine.getCurrentPlayer();
  const phase = gameEngine.getPhase();
  const selectedCell = gameEngine.getSelectedCell();
  const boardRotation = gameEngine.getBoardRotation();
  const isRotating = gameEngine.getIsRotating();
  const flashPhase = gameEngine.getFlashPhase();
  const borderHue = gameEngine.getBorderHue();
  const particles = gameEngine.getParticles();
  const isComboActive = gameEngine.getIsComboActive();
  const combo = gameEngine.getCombo();
  const placementCount = gameEngine.getPlacementCount();
  const winner = gameEngine.getWinner();
  const finalScore = gameEngine.getFinalScore();
  const bestCombo = gameEngine.getBestCombo();
  const averageAccuracy = gameEngine.getAverageAccuracy();

  const currentPlayerColor = currentPlayer === 'player1' ? '#4A90D9' : '#D94A4A';
  const currentPlayerText = currentPlayer === 'player1' ? '蓝方' : '红方';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0A0E1A 0%, #1A1E2E 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '40px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <h1
          style={{
            margin: 0,
            color: '#FFFFFF',
            fontSize: '28px',
            fontWeight: 'bold',
            letterSpacing: '4px',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
          }}
        >
          节奏领土
        </h1>

        <RhythmPanel beatOffset={beatOffset} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            fontSize: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>当前回合:</span>
            <span
              style={{
                color: currentPlayerColor,
                fontWeight: 'bold',
                textShadow: `0 0 10px ${currentPlayerColor}50`,
              }}
            >
              {currentPlayerText}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>剩余放置:</span>
            <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
              {PLACEMENTS_PER_TURN - placementCount}
            </span>
          </div>

          {combo > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>连击:</span>
              <span
                style={{
                  color: '#FFD700',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                }}
              >
                {combo}x
              </span>
            </div>
          )}

          {isComboActive && (
            <div
              style={{
                padding: '4px 12px',
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                borderRadius: '12px',
                color: '#FFD700',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid rgba(255, 215, 0, 0.5)',
                animation: 'pulse 0.5s ease-in-out infinite',
              }}
            >
              连击加成激活！
            </div>
          )}
        </div>
      </div>

      <BoardRenderer
        board={board}
        currentPlayer={currentPlayer}
        selectedCell={selectedCell}
        canPlace={canPlace}
        onCellClick={handleCellClick}
        boardRotation={boardRotation}
        isRotating={isRotating}
        flashPhase={flashPhase}
        borderHue={borderHue}
        particles={particles}
        isComboActive={isComboActive}
        beatOffset={beatOffset}
        beatProgress={beatProgress}
      />

      <div
        style={{
          marginTop: '20px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
          textAlign: 'center',
        }}
      >
        {phase === 'placing' && '点击高亮格子选择放置位置'}
        {phase === 'waitingForSpace' && '按下 空格键 确认放置！'}
        {phase === 'switching' && '回合切换中...'}
      </div>

      {phase === 'ended' && winner && (
        <GameOverPanel
          winner={winner}
          finalScore={finalScore}
          bestCombo={bestCombo}
          averageAccuracy={averageAccuracy}
          onRestart={handleRestart}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes comboGlow {
          0% { 
            transform: scale(0.8);
            opacity: 0.5;
          }
          100% { 
            transform: scale(1.2);
            opacity: 0;
          }
        }
        
        * {
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default App;
