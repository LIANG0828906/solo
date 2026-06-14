import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Fragment } from '@/modules/puzzleManager';
import { useGameStore } from '@/store/gameStore';

interface PlacedFragmentProps {
  fragment: Fragment;
  flashRed: boolean;
}

const PlacedFragment: React.FC<PlacedFragmentProps> = memo(({ fragment, flashRed }) => {
  const [isBouncingBack, setIsBouncingBack] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const prevCorrect = useRef(fragment.isCorrect);
  const prevFlashRed = useRef(flashRed);

  useEffect(() => {
    if (!prevCorrect.current && fragment.isCorrect) {
      setShowCheckmark(true);
      const timer = setTimeout(() => setShowCheckmark(false), 500);
      return () => clearTimeout(timer);
    }
    prevCorrect.current = fragment.isCorrect;
  }, [fragment.isCorrect]);

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

  const fragmentClass = [
    'placed-fragment',
    fragment.isCorrect ? 'placed-fragment-correct' : '',
    flashRed ? 'placed-fragment-error' : '',
    isBouncingBack ? 'placed-fragment-bounce' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style: React.CSSProperties = {
    position: 'absolute',
    left: fragment.currentX,
    top: fragment.currentY,
    width: fragment.width,
    height: fragment.height,
    backgroundColor: fragment.bgColor,
    borderRadius: 8,
    transform: `rotate(${fragment.rotation}deg)`,
    display: shouldShow ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 500,
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    cursor: fragment.isCorrect ? 'default' : 'grab',
    willChange: 'transform, opacity',
    pointerEvents: fragment.isCorrect ? 'none' : 'auto',
  };

  const checkmarkClass = ['placed-checkmark', showCheckmark ? 'placed-checkmark-show' : '']
    .filter(Boolean)
    .join(' ');

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
    zIndex: 10,
  };

  return (
    <div className={fragmentClass} style={style}>
      <div className={checkmarkClass} style={checkmarkStyle}>
        ✓
      </div>
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

  const canvasClass = ['canvas-area', flashOrange ? 'canvas-area-flash' : '', isOver ? 'canvas-area-over' : '']
    .filter(Boolean)
    .join(' ');

  const canvasStyle: React.CSSProperties = {
    width: 600,
    height: 700,
    backgroundColor: flashOrange ? '#f97316' : '#f1f5f9',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    backgroundImage: `url(${gridPattern})`,
    backgroundSize: '20px 20px',
    flexShrink: 0,
  };

  const placedFragments = fragments.filter((f) => f.isPlaced && !f.isCorrect);
  const correctFragments = fragments.filter((f) => f.isCorrect);

  return (
    <div id="canvas-area" ref={setNodeRef} className={canvasClass} style={canvasStyle}>
      {correctFragments.map((fragment) => (
        <PlacedFragment key={fragment.id} fragment={fragment} flashRed={flashRed === fragment.id} />
      ))}
      {placedFragments.map((fragment) => (
        <PlacedFragment key={fragment.id} fragment={fragment} flashRed={flashRed === fragment.id} />
      ))}
      <style>{`
        .canvas-area {
          will-change: background-color;
          transition: background-color 0.4s ease-in-out;
        }
        .canvas-area-over {
          border: 2px dashed #3b82f6;
        }
        .canvas-area-flash {
          animation: flash-orange 0.4s ease-in-out;
        }
        .placed-fragment {
          transition: transform 0.3s ease-out, border-color 0.3s ease-out, box-shadow 0.3s ease-out;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 2px solid transparent;
        }
        .placed-fragment-correct {
          border-color: #22c55e;
          box-shadow: 0 0 0 2px #22c55e;
        }
        .placed-fragment-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px #ef4444;
          animation: shake 0.2s ease-in-out;
        }
        .placed-fragment-bounce {
          animation: bounce-back 0.3s ease-in forwards;
        }
        .placed-checkmark {
          opacity: 0;
          transform: scale(0);
          transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        }
        .placed-checkmark-show {
          animation: checkmark 0.3s ease-out;
          opacity: 1;
          transform: scale(1);
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
