import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import type { GameState, Action, Position, Move, Piece } from './types';
import {
  BOARD_ROWS,
  BOARD_COLS,
  PIECE_CHARS,
  createInitialBoard,
  generatePieceMoves,
  applyMoveToBoard,
  undoMoveOnBoard,
  checkGameEnd,
  cloneBoard,
} from './ChessEngine';

const MAX_UNDO = 10;
const REPLAY_INTERVAL = 1500;

const initialState = (difficulty: 'easy' | 'medium' = 'medium'): GameState => ({
  board: createInitialBoard(),
  currentPlayer: 'red',
  history: [],
  status: 'playing',
  winner: null,
  noCaptureCount: 0,
  difficulty,
  aiColor: 'black',
  selected: null,
  validMoves: [],
  lastMove: null,
  replaying: false,
  aiThinking: false,
});

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SELECT_PIECE': {
      if (state.status !== 'playing' || state.replaying || state.aiThinking)
        return state;
      const piece = state.board[action.pos.row][action.pos.col];
      if (piece && piece.color === state.currentPlayer) {
        const validMoves = generatePieceMoves(state.board, action.pos);
        return { ...state, selected: action.pos, validMoves };
      }
      if (
        state.selected &&
        state.validMoves.some(
          (m) => m.row === action.pos.row && m.col === action.pos.col
        )
      ) {
        return reducer(state, {
          type: 'MOVE_PIECE',
          from: state.selected,
          to: action.pos,
        });
      }
      return { ...state, selected: null, validMoves: [] };
    }

    case 'MOVE_PIECE':
    case 'AI_MOVE': {
      if (state.status !== 'playing' || state.replaying) return state;
      const piece = state.board[action.from.row][action.from.col];
      if (!piece) return state;
      const captured = state.board[action.to.row][action.to.col];
      const move: Move = { from: action.from, to: action.to, piece, captured };
      const newBoard = cloneBoard(state.board);
      applyMoveToBoard(newBoard, move);
      const newNoCapture = captured ? 0 : state.noCaptureCount + 1;
      const nextPlayer: 'red' | 'black' =
        state.currentPlayer === 'red' ? 'black' : 'red';
      const result = checkGameEnd(newBoard, nextPlayer, newNoCapture);
      const newHistory = [...state.history, { move, noCaptureCount: state.noCaptureCount }];
      if (newHistory.length > MAX_UNDO * 2) {
        newHistory.splice(0, newHistory.length - MAX_UNDO * 2);
      }
      return {
        ...state,
        board: newBoard,
        currentPlayer: nextPlayer,
        history: newHistory,
        noCaptureCount: newNoCapture,
        selected: null,
        validMoves: [],
        lastMove: move,
        status: result.status,
        winner: result.winner,
        aiThinking: false,
      };
    }

    case 'UNDO': {
      if (state.history.length === 0 || state.replaying || state.aiThinking) return state;
      const undoCount = state.history.length >= 2 && state.aiColor !== state.currentPlayer ? 2 : 1;
      let newBoard = cloneBoard(state.board);
      let newHistory = [...state.history];
      let lastNoCapture = state.noCaptureCount;
      let lastMove = state.lastMove;
      for (let i = 0; i < undoCount && newHistory.length > 0; i++) {
        const record = newHistory.pop()!;
        undoMoveOnBoard(newBoard, record.move);
        lastNoCapture = record.noCaptureCount;
        lastMove = newHistory.length > 0 ? newHistory[newHistory.length - 1].move : null;
      }
      const prevPlayer: 'red' | 'black' =
        state.currentPlayer === 'red' ? 'black' : 'red';
      const actualPlayer = undoCount === 2 ? state.currentPlayer : prevPlayer;
      return {
        ...state,
        board: newBoard,
        currentPlayer: actualPlayer,
        history: newHistory,
        noCaptureCount: lastNoCapture,
        selected: null,
        validMoves: [],
        lastMove,
        status: 'playing',
        winner: null,
      };
    }

    case 'NEW_GAME': {
      return initialState(action.difficulty);
    }

    case 'START_REPLAY': {
      return {
        ...state,
        ...initialState(state.difficulty),
        history: state.history,
        replaying: true,
      };
    }

    case 'REPLAY_STEP': {
      if (!state.replaying || action.index >= state.history.length) return state;
      const record = state.history[action.index];
      const newBoard = cloneBoard(state.board);
      applyMoveToBoard(newBoard, record.move);
      const nextPlayer: 'red' | 'black' =
        action.index % 2 === 0 ? 'black' : 'red';
      return {
        ...state,
        board: newBoard,
        currentPlayer: nextPlayer,
        lastMove: record.move,
        noCaptureCount: record.move.captured ? 0 : state.noCaptureCount + 1,
      };
    }

    case 'END_REPLAY': {
      const fullHistory = state.history;
      const fresh = initialState(state.difficulty);
      let b = cloneBoard(fresh.board);
      let lm: Move | null = null;
      for (const rec of fullHistory) {
        applyMoveToBoard(b, rec.move);
        lm = rec.move;
      }
      const result = checkGameEnd(b, fullHistory.length % 2 === 0 ? 'red' : 'black', state.noCaptureCount);
      return {
        ...fresh,
        board: b,
        history: fullHistory,
        currentPlayer: fullHistory.length % 2 === 0 ? 'red' : 'black',
        lastMove: lm,
        status: result.status,
        winner: result.winner,
        replaying: false,
      };
    }

    case 'SET_AI_THINKING': {
      return { ...state, aiThinking: action.thinking };
    }

    default:
      return state;
  }
}

interface BoardCanvasProps {
  state: GameState;
  cellSize: number;
  pressedCell: Position | null;
  animatingMove: Move | null;
  onCellClick: (pos: Position) => void;
  onCellPress: (pos: Position | null) => void;
}

const BoardCanvas: React.FC<BoardCanvasProps> = ({
  state,
  cellSize,
  pressedCell,
  animatingMove,
  onCellClick,
  onCellPress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padding = cellSize * 0.6;
  const boardWidth = cellSize * (BOARD_COLS - 1) + padding * 2;
  const boardHeight = cellSize * (BOARD_ROWS - 1) + padding * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = boardWidth * dpr;
    canvas.height = boardHeight * dpr;
    canvas.style.width = `${boardWidth}px`;
    canvas.style.height = `${boardHeight}px`;
    ctx.scale(dpr, dpr);

    const gradient = ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
    gradient.addColorStop(0, '#e8c98b');
    gradient.addColorStop(0.3, '#d9b77a');
    gradient.addColorStop(0.5, '#d4a96a');
    gradient.addColorStop(0.7, '#d9b77a');
    gradient.addColorStop(1, '#c9a060');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, boardWidth, boardHeight);

    ctx.strokeStyle = 'rgba(120, 70, 30, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * boardWidth, 0);
      ctx.lineTo(Math.random() * boardWidth, boardHeight);
      ctx.stroke();
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 5;
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 3;
    ctx.strokeRect(padding - 4, padding - 4, boardWidth - padding * 2 + 8, boardHeight - padding * 2 + 8);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 2;

    for (let r = 0; r < BOARD_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(padding, padding + r * cellSize);
      ctx.lineTo(padding + (BOARD_COLS - 1) * cellSize, padding + r * cellSize);
      ctx.stroke();
    }

    for (let c = 0; c < BOARD_COLS; c++) {
      if (c === 0 || c === BOARD_COLS - 1) {
        ctx.beginPath();
        ctx.moveTo(padding + c * cellSize, padding);
        ctx.lineTo(padding + c * cellSize, padding + (BOARD_ROWS - 1) * cellSize);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(padding + c * cellSize, padding);
        ctx.lineTo(padding + c * cellSize, padding + 4 * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding + c * cellSize, padding + 5 * cellSize);
        ctx.lineTo(padding + c * cellSize, padding + 9 * cellSize);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding + 3 * cellSize, padding);
    ctx.lineTo(padding + 5 * cellSize, padding + 2 * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding + 5 * cellSize, padding);
    ctx.lineTo(padding + 3 * cellSize, padding + 2 * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding + 3 * cellSize, padding + 7 * cellSize);
    ctx.lineTo(padding + 5 * cellSize, padding + 9 * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding + 5 * cellSize, padding + 7 * cellSize);
    ctx.lineTo(padding + 3 * cellSize, padding + 9 * cellSize);
    ctx.stroke();

    ctx.font = `bold ${cellSize * 0.55}px "KaiTi", "STKaiti", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5a3a1a';
    const riverY = padding + 4.5 * cellSize;
    ctx.fillText('楚 河', padding + 2 * cellSize, riverY);
    ctx.fillText('汉 界', padding + 6 * cellSize, riverY);

    const marks: Array<[number, number, boolean]> = [
      [2, 1, true], [2, 7, true], [7, 1, false], [7, 7, false],
      [3, 0, true], [3, 2, true], [3, 4, true], [3, 6, true], [3, 8, true],
      [6, 0, false], [6, 2, false], [6, 4, false], [6, 6, false], [6, 8, false],
    ];
    for (const [r, c, isBlack] of marks) {
      const x = padding + c * cellSize;
      const y = padding + r * cellSize;
      drawMark(ctx, x, y, cellSize * 0.12, c > 0, c < BOARD_COLS - 1);
      if (isBlack) {}
    }

    if (state.selected) {
      const x = padding + state.selected.col * cellSize;
      const y = padding + state.selected.row * cellSize;
      const selSize = cellSize * 0.46;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      drawCorner(ctx, x - selSize, y - selSize, 'tl', cellSize * 0.15);
      drawCorner(ctx, x + selSize, y - selSize, 'tr', cellSize * 0.15);
      drawCorner(ctx, x - selSize, y + selSize, 'bl', cellSize * 0.15);
      drawCorner(ctx, x + selSize, y + selSize, 'br', cellSize * 0.15);
    }

    for (const move of state.validMoves) {
      const x = padding + move.col * cellSize;
      const y = padding + move.row * cellSize;
      const target = state.board[move.row][move.col];
      if (target) {
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.46, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(70, 160, 70, 0.55)';
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (state.lastMove && !animatingMove) {
      const fromX = padding + state.lastMove.from.col * cellSize;
      const fromY = padding + state.lastMove.from.row * cellSize;
      const toX = padding + state.lastMove.to.col * cellSize;
      const toY = padding + state.lastMove.to.row * cellSize;
      ctx.fillStyle = 'rgba(255, 200, 80, 0.25)';
      ctx.beginPath();
      ctx.arc(fromX, fromY, cellSize * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(toX, toY, cellSize * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [state, cellSize, boardWidth, boardHeight, padding, animatingMove]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.round((x - padding) / cellSize);
    const row = Math.round((y - padding) / cellSize);
    if (row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS) {
      onCellClick({ row, col });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.round((x - padding) / cellSize);
    const row = Math.round((y - padding) / cellSize);
    if (row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS) {
      onCellPress({ row, col });
    }
  };

  const handleMouseUp = () => {
    onCellPress(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'block',
          borderRadius: 8,
          touchAction: 'manipulation',
        }}
      />
      {renderPieces(state, cellSize, padding, pressedCell, animatingMove)}
    </div>
  );
};

function drawMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  left: boolean,
  right: boolean
) {
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 1.5;
  const offset = size * 0.6;
  if (left) {
    ctx.beginPath();
    ctx.moveTo(x - offset - size, y - offset);
    ctx.lineTo(x - offset, y - offset);
    ctx.lineTo(x - offset, y - offset - size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - offset - size, y + offset);
    ctx.lineTo(x - offset, y + offset);
    ctx.lineTo(x - offset, y + offset + size);
    ctx.stroke();
  }
  if (right) {
    ctx.beginPath();
    ctx.moveTo(x + offset + size, y - offset);
    ctx.lineTo(x + offset, y - offset);
    ctx.lineTo(x + offset, y - offset - size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + offset + size, y + offset);
    ctx.lineTo(x + offset, y + offset);
    ctx.lineTo(x + offset, y + offset + size);
    ctx.stroke();
  }
}

function drawCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  corner: 'tl' | 'tr' | 'bl' | 'br',
  len: number
) {
  ctx.beginPath();
  if (corner === 'tl') {
    ctx.moveTo(x, y + len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
  } else if (corner === 'tr') {
    ctx.moveTo(x - len, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + len);
  } else if (corner === 'bl') {
    ctx.moveTo(x, y - len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
  } else {
    ctx.moveTo(x - len, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y - len);
  }
  ctx.stroke();
}

const renderPieces = (
  state: GameState,
  cellSize: number,
  padding: number,
  pressedCell: Position | null,
  animatingMove: Move | null
) => {
  const pieces: React.ReactNode[] = [];
  const pieceSize = cellSize * 0.88;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = state.board[r][c];
      if (!piece) continue;

      const isAnimatingFrom =
        animatingMove &&
        animatingMove.from.row === r &&
        animatingMove.from.col === c;
      if (isAnimatingFrom) continue;

      const isAnimatingTo =
        animatingMove &&
        animatingMove.to.row === r &&
        animatingMove.to.col === c;

      const isSelected =
        state.selected &&
        state.selected.row === r &&
        state.selected.col === c;
      const isPressed =
        pressedCell && pressedCell.row === r && pressedCell.col === c;

      const x = padding + c * cellSize - pieceSize / 2;
      const y = padding + r * cellSize - pieceSize / 2;

      pieces.push(
        <PieceView
          key={piece.id}
          piece={piece}
          x={x}
          y={y}
          size={pieceSize}
          selected={!!isSelected}
          pressed={!!isPressed}
          animateDrop={!!isAnimatingTo}
        />
      );
    }
  }
  return pieces;
};

interface PieceViewProps {
  piece: Piece;
  x: number;
  y: number;
  size: number;
  selected: boolean;
  pressed: boolean;
  animateDrop: boolean;
}

const PieceView: React.FC<PieceViewProps> = ({
  piece,
  x,
  y,
  size,
  selected,
  pressed,
  animateDrop,
}) => {
  const isRed = piece.color === 'red';
  const char = PIECE_CHARS[piece.color][piece.type];

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        pointerEvents: 'none',
        animation: animateDrop
          ? 'pieceDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          : pressed
          ? 'piecePress 0.1s ease'
          : undefined,
        zIndex: selected ? 10 : 1,
      }}
    >
      {selected && (
        <div
          style={{
            position: 'absolute',
            left: -size * 0.05,
            top: -size * 0.05,
            width: size * 1.1,
            height: size * 1.1,
            borderRadius: '50%',
            animation: 'highlightPulse 1s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, #fff8e0 0%, #f0d8a0 35%, #d4a96a 65%, #a87840 100%)`,
          boxShadow: `
            inset -3px -3px 6px rgba(90, 50, 20, 0.45),
            inset 2px 2px 4px rgba(255, 248, 220, 0.8),
            2px 3px 6px rgba(0, 0, 0, 0.4)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${isRed ? '#b02020' : '#1a1a1a'}`,
        }}
      >
        <div
          style={{
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: '50%',
            border: `1.5px solid ${isRed ? 'rgba(176, 32, 32, 0.5)' : 'rgba(26, 26, 26, 0.5)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: isRed ? '#c02020' : '#1a1a1a',
              fontSize: size * 0.5,
              fontWeight: 900,
              fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
              textShadow: isRed
                ? '0.5px 0.5px 0 rgba(80, 0, 0, 0.3)'
                : '0.5px 0.5px 0 rgba(255, 255, 255, 0.15)',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {char}
          </span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState('medium'));
  const [cellSize, setCellSize] = useState(44);
  const [pressedCell, setPressedCell] = useState<Position | null>(null);
  const [animatingMove, setAnimatingMove] = useState<Move | null>(null);
  const [showReplayBtn, setShowReplayBtn] = useState(false);
  const aiWorkerRef = useRef<Worker | null>(null);
  const replayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 20, 560);
      const maxHeight = window.innerHeight - 260;
      const byWidth = (maxWidth - 60) / (BOARD_COLS - 1);
      const byHeight = (maxHeight - 60) / (BOARD_ROWS - 1);
      setCellSize(Math.max(28, Math.min(52, Math.floor(Math.min(byWidth, byHeight)))));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    try {
      const workerCode = `
        importScripts('/src/aiWorker.ts');
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
    } catch (_e) {
    }
  }, []);

  useEffect(() => {
    if (
      state.status !== 'playing' ||
      state.replaying ||
      state.currentPlayer !== state.aiColor ||
      state.aiThinking
    ) {
      return;
    }

    dispatch({ type: 'SET_AI_THINKING', thinking: true });

    const runAI = () => {
      const { makeAIMove } = require('./ChessEngine');
      const move = makeAIMove(state.board, state.aiColor, state.difficulty);
      if (move) {
        setAnimatingMove(move);
        setTimeout(() => {
          dispatch({ type: 'AI_MOVE', from: move.from, to: move.to });
          setAnimatingMove(null);
        }, 500);
      } else {
        dispatch({ type: 'SET_AI_THINKING', thinking: false });
      }
    };

    const timer = window.setTimeout(runAI, 350);
    return () => window.clearTimeout(timer);
  }, [state.currentPlayer, state.status, state.replaying, state.aiColor, state.board, state.difficulty, state.aiThinking]);

  useEffect(() => {
    if (state.status !== 'playing' && state.history.length > 0) {
      setShowReplayBtn(true);
    } else {
      setShowReplayBtn(false);
    }
  }, [state.status, state.history.length]);

  useEffect(() => {
    if (!state.replaying) {
      if (replayTimerRef.current !== null) {
        window.clearTimeout(replayTimerRef.current);
        replayTimerRef.current = null;
      }
      return;
    }

    const totalMoves = state.history.length;
    let currentStep = 0;

    const doStep = () => {
      if (currentStep >= totalMoves) {
        dispatch({ type: 'END_REPLAY' });
        return;
      }
      const rec = state.history[currentStep];
      setAnimatingMove(rec.move);
      window.setTimeout(() => {
        dispatch({ type: 'REPLAY_STEP', index: currentStep });
        setAnimatingMove(null);
        currentStep++;
        replayTimerRef.current = window.setTimeout(doStep, REPLAY_INTERVAL - 500);
      }, 500);
    };

    replayTimerRef.current = window.setTimeout(doStep, 800);

    return () => {
      if (replayTimerRef.current !== null) {
        window.clearTimeout(replayTimerRef.current);
      }
    };
  }, [state.replaying, state.history]);

  const handleCellClick = useCallback((pos: Position) => {
    dispatch({ type: 'SELECT_PIECE', pos });
  }, []);

  const handleUndo = () => dispatch({ type: 'UNDO' });
  const handleNewGame = (difficulty: 'easy' | 'medium') => {
    dispatch({ type: 'NEW_GAME', difficulty });
    setShowReplayBtn(false);
    setAnimatingMove(null);
  };
  const handleReplay = () => dispatch({ type: 'START_REPLAY' });

  const statusText = (() => {
    if (state.replaying) return '⏳ 正在复盘...';
    if (state.status === 'checkmate')
      return `🏆 ${state.winner === 'red' ? '红方' : '黑方'}获胜（将死）`;
    if (state.status === 'stalemate')
      return `🏆 ${state.winner === 'red' ? '红方' : '黑方'}获胜（困毙）`;
    if (state.status === 'draw') return '🤝 和棋（30回合无吃子）';
    if (state.aiThinking) return '🤔 AI 思考中...';
    return `${state.currentPlayer === 'red' ? '🔴 红方' : '⚫ 黑方'}行棋`;
  })();

  const remainingNoCapture = Math.max(0, 60 - state.noCaptureCount);
  const canUndo = state.history.length > 0 && !state.replaying && !state.aiThinking && state.status === 'playing';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 14,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'linear-gradient(180deg, rgba(60, 35, 20, 0.9) 0%, rgba(40, 22, 12, 0.95) 100%)',
          border: '1px solid rgba(212, 169, 106, 0.35)',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div
            style={{
              color: '#f4e4bc',
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {statusText}
          </div>
          <div
            style={{
              color: '#c9a060',
              fontSize: 13,
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            和棋倒计时: {Math.ceil(remainingNoCapture / 2)} 步
          </div>
        </div>
      </div>

      <BoardCanvas
        state={state}
        cellSize={cellSize}
        pressedCell={pressedCell}
        animatingMove={animatingMove}
        onCellClick={handleCellClick}
        onCellPress={setPressedCell}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(40, 22, 12, 0.6)',
            borderRadius: 10,
            padding: '10px 16px',
            border: '1px solid rgba(212, 169, 106, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#c02020',
                boxShadow: '0 0 4px rgba(192, 32, 32, 0.6)',
              }}
            />
            <span style={{ color: '#f4e4bc', fontSize: 14, fontWeight: 500 }}>
              玩家（红方）
            </span>
          </div>
          <div
            style={{
              color: '#c9a060',
              fontSize: 13,
            }}
          >
            {state.status !== 'playing'
              ? state.winner === 'red'
                ? '🎉 胜利'
                : state.winner === 'black'
                ? '💔 失败'
                : '🤝 和棋'
              : state.currentPlayer === 'red' && !state.aiThinking
              ? '轮到你了'
              : '等待中...'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            style={{
              flex: 1,
              minWidth: 80,
              padding: '10px 14px',
              background: canUndo
                ? 'linear-gradient(180deg, #d4a96a 0%, #a87840 100%)'
                : 'rgba(120, 90, 60, 0.5)',
              color: canUndo ? '#2c1810' : 'rgba(244, 228, 188, 0.4)',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: canUndo ? 'pointer' : 'not-allowed',
              boxShadow: canUndo
                ? '0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : 'none',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => {
              if (canUndo) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
          >
            ↩ 悔棋
          </button>

          <button
            onClick={() => handleNewGame(state.difficulty)}
            style={{
              flex: 1,
              minWidth: 80,
              padding: '10px 14px',
              background: 'linear-gradient(180deg, #c02020 0%, #8b1818 100%)',
              color: '#fff8e0',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
          >
            🔄 新局
          </button>

          {showReplayBtn && (
            <button
              onClick={handleReplay}
              disabled={state.replaying}
              style={{
                flex: 1,
                minWidth: 80,
                padding: '10px 14px',
                background: state.replaying
                  ? 'rgba(120, 90, 60, 0.5)'
                  : 'linear-gradient(180deg, #4a8b5a 0%, #2d6b3d 100%)',
                color: state.replaying ? 'rgba(244, 228, 188, 0.4)' : '#fff8e0',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: state.replaying ? 'not-allowed' : 'pointer',
                boxShadow: !state.replaying
                  ? '0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  : 'none',
                transition: 'transform 0.1s',
              }}
              onMouseDown={(e) => {
                if (!state.replaying) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
            >
              🎬 复盘
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {(['easy', 'medium'] as const).map((d) => (
            <button
              key={d}
              onClick={() => handleNewGame(d)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background:
                  state.difficulty === d
                    ? 'linear-gradient(180deg, #d4a96a 0%, #a87840 100%)'
                    : 'rgba(60, 40, 25, 0.7)',
                color: state.difficulty === d ? '#2c1810' : '#c9a060',
                border:
                  state.difficulty === d
                    ? '1px solid rgba(244, 228, 188, 0.4)'
                    : '1px solid rgba(212, 169, 106, 0.25)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {d === 'easy' ? '🌟 简单模式' : '🧠 中等模式'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
