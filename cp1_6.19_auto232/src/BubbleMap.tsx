import React from 'react';
import BubbleNode from './BubbleNode';
import ConnectionLine from './ConnectionLine';
import { useAppStore } from './store';

export default function BubbleMap() {
  const bubbles = useAppStore((s) => s.bubbles);
  const connections = useAppStore((s) => s.connections);
  const toolMode = useAppStore((s) => s.toolMode);
  const selectedBubbleId = useAppStore((s) => s.selectedBubbleId);
  const selectedConnectionId = useAppStore((s) => s.selectedConnectionId);
  const connectingFromId = useAppStore((s) => s.connectingFromId);
  const isDragging = useAppStore((s) => s.isDragging);
  const addBubble = useAppStore((s) => s.addBubble);
  const selectBubble = useAppStore((s) => s.selectBubble);
  const selectConnection = useAppStore((s) => s.selectConnection);
  const setConnectingFromId = useAppStore((s) => s.setConnectingFromId);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;

    if (e.ctrlKey && toolMode === 'select') {
      return;
    }

    if (toolMode === 'create') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addBubble(x, y);
    } else if (toolMode === 'select') {
      selectBubble(null);
      selectConnection(null);
    } else if (toolMode === 'connect') {
      setConnectingFromId(null);
    }
  };

  let cursor: React.CSSProperties['cursor'] = 'default';
  if (toolMode === 'create') {
    cursor = 'crosshair';
  } else if (toolMode === 'connect') {
    cursor = 'copy';
  } else if (toolMode === 'select' && isDragging) {
    cursor = 'grabbing';
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        marginLeft: 60,
        marginRight: 368,
        height: '100vh',
        overflow: 'auto',
        cursor,
      }}
    >
      <div
        id="bubble-map-canvas"
        className="canvas-grid"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minWidth: 5000,
          minHeight: 5000,
        }}
        onMouseDown={handleMouseDown}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: 1,
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6C757D" />
            </marker>
          </defs>
          {connections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              connection={conn}
              bubbles={bubbles}
              isSelected={selectedConnectionId === conn.id}
            />
          ))}
        </svg>

        <div style={{ position: 'relative', zIndex: 2 }}>
          {bubbles.map((bubble) => (
            <BubbleNode
              key={bubble.id}
              bubble={bubble}
              isSelected={selectedBubbleId === bubble.id}
              isConnecting={connectingFromId === bubble.id}
              toolMode={toolMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
