import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Crystal from './Crystal';
import { CRYSTAL_CONFIGS } from '../utils/gameLogic';
import { RotateCcw, HelpCircle } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'success' | 'error';
}

const GameBoard = () => {
  const {
    grid,
    crystalPool,
    energy,
    gameStatus,
    hintsRemaining,
    totalMoves,
    highlightedCell,
    lastFeedback,
    feedbackCell,
    placeCrystal,
    resetGame,
    useHint,
    clearFeedback,
  } = useGameStore();

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [particleId, setParticleId] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [explosionParticles, setExplosionParticles] = useState<
    { id: number; angle: number }[]
  >([]);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cellSize = useMemo(() => {
    return windowWidth < 768 ? 80 : 120;
  }, [windowWidth]);

  const crystalSize = cellSize * 0.6;
  const gap = 8;
  const gridPadding = 16;

  useEffect(() => {
    if (lastFeedback && feedbackCell !== null && gridContainerRef.current) {
      const row = Math.floor(feedbackCell / 3);
      const col = feedbackCell % 3;

      const x = gridPadding + col * (cellSize + gap) + cellSize / 2;
      const y = gridPadding + row * (cellSize + gap) + cellSize / 2;

      const newParticle: Particle = {
        id: particleId,
        x,
        y,
        type: lastFeedback as 'success' | 'error',
      };

      setParticles((prev) => [...prev, newParticle]);
      setParticleId((prev) => prev + 1);

      const timer = setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 1000);

      const feedbackTimer = setTimeout(() => {
        clearFeedback();
      }, 500);

      return () => {
        clearTimeout(timer);
        clearTimeout(feedbackTimer);
      };
    }
  }, [lastFeedback, feedbackCell, particleId, clearFeedback, cellSize]);

  useEffect(() => {
    if (gameStatus === 'won') {
      setShowFlash(true);

      const newParticles = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        angle: (i / 10) * 360,
      }));
      setExplosionParticles(newParticles);

      const flashTimer = setTimeout(() => setShowFlash(false), 300);
      const particleTimer = setTimeout(() => setExplosionParticles([]), 600);

      return () => {
        clearTimeout(flashTimer);
        clearTimeout(particleTimer);
      };
    }
  }, [gameStatus]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const source = result.source;
      const destination = result.destination;

      if (
        source.droppableId === 'crystal-pool' &&
        destination.droppableId.startsWith('cell-')
      ) {
        const poolIndex = source.index;
        const cellIndex = parseInt(
          destination.droppableId.replace('cell-', ''),
          10
        );

        if (!isNaN(cellIndex)) {
          placeCrystal(cellIndex, poolIndex);
        }
      }
    },
    [placeCrystal]
  );

  const gridWidth = cellSize * 3 + gap * 2 + gridPadding * 2;

  return (
    <div className="flex flex-col items-center gap-6 relative">
      <div
        className="w-full flex items-center justify-between px-4"
        style={{ maxWidth: gridWidth }}
      >
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{
            color: '#ffd700',
            fontFamily: "'Cinzel Decorative', serif",
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          }}
        >
          元素水晶阵
        </h1>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={resetGame}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: '#8b0000',
              boxShadow: '0 2px 8px rgba(139, 0, 0, 0.5)',
            }}
            title="重置游戏"
          >
            <RotateCcw size={18} color="#fff" />
          </motion.button>
          <motion.button
            whileHover={{ scale: hintsRemaining > 0 ? 1.1 : 1 }}
            whileTap={{ scale: hintsRemaining > 0 ? 0.9 : 1 }}
            onClick={useHint}
            disabled={hintsRemaining <= 0 || gameStatus === 'won'}
            className="w-10 h-10 rounded-full flex items-center justify-center relative"
            style={{
              backgroundColor: hintsRemaining > 0 ? '#00008b' : '#555',
              boxShadow:
                hintsRemaining > 0 ? '0 2px 8px rgba(0, 0, 139, 0.5)' : 'none',
              cursor: hintsRemaining > 0 ? 'pointer' : 'not-allowed',
            }}
            title={`提示 (剩余${hintsRemaining}次)`}
          >
            <HelpCircle size={18} color="#fff" />
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ backgroundColor: '#ffd700', color: '#2f1a0e' }}
            >
              {hintsRemaining}
            </span>
          </motion.button>
        </div>
      </div>

      <div className="w-full px-4" style={{ maxWidth: gridWidth }}>
        <div
          className="w-full h-6 rounded-full overflow-hidden relative"
          style={{
            backgroundColor: '#2f1a0e',
            border: '2px solid #8b4513',
          }}
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${energy}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{
              background: 'linear-gradient(90deg, #b8860b, #ffd700, #ffed4a)',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.6)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-sm font-bold"
              style={{
                color: '#f5deb3',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              能量: {energy}/100
            </span>
          </div>
        </div>
      </div>

      <div className="relative" ref={gridContainerRef}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            className="rounded-lg"
            style={{
              backgroundColor: '#d2b48c',
              border: '3px solid #8b4513',
              boxShadow: 'inset 0 0 20px rgba(139, 69, 19, 0.3)',
              padding: gridPadding,
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(3, ${cellSize}px)`,
                gap: `${gap}px`,
              }}
            >
              {grid.map((crystalType, index) => (
                <Droppable key={index} droppableId={`cell-${index}`}>
                  {(provided, snapshot) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="relative flex items-center justify-center"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: '5px',
                        border: `2px solid ${
                          highlightedCell === index ? '#ffd700' : '#8b4513'
                        }`,
                        backgroundColor: snapshot.isDraggingOver
                          ? 'rgba(255, 215, 0, 0.2)'
                          : 'rgba(139, 69, 19, 0.1)',
                        boxShadow:
                          highlightedCell === index
                            ? '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.3)'
                            : 'inset 0 0 10px rgba(139, 69, 19, 0.2)',
                        backgroundImage: `repeating-linear-gradient(
                          45deg,
                          transparent,
                          transparent 5px,
                          rgba(139, 69, 19, 0.05) 5px,
                          rgba(139, 69, 19, 0.05) 10px
                        )`,
                      }}
                      animate={
                        highlightedCell === index
                          ? {
                              boxShadow: [
                                '0 0 15px rgba(255, 215, 0, 0.8)',
                                '0 0 25px rgba(255, 215, 0, 1)',
                                '0 0 15px rgba(255, 215, 0, 0.8)',
                              ],
                            }
                          : {}
                      }
                      transition={
                        highlightedCell === index
                          ? { duration: 1.5, repeat: Infinity }
                          : {}
                      }
                    >
                      {crystalType && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          <Crystal type={crystalType} size={crystalSize} />
                        </motion.div>
                      )}
                      {feedbackCell === index && lastFeedback === 'error' && (
                        <motion.div
                          className="absolute inset-0 rounded"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.5, 0] }}
                          transition={{ duration: 0.5 }}
                          style={{
                            backgroundColor: 'rgba(255, 0, 0, 0.3)',
                            boxShadow: 'inset 0 0 20px rgba(255, 0, 0, 0.5)',
                          }}
                        />
                      )}
                      {provided.placeholder}
                    </motion.div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <Droppable droppableId="crystal-pool" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: '#8b4513',
                    border: '3px solid #654321',
                    boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)',
                    minHeight: crystalSize * 0.8 + 32,
                    width: gridWidth,
                  }}
                >
                  <div
                    className="flex flex-wrap gap-2 justify-center"
                    style={{
                      minHeight: crystalSize * 0.8,
                    }}
                  >
                    {crystalPool.map((crystalType, index) => (
                      <Draggable
                        key={`pool-${index}-${crystalType}`}
                        draggableId={`pool-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.5 : 1,
                              zIndex: snapshot.isDragging ? 1000 : 'auto',
                            }}
                          >
                            <Crystal
                              type={crystalType}
                              size={crystalSize * 0.8}
                              isDragging={snapshot.isDragging}
                              isFloating={!snapshot.isDragging}
                              floatDelay={index * 0.08}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>

        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none"
              initial={{
                opacity: 1,
                y: particle.y,
                x: particle.x,
                scale: 1,
              }}
              animate={{
                opacity: 0,
                y: particle.y - 50,
                scale: 0.5,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                left: 0,
                top: 0,
              }}
            >
              {Array.from({
                length: particle.type === 'success' ? 5 : 3,
              }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor:
                      particle.type === 'success' ? '#32cd32' : '#ff4500',
                    boxShadow: `0 0 6px ${
                      particle.type === 'success' ? '#32cd32' : '#ff4500'
                    }`,
                    left: Math.cos((i / 5) * Math.PI * 2) * 10 - 4,
                    top: Math.sin((i / 5) * Math.PI * 2) * 10 - 4,
                  }}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {explosionParticles.length > 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: gridWidth / 2,
                top: (cellSize * 3 + gap * 2 + gridPadding * 2) / 2,
              }}
            >
              {explosionParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute rounded-full"
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos((particle.angle * Math.PI) / 180) * 120,
                    y: Math.sin((particle.angle * Math.PI) / 180) * 120,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: '#ffd700',
                    boxShadow: '0 0 20px #ffd700, 0 0 40px #ffd700',
                    marginLeft: -10,
                    marginTop: -10,
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ backgroundColor: 'white' }}
          />
        )}
      </AnimatePresence>

      <div className="flex gap-8 text-sm" style={{ color: '#f5deb3' }}>
        <div>
          步数：
          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
            {totalMoves}
          </span>
        </div>
        <div>
          剩余水晶：
          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
            {crystalPool.length}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3" style={{ maxWidth: gridWidth }}>
        {Object.entries(CRYSTAL_CONFIGS).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: config.color,
                boxShadow: `0 0 4px ${config.glowColor}`,
              }}
            />
            <span className="text-xs" style={{ color: '#d2b48c' }}>
              {config.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
