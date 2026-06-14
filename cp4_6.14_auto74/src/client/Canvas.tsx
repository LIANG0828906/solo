import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useBoardStore, CardData, ConnectionData } from './Store';
import { Card } from './Card';
import { Toolbar } from './Toolbar';

const GRID_SIZE = 20;

const ConnectionLine: React.FC<{
  conn: ConnectionData;
  cards: CardData[];
  hovered: boolean;
  onHover: (id: string | null) => void;
  onDelete: (id: string) => void;
  isDeleteMode: boolean;
}> = ({ conn, cards, hovered, onHover, onDelete, isDeleteMode }) => {
  const fromCard = cards.find((c) => c.id === conn.fromCardId);
  const toCard = cards.find((c) => c.id === conn.toCardId);
  if (!fromCard || !toCard) return null;

  const x1 = fromCard.x + 80;
  const y1 = fromCard.y + 120;
  const x2 = toCard.x + 80;
  const y2 = toCard.y;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curveOffset = Math.min(dist * 0.4, 100);

  const cx1 = x1;
  const cy1 = y1 + curveOffset;
  const cx2 = x2;
  const cy2 = y2 - curveOffset;

  const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g
      onMouseEnter={() => onHover(conn.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => {
        if (isDeleteMode) onDelete(conn.id);
      }}
      style={{ cursor: isDeleteMode ? 'pointer' : 'default' }}
    >
      <path
        d={path}
        fill="none"
        stroke={conn.color}
        strokeWidth={hovered ? 4 : 2}
        strokeDasharray={hovered ? '8,4' : 'none'}
        style={{ transition: 'stroke-dasharray 150ms ease' }}
      />
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
      />
      {hovered && conn.label && (
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize={11}
          style={{ pointerEvents: 'none' }}
        >
          {conn.label}
        </text>
      )}
    </g>
  );
};

export const Canvas: React.FC = () => {
  const cards = useBoardStore((s) => s.cards);
  const connections = useBoardStore((s) => s.connections);
  const toolMode = useBoardStore((s) => s.toolMode);
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const connectingFrom = useBoardStore((s) => s.connectingFrom);
  const connectingTo = useBoardStore((s) => s.connectingTo);
  const onlineCount = useBoardStore((s) => s.onlineCount);
  const loadBoard = useBoardStore((s) => s.loadBoard);
  const addCard = useBoardStore((s) => s.addCard);
  const updateCard = useBoardStore((s) => s.updateCard);
  const deleteCard = useBoardStore((s) => s.deleteCard);
  const addConnection = useBoardStore((s) => s.addConnection);
  const deleteConnection = useBoardStore((s) => s.deleteConnection);
  const saveSnapshot = useBoardStore((s) => s.saveSnapshot);
  const selectCard = useBoardStore((s) => s.selectCard);
  const setConnectingFrom = useBoardStore((s) => s.setConnectingFrom);
  const setConnectingTo = useBoardStore((s) => s.setConnectingTo);
  const applyFullSync = useBoardStore((s) => s.applyFullSync);
  const applyIncremental = useBoardStore((s) => s.applyIncremental);
  const setOnlineCount = useBoardStore((s) => s.setOnlineCount);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    cardId: string;
    startX: number;
    startY: number;
    cardStartX: number;
    cardStartY: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const eventSource = new EventSource('/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'full-sync') {
          applyFullSync(data.state);
        } else if (data.type === 'incremental') {
          applyIncremental(data.updates);
        }
      } catch {}
    };

    return () => {
      eventSource.close();
    };
  }, [applyFullSync, applyIncremental]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/online');
        const data = await res.json();
        setOnlineCount(data.count);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [setOnlineCount]);

  const getCanvasCursor = useCallback(() => {
    if (toolMode === 'connect') return 'crosshair';
    if (toolMode === 'delete') return 'none';
    if (toolMode === 'add-card') return 'cell';
    return 'default';
  }, [toolMode]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains('canvas-grid')) return;

      if (toolMode === 'add-card') {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left - 80 + canvasOffset.x;
        const y = e.clientY - rect.top - 60 + canvasOffset.y;
        addCard(x, y);
      }

      selectCard(null);
      setEditingCardId(null);

      if (toolMode === 'select' && e.button === 0) {
        const startX = e.clientX;
        const startY = e.clientY;
        const startOffset = { ...canvasOffset };

        const handleMove = (ev: MouseEvent) => {
          setCanvasOffset({
            x: startOffset.x - (ev.clientX - startX),
            y: startOffset.y - (ev.clientY - startY),
          });
        };

        const handleUp = () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mouseup', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
      }
    },
    [toolMode, addCard, selectCard, canvasOffset]
  );

  const handleCardDragStart = useCallback(
    (cardId: string, e: React.MouseEvent) => {
      if (toolMode !== 'select') return;
      e.stopPropagation();
      selectCard(cardId);

      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      dragRef.current = {
        cardId,
        startX: e.clientX,
        startY: e.clientY,
        cardStartX: card.x,
        cardStartY: card.y,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        updateCard(cardId, {
          x: dragRef.current.cardStartX + dx,
          y: dragRef.current.cardStartY + dy,
        });
      };

      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [toolMode, cards, selectCard, updateCard]
  );

  const handleConnectStart = useCallback(
    (cardId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConnectingFrom(cardId);

      const handleMove = (ev: MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        setConnectingTo({
          x: ev.clientX - rect.left + canvasOffset.x,
          y: ev.clientY - rect.top + canvasOffset.y,
        });
      };

      const handleUp = (ev: MouseEvent) => {
        const target = ev.target as HTMLElement;
        const cardEl = target.closest('[data-card-id]');
        if (cardEl) {
          const toCardId = cardEl.getAttribute('data-card-id');
          if (toCardId && toCardId !== cardId) {
            addConnection(cardId, toCardId);
          }
        }
        setConnectingFrom(null);
        setConnectingTo(null);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [addConnection, setConnectingFrom, setConnectingTo, canvasOffset]
  );

  const handleDoubleClick = useCallback((cardId: string) => {
    setEditingCardId(cardId);
  }, []);

  const handleEditEnd = useCallback((_cardId: string) => {
    setEditingCardId(null);
  }, []);

  const handleContentChange = useCallback(
    (cardId: string, content: string) => {
      updateCard(cardId, { content });
    },
    [updateCard]
  );

  const handleSaveSnapshot = useCallback(async () => {
    await saveSnapshot();
  }, [saveSnapshot]);

  const renderGrid = () => {
    const patternId = 'grid-pattern';
    return (
      <svg
        style={{
          position: 'absolute',
          left: -canvasOffset.x,
          top: -canvasOffset.y,
          width: '200%',
          height: '200%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <pattern id={patternId} width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <circle cx={GRID_SIZE / 2} cy={GRID_SIZE / 2} r={0.5} fill="rgba(30,41,59,0.5)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    );
  };

  const renderConnections = () => {
    return (
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <g transform={`translate(${-canvasOffset.x}, ${-canvasOffset.y})`}>
          {connections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              conn={conn}
              cards={cards}
              hovered={hoveredConnection === conn.id}
              onHover={setHoveredConnection}
              onDelete={deleteConnection}
              isDeleteMode={toolMode === 'delete'}
            />
          ))}
          {connectingFrom && connectingTo && (
            <ConnectingLine
              fromCardId={connectingFrom}
              toPos={connectingTo}
              cards={cards}
            />
          )}
        </g>
      </svg>
    );
  };

  const renderCards = () => {
    return cards.map((card) => (
      <div
        key={card.id}
        data-card-id={card.id}
        style={{
          position: 'absolute',
          left: card.x - canvasOffset.x,
          top: card.y - canvasOffset.y,
          transition: 'left 0.25s cubic-bezier(.34,1.56,.64,1), top 0.25s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <Card
          card={card}
          isSelected={selectedCardId === card.id}
          isEditing={editingCardId === card.id}
          isConnecting={toolMode === 'connect'}
          isDeleteMode={toolMode === 'delete'}
          onDoubleClick={handleDoubleClick}
          onDragStart={handleCardDragStart}
          onConnectStart={handleConnectStart}
          onDelete={deleteCard}
          onContentChange={handleContentChange}
          onEditEnd={handleEditEnd}
        />
      </div>
    ));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f172a' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          background: 'rgba(30,41,59,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 200,
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 16 }}>
            团队创意头脑风暴看板
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px rgba(34,197,94,0.5)',
            }}
          />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{onlineCount} 在线</span>
        </div>
      </div>

      <Toolbar onSaveSnapshot={handleSaveSnapshot} />

      <div
        ref={canvasRef}
        className="canvas-grid"
        onMouseDown={handleCanvasMouseDown}
        style={{
          position: 'fixed',
          left: 60,
          top: 48,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          cursor: getCanvasCursor(),
        }}
      >
        {renderGrid()}
        {renderConnections()}
        {renderCards()}

        {toolMode === 'delete' && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              background: 'rgba(239,68,68,0.9)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              zIndex: 300,
              pointerEvents: 'none',
            }}
          >
            点击卡片或连线进行删除
          </div>
        )}

        {toolMode === 'connect' && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              background: 'rgba(59,130,246,0.9)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              zIndex: 300,
              pointerEvents: 'none',
            }}
          >
            从卡片底部连接点拖拽到另一张卡片
          </div>
        )}
      </div>
    </div>
  );
};

const ConnectingLine: React.FC<{
  fromCardId: string;
  toPos: { x: number; y: number };
  cards: CardData[];
}> = ({ fromCardId, toPos, cards }) => {
  const fromCard = cards.find((c) => c.id === fromCardId);
  if (!fromCard) return null;

  const x1 = fromCard.x + 80;
  const y1 = fromCard.y + 120;
  const x2 = toPos.x;
  const y2 = toPos.y;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curveOffset = Math.min(dist * 0.4, 100);

  const path = `M ${x1} ${y1} C ${x1} ${y1 + curveOffset}, ${x2} ${y2 - curveOffset}, ${x2} ${y2}`;

  return (
    <path
      d={path}
      fill="none"
      stroke={fromCard.color}
      strokeWidth={2}
      strokeDasharray="6,4"
      style={{ pointerEvents: 'none' }}
    />
  );
};
