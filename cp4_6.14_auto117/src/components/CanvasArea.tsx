import React, { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Fragment } from '@/modules/puzzleManager';
import { useGameStore } from '@/store/gameStore';

interface PlacedFragmentProps {
  fragment: Fragment;
  flashRed: boolean;
}

const PlacedFragment: React.FC<PlacedFragmentProps> = memo(({ fragment, flashRed }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: fragment.currentX,
    top: fragment.currentY,
    width: fragment.width,
    height: fragment.height,
    backgroundColor: fragment.bgColor,
    borderRadius: 8,
    border: `2px solid ${fragment.isCorrect ? 'var(--color-success)' : flashRed ? 'var(--color-error)' : 'transparent'}`,
    transform: `rotate(${fragment.rotation}deg)`,
    transition: 'all var(--transition-normal)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 500,
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    cursor: fragment.isCorrect ? 'default' : 'grab',
    boxShadow: fragment.isCorrect ? '0 0 0 2px var(--color-success)' : 'none',
    animation: flashRed ? 'shake 0.2s ease-in-out' : fragment.isCorrect ? 'none' : undefined,
    willChange: 'transform',
  };

  const checkmarkStyle: React.CSSProperties = {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    backgroundColor: 'var(--color-success)',
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

  const bounceStyle: React.CSSProperties = {
    animation: flashRed ? 'none' : undefined,
    transition: flashRed ? 'none' : 'all var(--transition-normal)',
  };

  return (
    <div style={{ ...style, ...bounceStyle }}>
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
    backgroundColor: flashOrange ? 'var(--color-reward)' : 'var(--color-canvas)',
    borderRadius: 'var(--radius-canvas)',
    position: 'relative',
    overflow: 'hidden',
    backgroundImage: `url(${gridPattern})`,
    backgroundSize: '20px 20px',
    transition: 'background-color var(--transition-slow)',
    border: isOver ? '2px dashed var(--color-highlight)' : 'none',
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
            width: calc(100% - 360px) !important;
            max-width: 600px;
            min-width: 320px;
          }
        }
        @media (max-width: 768px) {
          .canvas-area {
            width: 100% !important;
            max-width: 600px;
            height: 500px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(CanvasArea);
