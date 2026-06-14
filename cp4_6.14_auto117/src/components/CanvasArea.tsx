import React, { memo, useMemo, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Fragment } from '@/modules/puzzleManager';
import { useGameStore } from '@/store/gameStore';

interface PlacedFragmentProps {
  fragment: Fragment;
  flashRed: boolean;
}

const PlacedFragment: React.FC<PlacedFragmentProps> = memo(({ fragment, flashRed }) => {
  const [isBouncingBack, setIsBouncingBack] = React.useState(false);
  const prevFlashRed = useRef(flashRed);

  useEffect(() => {
    if (prevFlashRed.current && !flashRed) {
      setIsBouncingBack(true);
      const timer = setTimeout(() => {
        setIsBouncingBack(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    prevFlashRed.current = flashRed;
  }, [flashRed]);

  const shouldShow = !isBouncingBack && (fragment.isPlaced || fragment.isCorrect);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: fragment.currentX,
    top: fragment.currentY,
    width: fragment.width,
    height: fragment.height,
    backgroundColor: fragment.bgColor,
    borderRadius: 8,
    border: `2px solid ${
      fragment.isCorrect
        ? '#22c55e'
        : flashRed
        ? '#ef4444'
        : 'transparent'
    }`,
    transform: `rotate(${fragment.rotation}deg)`,
    transition: flashRed ? 'none' : 'all 0.3s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 500,
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    cursor: fragment.isCorrect ? 'default' : 'grab',
    boxShadow: fragment.isCorrect
      ? '0 0 0 2px #22c55e'
      : flashRed
      ? '0 0 0 2px #ef4444'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    animation: flashRed ? 'shake 0.2s ease-in-out' : 'none',
    willChange: 'transform, opacity',
    opacity: shouldShow ? 1 : 0,
    pointerEvents: fragment.isCorrect ? 'none' : 'auto',
  };

  const checkmarkStyle: React.CSSProperties = {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    backgroundColor: '#22c55e',
    borderRadius: '50%',
    display: fragment.isCorrect ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    animation: 'checkmark 0.3s ease-out',
    zIndex: 10,
  };

  return (
    <div style={style}>
      <div style={checkmarkStyle}>✓</div>
      {fragment.name}
    </div>
  );
});

PlacedFragment.displayName = 'PlacedFragment';

const CanvasArea: React.FC = () => {
  const { fragments, flashOrange, flashRed } = useGameStore();
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  const gridPattern = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, 20);
      ctx.stroke();
    }
    return canvas.toDataURL();
  }, []);

  const canvasStyle: React.CSSProperties = {
    width: 600,
    height: 700,
    backgroundColor: flashOrange ? '#f97316' : '#f1f5f9',
    borderRadius: 'var(--radius-canvas)',
    position: 'relative',
    overflow: 'hidden',
    backgroundImage: `url(${gridPattern})`,
    backgroundSize: '20px 20px',
    transition: 'background-color 0.4s ease-in-out',
    border: isOver ? '2px dashed #3b82f6' : 'none',
    flexShrink: 0,
  };

  const placedFragments = fragments.filter((f) => f.isPlaced && !f.isCorrect);
  const correctFragments = fragments.filter((f) => f.isCorrect);

  return (
    <div
      id="canvas-area"
      ref={setNodeRef}
      className="canvas-area"
      style={canvasStyle}
    >
      {correctFragments.map((fragment) => (
        <PlacedFragment
          key={fragment.id}
          fragment={fragment}
          flashRed={flashRed === fragment.id}
        />
      ))}
      {placedFragments.map((fragment) => (
        <PlacedFragment
          key={fragment.id}
          fragment={fragment}
          flashRed={flashRed === fragment.id}
        />
      ))}
      <style>{`
        .canvas-area {
          will-change: background-color;
        }
        @media (max-width: 1000px) {
          .canvas-area {
            width: calc(100vw - 360px) !important;
            max-width: 600px;
            min-width: 320px;
            height: calc(100vh - 80px) !important;
            max-height: 700px;
          }
        }
        @media (max-width: 768px) {
          .canvas-area {
            width: 100% !important;
            max-width: 600px;
            height: calc(100vh - 400px) !important;
            min-height: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(CanvasArea);
