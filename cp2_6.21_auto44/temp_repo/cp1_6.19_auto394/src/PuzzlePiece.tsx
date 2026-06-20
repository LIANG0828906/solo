import { motion } from 'framer-motion';
import { usePuzzleStore } from './puzzleStore';

interface PuzzlePieceProps {
  id: number;
  originalIndex: number;
  currentIndex: number;
  isPlaced: boolean;
  isFlashing: boolean;
  pieceSize: number;
  image: string;
  gridSize: number;
  onDragStart: (pieceId: number) => void;
  onDragEnd: (pieceId: number, targetIndex: number | null) => void;
  onDragOver: (index: number) => void;
}

export function PuzzlePiece({
  id,
  originalIndex,
  currentIndex,
  isPlaced,
  isFlashing,
  pieceSize,
  image,
  gridSize,
  onDragStart,
  onDragEnd,
  onDragOver,
}: PuzzlePieceProps) {
  const { showHint } = usePuzzleStore();

  const originalRow = Math.floor(originalIndex / gridSize);
  const originalCol = originalIndex % gridSize;

  const bgPosX = -(originalCol * pieceSize);
  const bgPosY = -(originalRow * pieceSize);

  const shouldShowHint = showHint && !isPlaced;

  return (
    <motion.div
      layout
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      style={{
        width: pieceSize,
        height: pieceSize,
        backgroundImage: `url(${image})`,
        backgroundSize: `${pieceSize * gridSize}px ${pieceSize * gridSize}px`,
        backgroundPosition: `${bgPosX}px ${bgPosY}px`,
        cursor: 'grab',
        position: 'relative',
        willChange: 'transform',
        boxSizing: 'border-box',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      animate={{
        y: 0,
        scale: 1,
        boxShadow: isFlashing
          ? '0 0 30px 10px rgba(100, 181, 246, 0.8)'
          : shouldShowHint
          ? '0 0 20px 5px rgba(255, 255, 255, 0.6)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        zIndex: isFlashing ? 10 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        bounce: 0.4,
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
      whileDrag={{
        y: -5,
        cursor: 'grabbing',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        zIndex: 100,
        scale: 1.02,
      }}
      onDragStart={() => onDragStart(id)}
      onDragEnd={(e, _info) => {
        const boardRect = document.getElementById('puzzle-board')?.getBoundingClientRect();
        if (!boardRect) {
          onDragEnd(id, null);
          return;
        }

        const evt = e as PointerEvent;
        const clientX = evt.clientX;
        const clientY = evt.clientY;

        const x = clientX - boardRect.left;
        const y = clientY - boardRect.top;

        if (x >= 0 && x < boardRect.width && y >= 0 && y < boardRect.height) {
          const col = Math.floor(x / pieceSize);
          const row = Math.floor(y / pieceSize);
          const targetIndex = row * gridSize + col;

          if (targetIndex >= 0 && targetIndex < gridSize * gridSize) {
            onDragEnd(id, targetIndex);
            return;
          }
        }
        onDragEnd(id, null);
      }}
      onMouseEnter={() => onDragOver(currentIndex)}
    >
      {shouldShowHint && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            pointerEvents: 'none',
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
}
