import React, { useState, useRef, useEffect } from 'react';
import type { SemanticGroup } from '@/types';
import { useBrainstormStore } from '@/stores/useBrainstormStore';

interface SemanticGroupBoxProps {
  group: SemanticGroup;
  onDrag: (groupId: string, dx: number, dy: number) => void;
}

export default function SemanticGroupBox({ group, onDrag }: SemanticGroupBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const nodes = useBrainstormStore((state) => state.nodes);

  const padding = 24;

  const groupNodes = nodes.filter((n) => group.nodeIds.includes(n.id));

  let minX = group.x;
  let minY = group.y;
  let maxX = group.x + group.width;
  let maxY = group.y + group.height;

  if (groupNodes.length > 0) {
    minX = Math.min(...groupNodes.map((n) => n.x)) - padding;
    minY = Math.min(...groupNodes.map((n) => n.y)) - padding;
    maxX = Math.max(...groupNodes.map((n) => n.x + n.width)) + padding;
    maxY = Math.max(...groupNodes.map((n) => n.y + n.height)) + padding;
  }

  const width = maxX - minX;
  const height = maxY - minY;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      onDrag(group.id, dx, dy);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, group.id, onDrag]);

  return (
    <g style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        rx={16}
        ry={16}
        fill="rgba(158, 158, 158, 0.15)"
        stroke="rgba(158, 158, 158, 0.3)"
        strokeWidth={1}
        strokeDasharray="4 4"
        onMouseDown={handleMouseDown}
        style={{ transition: 'all 0.2s ease' }}
      />
      <foreignObject
        x={minX + 12}
        y={minY - 14}
        width={200}
        height={28}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#616161',
            fontFamily: "'Roboto', sans-serif",
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            whiteSpace: 'nowrap',
          }}
        >
          {group.keyword}
        </div>
      </foreignObject>
    </g>
  );
}
