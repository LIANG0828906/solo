import { useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { useGameStore } from './stores/gameStore';
import { Direction } from './types';
import './App.css';

function App() {
  const {
    status,
    twoPlayerMode,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    toggleTwoPlayer,
    setDirection,
  } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') {
        if (e.key === 'Enter' || e.key === ' ') {
          if (status === 'menu') {
            startGame(twoPlayerMode);
          } else if (status === 'paused') {
            resumeGame();
          } else if (status === 'gameover' || status === 'win') {
            restartGame();
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (e.key === 'ArrowUp') {
            setDirection(twoPlayerMode ? 'player2' : 'player1', Direction.UP);
          } else {
            setDirection('player1', Direction.UP);
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (e.key === 'ArrowDown') {
            setDirection(twoPlayerMode ? 'player2' : 'player1', Direction.DOWN);
          } else {
            setDirection('player1', Direction.DOWN);
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (e.key === 'ArrowLeft') {
            setDirection(twoPlayerMode ? 'player2' : 'player1', Direction.LEFT);
          } else {
            setDirection('player1', Direction.LEFT);
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (e.key === 'ArrowRight') {
            setDirection(twoPlayerMode ? 'player2' : 'player1', Direction.RIGHT);
          } else {
            setDirection('player1', Direction.RIGHT);
          }
          break;
        case 'Escape':
        case 'p':
        case 'P':
          e.preventDefault();
          pauseGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, twoPlayerMode, startGame, pauseGame, resumeGame, restartGame, setDirection]);

  const handleStart = () => {
    startGame(twoPlayerMode);
  };

  const handlePause = () => {
    pauseGame();
  };

  const handleResume = () => {
    resumeGame();
  };

  const handleRestart = () => {
    restartGame();
  };

  return (
    <div
      className="game-container"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1A1A2E',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '800px',
        minHeight: '600px',
      }}
    >
      <HUD />

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '60px',
          boxSizing: 'border-box',
        }}
      >
        <GameCanvas />
      </div>

      {status === 'menu' && (
        <div className="overlay">
          <div className="menu-box">
            <h1 className="game-title">PacDot</h1>
            <p className="game-subtitle">Retro Maze Adventure</p>

            <div className="mode-selector">
              <div
                className={`mode-option ${!twoPlayerMode ? 'active' : ''}`}
                onClick={() => !twoPlayerMode || toggleTwoPlayer()}
              >
                👤 Single Player
              </div>
              <div
                className={`mode-option ${twoPlayerMode ? 'active' : ''}`}
                onClick={() => twoPlayerMode || toggleTwoPlayer()}
              >
                👥 Two Players
              </div>
            </div>

            <button className="game-btn primary" onClick={handleStart}>
              START GAME
            </button>

            <div className="controls-info">
              <p>{twoPlayerMode ? 'Player 1: WASD' : 'Controls: Arrow Keys'}</p>
              {twoPlayerMode && <p>Player 2: Arrow Keys</p>}
              <p>P / ESC = Pause</p>
            </div>
          </div>
        </div>
      )}

      {status === 'paused' && (
        <div className="overlay">
          <div className="menu-box">
            <h2 className="pause-title">PAUSED</h2>
            <button className="game-btn primary" onClick={handleResume}>
              RESUME
            </button>
            <button className="game-btn secondary" onClick={handleRestart}>
              RESTART
            </button>
          </div>
        </div>
      )}

      {status === 'gameover' && (
        <div className="overlay">
          <div className="menu-box">
            <h2 className="gameover-title">GAME OVER</h2>
            <button className="game-btn primary" onClick={handleRestart}>
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {status === 'win' && (
        <div className="overlay">
          <div className="menu-box">
            <h2 className="win-title">YOU WIN!</h2>
            <button className="game-btn primary" onClick={handleRestart}>
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {status === 'playing' && (
        <button
          className="pause-btn"
          onClick={handlePause}
          aria-label="Pause"
        >
          ⏸
        </button>
      )}
    </div>
  );
}

export default App;
