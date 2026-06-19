import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import type { Bubble, ToolMode } from './types';
import { MIN_BUBBLE_DIAMETER, MAX_BUBBLE_DIAMETER, MAX_NAME_LENGTH } from './constants';
import { useAppStore } from './store';

interface BubbleNodeProps {
  bubble: Bubble;
  isSelected: boolean;
  isConnecting: boolean;
  toolMode: ToolMode;
}

export default function BubbleNode({
  bubble,
  isSelected,
  isConnecting,
  toolMode,
}: BubbleNodeProps) {
  const updateBubble = useAppStore((s) => s.updateBubble);
  const selectBubble = useAppStore((s) => s.selectBubble);
  const setDragging = useAppStore((s) => s.setDragging);
  const setResizing = useAppStore((s) => s.setResizing);
  const setConnectingFromId = useAppStore((s) => s.setConnectingFromId);
  const addConnection = useAppStore((s) => s.addConnection);
  const connectingFromId = useAppStore((s) => s.connectingFromId);
  const isDragging = useAppStore((s) => s.isDragging);

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    origDiameter: number;
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (e.ctrlKey && (toolMode === 'select' || toolMode === 'connect')) {
      if (connectingFromId === null) {
        selectBubble(bubble.id);
        setConnectingFromId(bubble.id);
      } else if (connectingFromId !== bubble.id) {
        addConnection(connectingFromId, bubble.id);
      }
      return;
    }

    if (toolMode === 'select') {
      selectBubble(bubble.id);
      setDragging(true);
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: bubble.x,
        origY: bubble.y,
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragStartRef.current) return;
        updateBubble(bubble.id, {
          x: dragStartRef.current.origX + (ev.clientX - dragStartRef.current.startX),
          y: dragStartRef.current.origY + (ev.clientY - dragStartRef.current.startY),
        });
      };

      const onUp = () => {
        setDragging(false);
        dragStartRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    } else if (toolMode === 'connect') {
      if (connectingFromId === null) {
        selectBubble(bubble.id);
        setConnectingFromId(bubble.id);
      } else if (connectingFromId !== bubble.id) {
        addConnection(connectingFromId, bubble.id);
      }
    } else if (toolMode === 'create') {
      selectBubble(bubble.id);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(true);

    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origDiameter: bubble.diameter,
    };

    const onMove = (ev: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const dx = ev.clientX - resizeStartRef.current.startX;
      const dy = ev.clientY - resizeStartRef.current.startY;
      const delta = Math.sqrt(dx * dx + dy * dy);
      const sign = dx + dy >= 0 ? 1 : -1;
      let newDiameter = resizeStartRef.current.origDiameter + sign * delta * 2;
      newDiameter = Math.max(MIN_BUBBLE_DIAMETER, Math.min(MAX_BUBBLE_DIAMETER, newDiameter));
      updateBubble(bubble.id, { diameter: newDiameter });
    };

    const onUp = () => {
      setResizing(false);
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const displayName = bubble.name.slice(0, MAX_NAME_LENGTH);
  const radius = bubble.diameter / 2;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', duration: 0.25, bounce: 0.56 }}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: bubble.x - radius,
        top: bubble.y - radius,
        width: bubble.diameter,
        height: bubble.diameter,
        borderRadius: '50%',
        background: bubble.color,
        opacity: bubble.opacity,
        outline: isSelected
          ? '2px dashed #333333'
          : isConnecting
          ? '2px dashed #1A365D'
          : 'none',
        outlineOffset: isSelected || isConnecting ? '2px' : 0,
        boxShadow: isSelected
          ? '0 0 0 3px rgba(26, 54, 93, 0.2), 0 2px 8px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        cursor:
          toolMode === 'select'
            ? isDragging && isSelected
              ? 'grabbing'
              : 'grab'
            : toolMode === 'connect'
            ? 'copy'
            : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 700,
        userSelect: 'none',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        zIndex: isSelected ? 10 : 1,
      }}
    >
      {displayName}

      {isSelected && (
        <>
          <div
            onMouseDown={handleResizeMouseDown}
            style={{
              position: 'absolute',
              right: -7,
              bottom: -7,
              width: 14,
              height: 14,
              background: '#FFFFFF',
              border: '1.5px solid #333333',
              borderRadius: 3,
              cursor: 'nwse-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: '#333333',
              userSelect: 'none',
              zIndex: 20,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </div>

          <div
            style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 10,
              height: 10,
              background: '#FFFFFF',
              border: '1.5px solid #333333',
              borderRadius: '50%',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </div>
        </>
      )}
    </motion.div>
  );
}
