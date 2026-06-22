import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStore } from '../store';
import { CARD_WIDTH, CARD_HEIGHT } from '../utils/connection';

interface NodeCardProps {
  id: string;
  isTarget: boolean;
  onConnectionStart: (id: string, e: React.MouseEvent) => void;
}

export const NodeCard: React.FC<NodeCardProps> = React.memo(({
  id,
  isTarget,
  onConnectionStart,
}) => {
  const node = useStore((state) => state.nodes.find((n) => n.id === id));
  const updateNodeText = useStore((state) => state.updateNodeText);
  const deleteNode = useStore((state) => state.deleteNode);
  const updateNodePosition = useStore((state) => state.updateNodePosition);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(true);
  const [connectMode, setConnectMode] = useState(false);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: isEditing || connectMode,
  });

  useEffect(() => {
    if (!node) return;
    const checkView = () => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const inView =
          rect.right >= -20 &&
          rect.left <= window.innerWidth + 20 &&
          rect.bottom >= -20 &&
          rect.top <= window.innerHeight + 20;
        setIsInView(inView);
      }
    };
    checkView();
    window.addEventListener('resize', checkView);
    return () => window.removeEventListener('resize', checkView);
  }, [node?.x, node?.y]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      setIsEditing(true);
      setEditText(node?.text || '');
    }
  }, [isDragging, node?.text]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [deleteNode, id]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value.slice(0, 40));
  }, []);

  const handleInputBlur = useCallback(() => {
    if (editText.trim()) {
      updateNodeText(id, editText.trim());
    }
    setIsEditing(false);
  }, [editText, id, updateNodeText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
    }
  }, [handleInputBlur]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing || e.button !== 0) return;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };

    longPressTimer.current = window.setTimeout(() => {
      setConnectMode(true);
      onConnectionStart(id, e);
    }, 200);

    const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
      if (!mouseDownPos.current) return;
      const dx = moveEvent.clientX - mouseDownPos.current.x;
      const dy = moveEvent.clientY - mouseDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        if (distance > 30 || moveEvent.shiftKey) {
          setConnectMode(true);
          onConnectionStart(id, e);
        }
        window.removeEventListener('mousemove', handleGlobalMouseMove);
      }
    };

    const handleGlobalMouseUp = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  }, [id, isEditing, onConnectionStart]);

  useEffect(() => {
    if (!isDragging && !connectMode && node) {
      if (cardRef.current) {
        const transform = cardRef.current.style.transform;
        if (transform) {
          const match = transform.match(/translate3d\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px/);
          if (match) {
            const dx = parseFloat(match[1]);
            const dy = parseFloat(match[2]);
            if (dx !== 0 || dy !== 0) {
              updateNodePosition(id, node.x + dx, node.y + dy);
              cardRef.current.style.transform = '';
            }
          }
        }
      }
    }
  }, [isDragging, connectMode, id, node, updateNodePosition]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  if (!node) return null;

  const fontSize = isInView ? 14 : 12;

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      {...(!connectMode ? attributes : {})}
      {...(!connectMode ? listeners : {})}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background: isEditing ? '#FFF9C4' : '#FFFFFF',
        borderRadius: 8,
        boxShadow: isDragging
          ? '0 8px 16px rgba(0,0,0,0.2)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        opacity: isDragging ? 0.7 : 1,
        transition: connectMode ? 'none' : 'all 200ms ease-out',
        cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px 8px 14px',
        boxSizing: 'border-box',
        borderLeft: `3px solid ${node.color}`,
        userSelect: 'none',
        zIndex: isDragging ? 1000 : isTarget ? 100 : 1,
        outline: isTarget ? `3px solid ${node.color}` : 'none',
        outlineOffset: 2,
        touchAction: 'none',
      }}
    >
      <button
        onClick={handleDelete}
        style={{
          position: 'absolute',
          top: 4,
          right: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          color: '#999',
          padding: 0,
          lineHeight: 1,
          transition: 'color 200ms ease-out',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#FF6B6B';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#999';
        }}
      >
        ✕
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            textAlign: 'center',
            fontSize,
            fontFamily: 'inherit',
          }}
          maxLength={40}
        />
      ) : (
        <span
          style={{
            fontSize,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
            lineHeight: 1.3,
          }}
          title={node.text}
        >
          {node.text}
        </span>
      )}
    </div>
  );
});

NodeCard.displayName = 'NodeCard';
