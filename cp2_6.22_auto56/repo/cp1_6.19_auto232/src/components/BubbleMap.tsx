import { useAppStore } from '../store';

export default function BubbleMap() {
  const bubbles = useAppStore((s) => s.bubbles);
  const connections = useAppStore((s) => s.connections);
  const toolMode = useAppStore((s) => s.toolMode);
  const selectedBubbleId = useAppStore((s) => s.selectedBubbleId);
  const selectedConnectionId = useAppStore((s) => s.selectedConnectionId);
  const connectingFromId = useAppStore((s) => s.connectingFromId);
  const isDragging = useAppStore((s) => s.isDragging);
  const addBubble = useAppStore((s) => s.addBubble);
  const updateBubble = useAppStore((s) => s.updateBubble);
  const selectBubble = useAppStore((s) => s.selectBubble);
  const selectConnection = useAppStore((s) => s.selectConnection);
  const setConnectingFromId = useAppStore((s) => s.setConnectingFromId);
  const addConnection = useAppStore((s) => s.addConnection);
  const setDragging = useAppStore((s) => s.setDragging);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
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

  const handleBubbleMouseDown = (e: React.MouseEvent, bubbleId: string) => {
    e.stopPropagation();
    const bubble = bubbles.find((b) => b.id === bubbleId);
    if (!bubble) return;

    if (toolMode === 'select') {
      selectBubble(bubbleId);
      setDragging(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = bubble.x;
      const origY = bubble.y;

      const onMove = (ev: MouseEvent) => {
        updateBubble(bubbleId, {
          x: origX + (ev.clientX - startX),
          y: origY + (ev.clientY - startY),
        });
      };
      const onUp = () => {
        setDragging(false);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    } else if (toolMode === 'connect') {
      if (connectingFromId === null) {
        setConnectingFromId(bubbleId);
      } else if (connectingFromId !== bubbleId) {
        addConnection(connectingFromId, bubbleId);
      }
    }
  };

  const handleConnectionClick = (e: React.MouseEvent, connId: string) => {
    e.stopPropagation();
    if (toolMode === 'select') {
      selectConnection(connId);
    }
  };

  const getBubbleCenter = (bubbleId: string) => {
    const b = bubbles.find((x) => x.id === bubbleId);
    return b ? { x: b.x, y: b.y, r: b.diameter / 2 } : null;
  };

  return (
    <div
      id="bubble-map-canvas"
      className="canvas-grid"
      style={{
        marginLeft: 60,
        marginRight: 368,
        height: '100vh',
        position: 'relative',
        overflow: 'auto',
        cursor:
          toolMode === 'create'
            ? 'crosshair'
            : toolMode === 'connect'
            ? 'pointer'
            : isDragging
            ? 'grabbing'
            : 'default',
      }}
      onClick={handleCanvasClick}
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
      }}
    >
      {connections.map((conn) => {
        const s = getBubbleCenter(conn.sourceId);
        const t = getBubbleCenter(conn.targetId);
        if (!s || !t) return null;
        const isSelected = selectedConnectionId === conn.id;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        const x1 = s.x + ux * s.r;
        const y1 = s.y + uy * s.r;
        const x2 = t.x - ux * t.r;
        const y2 = t.y - uy * t.r;
        return (
          <g
            key={conn.id}
            style={{ pointerEvents: 'auto', cursor: toolMode === 'select' ? 'pointer' : 'default' }}
            onClick={(e) => handleConnectionClick(e, conn.id)}
          >
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isSelected ? '#1A365D' : conn.color}
              strokeWidth={isSelected ? conn.width + 1 : conn.width}
            />
            <circle
              cx={(x1 + x2) / 2}
              cy={(y1 + y2) / 2}
              r={12}
              fill="#FFFFFF"
              stroke={conn.color}
              strokeWidth={1}
            />
            <text
              x={(x1 + x2) / 2}
              y={(y1 + y2) / 2 + 4}
              fontSize={10}
              fill={conn.color}
              textAnchor="middle"
            >
              {conn.label}
            </text>
          </g>
        );
      })}
    </svg>

      {bubbles.map((b) => {
        const isSelected = selectedBubbleId === b.id;
        const isConnecting = connectingFromId === b.id;
        return (
          <div
            key={b.id}
            onMouseDown={(e) => handleBubbleMouseDown(e, b.id)}
            style={{
              position: 'absolute',
              left: b.x - b.diameter / 2,
              top: b.y - b.diameter / 2,
              width: b.diameter,
              height: b.diameter,
              borderRadius: '50%',
              background: b.color,
              opacity: b.opacity,
              border: isSelected
                ? '2px solid #333333'
                : isConnecting
                ? '2px dashed #1A365D'
                : '2px solid rgba(0,0,0,0.1)',
              boxShadow: isSelected
                ? '0 0 0 3px rgba(26, 54, 93, 0.2)'
                : '0 2px 8px rgba(0,0,0,0.1)',
              cursor:
                toolMode === 'select'
                  ? isDragging && isSelected
                    ? 'grabbing'
                    : 'grab'
                  : 'pointer',
              transition: 'box-shadow 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              userSelect: 'none',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {b.name}
          </div>
        );
      })}
    </div>
  );
}
