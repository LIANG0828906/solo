import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Piece as PieceType } from '../types/game';
import { CELL_SIZE, COLORS } from '../utils/constants';

interface PieceProps {
  piece: PieceType;
  onClick: () => void;
  isInteractive: boolean;
}

export const Piece = memo(function Piece({ piece, onClick, isInteractive }: PieceProps) {
  const isTiger = piece.type === 'tiger';
  const color = isTiger ? COLORS.tigerRed : COLORS.leopardBlue;
  const size = CELL_SIZE * (isTiger ? 1.8 : 0.9);

  return (
    <motion.div
      layout
      transition={{
        type: 'tween',
        duration: 0.3,
        ease: 'easeOut',
      }}
      style={{
        position: 'absolute',
        left: piece.position.x * CELL_SIZE + CELL_SIZE / 2,
        top: piece.position.y * CELL_SIZE + CELL_SIZE / 2,
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        cursor: isInteractive ? 'pointer' : 'default',
        zIndex: piece.isSelected ? 20 : 10,
        perspective: '500px',
      }}
      onClick={isInteractive ? onClick : undefined}
    >
      <motion.div
        animate={piece.isSelected ? {
          boxShadow: [
            `0 0 20px ${COLORS.gold}, 0 0 40px ${COLORS.gold}`,
            `0 0 30px ${COLORS.gold}, 0 0 60px ${COLORS.gold}`,
            `0 0 20px ${COLORS.gold}, 0 0 40px ${COLORS.gold}`,
          ],
        } : {}}
        transition={{
          boxShadow: {
            duration: 1.5,
            repeat: Infinity,
          },
        }}
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(20deg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: color,
            borderRadius: isTiger ? '50% 50% 45% 45%' : '40%',
            transform: 'translateZ(10px)',
            boxShadow: `inset 0 -5px 15px rgba(0,0,0,0.4), inset 0 5px 15px rgba(255,255,255,0.2), 0 5px 15px rgba(0,0,0,0.5)`,
            border: piece.isSelected
              ? `3px solid ${COLORS.gold}`
              : `2px solid rgba(0,0,0,0.3)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: isTiger ? '28px' : '20px',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              fontWeight: 'bold',
              transform: 'translateZ(5px)',
            }}
          >
            {isTiger ? '虎' : '豹'}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '20px',
            backgroundColor: color,
            borderRadius: '50%',
            bottom: '-5px',
            transform: 'rotateX(90deg)',
            opacity: 0.8,
            filter: 'blur(2px)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: '90%',
            height: '90%',
            left: '5%',
            top: '5%',
            borderRadius: isTiger ? '50% 50% 45% 45%' : '40%',
            background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)`,
            transform: 'translateZ(12px)',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    </motion.div>
  );
});
