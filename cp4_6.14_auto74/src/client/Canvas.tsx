import React, {
  memo,
  useCallback,
  useRef,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { useBoardStore, CardData, ConnectionData, SnapshotData } from './Store';
import { Card } from './Card';
import { Toolbar } from './Toolbar';

const GRID_SIZE = 20;
const CARD_W = 160;
const CARD_H = 120;

function computeBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curveOffset = Math.min(Math.max(dist * 0.4, 20), 100);
  return `M ${x1} ${y1} C ${x1} ${y1 + curveOffset}, ${x2} ${y2 - curveOffset}, ${x2} ${y2}`;
}

const ConnectionLine = memo(function ConnectionLine({
  conn,
  cardsById,
  hovered,
  onHover,
  onDelete,
  isDeleteMode,
}: {
  conn: ConnectionData;
  cardsById: Map<string, CardData>;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onDelete: (id: string) => void;
  isDeleteMode: boolean;
}) {
  const fromCard = cardsById.get(conn.fromCardId);
  const toCard = cardsById.get(conn.toCardId);
  if (!fromCard || !toCard) return null;

  const x1 = fromCard.x + CARD_W / 2;
  const y1 = fromCard.y + CARD_H;
  const x2 = toCard.x + CARD_W / 2;
  const y2 = toCard.y;

  const pathD = useMemo(
    () => computeBezierPath(x1, y1, x2, y2),
    [x1, y1, x2, y2]
  );

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
        d={pathD}
        fill="none"
        stroke={conn.color}
        strokeWidth={hovered ? 4 : 2}
        strokeDasharray={hovered ? '8,4' : undefined}
        style={{ transition: 'stroke-width 150ms ease, stroke-dasharray 150ms ease' }}
      />
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
      />
      {hovered && (
        <g>
          {conn.label ? (
            <text
              x={midX}
              y={midY - 10}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize={11}
              style={{ pointerEvents: 'none' }}
            >
              {conn.label}
            </text>
          ) : (
            <text
              x={midX}
              y={midY - 10}
              textAnchor="middle"
              fill="#64748b"
              fontSize={10}
              fontStyle="italic"
              style={{ pointerEvents: 'none' }}
            >
              点击删除
            </text>
          )}
        </g>
      )}
    </g>
  );
});

const SnapshotPanel = memo(function SnapshotPanel({
  snapshots,
  onClose,
  onRestore,
}: {
  snapshots: SnapshotData[];
  onClose: () => void;
  onRestore: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 48,
        right: 0,
        bottom: 0,
        width: 280,
        background: 'rgba(30,41,59,0.95)',
        backdropFilter: 'blur(8px)',
        borderLeft: '1px solid #334155',
        zIndex: 250,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>
          📜 历史快照
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {snapshots.length === 0 ? (
          <div
            style={{
              color: '#64748b',
              textAlign: 'center',
              padding: 40,
              fontSize: 13,
            }}
          >
            暂无快照记录
            <br />
            点击 📷 按钮保存快照
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {snapshots
              .slice()
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((snapshot, idx) => {
                const date = new Date(snapshot.timestamp);
                const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return (
                  <div
                    key={snapshot.id}
                    style={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      padding: 12,
                      cursor: 'default',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#334155';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>
                        快照 #{snapshots.length - idx}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>{timeStr}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 10,
                        fontSize: 11,
                        color: '#94a3b8',
                      }}
                    >
                      <span>💡 {snapshot.cards.length} 卡片</span>
                      <span>🔗 {snapshot.connections.length} 连线</span>
                    </div>
                    <button
                      onClick={() => onRestore(snapshot.id)}
                      style={{
                        width: '100%',
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 0',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'background 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#3b82f6';
                      }}
                    >
                      恢复到此版本
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
});

export const Canvas: React.FC = function Canvas() {
  const cards = useBoardStore((s) => s.cards);
  const connections = useBoardStore((s) => s.connections);
  const toolMode = useBoardStore((s) => s.toolMode);
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const connectingFrom = useBoardStore((s) => s.connectingFrom);
  const connectingTo = useBoardStore((s) => s.connectingTo);
  const onlineCount = useBoardStore((s) => s.onlineCount);
  const hoveredConnectionId = useBoardStore((s) => s.hoveredConnectionId);
  const snapshots = useBoardStore((s) => s.snapshots);
  const snapshotPanelOpen = useBoardStore((s) => s.snapshotPanelOpen);

  const loadBoard = useBoardStore((s) => s.loadBoard);
  const addCard = useBoardStore((s) => s.addCard);
  const updateCard = useBoardStore((s) => s.updateCard);
  const updateCardLocal = useBoardStore((s) => s.updateCardLocal);
  const flushPendingCardUpdates = useBoardStore((s) => s.flushPendingCardUpdates);
  const deleteCard = useBoardStore((s) => s.deleteCard);
  const addConnection = useBoardStore((s) => s.addConnection);
  const deleteConnection = useBoardStore((s) => s.deleteConnection);
  const saveSnapshot = useBoardStore((s) => s.saveSnapshot);
  const loadSnapshots = useBoardStore((s) => s.loadSnapshots);
  const restoreSnapshot = useBoardStore((s) => s.restoreSnapshot);
  const selectCard = useBoardStore((s) => s.selectCard);
  const setConnectingFrom = useBoardStore((s) => s.setConnectingFrom);
  const setConnectingTo = useBoardStore((s) => s.setConnectingTo);
  const setHoveredConnectionId = useBoardStore((s) => s.setHoveredConnectionId);
  const applyFullSync = useBoardStore((s) => s.applyFullSync);
  const applyIncremental = useBoardStore((s) => s.applyIncremental);
  const setOnlineCount = useBoardStore((s) => s.setOnlineCount);
  const setSnapshotPanelOpen = useBoardStore((s) => s.setSnapshotPanelOpen);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [hoveredConnectPoint, setHoveredConnectPoint] = useState<{
    cardId: string;
    point: 'top' | 'bottom';
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    cardId: string;
    startX: number;
    startY: number;
    cardStartX: number;
    cardStartY: number;
    lastSentX: number;
    lastSentY: number;
    rafId: number | null;
  } | null>(null);
  const contentDebounceRef = useRef<{ id: string; timer: NodeJS.Timeout } | null>(null);

  const cardsById = useMemo(() => {
    const map = new Map<string, CardData>();
    for (const c of cards) map.set(c.id, c);
    return map;
  }, [cards]);

  useEffect(() => {
    loadBoard();
    loadSnapshots();
  }, [loadBoard, loadSnapshots]);

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

  useEffect(() => {
    return () => {
      if (contentDebounceRef.current) {
        clearTimeout(contentDebounceRef.current.timer);
      }
      if (dragRef.current?.rafId) {
        cancelAnimationFrame(dragRef.current.rafId);
      }
    };
  }, []);

  const getCanvasCursor = useCallback(() => {
    if (toolMode === 'connect') return 'crosshair';
    if (toolMode === 'delete') return 'not-allowed';
    if (toolMode === 'add-card') return 'copy';
    return 'grab';
  }, [toolMode]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target !== canvasRef.current &&
        !target.classList.contains('canvas-grid-bg')
      ) {
        if (target.closest('[data-card-id]') || target.closest('svg')) return;
      }

      if (toolMode === 'add-card') {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left - CARD_W / 2 + canvasOffset.x;
        const y = e.clientY - rect.top - CARD_H / 2 + canvasOffset.y;
        addCard(x, y);
        return;
      }

      selectCard(null);
      setEditingCardId(null);

      if (toolMode === 'select' && e.button === 0) {
        const startX = e.clientX;
        const startY = e.clientY;
        const startOffset = { ...canvasOffset };
        e.preventDefault();

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

      const card = cardsById.get(cardId);
      if (!card) return;

      const rafIdRef = { value: 0 };
      const pending = { dx: 0, dy: 0 };

      dragRef.current = {
        cardId,
        startX: e.clientX,
        startY: e.clientY,
        cardStartX: card.x,
        cardStartY: card.y,
        lastSentX: card.x,
        lastSentY: card.y,
        rafId: null,
      };

      const scheduleRaf = () => {
        if (rafIdRef.value) return;
        rafIdRef.value = requestAnimationFrame(() => {
          rafIdRef.value = 0;
          if (!dragRef.current) return;
          const nx = dragRef.current.cardStartX + pending.dx;
          const ny = dragRef.current.cardStartY + pending.dy;
          updateCardLocal(cardId, { x: nx, y: ny });

          const ddx = Math.abs(nx - dragRef.current.lastSentX);
          const ddy = Math.abs(ny - dragRef.current.lastSentY);
          if (ddx + ddy > 4) {
            dragRef.current.lastSentX = nx;
            dragRef.current.lastSentY = ny;
            updateCard(cardId, { x: nx, y: ny });
          }
        });
      };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        pending.dx = ev.clientX - dragRef.current.startX;
        pending.dy = ev.clientY - dragRef.current.startY;
        scheduleRaf();
      };

      const handleUp = () => {
        if (rafIdRef.value) {
          cancelAnimationFrame(rafIdRef.value);
        }
        if (dragRef.current) {
          const nx = dragRef.current.cardStartX + pending.dx;
          const ny = dragRef.current.cardStartY + pending.dy;
          updateCard(cardId, { x: nx, y: ny });
          flushPendingCardUpdates();
          dragRef.current = null;
        }
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [toolMode, cardsById, selectCard, updateCardLocal, updateCard, flushPendingCardUpdates]
  );

  const handleConnectStart = useCallback(
    (cardId: string, point: 'bottom' | 'top', e: React.MouseEvent) => {
      if (toolMode !== 'connect') return;
      e.stopPropagation();
      setConnectingFrom(cardId);
      const rect = canvasRef.current!.getBoundingClientRect();
      const card = cardsById.get(cardId);
      if (!card) return;

      const startX = card.x + CARD_W / 2;
      const startY = point === 'bottom' ? card.y + CARD_H : card.y;
      setConnectingTo({
        x: startX + (e.clientX - rect.left - (startX - canvasOffset.x)),
        y: startY + (e.clientY - rect.top - (startY - canvasOffset.y)),
      });

      let releaseTarget: string | null = null;

      const handleMove = (ev: MouseEvent) => {
        setConnectingTo({
          x: ev.clientX - rect.left + canvasOffset.x,
          y: ev.clientY - rect.top + canvasOffset.y,
        });
        const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
        if (el) {
          const cp = el.closest('[data-connect-point]') as HTMLElement | null;
          if (cp && cp.getAttribute('data-connect-point') === 'top') {
            const cardEl = cp.closest('[data-card-id]') as HTMLElement | null;
            const tid = cardEl?.getAttribute('data-card-id') || null;
            releaseTarget = tid && tid !== cardId ? tid : null;
          } else {
            releaseTarget = null;
          }
        }
      };

      const handleUp = (ev: MouseEvent) => {
        let toCardId = releaseTarget;
        if (!toCardId) {
          const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
          if (el) {
            const cp = el.closest('[data-connect-point]') as HTMLElement | null;
            if (cp && cp.getAttribute('data-connect-point') === 'top') {
              const cardEl = cp.closest('[data-card-id]') as HTMLElement | null;
              const tid = cardEl?.getAttribute('data-card-id') || null;
              if (tid && tid !== cardId) toCardId = tid;
            }
          }
        }
        if (toCardId) {
          addConnection(cardId, toCardId);
        }
        setConnectingFrom(null);
        setConnectingTo(null);
        setHoveredConnectPoint(null);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [
      toolMode,
      cardsById,
      setConnectingFrom,
      setConnectingTo,
      canvasOffset,
      addConnection,
    ]
  );

  const handleDoubleClick = useCallback((cardId: string) => {
    const card = cardsById.get(cardId);
    setEditingCardId(cardId);
    setEditingContent(card?.content ?? '');
  }, [cardsById]);

  const handleEditEnd = useCallback(
    (cardId: string) => {
      if (contentDebounceRef.current && contentDebounceRef.current.id === cardId) {
        clearTimeout(contentDebounceRef.current.timer);
        updateCard(cardId, { content: editingContent });
        contentDebounceRef.current = null;
      }
      setEditingCardId(null);
    },
    [updateCard, editingContent]
  );

  const handleContentChange = useCallback(
    (cardId: string, content: string) => {
      setEditingContent(content);
      updateCardLocal(cardId, { content });
      if (contentDebounceRef.current) {
        clearTimeout(contentDebounceRef.current.timer);
      }
      contentDebounceRef.current = {
        id: cardId,
        timer: setTimeout(() => {
          updateCard(cardId, { content });
          contentDebounceRef.current = null;
        }, 50),
      };
    },
    [updateCardLocal, updateCard]
  );

  const handleSaveSnapshot = useCallback(async () => {
    await saveSnapshot();
  }, [saveSnapshot]);

  const handleToggleSnapshots = useCallback(async () => {
    if (!snapshotPanelOpen) {
      await loadSnapshots();
    }
    setSnapshotPanelOpen(!snapshotPanelOpen);
  }, [snapshotPanelOpen, setSnapshotPanelOpen, loadSnapshots]);

  const handleRestoreSnapshot = useCallback(
    async (id: string) => {
      await restoreSnapshot(id);
    },
    [restoreSnapshot]
  );

  const renderGrid = () => {
    const patternId = 'grid-pattern-main';
    return (
      <div
        className="canvas-grid-bg"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            left: -((canvasOffset.x % GRID_SIZE) + GRID_SIZE * 2),
            top: -((canvasOffset.y % GRID_SIZE) + GRID_SIZE * 2),
            width: 'calc(100% + 40px)',
            height: 'calc(100% + 40px)',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <pattern
              id={patternId}
              width={GRID_SIZE}
              height={GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                fill="none"
                stroke="#1e293b"
                strokeWidth={0.5}
              />
              <circle
                cx={GRID_SIZE / 2}
                cy={GRID_SIZE / 2}
                r={0.6}
                fill="rgba(51,65,85,0.6)"
              />
            </pattern>
          </defs>
          <rect width="120%" height="120%" fill={`url(#${patternId})`} />
        </svg>
      </div>
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
        <g
          transform={`translate(${-canvasOffset.x}, ${-canvasOffset.y})`}
          style={{ pointerEvents: 'auto' }}
        >
          {connections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              conn={conn}
              cardsById={cardsById}
              hovered={hoveredConnectionId === conn.id}
              onHover={setHoveredConnectionId}
              onDelete={deleteConnection}
              isDeleteMode={toolMode === 'delete'}
            />
          ))}
          {connectingFrom && connectingTo && (
            <ConnectingPreviewLine
              fromCardId={connectingFrom}
              toPos={connectingTo}
              cardsById={cardsById}
              targetCardId={hoveredConnectPoint?.cardId === connectingFrom ? null : hoveredConnectPoint?.cardId || null}
            />
          )}
        </g>
      </svg>
    );
  };

  const renderCards = () => {
    return cards.map((card) => {
      const isEditing = editingCardId === card.id;
      return (
        <div
          key={card.id}
          data-card-id={card.id}
          style={{
            position: 'absolute',
            left: card.x - canvasOffset.x,
            top: card.y - canvasOffset.y,
            width: CARD_W,
            height: CARD_H,
            transition:
              dragRef.current?.cardId === card.id || isEditing
                ? 'none'
                : 'left 0.25s cubic-bezier(.34,1.56,.64,1), top 0.25s cubic-bezier(.34,1.56,.64,1)',
            zIndex: selectedCardId === card.id ? 10 : 1,
          }}
        >
          <Card
            card={card}
            isSelected={selectedCardId === card.id}
            isEditing={isEditing}
            isConnecting={toolMode === 'connect'}
            isDeleteMode={toolMode === 'delete'}
            editingContent={isEditing ? editingContent : undefined}
            onDoubleClick={handleDoubleClick}
            onDragStart={handleCardDragStart}
            onConnectStart={handleConnectStart}
            onDelete={deleteCard}
            onContentChange={handleContentChange}
            onEditEnd={handleEditEnd}
            onConnectPointHover={(cid, pt) => {
              if (pt === null) setHoveredConnectPoint(null);
              else setHoveredConnectPoint({ cardId: cid, point: pt });
            }}
          />
        </div>
      );
    });
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#0f172a',
      }}
    >
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
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{onlineCount} 在线</span>
          <span style={{ color: '#475569', margin: '0 6px', fontSize: 12 }}>|</span>
          <span style={{ color: '#64748b', fontSize: 12 }}>
            💡 {cards.length} 卡片 · 🔗 {connections.length} 连线
          </span>
        </div>
      </div>

      <Toolbar
        onSaveSnapshot={handleSaveSnapshot}
        onToggleSnapshots={handleToggleSnapshots}
        snapshotCount={snapshots.length}
      />

      {snapshotPanelOpen && (
        <SnapshotPanel
          snapshots={snapshots}
          onClose={() => setSnapshotPanelOpen(false)}
          onRestore={handleRestoreSnapshot}
        />
      )}

      <div
        ref={canvasRef}
        className="canvas-grid"
        onMouseDown={handleCanvasMouseDown}
        style={{
          position: 'fixed',
          left: 60,
          top: 48,
          right: snapshotPanelOpen ? 280 : 0,
          bottom: 0,
          overflow: 'hidden',
          cursor: getCanvasCursor(),
          transition: 'right 200ms ease',
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
              right: snapshotPanelOpen ? 300 : 20,
              background: 'rgba(239,68,68,0.95)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              zIndex: 300,
              pointerEvents: 'none',
              transition: 'right 200ms ease',
            }}
          >
            🗑️ 点击卡片或连线进行删除
          </div>
        )}

        {toolMode === 'connect' && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              right: snapshotPanelOpen ? 300 : 20,
              background: 'rgba(59,130,246,0.95)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              zIndex: 300,
              pointerEvents: 'none',
              transition: 'right 200ms ease',
            }}
          >
            🔗 从卡片底部连接点拖拽到另一张卡片顶部连接点
          </div>
        )}

        {toolMode === 'add-card' && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              right: snapshotPanelOpen ? 300 : 20,
              background: 'rgba(34,197,94,0.95)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              zIndex: 300,
              pointerEvents: 'none',
              transition: 'right 200ms ease',
            }}
          >
            ➕ 点击画布任意位置添加卡片
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

const ConnectingPreviewLine = memo(function ConnectingPreviewLine({
  fromCardId,
  toPos,
  cardsById,
  targetCardId,
}: {
  fromCardId: string;
  toPos: { x: number; y: number };
  cardsById: Map<string, CardData>;
  targetCardId: string | null;
}) {
  const fromCard = cardsById.get(fromCardId);
  if (!fromCard) return null;

  const x1 = fromCard.x + CARD_W / 2;
  const y1 = fromCard.y + CARD_H;
  const x2 = targetCardId && cardsById.has(targetCardId)
    ? cardsById.get(targetCardId)!.x + CARD_W / 2
    : toPos.x;
  const y2 = targetCardId && cardsById.has(targetCardId)
    ? cardsById.get(targetCardId)!.y
    : toPos.y;

  const pathD = useMemo(
    () => computeBezierPath(x1, y1, x2, y2),
    [x1, y1, x2, y2]
  );

  const isValid = !!targetCardId && targetCardId !== fromCardId;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <path
        d={pathD}
        fill="none"
        stroke={isValid ? '#22c55e' : fromCard.color}
        strokeWidth={isValid ? 3 : 2}
        strokeDasharray="6,4"
        opacity={0.9}
      />
      <circle
        cx={x2}
        cy={y2}
        r={isValid ? 8 : 5}
        fill={isValid ? '#22c55e' : fromCard.color}
        stroke="#ffffff"
        strokeWidth={2}
      />
    </g>
  );
});
