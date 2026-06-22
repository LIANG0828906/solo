import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Piece } from './Piece';
import {
  BOARD_SIZE,
  CELL_SIZE,
  MERCURY_POOL,
  COLORS,
  FISH_POOL_POSITIONS,
  BOI_POSITIONS,
} from '../utils/constants';
import type { Position, Particle } from '../types/game';

interface GameBoardProps {
  onBoardCenter: (center: { x: number; y: number }) => void;
}

export const GameBoard = ({ onBoardCenter }: GameBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const {
    pieces,
    fishCards,
    validMoves,
    selectedPiece,
    currentPlayer,
    selectPiece,
    movePiece,
    removeParticle,
    phase,
    showFishBoi,
    isAIThinking,
  } = useGameStore();

  useEffect(() => {
    const updateBoardCenter = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        onBoardCenter({ x: rect.left, y: rect.top });
      }
    };

    updateBoardCenter();
    window.addEventListener('resize', updateBoardCenter);
    return () => window.removeEventListener('resize', updateBoardCenter);
  }, [onBoardCenter]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particleSystem = {
      particles: [] as Particle[],
    };

    const animate = () => {
      const state = useGameStore.getState();
      const currentParticles = state.particles;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const updatedParticles: Particle[] = [];
      for (const p of currentParticles) {
        const newLife = p.life - 16;
        if (newLife > 0) {
          const updated = {
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2,
            life: newLife,
          };
          updatedParticles.push(updated);

          const alpha = newLife / p.maxLife;
          ctx.beginPath();
          ctx.arc(
            updated.x - (boardRef.current?.getBoundingClientRect().left || 0),
            updated.y - (boardRef.current?.getBoundingClientRect().top || 0),
            p.size,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(192, 192, 192, ${alpha})`;
          ctx.fill();
        } else {
          removeParticle(p.id);
        }
      }

      if (updatedParticles.length !== currentParticles.length) {
        const idsToRemove = currentParticles
          .filter((p) => p.life <= 16)
          .map((p) => p.id);
        for (const id of idsToRemove) {
          removeParticle(id);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [removeParticle]);

  const boardPixelSize = BOARD_SIZE * CELL_SIZE;

  const handleCellClick = (pos: Position) => {
    if (phase !== 'playing' || showFishBoi || isAIThinking) return;
    if (currentPlayer !== 'tiger') return;

    const isInValidMoves = validMoves.some((m) => m.x === pos.x && m.y === pos.y);
    if (isInValidMoves && selectedPiece) {
      movePiece(selectedPiece, pos);
    }
  };

  const handlePieceClick = (pieceId: string) => {
    if (phase !== 'playing' || showFishBoi || isAIThinking) return;
    if (currentPlayer !== 'tiger') return;
    selectPiece(pieceId);
  };

  const isValidMove = (x: number, y: number) => {
    return validMoves.some((m) => m.x === x && m.y === y);
  };

  const isBoiCell = (x: number, y: number) => {
    return BOI_POSITIONS.some((p) => p.x === x && p.y === y);
  };

  const availableFish = fishCards.filter((f) => !f.isCaught);

  return (
    <div ref={boardRef} style={{ position: 'relative' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: boardPixelSize,
          height: boardPixelSize,
          position: 'relative',
          backgroundColor: COLORS.stoneGray,
          border: `8px solid ${COLORS.darkGold}`,
          borderRadius: '4px',
          boxShadow: `0 0 30px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.5)`,
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(0, 0, 0, 0.1) 10px,
              rgba(0, 0, 0, 0.1) 20px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(0, 0, 0, 0.05) 10px,
              rgba(0, 0, 0, 0.05) 20px
            )
          `,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
            const x = index % BOARD_SIZE;
            const y = Math.floor(index / BOARD_SIZE);
            const isInPool =
              x >= MERCURY_POOL.x &&
              x < MERCURY_POOL.x + MERCURY_POOL.width &&
              y >= MERCURY_POOL.y &&
              y < MERCURY_POOL.y + MERCURY_POOL.height;
            const validMove = isValidMove(x, y);
            const boiCell = isBoiCell(x, y);

            return (
              <div
                key={index}
                onClick={() => handleCellClick({ x, y })}
                style={{
                  position: 'relative',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  cursor: validMove ? 'pointer' : 'default',
                  backgroundColor: isInPool ? 'transparent' : 'transparent',
                }}
              >
                {validMove && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      inset: '4px',
                      backgroundColor: 'rgba(255, 215, 0, 0.3)',
                      border: `2px dashed ${COLORS.gold}`,
                      borderRadius: '4px',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {boiCell && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '2px',
                      border: `2px solid ${COLORS.bronzeYellow}`,
                      borderRadius: '4px',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '12px',
                        color: COLORS.bronzeYellow,
                        opacity: 0.7,
                      }}
                    >
                      博
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            left: MERCURY_POOL.x * CELL_SIZE,
            top: MERCURY_POOL.y * CELL_SIZE,
            width: MERCURY_POOL.width * CELL_SIZE,
            height: MERCURY_POOL.height * CELL_SIZE,
            background: `linear-gradient(135deg, ${COLORS.mercuryLight} 0%, ${COLORS.mercuryDark} 50%, ${COLORS.mercuryLight} 100%)`,
            boxShadow: `inset 0 0 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(192, 192, 192, 0.5)`,
            borderRadius: '4px',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <svg
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: 0.3,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.circle
                key={i}
                cx="50%"
                cy="50%"
                r={20 + i * 30}
                fill="none"
                stroke="white"
                strokeWidth="1"
                animate={{
                  r: [20 + i * 30, 40 + i * 30, 20 + i * 30],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </svg>

          {availableFish.map((fish) => {
            const pos = FISH_POOL_POSITIONS[fish.poolIndex % FISH_POOL_POSITIONS.length];
            return (
              <motion.div
                key={fish.id}
                animate={{
                  y: [0, -3, 0],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  left: (pos.x - MERCURY_POOL.x) * CELL_SIZE + CELL_SIZE / 2 - 15,
                  top: (pos.y - MERCURY_POOL.y) * CELL_SIZE + CELL_SIZE / 2 - 10,
                  fontSize: '30px',
                  filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.6))',
                  transformOrigin: 'center',
                }}
              >
                🐟
              </motion.div>
            );
          })}
        </div>

        {pieces.map((piece) => (
          <Piece
            key={piece.id}
            piece={piece}
            onClick={() => handlePieceClick(piece.id)}
            isInteractive={piece.player === currentPlayer && currentPlayer === 'tiger'}
          />
        ))}

        <canvas
          ref={canvasRef}
          width={boardPixelSize}
          height={boardPixelSize}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 30,
          }}
        />
      </motion.div>
    </div>
  );
};
