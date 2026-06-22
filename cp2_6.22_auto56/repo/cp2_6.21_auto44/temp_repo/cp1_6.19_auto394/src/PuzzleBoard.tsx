import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePuzzleStore } from './puzzleStore';
import { PuzzlePiece } from './PuzzlePiece';

const BOARD_WIDTH = 600;
const BOARD_HEIGHT = 500;
const GRID_SIZE = 3;
const PIECE_SIZE = Math.min(BOARD_WIDTH, BOARD_HEIGHT) / GRID_SIZE;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
}

export function PuzzleBoard() {
  const {
    image,
    pieces,
    moves,
    time,
    isCompleted,
    isPlaying,
    showHint,
    initializePieces,
    placePiece,
    setFlash,
    incrementMoves,
    incrementTime,
    setIsPlaying,
    setShowHint,
    shufflePieces,
    setCurrentPage,
    addRecentPuzzle,
    resetGame,
  } = usePuzzleStore();

  const [_draggingPieceId, _setDraggingPieceId] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    if (image && pieces.length === 0) {
      initializePieces();
    }
  }, [image, pieces.length, initializePieces]);

  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying && !isCompleted) {
      interval = window.setInterval(() => {
        incrementTime();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isCompleted, incrementTime]);

  useEffect(() => {
    if (isCompleted) {
      setIsPlaying(false);
      setShowConfetti(true);

      const particles: ConfettiParticle[] = [];
      for (let i = 0; i < 150; i++) {
        particles.push({
          id: i,
          x: Math.random() * BOARD_WIDTH,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.5,
          size: 6 + Math.random() * 8,
        });
      }
      setConfettiParticles(particles);

      const thumbnail = createThumbnail(image!, 200);
      addRecentPuzzle({
        id: Date.now().toString(),
        thumbnail,
        completionTime: time,
        completedAt: Date.now(),
      });

      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isCompleted, image, time, addRecentPuzzle]);

  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showHint, setShowHint]);

  const createThumbnail = (imgSrc: string, size: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imgSrc;

    const img = new Image();
    img.src = imgSrc;
    const scale = Math.max(size / img.width, size / img.height);
    const x = (size - img.width * scale) / 2;
    const y = (size - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleDragStart = useCallback((pieceId: number) => {
    _setDraggingPieceId(pieceId);
  }, []);

  const handleDragEnd = useCallback((pieceId: number, targetIndex: number | null) => {
    _setDraggingPieceId(null);

    if (targetIndex !== null) {
      const piece = pieces.find(p => p.id === pieceId);
      if (piece && piece.currentIndex !== targetIndex) {
        placePiece(pieceId, targetIndex);
        incrementMoves();

        const targetPiece = pieces.find(p => p.currentIndex === targetIndex);
        if (piece.originalIndex === targetIndex) {
          setFlash(pieceId, true);
          setTimeout(() => setFlash(pieceId, false), 500);
        }
        if (targetPiece && targetPiece.originalIndex === piece.currentIndex) {
          setFlash(targetPiece.id, true);
          setTimeout(() => setFlash(targetPiece.id, false), 500);
        }
      }
    }
  }, [pieces, placePiece, incrementMoves, setFlash]);

  const handleDragOver = useCallback((_index: number) => {
    // drag over handler
  }, []);

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      shufflePieces();
      setIsShuffling(false);
    }, 500);
  };

  const handleHint = () => {
    setShowHint(true);
  };

  const handleBack = () => {
    resetGame();
    setCurrentPage('home');
  };

  const sortedPieces = [...pieces].sort((a, b) => a.currentIndex - b.currentIndex);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B192C 0%, #1A3A5C 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: BOARD_WIDTH + 200,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={handleBack}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: '#37474F',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#455A64')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#37474F')}
        >
          ← 返回首页
        </button>

        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <div style={{ color: '#B0BEC5', fontSize: '24px', fontFamily: 'monospace' }}>
            ⏱ {formatTime(time)}
          </div>
          <div style={{ color: '#B0BEC5', fontSize: '20px' }}>
            步数: {moves}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button
            onClick={handleHint}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#64B5F6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            💡 提示
          </motion.button>
          <motion.button
            onClick={handleShuffle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#64B5F6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            🔀 洗牌
          </motion.button>
        </div>
      </div>

      <div
        id="puzzle-board"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          backgroundColor: '#37474F',
          borderRadius: '12px',
          padding: '20px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}
      >
        <AnimatePresence mode="wait">
          {!isShuffling && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, rotateY: 180 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${PIECE_SIZE}px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, ${PIECE_SIZE}px)`,
                gap: '0px',
                perspective: '1000px',
              }}
            >
              {sortedPieces.map((piece) => (
                <PuzzlePiece
                  key={piece.id}
                  id={piece.id}
                  originalIndex={piece.originalIndex}
                  currentIndex={piece.currentIndex}
                  isPlaced={piece.isPlaced}
                  isFlashing={piece.isFlashing}
                  pieceSize={PIECE_SIZE}
                  image={image!}
                  gridSize={GRID_SIZE}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                />
              ))}
            </motion.div>
          )}
          {isShuffling && (
            <motion.div
              key="shuffle"
              initial={{ opacity: 0, rotateY: -180 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${PIECE_SIZE}px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, ${PIECE_SIZE}px)`,
                gap: '0px',
                perspective: '1000px',
              }}
            >
              {sortedPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    width: PIECE_SIZE,
                    height: PIECE_SIZE,
                    backgroundColor: '#455A64',
                    borderRadius: '4px',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showConfetti && (
            <>
              {confettiParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{
                    y: BOARD_HEIGHT + 50,
                    x: particle.x,
                    opacity: 1,
                    rotate: 0,
                  }}
                  animate={{
                    y: -50,
                    x: particle.x + (Math.random() - 0.5) * 200,
                    opacity: [1, 1, 0],
                    rotate: Math.random() * 720 - 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: particle.delay,
                    ease: 'easeOut',
                  }}
                  style={{
                    position: 'absolute',
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    borderRadius: '2px',
                    pointerEvents: 'none',
                  }}
                />
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(11, 25, 44, 0.95)',
                  padding: '30px 50px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 10px 50px rgba(100, 181, 246, 0.3)',
                  border: '2px solid #64B5F6',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎉</div>
                <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                  恭喜完成！
                </div>
                <div style={{ color: '#B0BEC5', fontSize: '18px' }}>
                  用时: {formatTime(time)} | 步数: {moves}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {isCompleted && (
        <motion.button
          onClick={handleBack}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            marginTop: '30px',
            padding: '15px 40px',
            borderRadius: '8px',
            backgroundColor: '#64B5F6',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          再玩一张
        </motion.button>
      )}
    </div>
  );
}
