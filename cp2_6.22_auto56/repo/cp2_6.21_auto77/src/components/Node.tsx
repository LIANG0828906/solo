import React, { useState, useRef, useEffect } from 'react';
import { StickyNote } from 'lucide-react';
import type { BrainstormNode } from '@/types';
import { useBrainstormStore } from '@/stores/useBrainstormStore';

interface NodeProps {
  node: BrainstormNode;
  isSelected: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onStartDragConnection: (nodeId: string, startX: number, startY: number) => void;
  onDoubleClick: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BrainstormNode>) => void;
}

export default function Node({
  node,
  isSelected,
  scale,
  onSelect,
  onMove,
  onStartDragConnection,
  onDoubleClick,
  onUpdate,
}: NodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const dragStartRef = useRef<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);
  const nodes = useBrainstormStore((state) => state.nodes);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const checkCollision = (newX: number, newY: number): boolean => {
    const padding = 20;
    for (const other of nodes) {
      if (other.id === node.id) continue;
      const overlapX =
        newX + node.width + padding > other.x &&
        newX < other.x + other.width + padding;
      const overlapY =
        newY + node.height + padding > other.y &&
        newY < other.y + other.height + padding;
      if (overlapX && overlapY) {
        return true;
      }
    }
    return false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect(node.id);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;
      const newX = dragStartRef.current.nodeX + dx;
      const newY = dragStartRef.current.nodeY + dy;
      if (!checkCollision(newX, newY)) {
        onMove(node.id, newX, newY);
      }
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
  }, [isDragging, scale, node.id, onMove]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(node.title);
    onDoubleClick(node.id);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle !== node.title) {
      onUpdate(node.id, { title: editTitle.trim() });
    } else {
      setEditTitle(node.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(node.title);
    }
  };

  const handleConnectionStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const handleX = node.x + node.width;
    const handleY = node.y + node.height;
    onStartDragConnection(node.id, handleX, handleY);
  };

  return (
    <g
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 0.2s ease',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transformOrigin: `${node.x + node.width / 2}px ${node.y + node.height / 2}px`,
      }}
    >
      {isDragging && (
        <rect
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          rx={12}
          ry={12}
          fill="transparent"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
          }}
        />
      )}
      <foreignObject
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        style={{ overflow: 'visible' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            backgroundColor: '#E3F2FD',
            border: `2px solid ${isSelected ? '#1565C0' : 'transparent'}`,
            boxSizing: 'border-box',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Roboto', sans-serif",
            transition: 'all 0.2s ease',
            boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: '#212121',
                fontFamily: "'Roboto', sans-serif",
                padding: 0,
              }}
            />
          ) : (
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#212121',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {node.title}
            </div>
          )}
          {node.note && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <StickyNote size={14} color="#757575" />
            </div>
          )}
        </div>
      </foreignObject>
      <circle
        cx={node.x + node.width}
        cy={node.y + node.height}
        r={6}
        fill="#1565C0"
        stroke="#FFFFFF"
        strokeWidth={2}
        style={{
          cursor: 'crosshair',
          transition: 'all 0.2s ease',
        }}
        onMouseDown={handleConnectionStart}
      />
    </g>
  );
}
