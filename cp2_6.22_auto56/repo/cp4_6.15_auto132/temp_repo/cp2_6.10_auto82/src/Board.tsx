import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from './store';
import { analyzeShape, getPositionKey } from './utils';
import { Position, ShapeAnalysis } from './types';

const BOARD_SIZE = 19;
const CELL_SIZE = 28;
const PADDING = 20;
const BOARD_WIDTH = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2;
const STAR_POINTS = [
  [3, 3], [3, 9], [3, 15],
  [9, 3], [9, 9], [9, 15],
  [15, 3], [15, 9], [15, 15]
];

const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPos, setHoverPos] = useState<Position | null>(null);
  const [shapeAnalysis, setShapeAnalysis] = useState<ShapeAnalysis | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const {
    board,
    moveHistory,
    currentMoveIndex,
    gameMode,
    currentPlayer,
    isGameOver,
    shaking,
    fadingStones,
    lastMove,
    aiPulsePosition,
    deadBlocks,
    placeUserStone,
    prevManualMove,
    nextManualMove,
    endGame,
    capturedBlack,
    capturedWhite,
    blackTerritory,
    whiteTerritory,
    selectedManual,
    manualProgress
  } = useGameStore();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const displayBoard = useMemo(() => {
    if (currentMoveIndex < 0 || moveHistory.length === 0) {
      return board.map(row => [...row]);
    }
    
    const tempBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    for (let i = 0; i <= currentMoveIndex; i++) {
      const move = moveHistory[i];
      tempBoard[move.position.row][move.position.col] = move.color;
    }
    return tempBoard;
  }, [moveHistory, currentMoveIndex, board]);

  const currentMove = useMemo(() => {
    if (currentMoveIndex >= 0 && currentMoveIndex < moveHistory.length) {
      return moveHistory[currentMoveIndex];
    }
    return null;
  }, [moveHistory, currentMoveIndex]);

  useEffect(() => {
    if (currentMove && currentMoveIndex >= 0) {
      const analysis = analyzeShape(displayBoard, currentMove.position, currentMove.color);
      setShapeAnalysis(analysis);
    } else {
      setShapeAnalysis(null);
    }
  }, [currentMove, displayBoard, currentMoveIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startTime = performance.now();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = isMobile ? 0.8 : 1;
    const actualCellSize = CELL_SIZE * scale;
    const actualPadding = PADDING * scale;
    const actualWidth = BOARD_WIDTH * scale;

    canvas.width = actualWidth;
    canvas.height = actualWidth;

    const gradient = ctx.createLinearGradient(0, 0, actualWidth, actualWidth);
    gradient.addColorStop(0, '#c4a46c');
    gradient.addColorStop(0.5, '#b8956a');
    gradient.addColorStop(1, '#8b5e3c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, actualWidth, actualWidth);

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? 'rgba(255, 235, 205, 0.15)' : 'rgba(139, 90, 43, 0.15)';
        const x = actualPadding + col * actualCellSize - actualCellSize / 2;
        const y = actualPadding + row * actualCellSize - actualCellSize / 2;
        if (x >= 0 && y >= 0) {
          ctx.fillRect(x, y, actualCellSize, actualCellSize);
        }
      }
    }

    ctx.strokeStyle = '#1a0a00';
    ctx.lineWidth = 0.8 * scale;

    for (let i = 0; i < BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(actualPadding, actualPadding + i * actualCellSize);
      ctx.lineTo(actualPadding + (BOARD_SIZE - 1) * actualCellSize, actualPadding + i * actualCellSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(actualPadding + i * actualCellSize, actualPadding);
      ctx.lineTo(actualPadding + i * actualCellSize, actualPadding + (BOARD_SIZE - 1) * actualCellSize);
      ctx.stroke();
    }

    ctx.fillStyle = '#1a0a00';
    for (const [row, col] of STAR_POINTS) {
      ctx.beginPath();
      ctx.arc(
        actualPadding + col * actualCellSize,
        actualPadding + row * actualCellSize,
        3 * scale,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const deadStoneKeys = new Set<string>();
    for (const block of deadBlocks) {
      for (const pos of block) {
        deadStoneKeys.add(getPositionKey(pos));
      }
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const stone = displayBoard[row][col];
        if (stone) {
          const x = actualPadding + col * actualCellSize;
          const y = actualPadding + row * actualCellSize;
          const radius = (actualCellSize * 0.45);

          const isFading = fadingStones.some(p => p.row === row && p.col === col);
          const isDead = deadStoneKeys.has(getPositionKey({ row, col }));

          ctx.save();
          if (isFading) {
            ctx.globalAlpha = 0.3;
          }

          if (isDead) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8 * scale;
          }

          const stoneGradient = ctx.createRadialGradient(
            x - radius * 0.3,
            y - radius * 0.3,
            0,
            x,
            y,
            radius
          );

          if (stone === 'black') {
            stoneGradient.addColorStop(0, '#4a4a4a');
            stoneGradient.addColorStop(0.3, '#2a2a2a');
            stoneGradient.addColorStop(1, '#0a0a0a');
          } else {
            stoneGradient.addColorStop(0, '#ffffff');
            stoneGradient.addColorStop(0.5, '#f0f0f0');
            stoneGradient.addColorStop(1, '#d0d0d0');
          }

          ctx.fillStyle = stoneGradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = stone === 'black' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = stone === 'black' ? '#000000' : '#a0a0a0';
          ctx.lineWidth = 0.5 * scale;
          ctx.stroke();

          ctx.restore();

          const isLastMove = lastMove && lastMove.row === row && lastMove.col === col;
          if (isLastMove && !isFading) {
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }

    if (aiPulsePosition) {
      const x = actualPadding + aiPulsePosition.col * actualCellSize;
      const y = actualPadding + aiPulsePosition.row * actualCellSize;
      const time = (Date.now() % 1000) / 1000;
      const pulseRadius = (actualCellSize * 0.5) * (1 + time * 0.5);
      
      ctx.strokeStyle = `rgba(0, 150, 255, ${1 - time})`;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (hoverPos && gameMode === 'free' && currentPlayer === 'black' && !isGameOver) {
      const x = actualPadding + hoverPos.col * actualCellSize;
      const y = actualPadding + hoverPos.row * actualCellSize;
      const radius = actualCellSize * 0.45;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > 5) {
      console.warn(`Canvas绘制耗时: ${elapsed.toFixed(2)}ms`);
    }
  }, [displayBoard, hoverPos, isMobile, fadingStones, lastMove, aiPulsePosition, deadBlocks, gameMode, currentPlayer, isGameOver]);

  useEffect(() => {
    if (aiPulsePosition) {
      const interval = setInterval(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const scale = isMobile ? 0.8 : 1;
            const actualPadding = PADDING * scale;
            const actualCellSize = CELL_SIZE * scale;
            const x = actualPadding + aiPulsePosition.col * actualCellSize;
            const y = actualPadding + aiPulsePosition.row * actualCellSize;
            const time = (Date.now() % 1000) / 1000;
            const radius = (actualCellSize * 0.5) * (1 + time * 0.5);
            
            ctx.strokeStyle = `rgba(0, 150, 255, ${1 - time})`;
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [aiPulsePosition, isMobile]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = isMobile ? 0.8 : 1;
    const actualPadding = PADDING * scale;
    const actualCellSize = CELL_SIZE * scale;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round((x - actualPadding) / actualCellSize);
    const row = Math.round((y - actualPadding) / actualCellSize);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      if (gameMode === 'free') {
        placeUserStone({ row, col });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = isMobile ? 0.8 : 1;
    const actualPadding = PADDING * scale;
    const actualCellSize = CELL_SIZE * scale;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round((x - actualPadding) / actualCellSize);
    const row = Math.round((y - actualPadding) / actualCellSize);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && displayBoard[row][col] === null) {
      setHoverPos({ row, col });
    } else {
      setHoverPos(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full max-w-xl px-2">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded bg-black text-white text-sm">
            黑提: {capturedWhite}
          </div>
          <div className="px-3 py-1 rounded bg-white text-black border text-sm">
            白提: {capturedBlack}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded bg-black text-white text-sm">
            黑空: {blackTerritory}
          </div>
          <div className="px-3 py-1 rounded bg-white text-black border text-sm">
            白空: {whiteTerritory}
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative"
        style={{
          border: `8px solid #8b7d6b`,
          borderRadius: '4px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.1)',
          backgroundImage: `
            linear-gradient(135deg, rgba(139, 90, 43, 0.2) 0%, transparent 50%),
            linear-gradient(225deg, rgba(92, 58, 30, 0.3) 0%, transparent 50%)
          `
        }}
      >
        <motion.div
          animate={shaking ? {
            x: [0, 2, -2, 2, -2, 0],
            transition: { duration: 0.1 }
          } : {}}
        >
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverPos(null)}
            style={{
              cursor: gameMode === 'free' && currentPlayer === 'black' && !isGameOver ? 'pointer' : 'default',
              display: 'block'
            }}
          />
        </motion.div>
      </div>

      {deadBlocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold"
        >
          ⚠️ 此块棋已死！
        </motion.div>
      )}

      {shapeAnalysis && currentMove && (
        <div className="w-full max-w-xl p-4 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #faf0e6 0%, #f5e6d3 100%)',
            border: '2px solid #8b7d6b'
          }}>
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-lg">
              第 {currentMove.moveNumber} 手 ({currentMove.color === 'black' ? '黑' : '白'})
            </span>
            <span className="px-2 py-1 rounded text-sm"
              style={{ backgroundColor: '#2b5e3c', color: 'white' }}>
              {shapeAnalysis.patternName}
            </span>
          </div>
          <p className="text-sm mb-1">
            <span className="font-semibold">位置：</span>
            {shapeAnalysis.description}
          </p>
          <p className="text-sm">
            <span className="font-semibold">AI建议：</span>
            {shapeAnalysis.suggestion}
          </p>
        </div>
      )}

      {gameMode === 'manual' && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xl">
          <div className="flex justify-between w-full">
            <span className="text-sm">
              棋谱: {selectedManual?.name} | 进度: {Math.min(manualProgress, selectedManual?.totalMoves || 0)}/{selectedManual?.totalMoves}
            </span>
            <span className="text-sm">
              当前: {currentMoveIndex + 1}/{moveHistory.length}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={prevManualMove}
              disabled={currentMoveIndex <= 0}
              className="px-4 py-2 rounded font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #8b7d6b 0%, #6b5d4b 100%)',
                color: 'white',
                border: '2px solid #5c3a1e'
              }}
            >
              ◀ 上一手
            </button>
            <button
              onClick={nextManualMove}
              disabled={manualProgress >= (selectedManual?.totalMoves || 0) && currentMoveIndex >= moveHistory.length - 1}
              className="px-4 py-2 rounded font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #2b5e3c 0%, #1a4e2c 100%)',
                color: 'white',
                border: '2px solid #1a3a1e'
              }}
            >
              下一手 ▶
            </button>
            <button
              onClick={endGame}
              className="px-4 py-2 rounded font-semibold transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8b0000 0%, #5c0000 100%)',
                color: 'white',
                border: '2px solid #3c0000'
              }}
            >
              结束打谱
            </button>
          </div>
        </div>
      )}

      {gameMode === 'free' && !isGameOver && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xl">
          <div className="text-lg font-bold">
            当前轮到:
            <span className={currentPlayer === 'black' ? 'text-black' : 'text-gray-400'}>
              {' '}{currentPlayer === 'black' ? '⚫ 黑方 (您)' : '⚪ 白方 (AI)'}
            </span>
          </div>
          <button
            onClick={endGame}
            className="px-6 py-2 rounded font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #8b0000 0%, #5c0000 100%)',
              color: 'white',
              border: '2px solid #3c0000'
            }}
          >
            结束对弈
          </button>
        </div>
      )}

      {isGameOver && gameMode === 'free' && (
        <div className="text-center">
          <p className="text-lg font-bold">
            对弈结束！黑方 {blackTerritory + capturedWhite} 目 vs 白方 {whiteTerritory + capturedBlack + 6.5} 目
          </p>
        </div>
      )}
    </div>
  );
};

export default Board;
