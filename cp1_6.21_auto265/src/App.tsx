import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameBoard from './GameBoard';
import PlayerIndicator from './PlayerIndicator';
import HistoryPanel from './HistoryPanel';
import {
  type BoardState,
  type GameRecord,
  type GameStats,
  type GameStatus,
  type MoveStep,
  type Player,
  PLAYER1_CONFIG,
  PLAYER2_CONFIG,
  WINNING_LINES,
} from './types';
import {
  generateRecordId,
  getGameRecords,
  getGameStats,
  saveGameRecord,
  saveGameStats,
} from './utils/storage';
import {
  initAudioOnFirstInteraction,
  playPlayer1Place,
  playPlayer2Place,
  playUndo,
  playWin,
} from './utils/audio';

const createEmptyBoard = (): BoardState => [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

const cellKey = (row: number, col: number): string => `${row}-${col}`;

interface CheckResult {
  winner: Player | null;
  line: [number, number][] | null;
  isDraw: boolean;
}

function checkWinning(board: BoardState): CheckResult {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const v = board[a[0]][a[1]];
    if (v && v === board[b[0]][b[1]] && v === board[c[0]][c[1]]) {
      return { winner: v, line, isDraw: false };
    }
  }
  const isFull = board.every((row) => row.every((cell) => cell !== null));
  return { winner: null, line: null, isDraw: isFull };
}

type UndoUsedState = { player1: boolean; player2: boolean };

const App: React.FC = function App() {
  const [board, setBoard] = useState<BoardState>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('player1');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [history, setHistory] = useState<MoveStep[]>([]);
  const [winningCells, setWinningCells] = useState<Set<string>>(new Set());
  const [lastMove, setLastMove] = useState<MoveStep | null>(null);
  const [shrinkingCell, setShrinkingCell] = useState<{ row: number; col: number } | null>(null);
  const [undoUsed, setUndoUsed] = useState<UndoUsedState>({ player1: false, player2: false });
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState<GameStats>(() => getGameStats());
  const [records, setRecords] = useState<GameRecord[]>(() => getGameRecords());
  const [boardLocked, setBoardLocked] = useState(false);

  const modalShownRef = useRef(false);
  const statsSavedRef = useRef(false);

  useEffect(() => {
    initAudioOnFirstInteraction();
  }, []);

  const gameOver = status !== 'playing';

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (boardLocked || gameOver || board[row][col] !== null) return;

      const player = currentPlayer;
      const newBoard = board.map((r) => r.slice()) as BoardState;
      newBoard[row][col] = player;

      setBoard(newBoard);
      setLastMove({ row, col, player });
      setShrinkingCell(null);
      setHistory((prev) => [...prev, { row, col, player }]);

      if (player === 'player1') {
        playPlayer1Place();
      } else {
        playPlayer2Place();
      }

      const result = checkWinning(newBoard);

      if (result.winner) {
        const winSet = new Set(result.line!.map(([r, c]) => cellKey(r, c)));
        setWinningCells(winSet);
        setStatus(result.winner === 'player1' ? 'player1Win' : 'player2Win');
        setBoardLocked(true);

        playWin();

        setTimeout(() => {
          setShowModal(true);
        }, 1500);
      } else if (result.isDraw) {
        setStatus('draw');
        setBoardLocked(true);

        setTimeout(() => {
          setShowModal(true);
        }, 600);
      } else {
        setCurrentPlayer(player === 'player1' ? 'player2' : 'player1');
      }
    },
    [board, currentPlayer, boardLocked, gameOver]
  );

  useEffect(() => {
    if (status === 'playing') return;
    if (modalShownRef.current) return;
    modalShownRef.current = true;

    const winner: Player | 'draw' =
      status === 'player1Win' ? 'player1' : status === 'player2Win' ? 'player2' : 'draw';

    if (!statsSavedRef.current) {
      statsSavedRef.current = true;

      const newStats: GameStats = { ...stats };
      if (winner === 'player1') newStats.player1Wins += 1;
      if (winner === 'player2') newStats.player2Wins += 1;
      saveGameStats(newStats);
      setStats(newStats);

      const record: GameRecord = {
        id: generateRecordId(),
        player1Name: PLAYER1_CONFIG.name,
        player2Name: PLAYER2_CONFIG.name,
        winner,
        timestamp: Date.now(),
      };
      saveGameRecord(record);
      setRecords((prev) => [record, ...prev].slice(0, 20));
    }
  }, [status, stats]);

  const canUndo = useMemo(() => {
    if (gameOver || boardLocked || history.length === 0) return false;
    const last = history[history.length - 1];
    return !undoUsed[last.player];
  }, [gameOver, boardLocked, history, undoUsed]);

  const handleUndo = useCallback(() => {
    if (!canUndo || history.length === 0 || boardLocked) return;

    const last = history[history.length - 1];
    setShrinkingCell({ row: last.row, col: last.col });
    setBoardLocked(true);
    playUndo();

    setTimeout(() => {
      setBoard((prev) => {
        const next = prev.map((r) => r.slice()) as BoardState;
        next[last.row][last.col] = null;
        return next;
      });
      setHistory((prev) => prev.slice(0, -1));
      setLastMove(null);
      setShrinkingCell(null);
      setUndoUsed((prev) => ({ ...prev, [last.player]: true }));
      setCurrentPlayer(last.player);
      setBoardLocked(false);
    }, 200);
  }, [canUndo, history, boardLocked]);

  const handleReset = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('player1');
    setStatus('playing');
    setHistory([]);
    setWinningCells(new Set());
    setLastMove(null);
    setShrinkingCell(null);
    setUndoUsed({ player1: false, player2: false });
    setShowModal(false);
    setBoardLocked(false);
    modalShownRef.current = false;
    statsSavedRef.current = false;
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const renderModal = () => {
    if (!showModal) return null;

    const isP1Win = status === 'player1Win';
    const isP2Win = status === 'player2Win';
    const isDraw = status === 'draw';
    const titleClass = isP1Win ? 'win-p1' : isP2Win ? 'win-p2' : 'draw';
    const titleText = isP1Win
      ? `${PLAYER1_CONFIG.name} 获胜！`
      : isP2Win
        ? `${PLAYER2_CONFIG.name} 获胜！`
        : '平局！';
    const avatarPlayer = isP1Win ? 'player1' : isP2Win ? 'player2' : null;

    return (
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={handleCloseModal}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          {avatarPlayer ? (
            <div className={`avatar ${avatarPlayer}`} aria-hidden="true">
              {avatarPlayer === 'player1' ? 'P1' : 'P2'}
            </div>
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: 'white',
                backgroundColor: '#F59E0B',
                boxShadow: '0 0 24px rgba(245, 158, 11, 0.5)',
              }}
            >
              =
            </div>
          )}
          <h2 id="modal-title" className={`modal-title ${titleClass}`}>
            {titleText}
          </h2>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseModal}
            >
              查看棋盘
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReset}
              autoFocus
            >
              再来一局
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <h1 className="app-title">像素叠叠乐</h1>

      <PlayerIndicator currentPlayer={currentPlayer} stats={stats} />

      <div className="game-area">
        <GameBoard
          board={board}
          winningCells={winningCells}
          lastMove={lastMove}
          shrinkingCell={shrinkingCell}
          disabled={boardLocked || gameOver}
          onCellClick={handleCellClick}
        />

        <div className="controls" role="group" aria-label="游戏控制">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="悔棋"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3L3 13" />
            </svg>
            悔棋
            {history.length > 0 && !undoUsed[history[history.length - 1].player] && (
              <span style={{ fontSize: 11, opacity: 0.7 }}>(剩1次)</span>
            )}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleReset}
            aria-label="重新开始"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            重新开始
          </button>
        </div>
      </div>

      <HistoryPanel records={records} />

      {renderModal()}
    </div>
  );
};

export default App;
