import React, { useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import RoomView from './components/RoomView';
import ItemBar from './components/ItemBar';
import PuzzleModal from './components/PuzzleModal';
import { useGameStore } from './store';
import { ALL_ITEMS, ItemId, FurnitureId, Particle } from './types';

const ParticleCanvas = React.memo(function ParticleCanvas({ particles }: { particles: Particle[] }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animRef = React.useRef<number>(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particleData = particles.map((p) => ({
      ...p,
      startX: p.x * window.innerWidth / 100,
      startY: p.y * window.innerHeight / 100,
      curLife: p.life,
    }));

    let running = true;
    const startTime = performance.now();

    const loop = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = (performance.now() - startTime) / 1100;
      const life = Math.max(0, 1 - elapsed);

      particleData.forEach((p) => {
        const t = 1 - life;
        const x = p.startX + p.vx * 60 * t;
        const y = p.startY + p.vy * 60 * t + 0.5 * 0.2 * t * t * 60;
        ctx.globalAlpha = life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (0.4 + life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (life > 0) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [particles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
});

const FlashRipple = React.memo(function FlashRipple({
  position,
  type,
  onAnimationComplete,
}: {
  position: { x: number; y: number };
  type: 'puzzle_solve' | 'item_pickup';
  onAnimationComplete: () => void;
}) {
  const color = type === 'puzzle_solve' ? '#66ccff' : '#a0e0ff';
  return (
    <motion.div
      onAnimationComplete={onAnimationComplete}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 0.9, 0], scale: [0, 1, 2.5] }}
      transition={{ duration: 1.1, ease: 'easeOut', times: [0, 0.3, 1] }}
      style={{
        position: 'fixed',
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: 300,
        height: 300,
        marginLeft: -150,
        marginTop: -150,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}aa 0%, ${color}44 40%, transparent 70%)`,
        boxShadow: `0 0 80px 30px ${color}66`,
        pointerEvents: 'none',
        zIndex: 9998,
        willChange: 'transform, opacity',
      }}
    />
  );
});

const VictoryScreen = React.memo(function VictoryScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at center, #2b1a0e 0%, #0a0604 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <motion.h1
        initial={{ y: 40, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 80 }}
        style={{
          fontSize: 72,
          color: '#f5d6a0',
          textShadow: '0 0 40px #f5d6a088, 0 0 80px #c49a6c44',
          marginBottom: 24,
          letterSpacing: 8,
        }}
      >
        🎉 成功逃脱 🎉
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{ fontSize: 22, color: '#c49a6c', marginBottom: 48 }}
      >
        恭喜你解开了所有谜题，走出了密室！
      </motion.p>
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: '0 0 30px #f5d6a066' }}
        whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        style={{
          padding: '16px 56px',
          fontSize: 20,
          background: 'linear-gradient(135deg, #c49a6c, #8b5a2b)',
          color: '#2b1a0e',
          border: '2px solid #f5d6a0',
          borderRadius: 12,
          cursor: 'pointer',
          fontWeight: 700,
          letterSpacing: 4,
          boxShadow: '0 8px 32px #00000066',
        }}
      >
        再玩一次
      </motion.button>
    </motion.div>
  );
});

export default function App() {
  const {
    draggedItemId,
    setDraggedItem,
    setDropHoverTarget,
    tryCombine,
    flashEvents,
    particles,
    victory,
    reset,
    activePuzzleId,
    clearFlashEvent,
  } = useGameStore();

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 6 },
  });
  const sensors = useSensors(pointerSensor);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setDraggedItem(event.active.id as ItemId);
    },
    [setDraggedItem]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      if (event.over) {
        const targetId = String(event.over.id);
        if (targetId.startsWith('furn_')) {
          const furnId = targetId.replace('furn_', '') as FurnitureId;
          setDropHoverTarget(furnId);
        } else {
          setDropHoverTarget(null);
        }
      } else {
        setDropHoverTarget(null);
      }
    },
    [setDropHoverTarget]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const itemId = event.active.id as ItemId;
      if (event.over) {
        const targetId = String(event.over.id);
        if (targetId.startsWith('furn_')) {
          const furnId = targetId.replace('furn_', '') as FurnitureId;
          tryCombine(itemId, furnId);
        }
      }
      setDraggedItem(null);
      setDropHoverTarget(null);
    },
    [setDraggedItem, setDropHoverTarget, tryCombine]
  );

  const draggedItem = useMemo(
    () => (draggedItemId ? ALL_ITEMS[draggedItemId] : null),
    [draggedItemId]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setDraggedItem(null);
        setDropHoverTarget(null);
      }}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <RoomView />
        <ItemBar />

        <AnimatePresence>
          {activePuzzleId && <PuzzleModal key="puzzle-modal" />}
        </AnimatePresence>

        {flashEvents.map((f) => (
          <FlashRipple
            key={f.id}
            position={f.position}
            type={f.type}
            onAnimationComplete={() => clearFlashEvent(f.id)}
          />
        ))}

        {particles.length > 0 && <ParticleCanvas particles={particles} />}

        <DragOverlay dropAnimation={{ duration: 200, easing: 'easeOut' as any }}>
          {draggedItem ? (
            <motion.div
              animate={{ rotate: [0, -4, 4, -2, 2, 0], scale: 1.1 }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{
                width: 78,
                height: 92,
                background: 'linear-gradient(145deg, #3a2512dd, #1a0f07ee)',
                border: '2px solid #f5d6a0',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: 0.92,
                boxShadow: '0 8px 32px #000000aa, 0 0 24px #f5d6a033',
                willChange: 'transform',
              }}
            >
              <span style={{ fontSize: 36 }}>{draggedItem.icon}</span>
              <span style={{ fontSize: 11, color: '#f5d6a0', fontWeight: 600 }}>{draggedItem.name}</span>
            </motion.div>
          ) : null}
        </DragOverlay>

        <AnimatePresence>
          {victory && <VictoryScreen key="victory" onRestart={reset} />}
        </AnimatePresence>
      </div>
    </DndContext>
  );
}
