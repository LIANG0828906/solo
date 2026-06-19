import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { Slot, Part } from '../types';

const SLOT_STYLES = {
  weapon: {
    shape: 'circle' as const,
    borderColor: '#A0B0C0',
    size: 40,
  },
  shield: {
    shape: 'hexagon' as const,
    borderColor: '#80D0C0',
    size: 44,
  },
  engine: {
    shape: 'triangle' as const,
    borderColor: '#D0A060',
    size: 50,
  },
};

interface SlotShapeProps {
  type: 'weapon' | 'shield' | 'engine';
  size: number;
  filled?: boolean;
  flash?: boolean;
}

function SlotShape({ type, size, filled, flash }: SlotShapeProps) {
  const borderColor = SLOT_STYLES[type].borderColor;
  const bgColor = filled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.25)';

  if (type === 'weapon') {
    return (
      <motion.div
        animate={flash ? { filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] } : {}}
        transition={{ duration: 0.3 }}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: `2px solid ${borderColor}`,
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      />
    );
  }

  if (type === 'shield') {
    return (
      <motion.div
        animate={flash ? { filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] } : {}}
        transition={{ duration: 0.3 }}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 44 44"
          style={{ position: 'absolute', inset: 0 }}
        >
          <polygon
            points="22,2 42,12 42,32 22,42 2,32 2,12"
            fill={bgColor}
            stroke={borderColor}
            strokeWidth="2"
          />
        </svg>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={flash ? { filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] } : {}}
      transition={{ duration: 0.3 }}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{ position: 'absolute', inset: 0 }}
      >
        <polygon
          points="25,4 46,44 4,44"
          fill={bgColor}
          stroke={borderColor}
          strokeWidth="2"
        />
      </svg>
    </motion.div>
  );
}

function BattleshipAssembly() {
  const { currentShip, placePart, removePart, draggedPart, setDraggedPart } = useGameStore();
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [flashSlots, setFlashSlots] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setHoveredSlot(slotId);
  };

  const handleDragLeave = () => {
    setHoveredSlot(null);
  };

  const handleDrop = (e: React.DragEvent, slot: Slot) => {
    e.preventDefault();
    setHoveredSlot(null);

    if (draggedPart && slot.type === draggedPart.category) {
      placePart(slot.id, draggedPart);
      setFlashSlots((prev) => new Set([...prev, slot.id]));
      setTimeout(() => {
        setFlashSlots((prev) => {
          const next = new Set(prev);
          next.delete(slot.id);
          return next;
        });
      }, 300);
      setDraggedPart(null);
    }
  };

  const handleSlotClick = (slot: Slot) => {
    if (slot.part) {
      removePart(slot.id);
    }
  };

  const renderSlot = (slot: Slot) => {
    const style = SLOT_STYLES[slot.type];
    const isHovered = hoveredSlot === slot.id && draggedPart?.category === slot.type;
    const hasPart = !!slot.part;
    const isFlashing = flashSlots.has(slot.id);

    return (
      <div
        key={slot.id}
        style={{
          position: 'absolute',
          left: `${slot.x}px`,
          top: `${slot.y}px`,
          transform: 'translate(-50%, -50%)',
          cursor: hasPart ? 'pointer' : 'default',
          zIndex: isHovered ? 10 : 1,
        }}
        onDragOver={(e) => handleDragOver(e, slot.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, slot)}
        onClick={() => handleSlotClick(slot)}
      >
        <motion.div
          animate={isHovered ? { scale: 1.15 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <SlotShape
            type={slot.type}
            size={style.size}
            filled={hasPart}
            flash={isFlashing}
          />
          {slot.part && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: slot.type === 'engine' ? '18px' : '16px',
                pointerEvents: 'none',
              }}
            >
              {slot.part.icon}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '420px',
        height: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '360px',
          height: '120px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="360"
            height="120"
            viewBox="0 0 360 120"
            style={{ opacity: 0.6 }}
          >
            <defs>
              <linearGradient id="shipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7B8B9D" />
                <stop offset="50%" stopColor="#6B7B8D" />
                <stop offset="100%" stopColor="#5B6B7D" />
              </linearGradient>
            </defs>
            <path
              d="M20,60 L60,30 L280,25 L320,40 L340,50 L340,70 L320,80 L280,95 L60,90 Z"
              fill="url(#shipGradient)"
              stroke="#8B9BAD"
              strokeWidth="2"
            />
            <path
              d="M80,35 L120,30 L120,50 L80,50 Z"
              fill="rgba(0,0,0,0.2)"
            />
            <path
              d="M140,32 L200,28 L200,48 L140,48 Z"
              fill="rgba(0,0,0,0.15)"
            />
            <rect x="300" y="52" width="25" height="16" rx="2" fill="rgba(0,0,0,0.25)" />
            <circle cx="100" cy="70" r="4" fill="rgba(255,255,255,0.2)" />
            <circle cx="150" cy="75" r="3" fill="rgba(255,255,255,0.15)" />
            <circle cx="200" cy="72" r="3" fill="rgba(255,255,255,0.15)" />
            <circle cx="250" cy="70" r="4" fill="rgba(255,255,255,0.2)" />
          </svg>
        </div>

        {currentShip.slots.map(renderSlot)}
      </div>
    </div>
  );
}

export default BattleshipAssembly;
