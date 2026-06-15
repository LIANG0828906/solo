import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { CELESTIAL_SYMBOLS, calculateRotation, DEGREES_PER_SYMBOL } from '../utils/puzzleLogic';

interface LockRingProps {
  ringId: number;
  size: number;
  innerSize: number;
}

const LockRing: React.FC<LockRingProps> = React.memo(({ ringId, size, innerSize }) => {
  const ring = useGameStore((state) => state.rings[ringId]);
  const rotateRing = useGameStore((state) => state.rotateRing);
  const snapRing = useGameStore((state) => state.snapRing);
  const checkCombination = useGameStore((state) => state.checkCombination);
  const triggerSuccessAnimation = useGameStore((state) => state.triggerSuccessAnimation);
  const triggerFailAnimation = useGameStore((state) => state.triggerFailAnimation);
  const incrementAttempts = useGameStore((state) => state.incrementAttempts);
  const lockRings = useGameStore((state) => state.lockRings);
  const isLocked = useGameStore((state) => state.isLocked);
  const isSolved = useGameStore((state) => state.isSolved);
  const maxAttempts = useGameStore((state) => state.maxAttempts);

  const controls = useAnimation();
  const ringRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; angle: number } | null>(null);
  const lastAngleRef = useRef(0);

  useEffect(() => {
    controls.start({
      rotate: ring?.angle || 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20,
      },
    });
    lastAngleRef.current = ring?.angle || 0;
  }, [ring?.angle, controls]);

  const getCenter = useCallback(() => {
    if (!ringRef.current) return { x: 0, y: 0 };
    const rect = ringRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked || isSolved || !ring) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        angle: ring.angle,
      });
    },
    [isLocked, isSolved, ring, getCenter]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStart || !ring) return;
      const center = getCenter();
      const deltaAngle = calculateRotation(
        center.x,
        center.y,
        dragStart.x,
        dragStart.y,
        e.clientX,
        e.clientY
      );
      const newAngle = dragStart.angle + deltaAngle;
      const snappedDelta = Math.round((newAngle - lastAngleRef.current) / (DEGREES_PER_SYMBOL / 6)) * (DEGREES_PER_SYMBOL / 6);
      if (Math.abs(snappedDelta) >= DEGREES_PER_SYMBOL / 6) {
        rotateRing(ringId, snappedDelta);
        lastAngleRef.current += snappedDelta;
      }
    },
    [isDragging, dragStart, ring, ringId, rotateRing, getCenter]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStart(null);

    const combinationChanged = snapRing(ringId);
    if (combinationChanged) {
      setTimeout(() => {
        const isCorrect = checkCombination();
        if (isCorrect) {
          triggerSuccessAnimation();
        } else {
          const newAttempts = incrementAttempts();
          if (newAttempts >= maxAttempts) {
            lockRings(10);
          } else {
            triggerFailAnimation();
          }
        }
      }, 100);
    }
  }, [isDragging, ringId, snapRing, checkCombination, triggerSuccessAnimation, incrementAttempts, maxAttempts, lockRings, triggerFailAnimation]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!ring) return null;

  const ringColor = ring.isSuccess
    ? '#2ecc71'
    : ring.isFailed
    ? '#e74c3c'
    : 'linear-gradient(135deg, #b87333 0%, #8b6f47 50%, #b87333 100%)';

  const renderSymbols = () => {
    return CELESTIAL_SYMBOLS.map((symbol, index) => {
      const angle = (index * DEGREES_PER_SYMBOL - 90) * (Math.PI / 180);
      const radius = (size + innerSize) / 4;
      const x = Math.cos(angle) * radius + size / 2;
      const y = Math.sin(angle) * radius + size / 2;
      const isCurrentSymbol = ring.currentSymbol === symbol;

      return (
        <motion.div
          key={symbol}
          className="symbol"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: `translate(-50%, -50%) rotate(${-ring.angle}deg)`,
            fontFamily: "'ZCOOL XiaoWei', 'Noto Serif SC', serif",
            fontSize: '16px',
            fontWeight: isCurrentSymbol ? 'bold' : 'normal',
            color: isCurrentSymbol ? '#ffd700' : '#d4a76a',
            textShadow: isCurrentSymbol ? '0 0 10px #ffd700' : 'none',
            transition: 'color 0.2s, text-shadow 0.2s',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {symbol}
        </motion.div>
      );
    });
  };

  return (
    <motion.div
      ref={ringRef}
      className="lock-ring-container"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        cursor: isLocked || isSolved ? 'not-allowed' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      whileHover={{
        boxShadow: !isLocked && !isSolved ? '0 0 20px rgba(241, 196, 15, 0.6)' : 'none',
      }}
      animate={{
        x: ring.isFailed && !ring.isSuccess ? [0, -2, 2, -2, 2, 0] : 0,
        scale: ring.isSuccess ? [1, 0.9, 1] : 1,
      }}
      transition={{
        x: { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        scale: { duration: 1.2, times: [0, 0.5, 1] },
      }}
    >
      <AnimatePresence>
        <motion.div
          className="lock-ring"
          animate={controls}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: ringColor,
            position: 'relative',
            boxShadow: `
              inset 0 0 0.5px rgba(255, 255, 255, 0.3),
              inset 0 -2px 4px rgba(0, 0, 0, 0.3),
              0 4px 8px rgba(0, 0, 0, 0.4)
            `,
            border: ring.isSuccess
              ? '2px solid #2ecc71'
              : ring.isFailed
              ? '2px solid #e74c3c'
              : '1px solid rgba(139, 111, 71, 0.5)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: innerSize,
              height: innerSize,
              borderRadius: '50%',
              background: '#1a1a2e',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.6)',
            }}
          />
          {renderSymbols()}
        </motion.div>
      </AnimatePresence>

      <div
        style={{
          position: 'absolute',
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '12px solid #ffd700',
          filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
});

LockRing.displayName = 'LockRing';

export default LockRing;
