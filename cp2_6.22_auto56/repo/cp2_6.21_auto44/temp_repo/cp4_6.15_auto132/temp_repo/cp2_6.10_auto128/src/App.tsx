import { useEffect, useState, useCallback } from 'react';
import { Board } from './components/Board';
import { PlayerPanel } from './components/PlayerPanel';
import { useGameLogic } from './hooks/useGameLogic';
import { useGameStore } from './store/useGameStore';
import { StoneColor, Position } from './types';

const CELL_SIZE = 40;

function App() {
  const {
    gameState,
    makeMove,
    jumpToMove,
    resetGame,
    resumeGame,
    toggleAnnotation,
    exportRecord,
    getElapsedTime,
    starPoints,
    boardSize
  } = useGameLogic();

  const {
    animatedStones,
    lastMovePosition,
    updateFromState,
    clearAnimatedStones,
    playSound
  } = useGameStore();

  const [showModal, setShowModal] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    updateFromState(gameState);
  }, [gameState, updateFromState]);

  useEffect(() => {
    if (gameState.gameOver && gameState.winner) {
      setShowModal(true);
    }
  }, [gameState.gameOver, gameState.winner]);

  useEffect(() => {
    const prevMovesLength = useGameStore.getState().gameRecord.moves.length;
    if (gameState.gameRecord.moves.length > prevMovesLength && !gameState.isReplaying) {
      playSound();
    }
  }, [gameState.gameRecord.moves.length, gameState.isReplaying, playSound]);

  useEffect(() => {
    if (!gameState.gameOver && !gameState.isReplaying) {
      const interval = setInterval(() => {
        setTick(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState.gameOver, gameState.isReplaying]);

  const handleCellClick = useCallback((pos: Position) => {
    if (gameState.gameOver || gameState.isReplaying) return;
    if (gameState.currentTurn !== StoneColor.Black) return;

    const success = makeMove(pos);
    if (success) {
      playSound();
    }
  }, [gameState.gameOver, gameState.isReplaying, gameState.currentTurn, makeMove, playSound]);

  const handleReset = useCallback(() => {
    resetGame();
    clearAnimatedStones();
    setShowModal(false);
  }, [resetGame, clearAnimatedStones]);

  const handleExport = useCallback(() => {
    const record = exportRecord();
    const blob = new Blob([record], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `兰台连珠棋谱_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportRecord]);

  const handleJumpToMove = useCallback((index: number) => {
    clearAnimatedStones();
    jumpToMove(index);
  }, [jumpToMove, clearAnimatedStones]);

  const handleResume = useCallback(() => {
    clearAnimatedStones();
    resumeGame();
  }, [resumeGame, clearAnimatedStones]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const secs = seconds % 60;
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}时${mins}分${secs}秒`;
    }
    if (minutes > 0) {
      return `${mins}分${secs}秒`;
    }
    return `${secs}秒`;
  };

  const getWinnerText = (): string => {
    if (gameState.winner === StoneColor.Black) return '黑方（玩家）';
    if (gameState.winner === StoneColor.White) return '白方（AI）';
    return '平局';
  };

  const isPlayerTurn = gameState.currentTurn === StoneColor.Black && !gameState.gameOver && !gameState.isReplaying;

  return (
    <div className="app-container">
      <header className="header-banner">
        <h1>兰 台 连 珠 棋 谱</h1>
      </header>

      <main className="main-content">
        <section className="board-section">
          <div className="board-wrapper">
            <Board
              board={gameState.board}
              boardSize={boardSize}
              cellSize={CELL_SIZE}
              starPoints={starPoints}
              lastMove={lastMovePosition}
              onCellClick={handleCellClick}
              disabled={!isPlayerTurn}
              animatedStones={animatedStones}
            />
          </div>
        </section>

        <aside className="panel-section">
          <PlayerPanel
            currentTurn={gameState.currentTurn}
            gameOver={gameState.gameOver}
            winner={gameState.winner}
            isReplaying={gameState.isReplaying}
            moves={gameState.gameRecord.moves}
            currentMoveIndex={gameState.currentMoveIndex}
            elapsedTime={getElapsedTime()}
            onReset={handleReset}
            onJumpToMove={handleJumpToMove}
            onResume={handleResume}
            onExport={handleExport}
            onToggleAnnotation={toggleAnnotation}
          />
        </aside>
      </main>

      {showModal && gameState.winner && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <h2 className="modal-title">◆ 对 局 结 束 ◆</h2>
            <div className="modal-info">
              <div className="modal-info-row">
                <span className="status-label">胜方</span>
                <span
                  className="status-value"
                  style={{
                    color: gameState.winner === StoneColor.Black ? '#000' : '#666',
                    fontWeight: 700
                  }}
                >
                  {getWinnerText()}
                </span>
              </div>
              <div className="modal-info-row">
                <span className="status-label">总步数</span>
                <span className="status-value">{gameState.gameRecord.totalMoves} 手</span>
              </div>
              <div className="modal-info-row">
                <span className="status-label">对局时长</span>
                <span className="status-value">{formatTime(getElapsedTime())}</span>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn btn-primary" onClick={handleReset}>
                重新开始
              </button>
              <button className="btn btn-secondary" onClick={handleExport}>
                导出棋谱
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
