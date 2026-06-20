import React, { useEffect, useRef, useState } from 'react';
import { GameManager } from './game/GameManager';
import Board from './game/Board';
import GamePanel from './game/GamePanel';
import Lobby from './lobby/Lobby';
import Replay from './replay/Replay';
import { MoveRecord, PieceColor } from '../shared/types';

type AppView = 'lobby' | 'game' | 'replay';

const Confetti: React.FC = () => {
  const colors = ['#FF0000', '#FFD700', '#00FF00', '#00BFFF', '#FF69B4', '#FFA500', '#8B0000'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('lobby');
  const [gameManager] = useState(() => new GameManager());
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverInfo, setGameOverInfo] = useState<{ winner: PieceColor | null; status: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [checkToast, setCheckToast] = useState(false);
  const [invalidMoveToast, setInvalidMoveToast] = useState<string | null>(null);
  const [replayData, setReplayData] = useState<{ moveHistory: MoveRecord[]; pgn: string } | null>(null);

  useEffect(() => {
    const handleEvent = (event: string, data?: any) => {
      if (event === 'gameStart') {
        setView('game');
        setShowGameOver(false);
        setGameOverInfo(null);
      }

      if (event === 'gameOver') {
        setShowGameOver(true);
        setGameOverInfo({ winner: data.winner, status: data.status });
        if (data.winner === gameManager.getMyColor()) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }

      if (event === 'check') {
        setCheckToast(true);
        setTimeout(() => setCheckToast(false), 2000);
      }

      if (event === 'invalidMove') {
        setInvalidMoveToast(data.reason || '非法走法');
        setTimeout(() => setInvalidMoveToast(null), 2000);
      }

      if (event === 'REPLAY_DATA' || (event === 'gameOver' && gameManager.getGameState())) {
        const gs = gameManager.getGameState();
        if (gs) {
          setReplayData({
            moveHistory: [...gs.moveHistory],
            pgn: '',
          });
        }
      }
    };

    gameManager.onEvent(handleEvent);
    return () => gameManager.removeEvent(handleEvent);
  }, [gameManager]);

  const handleGameStart = () => {
    setView('game');
  };

  const handleReplay = () => {
    const gs = gameManager.getGameState();
    if (gs && gs.moveHistory.length > 0) {
      setReplayData({
        moveHistory: [...gs.moveHistory],
        pgn: '',
      });
      setView('replay');
      setShowGameOver(false);
    }
  };

  const handleBackToLobby = () => {
    setView('lobby');
    setShowGameOver(false);
    setGameOverInfo(null);
  };

  const statusLabel: Record<string, string> = {
    checkmate: '将杀',
    stalemate: '困毙',
    timeout: '超时',
    resigned: '认输',
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>♚ 中国象棋在线</h1>
          <div className="subtitle">双人对弈平台</div>
        </div>
        {view === 'game' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }} onClick={handleBackToLobby}>
              离开对局
            </button>
          </div>
        )}
      </header>

      {view === 'lobby' && (
        <Lobby gameManager={gameManager} onGameStart={handleGameStart} />
      )}

      {view === 'game' && (
        <div className="game-layout">
          <div className="board-area">
            <Board gameManager={gameManager} />
          </div>
          <GamePanel gameManager={gameManager} />
        </div>
      )}

      {view === 'replay' && replayData && (
        <Replay
          moveHistory={replayData.moveHistory}
          pgn={replayData.pgn}
          onBack={handleBackToLobby}
        />
      )}

      {showConfetti && <Confetti />}

      {checkToast && (
        <div className="check-toast">将军！</div>
      )}

      {invalidMoveToast && (
        <div className="invalid-move-toast">⚠ {invalidMoveToast}</div>
      )}

      {showGameOver && gameOverInfo && (
        <div className="game-over-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowGameOver(false); }}>
          <div className="game-over-card">
            <h2 className={gameOverInfo.winner === 'red' ? 'red-win' : 'black-win'}>
              {gameOverInfo.winner === 'red' ? '红方胜利' : '黑方胜利'}
            </h2>
            <div className="result-detail">
              {statusLabel[gameOverInfo.status] || gameOverInfo.status}
              {gameOverInfo.winner === gameManager.getMyColor() ? ' 🎉' : ''}
            </div>
            <div className="actions">
              <button className="btn btn-primary btn-sm" onClick={handleReplay}>
                回放棋局
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleBackToLobby}>
                返回大厅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
