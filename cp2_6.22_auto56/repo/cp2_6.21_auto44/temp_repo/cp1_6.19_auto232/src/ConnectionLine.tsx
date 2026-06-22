import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Connection, Bubble } from './types';
import { useAppStore } from './store';

interface ConnectionLineProps {
  connection: Connection;
  bubbles: Bubble[];
  isSelected: boolean;
}

export default function ConnectionLine({
  connection,
  bubbles,
  isSelected,
}: ConnectionLineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(connection.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectConnection = useAppStore((s) => s.selectConnection);
  const updateConnection = useAppStore((s) => s.updateConnection);
  const toolMode = useAppStore((s) => s.toolMode);

  const source = bubbles.find((b) => b.id === connection.sourceId);
  const target = bubbles.find((b) => b.id === connection.targetId);

  if (!source || !target) return null;

  const sR = source.diameter / 2;
  const tR = target.diameter / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  const x1 = source.x + ux * sR;
  const y1 = source.y + uy * sR;
  const x2 = target.x - ux * tR;
  const y2 = target.y - uy * tR;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  let pathD: string;
  let labelX = midX;
  let labelY = midY;

  if (connection.style === 'bezier') {
    const offset = connection.controlPointOffset || { x1: 0, y1: -80, x2: 0, y2: -80 };
    const cp1x = x1 + (x2 - x1) * 0.3 + offset.x1;
    const cp1y = y1 + (y2 - y1) * 0.3 + offset.y1;
    const cp2x = x1 + (x2 - x1) * 0.7 + offset.x2;
    const cp2y = y1 + (y2 - y1) * 0.7 + offset.y2;
    pathD = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

    const t = 0.5;
    const mt = 1 - t;
    labelX = mt * mt * mt * x1 + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * x2;
    labelY = mt * mt * mt * y1 + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * y2;
  } else {
    pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toolMode === 'select') {
      selectConnection(connection.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toolMode === 'select') {
      setEditValue(connection.label);
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const finishEdit = () => {
    if (editValue.trim()) {
      updateConnection(connection.id, { label: editValue.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      finishEdit();
    } else if (e.key === 'Escape') {
      setEditValue(connection.label);
      setIsEditing(false);
    }
  };

  const strokeColor = isSelected ? '#1A365D' : connection.color;
  const strokeWidth = isSelected ? connection.width + 1.5 : connection.width;

  const arrowAngle = Math.atan2(y2 - y1, x2 - x1);
  const arrowSize = 8;
  const arrowTipX = x2;
  const arrowTipY = y2;
  const arrowBaseX1 = arrowTipX - arrowSize * Math.cos(arrowAngle - Math.PI / 6);
  const arrowBaseY1 = arrowTipY - arrowSize * Math.sin(arrowAngle - Math.PI / 6);
  const arrowBaseX2 = arrowTipX - arrowSize * Math.cos(arrowAngle + Math.PI / 6);
  const arrowBaseY2 = arrowTipY - arrowSize * Math.sin(arrowAngle + Math.PI / 6);
  const arrowPathD = `M ${arrowTipX} ${arrowTipY} L ${arrowBaseX1} ${arrowBaseY1} L ${arrowBaseX2} ${arrowBaseY2} Z`;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        pointerEvents: 'auto',
        cursor: toolMode === 'select' ? 'pointer' : 'default',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth={Math.max(strokeWidth + 10, 14)}
        fill="none"
      />
      <path
        d={pathD}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      <path d={arrowPathD} fill={strokeColor} />

      <foreignObject
        x={labelX - 60}
        y={labelY - 14}
        width={120}
        height={28}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          {isEditing && isSelected ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={finishEdit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(255,255,255,0.95)',
                border: `1px solid ${isSelected ? '#1A365D' : connection.color}`,
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 11,
                width: 80,
                textAlign: 'center',
                pointerEvents: 'auto',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <span
              style={{
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 11,
                color: isSelected ? '#1A365D' : '#4A5568',
                fontWeight: isSelected ? 600 : 500,
                whiteSpace: 'nowrap',
                pointerEvents: isSelected ? 'auto' : 'none',
                border: isSelected ? '1px solid #1A365D' : 'none',
              }}
            >
              {connection.label}
            </span>
          )}
        </div>
      </foreignObject>
    </motion.g>
  );
}
