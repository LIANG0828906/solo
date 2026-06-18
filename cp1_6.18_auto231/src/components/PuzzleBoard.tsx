import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { ShapeType, SlotConfig, ShapeConfig, Position } from '@/store/gameStore';

function SlotOutline({ slot, isFlashing, isError }: { slot: SlotConfig; isFlashing: boolean; isError: boolean }) {
  const [flashStep, setFlashStep] = useState(0);
  const flashRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isFlashing) {
      let step = 0;
      flashRef.current = setInterval(() => {
        step++;
        setFlashStep(step);
        if (step >= 6) {
          clearInterval(flashRef.current);
          useGameStore.getState().clearSlotFlash(slot.id);
        }
      }, 100);
    }
    return () => {
      if (flashRef.current) clearInterval(flashRef.current);
    };
  }, [isFlashing, slot.id]);

  const flashColor = isFlashing && flashStep % 2 === 0 ? '#FFFFFF' : slot.color;
  const borderColor = isError ? '#FF0000' : flashColor;
  const borderStyle = isError ? 'solid' : 'dashed';

  return (
    <div
      className="slot-outline"
      style={{
        position: 'absolute',
        left: slot.position.x - slot.width / 2,
        top: slot.position.y - slot.height / 2,
        width: slot.width,
        height: slot.height,
        border: `2px ${borderStyle} ${borderColor}`,
        opacity: slot.isOccupied ? 0 : (isError ? 1 : 0.5),
        transition: 'opacity 0.5s ease-out, border-color 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: slot.shapeType === 'circle' ? '50%' : slot.shapeType === 'rectangle' ? '4px' : '0',
        pointerEvents: 'none',
      }}
    >
      <SlotShapeHint type={slot.shapeType} color={flashColor} width={slot.width} height={slot.height} visible={!slot.isOccupied} />
    </div>
  );
}

function SlotShapeHint({ type, color, width, height, visible }: { type: ShapeType; color: string; width: number; height: number; visible: boolean }) {
  if (!visible) return null;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity: 0.2 }}>
      {type === 'circle' && <circle cx={width / 2} cy={height / 2} r={width / 2 - 4} fill="none" stroke={color} strokeWidth={2} />}
      {type === 'rectangle' && <rect x={4} y={4} width={width - 8} height={height - 8} rx={4} fill="none" stroke={color} strokeWidth={2} />}
      {type === 'triangle' && <polygon points={`${width / 2},6 ${width - 6},${height - 6} 6,${height - 6}`} fill="none" stroke={color} strokeWidth={2} />}
    </svg>
  );
}

function SnappedShape({ shape, slot }: { shape: ShapeConfig; slot: SlotConfig }) {
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setAnimating(false), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="snapped-shape"
      style={{
        position: 'absolute',
        left: slot.position.x - shape.width / 2,
        top: slot.position.y - shape.height / 2,
        width: shape.width,
        height: shape.height,
        transform: animating ? 'scale(1.1)' : 'scale(1.0)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        filter: `drop-shadow(0 0 1px ${shape.color})`,
        pointerEvents: 'none',
      }}
    >
      <ShapeSVG type={shape.type} color={shape.color} width={shape.width} height={shape.height} />
    </div>
  );
}

function ShapeSVG({ type, color, width, height }: { type: ShapeType; color: string; width: number; height: number }) {
  if (type === 'circle') {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <circle cx={width / 2} cy={height / 2} r={width / 2 - 1} fill={color} stroke={color} strokeWidth={1} opacity={0.9} />
      </svg>
    );
  }
  if (type === 'rectangle') {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x={1} y={1} width={width - 2} height={height - 2} rx={4} fill={color} stroke={color} strokeWidth={1} opacity={0.9} />
      </svg>
    );
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon points={`${width / 2},2 ${width - 2},${height - 2} 2,${height - 2}`} fill={color} stroke={color} strokeWidth={1} opacity={0.9} />
    </svg>
  );
}

export default function PuzzleBoard({ boardRef }: { boardRef: React.RefObject<HTMLDivElement | null> }) {
  const slots = useGameStore(s => s.slots);
  const shapes = useGameStore(s => s.shapes);
  const isCompleted = useGameStore(s => s.isCompleted);
  const slotFlashing = useGameStore(s => s.slotFlashing);
  const slotError = useGameStore(s => s.slotError);

  useEffect(() => {
    const errorTimers: ReturnType<typeof setTimeout>[] = [];
    Object.keys(slotError).forEach(slotId => {
      const t = setTimeout(() => {
        useGameStore.getState().clearSlotError(slotId);
      }, 500);
      errorTimers.push(t);
    });
    return () => errorTimers.forEach(t => clearTimeout(t));
  }, [slotError]);

  const snappedShapes = shapes.filter(s => s.isSnapped);

  return (
    <div
      ref={boardRef}
      className={`puzzle-board ${isCompleted ? 'puzzle-board-completed' : ''}`}
    >
      {slots.map(slot => (
        <SlotOutline
          key={slot.id}
          slot={slot}
          isFlashing={slot.id in slotFlashing}
          isError={slot.id in slotError}
        />
      ))}
      {snappedShapes.map(shape => {
        const slot = slots.find(sl => sl.id === shape.targetSlotId);
        if (!slot) return null;
        return <SnappedShape key={shape.id} shape={shape} slot={slot} />;
      })}
    </div>
  );
}
