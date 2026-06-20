import React, { useEffect, useRef, useState } from 'react';
import { BoardState, MoveRecord, Piece, Position, PIECE_NAMES } from '../../shared/types';

interface ReplayProps {
  moveHistory: MoveRecord[];
  pgn: string;
  onBack: () => void;
}

const CELL_SIZE = 56;
const PADDING = 28;
const COLS = 9;
const ROWS = 10;

function posToPixel(pos: Position): { x: number; y: number } {
  return {
    x: PADDING + pos.col * CELL_SIZE,
    y: PADDING + pos.row * CELL_SIZE,
  };
}

const Replay: React.FC<ReplayProps> = ({ moveHistory, pgn, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [board, setBoard] = useState<BoardState | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const buildBoardAtStep = (step: number): BoardState => {
    const initialBoard: BoardState = Array.from({ length: 10 }, () => Array(9).fill(null));
    const backRow: string[] = ['rook', 'knight', 'bishop', 'advisor', 'king', 'advisor', 'bishop', 'knight', 'rook'];

    for (let c = 0; c < 9; c++) {
      initialBoard[0][c] = { type: backRow[c] as any, color: 'black' };
      initialBoard[9][c] = { type: backRow[c] as any, color: 'red' };
    }
    initialBoard[2][1] = { type: 'cannon', color: 'black' };
    initialBoard[2][7] = { type: 'cannon', color: 'black' };
    initialBoard[7][1] = { type: 'cannon', color: 'red' };
    initialBoard[7][7] = { type: 'cannon', color: 'red' };
    for (let c = 0; c < 9; c += 2) {
      initialBoard[3][c] = { type: 'pawn', color: 'black' };
      initialBoard[6][c] = { type: 'pawn', color: 'red' };
    }

    for (let i = 0; i < step && i < moveHistory.length; i++) {
      const move = moveHistory[i];
      initialBoard[move.to.row][move.to.col] = initialBoard[move.from.row][move.from.col];
      initialBoard[move.from.row][move.from.col] = null;
    }

    return initialBoard;
  };

  useEffect(() => {
    setBoard(buildBoardAtStep(currentStep));
  }, [currentStep, moveHistory]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= moveHistory.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, moveHistory.length]);

  const boardWidth = PADDING * 2 + (COLS - 1) * CELL_SIZE;
  const boardHeight = PADDING * 2 + (ROWS - 1) * CELL_SIZE;

  const drawBoardLines = () => {
    const lines: React.ReactNode[] = [];
    let key = 0;

    for (let r = 0; r < ROWS; r++) {
      const y = PADDING + r * CELL_SIZE;
      lines.push(
        <line key={key++} x1={PADDING} y1={y} x2={PADDING + 8 * CELL_SIZE} y2={y}
          stroke="#5C3317" strokeWidth={r === 0 || r === 9 ? 2 : 1} />
      );
    }
    for (let c = 0; c < COLS; c++) {
      const x = PADDING + c * CELL_SIZE;
      lines.push(
        <line key={key++} x1={x} y1={PADDING} x2={x} y2={PADDING + 4 * CELL_SIZE}
          stroke="#5C3317" strokeWidth={c === 0 || c === 8 ? 2 : 1} />
      );
      lines.push(
        <line key={key++} x1={x} y1={PADDING + 5 * CELL_SIZE} x2={x} y2={PADDING + 9 * CELL_SIZE}
          stroke="#5C3317" strokeWidth={c === 0 || c === 8 ? 2 : 1} />
      );
    }
    lines.push(
      <line key={key++} x1={PADDING} y1={PADDING} x2={PADDING} y2={PADDING + 9 * CELL_SIZE} stroke="#5C3317" strokeWidth={2} />,
      <line key={key++} x1={PADDING + 8 * CELL_SIZE} y1={PADDING} x2={PADDING + 8 * CELL_SIZE} y2={PADDING + 9 * CELL_SIZE} stroke="#5C3317" strokeWidth={2} />
    );

    const drawPalace = (startRow: number) => {
      const x1 = PADDING + 3 * CELL_SIZE;
      const y1 = PADDING + startRow * CELL_SIZE;
      const x2 = PADDING + 5 * CELL_SIZE;
      const y2 = PADDING + (startRow + 2) * CELL_SIZE;
      lines.push(<line key={key++} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5C3317" strokeWidth={1} />);
      lines.push(<line key={key++} x1={x2} y1={y1} x2={x1} y2={y2} stroke="#5C3317" strokeWidth={1} />);
    };
    drawPalace(0);
    drawPalace(7);

    const riverY1 = PADDING + 4 * CELL_SIZE;
    const riverY2 = PADDING + 5 * CELL_SIZE;
    lines.push(
      <text key={key++} x={PADDING + 2 * CELL_SIZE} y={(riverY1 + riverY2) / 2 + 6}
        textAnchor="middle" fill="#5C3317" fontSize="22" fontFamily="KaiTi, STKaiti, serif" fontWeight="bold">楚 河</text>,
      <text key={key++} x={PADDING + 6 * CELL_SIZE} y={(riverY1 + riverY2) / 2 + 6}
        textAnchor="middle" fill="#5C3317" fontSize="22" fontFamily="KaiTi, STKaiti, serif" fontWeight="bold">汉 界</text>
    );

    return lines;
  };

  return (
    <div className="replay-container">
      <div className="board-wrapper">
        <div style={{ width: boardWidth, height: boardHeight, position: 'relative' }}>
          <svg width={boardWidth} height={boardHeight} className="board-lines">
            {drawBoardLines()}
          </svg>

          {board?.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null;
              const px = posToPixel({ row: r, col: c });
              const name = PIECE_NAMES[cell.type][cell.color];
              return (
                <div
                  key={`rp-${r}-${c}`}
                  className={`piece ${cell.color}`}
                  style={{ left: px.x - 24, top: px.y - 24 }}
                >
                  {name}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="replay-controls">
        <button onClick={() => setCurrentStep(0)}>⏮</button>
        <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))}>◀</button>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={() => setCurrentStep(s => Math.min(moveHistory.length, s + 1))}>▶</button>
        <button onClick={() => setCurrentStep(moveHistory.length)}>⏭</button>
        <input
          type="range"
          className="replay-progress"
          min={0}
          max={moveHistory.length}
          value={currentStep}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentStep(Number(e.target.value));
          }}
        />
        <span className="replay-step-info">{currentStep}/{moveHistory.length}</span>
      </div>

      {currentStep > 0 && moveHistory[currentStep - 1] && (
        <div style={{ color: '#8B0000', fontWeight: 600, fontSize: 16 }}>
          {moveHistory[currentStep - 1].notation}
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>
          返回大厅
        </button>
      </div>
    </div>
  );
};

export default Replay;
