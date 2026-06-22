import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LetterPosition, getGridSize } from './utils';

interface GameBoardProps {
  letterPool: string[][];
  usedPositions: Set<string>;
  currentWord: LetterPosition[];
  onAddLetter: (position: LetterPosition) => void;
  onRemoveLetter: (index: number) => void;
  onClearWord: () => void;
  onSubmitWord: () => void;
  isShaking: boolean;
  isMobile: boolean;
  disabled?: boolean;
}

interface DragState {
  isDragging: boolean;
  letter: string;
  row: number;
  col: number;
  mouseX: number;
  mouseY: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  letterPool,
  usedPositions,
  currentWord,
  onAddLetter,
  onRemoveLetter,
  onClearWord,
  onSubmitWord,
  isShaking,
  isMobile,
  disabled = false
}) => {
  const gridSize = getGridSize(isMobile);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [bounceIndex, setBounceIndex] = useState<number | null>(null);
  const wordSlotRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, letter: string, row: number, col: number) => {
    if (disabled) return;
    const posKey = `${row}-${col}`;
    if (usedPositions.has(posKey)) return;
    
    e.preventDefault();
    setDragState({
      isDragging: true,
      letter,
      row,
      col,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
  }, [usedPositions, disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState?.isDragging) return;
    
    setDragState(prev => prev ? {
      ...prev,
      mouseX: e.clientX,
      mouseY: e.clientY
    } : null);

    if (wordSlotRef.current) {
      const rect = wordSlotRef.current.getBoundingClientRect();
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;
      setIsDragOver(isOver);
    }
  }, [dragState?.isDragging]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState?.isDragging) return;

    if (wordSlotRef.current) {
      const rect = wordSlotRef.current.getBoundingClientRect();
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (isOver) {
        onAddLetter({
          letter: dragState.letter,
          row: dragState.row,
          col: dragState.col
        });
        setBounceIndex(currentWord.length);
        setTimeout(() => setBounceIndex(null), 200);
      }
    }

    setDragState(null);
    setIsDragOver(false);
  }, [dragState, onAddLetter, currentWord.length]);

  useEffect(() => {
    if (dragState?.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState?.isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = useCallback((e: React.TouchEvent, letter: string, row: number, col: number) => {
    if (disabled) return;
    const posKey = `${row}-${col}`;
    if (usedPositions.has(posKey)) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    setDragState({
      isDragging: true,
      letter,
      row,
      col,
      mouseX: touch.clientX,
      mouseY: touch.clientY
    });
  }, [usedPositions, disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState?.isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    setDragState(prev => prev ? {
      ...prev,
      mouseX: touch.clientX,
      mouseY: touch.clientY
    } : null);

    if (wordSlotRef.current) {
      const rect = wordSlotRef.current.getBoundingClientRect();
      const isOver = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                     touch.clientY >= rect.top && touch.clientY <= rect.bottom;
      setIsDragOver(isOver);
    }
  }, [dragState?.isDragging]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!dragState?.isDragging) return;

    const touch = e.changedTouches[0];
    if (wordSlotRef.current) {
      const rect = wordSlotRef.current.getBoundingClientRect();
      const isOver = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                     touch.clientY >= rect.top && touch.clientY <= rect.bottom;

      if (isOver) {
        onAddLetter({
          letter: dragState.letter,
          row: dragState.row,
          col: dragState.col
        });
        setBounceIndex(currentWord.length);
        setTimeout(() => setBounceIndex(null), 200);
      }
    }

    setDragState(null);
    setIsDragOver(false);
  }, [dragState, onAddLetter, currentWord.length]);

  useEffect(() => {
    if (dragState?.isDragging) {
      const options = { passive: false };
      window.addEventListener('touchmove', handleTouchMove, options);
      window.addEventListener('touchend', handleTouchEnd, options);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragState?.isDragging, handleTouchMove, handleTouchEnd]);

  const handleLetterClick = useCallback((letter: string, row: number, col: number) => {
    if (disabled) return;
    const posKey = `${row}-${col}`;
    if (usedPositions.has(posKey)) return;
    
    onAddLetter({ letter, row, col });
    setBounceIndex(currentWord.length);
    setTimeout(() => setBounceIndex(null), 200);
  }, [usedPositions, onAddLetter, currentWord.length, disabled]);

  const handleSlotLetterClick = useCallback((index: number) => {
    if (disabled) return;
    onRemoveLetter(index);
  }, [onRemoveLetter, disabled]);

  return (
    <div className="main-game-area">
      <div className="word-slot-container">
        <div
          ref={wordSlotRef}
          className={`word-slot ${isDragOver ? 'drag-over' : ''} ${isShaking ? 'shaking' : ''}`}
        >
          {currentWord.length === 0 ? (
            <span style={{ color: '#64748B', fontSize: '14px' }}>
              拖拽或点击字母到这里组成单词
            </span>
          ) : (
            currentWord.map((item, index) => (
              <div
                key={`${item.row}-${item.col}-${index}`}
                className={`word-slot-letter ${bounceIndex === index ? 'bounce-in' : ''}`}
                onClick={() => handleSlotLetterClick(index)}
              >
                {item.letter}
              </div>
            ))
          )}
        </div>
        
        <div className="slot-controls">
          <button
            className="clear-btn"
            onClick={onClearWord}
            disabled={disabled || currentWord.length === 0}
          >
            清空
          </button>
          <button
            className="confirm-btn"
            onClick={onSubmitWord}
            disabled={disabled || currentWord.length < 3}
          >
            确认提交
          </button>
        </div>
      </div>

      <div
        className="letter-grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, var(--cell-size))`,
          gridTemplateRows: `repeat(${gridSize}, var(--cell-size))`
        }}
      >
        {letterPool.map((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const posKey = `${rowIndex}-${colIndex}`;
            const isUsed = usedPositions.has(posKey);
            const isDraggingThis = dragState?.isDragging && 
                                   dragState.row === rowIndex && 
                                   dragState.col === colIndex;
            
            return (
              <div
                key={posKey}
                className={`letter-cell ${isUsed ? 'used' : ''} ${isDraggingThis ? 'dragging' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, letter, rowIndex, colIndex)}
                onTouchStart={(e) => handleTouchStart(e, letter, rowIndex, colIndex)}
                onClick={() => handleLetterClick(letter, rowIndex, colIndex)}
              >
                {letter}
              </div>
            );
          })
        )}
      </div>

      {dragState?.isDragging && (
        <div
          className="drag-ghost"
          style={{
            left: dragState.mouseX,
            top: dragState.mouseY
          }}
        >
          {dragState.letter}
        </div>
      )}
    </div>
  );
};

export default React.memo(GameBoard);
