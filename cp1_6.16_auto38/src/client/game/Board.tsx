import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BoardState, CellState, Piece, PieceColor, Position } from '../../shared/types';
import { GameManager } from './GameManager';
import PieceComponent from './Piece';

interface BoardProps {
  gameManager: GameManager;
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

function pixelToPos(px: number, py: number): Position {
  const col = Math.round((px - PADDING) / CELL_SIZE);
  const row = Math.round((py - PADDING) / CELL_SIZE);
  if (row >= 0 && row <= 9 && col >= 0 && col <= 8) {
    return { row, col };
  }
  return { row: -1, col: -1 };
}

const Board: React.FC<BoardProps> = ({ gameManager }) => {
  const [board, setBoard] = useState<BoardState | null>(null);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [draggingPos, setDraggingPos] = useState<Position | null>(null);
  const [dragPixelPos, setDragPixelPos] = useState<{ x: number; y: number } | null>(null);
  const [placedPos, setPlacedPos] = useState<Position | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const myColor = gameManager.getMyColor();
  const isMyTurn = gameManager.isMyTurn();

  useEffect(() => {
    const handleEvent = (event: string, data?: any) => {
      if (event === 'stateUpdate' || event === 'gameStart') {
        const gs = gameManager.getGameState();
        if (gs) setBoard(gs.board.map(row => row.map(cell => cell ? { ...cell } : null)));
      }
      if (event === 'selectionChanged') {
        setSelectedPos(data.selectedPos);
        setValidMoves(data.validMoves);
      }
      if (event === 'moveMade') {
        setPlacedPos(data.to);
        setTimeout(() => setPlacedPos(null), 250);
      }
      if (event === 'dragUpdate') {
        setDraggingPos(data.dragging ? data.pos : null);
        setDragPixelPos(data.pixelPos);
      }
    };

    gameManager.onEvent(handleEvent);

    const gs = gameManager.getGameState();
    if (gs) {
      setBoard(gs.board.map(row => row.map(cell => cell ? { ...cell } : null)));
    }

    return () => gameManager.removeEvent(handleEvent);
  }, [gameManager]);

  const handleBoardClick = useCallback((e: React.MouseEvent) => {
    if (!boardRef.current || !board) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = pixelToPos(x, y);

    if (pos.row < 0) return;

    const piece = board[pos.row][pos.col];

    if (selectedPos && validMoves.some(m => m.row === pos.row && m.col === pos.col)) {
      gameManager.movePiece(pos);
    } else if (piece && piece.color === myColor) {
      gameManager.selectPiece(pos);
    } else {
      gameManager.clearSelection();
    }
  }, [board, selectedPos, validMoves, myColor, gameManager]);

  const handlePieceClick = useCallback((pos: Position) => {
    if (!board) return;
    const piece = board[pos.row][pos.col];

    if (selectedPos && validMoves.some(m => m.row === pos.row && m.col === pos.col)) {
      gameManager.movePiece(pos);
    } else if (piece && piece.color === myColor) {
      gameManager.selectPiece(pos);
    }
  }, [board, selectedPos, validMoves, myColor, gameManager]);

  const handleDragStart = useCallback((pos: Position, e: React.MouseEvent) => {
    gameManager.selectPiece(pos);
    setDraggingPos(pos);
    setDragPixelPos({ x: e.clientX - (boardRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (boardRef.current?.getBoundingClientRect().top || 0) });
    gameManager.setDragging(true, pos, { x: e.clientX - (boardRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (boardRef.current?.getBoundingClientRect().top || 0) });
  }, [gameManager]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingPos || !boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setDragPixelPos({ x: px, y: py });
      gameManager.setDragging(true, draggingPos, { x: px, y: py });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggingPos || !boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pos = pixelToPos(x, y);

      if (pos.row >= 0 && validMoves.some(m => m.row === pos.row && m.col === pos.col)) {
        gameManager.movePiece(pos);
      }

      setDraggingPos(null);
      setDragPixelPos(null);
      gameManager.setDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingPos, validMoves, gameManager]);

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

    const drawCross = (row: number, col: number) => {
      const cx = PADDING + col * CELL_SIZE;
      const cy = PADDING + row * CELL_SIZE;
      const d = 8;
      const g = 4;
      if (col > 0) {
        lines.push(<line key={key++} x1={cx - g} y1={cy - g} x2={cx - g - d} y2={cy - g} stroke="#5C3317" strokeWidth={1} />);
        lines.push(<line key={key++} x1={cx - g} y1={cy - g} x2={cx - g} y2={cy - g - d} stroke="#5C3317" strokeWidth={1} />);
        lines.push(<line key={key++} x1={cx - g} y1={cy + g} x2={cx - g - d} y2={cy + g} stroke="#5C3317" strokeWidth={1} />);
        lines.push(<line key={key++} x1={cx - g} y1={cy + g} x2={cx - g} y2={cy + g + d} stroke="#5C3317" strokeWidth={1} />);
      }
      if (col < 8) {
        lines.push(<line key={key++} x1={cx + g} y1={cy - g} x2={cx + g + d} y2={cy - g} stroke="#5C3317" strokeWidth={1} />);
        lines.push(<line key={key++} x1={cx + g} y1={cy - g} x2={cx + g} y2={cy - g - d} stroke="#5C3317" strokeWidth={1} />);
        lines.push(<line key={key++} x1={cx + g} y1={cy + g} x2={cx + g + d} y2={cy + g} stroke="#5C3317" strokeWidth={1} />);
        lines.push(<line key={key++} x1={cx + g} y1={cy + g} x2={cx + g} y2={cy + g + d} stroke="#5C3317" strokeWidth={1} />);
      }
    };

    drawCross(2, 1); drawCross(2, 7);
    drawCross(7, 1); drawCross(7, 7);
    for (let c = 0; c < 9; c += 2) {
      drawCross(3, c);
      drawCross(6, c);
    }

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

  if (!board) {
    return (
      <div className="board-wrapper">
        <div style={{ width: boardWidth, height: boardHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B6914' }}>
          等待对局开始...
        </div>
      </div>
    );
  }

  return (
    <div className="board-wrapper">
      <div
        className="board-grid"
        ref={boardRef}
        style={{ width: boardWidth, height: boardHeight, position: 'relative' }}
        onClick={handleBoardClick}
      >
        <svg width={boardWidth} height={boardHeight} className="board-lines">
          {drawBoardLines()}
        </svg>

        {validMoves.map((pos, i) => {
          const px = posToPixel(pos);
          const target = board[pos.row][pos.col];
          return (
            <div
              key={`vm-${i}`}
              className={`valid-move-dot ${target ? 'capture' : ''}`}
              style={{ left: px.x, top: px.y }}
            />
          );
        })}

        {board.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            const pos = { row: r, col: c };
            const px = posToPixel(pos);
            const isSelected = selectedPos?.row === r && selectedPos?.col === c;
            const isMyPiece = cell.color === myColor;
            const isPlaced = placedPos?.row === r && placedPos?.col === c;

            return (
              <div key={`p-${r}-${c}`} className={isPlaced ? 'placed' : ''}>
                <PieceComponent
                  piece={cell}
                  pos={pos}
                  isSelected={isSelected}
                  isMyPiece={isMyPiece}
                  isMyTurn={isMyTurn}
                  pixelPos={px}
                  isDragging={!!draggingPos}
                  dragPixelPos={isSelected ? dragPixelPos : null}
                  onClick={handlePieceClick}
                  onDragStart={handleDragStart}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Board;
