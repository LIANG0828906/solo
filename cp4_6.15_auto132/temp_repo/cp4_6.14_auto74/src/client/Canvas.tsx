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
const CONNECT_POINT_RADIUS = 14;

function computeBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curveOffset = Math.min(Math.max(dist * 0.45, 30), 120);
  return `M ${x1} ${y1} C ${x1} ${y1 + curveOffset}, ${x2} ${y2 - curveOffset}, ${x2} ${y2}`;
}

function isPointNear(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
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
      onClick={(e) => {
        e.stopPropagation();
        if (isDeleteMode) onDelete(conn.id);
      }}
      style={{ cursor: isDeleteMode ? 'pointer' : 'default' }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={conn.color}
        strokeWidth={hovered ? 5 : 2}
        strokeDasharray={hovered ? '10,5' : undefined}
        strokeLinecap="round"
        style={{
          transition: 'stroke-width 120ms ease, stroke-dasharray 120ms ease',
          filter: hovered ? 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' : 'none',
        }}
      />
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
      />
      {hovered && (
        <>
          <circle
            cx={x1}
            cy={y1}
            r={4}
            fill={conn.color}
            stroke="#ffffff"
            strokeWidth={2}
            style={{ pointerEvents: 'none' }}
          />
          <circle
            cx={x2}
            cy={y2}
            r={4}
            fill={conn.color}
            stroke="#ffffff"
            strokeWidth={2}
            style={{ pointerEvents: 'none' }}
          />
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={midX - 50}
              y={midY - 22}
              width={100}
              height={20}
              rx={6}
              fill="rgba(15,23,42,0.9)"
              stroke="#3b82f6"
              strokeWidth={1}
            />
            <text
              x={midX}
              y={midY - 8}
              textAnchor="middle"
              fill="#f1f5f9"
              fontSize={11}
              fontWeight={500}
            >
              {conn.label || '连接关系'}
            </text>
          </g>
        </>
      )}
    </g>
  );
});

const SnapshotPanel = memo(function SnapshotPanel({
  snapshots,
  onClose,
  onRestore,
  onSave,
}: {
  snapshots: SnapshotData[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 48,
        right: 0,
        bottom: 0,
        width: 320,
        background: 'rgba(30,41,59,0.97)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid #334155',
        zIndex: 250,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📜</span>
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>
            历史快照
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onSave}
            style={{
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            📷 保存
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 18,
              padding: 2,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {snapshots.length === 0 ? (
          <div
            style={{
              color: '#64748b',
              textAlign: 'center',
              padding: '50px 20px',
              fontSize: 13,
              lineHeight: 1.8,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
            暂无快照记录
            <br />
            <span style={{ fontSize: 12, color: '#475569' }}>
              点击上方「保存」按钮创建快照
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {snapshots
              .slice()
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((snapshot, idx) => {
                const date = new Date(snapshot.timestamp);
                const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                return (
                  <div
                    key={snapshot.id}
                    style={{
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid #334155',
                      borderRadius: 10,
                      padding: 14,
                      cursor: 'default',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = '#3b82f6';
                      el.style.background = 'rgba(15,23,42,0.9)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = '#334155';
                      el.style.background = 'rgba(15,23,42,0.6)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            background:
                              idx === 0 ? '#22c55e' : idx === 1 ? '#3b82f6' : '#64748b',
                            color: '#ffffff',
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 4,
                          }}
                        >
                          {idx === 0 ? '最新' : `#${snapshots.length - idx}`}
                        </div>
                        <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>
                          {dateStr} {timeStr}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 14,
                        marginBottom: 12,
                        fontSize: 12,
                        color: '#94a3b8',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        💡 <span style={{ color: '#e2e8f0' }}>{snapshot.cards.length}</span> 卡片
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        🔗 <span style={{ color: '#e2e8f0' }}>{snapshot.connections.length}</span> 连线
                      </span>
                    </div>
                    <button
                      onClick={() => onRestore(snapshot.id)}
                      style={{
                        width: '100%',
                        background: 'rgba(59,130,246,0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: 6,
                        padding: '7px 0',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#3b82f6';
                        (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.15)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#60a5fa';
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
  const [canvasSize, setCanvasSize] = useState({ w: 1000, h: 800 });
  const [hoveredConnectPoint, setHoveredConnectPoint] = useState<{
    cardId: string;
    point: 'top' | 'bottom';
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const connectingState = useRef<{
    fromCardId: string;
    validTargetId: string | null;
  } | null>(null);
  const contentDebounceRef = useRef<{ id: string; timer: NodeJS.Timeout } | null>(null);

  const cardsById = useMemo(() => {
    const map = new Map<string, CardData>();
    for (const c of cards) map.set(c.id, c);
    return map;
  }, [cards]);

  const viewportCards = useMemo(() => {
    const margin = 200;
    const left = canvasOffset.x - margin;
    const top = canvasOffset.y - margin;
    const right = canvasOffset.x + canvasSize.w + margin;
    const bottom = canvasOffset.y + canvasSize.h + margin;

    return cards.filter((c) => {
      return (
        c.x + CARD_W >= left &&
        c.x <= right &&
        c.y + CARD_H >= top &&
        c.y <= bottom
      );
    });
  }, [cards, canvasOffset, canvasSize]);

  const viewportConnections = useMemo(() => {
    const margin = 300;
    const left = canvasOffset.x - margin;
    const top = canvasOffset.y - margin;
    const right = canvasOffset.x + canvasSize.w + margin;
    const bottom = canvasOffset.y + canvasSize.h + margin;

    return connections.filter((conn) => {
      const fc = cardsById.get(conn.fromCardId);
      const tc = cardsById.get(conn.toCardId);
      if (!fc || !tc) return false;
      const minX = Math.min(fc.x, tc.x);
      const maxX = Math.max(fc.x, tc.x) + CARD_W;
      const minY = Math.min(fc.y, tc.y);
      const maxY = Math.max(fc.y, tc.y) + CARD_H;
      return minX <= right && maxX >= left && minY <= bottom && maxY >= top;
    });
  }, [connections, cardsById, canvasOffset, canvasSize]);

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
    const onResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ w: rect.width, h: rect.height });
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [snapshotPanelOpen]);

  useEffect(() => {
    return () => {
      if (contentDebounceRef.current) {
        clearTimeout(contentDebounceRef.current.timer);
      }
    };
  }, []);

  const getCanvasCursor = useCallback(() => {
    if (toolMode === 'connect') return 'crosshair';
    if (toolMode === 'delete') return 'not-allowed';
    if (toolMode === 'add-card') return 'copy';
    return 'default';
  }, [toolMode]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-card-id]') || target.closest('svg')) return;
      if (target !== canvasRef.current && !target.classList.contains('canvas-grid-bg')) return;

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
            x: Math.max(0, startOffset.x - (ev.clientX - startX)),
            y: Math.max(0, startOffset.y - (ev.clientY - startY)),
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
      let pendingX = card.x;
      let pendingY = card.y;
      let lastSentX = card.x;
      let lastSentY = card.y;

      const handleMove = (ev: MouseEvent) => {
        pending.dx = ev.clientX - e.clientX;
        pending.dy = ev.clientY - e.clientY;

        if (!rafIdRef.value) {
          rafIdRef.value = requestAnimationFrame(() => {
            rafIdRef.value = 0;
            pendingX = card.x + pending.dx;
            pendingY = card.y + pending.dy;
            updateCardLocal(cardId, { x: pendingX, y: pendingY });

            const ddx = Math.abs(pendingX - lastSentX);
            const ddy = Math.abs(pendingY - lastSentY);
            if (ddx + ddy > 3) {
              lastSentX = pendingX;
              lastSentY = pendingY;
              updateCard(cardId, { x: pendingX, y: pendingY });
            }
          });
        }
      };

      const handleUp = () => {
        if (rafIdRef.value) {
          cancelAnimationFrame(rafIdRef.value);
          rafIdRef.value = 0;
        }
        const finalX = card.x + pending.dx;
        const finalY = card.y + pending.dy;
        updateCard(cardId, { x: finalX, y: finalY });
        flushPendingCardUpdates();
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [toolMode, cardsById, selectCard, updateCardLocal, updateCard, flushPendingCardUpdates]
  );

  const handleConnectStart = useCallback(
    (cardId: string, _point: 'bottom' | 'top', e: React.MouseEvent) => {
      if (toolMode !== 'connect') return;
      e.stopPropagation();
      e.preventDefault();

      const card = cardsById.get(cardId);
      if (!card) return;

      setConnectingFrom(cardId);
      connectingState.current = { fromCardId: cardId, validTargetId: null };

      const startX = card.x + CARD_W / 2;
      const startY = card.y + CARD_H;
      const rect = canvasRef.current!.getBoundingClientRect();
      const initMouseX = e.clientX - rect.left + canvasOffset.x;
      const initMouseY = e.clientY - rect.top + canvasOffset.y;
      setConnectingTo({ x: initMouseX, y: initMouseY });

      let rafPending = false;
      let latestX = initMouseX;
      let latestY = initMouseY;

      const updateConnecting = () => {
        rafPending = false;
        setConnectingTo({ x: latestX, y: latestY });
      };

      const scheduleUpdate = () => {
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(updateConnecting);
        }
      };

      const handleMove = (ev: MouseEvent) => {
        latestX = ev.clientX - rect.left + canvasOffset.x;
        latestY = ev.clientY - rect.top + canvasOffset.y;
        scheduleUpdate();

        let foundTarget: string | null = null;
        const mouseWorldX = latestX;
        const mouseWorldY = latestY;

        for (const otherCard of cards) {
          if (otherCard.id === cardId) continue;
          const tx = otherCard.x + CARD_W / 2;
          const ty = otherCard.y;
          if (isPointNear(mouseWorldX, mouseWorldY, tx, ty, CONNECT_POINT_RADIUS + 8)) {
            foundTarget = otherCard.id;
            break;
          }
        }

        if (foundTarget !== connectingState.current!.validTargetId) {
          connectingState.current!.validTargetId = foundTarget;
          if (foundTarget) {
            setHoveredConnectPoint({ cardId: foundTarget, point: 'top' });
          } else {
            setHoveredConnectPoint(null);
          }
        }
      };

      const handleUp = (_ev: MouseEvent) => {
        const target = connectingState.current!.validTargetId;
        if (target && target !== cardId) {
          addConnection(cardId, target);
        }
        setConnectingFrom(null);
        setConnectingTo(null);
        setHoveredConnectPoint(null);
        connectingState.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        void startX;
        void startY;
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [
      toolMode,
      cardsById,
      cards,
      canvasOffset,
      setConnectingFrom,
      setConnectingTo,
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
    const patternId = 'grid-pattern-main-v2';
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
          overflow: 'hidden',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            left: -((canvasOffset.x % GRID_SIZE) + GRID_SIZE * 3),
            top: -((canvasOffset.y % GRID_SIZE) + GRID_SIZE * 3),
            width: 'calc(100% + 120px)',
            height: 'calc(100% + 120px)',
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
                strokeWidth={0.4}
              />
              <circle
                cx={GRID_SIZE / 2}
                cy={GRID_SIZE / 2}
                r={0.7}
                fill="rgba(71,85,105,0.7)"
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
          {viewportConnections.map((conn) => (
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
              targetCardId={hoveredConnectPoint?.cardId || null}
            />
          )}
        </g>
      </svg>
    );
  };

  const renderCards = () => {
    return viewportCards.map((card) => {
      const isEditing = editingCardId === card.id;
      const isDragging = selectedCardId === card.id && toolMode === 'select';
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
            willChange: isDragging ? 'left, top' : 'auto',
            transition:
              isDragging || isEditing
                ? 'none'
                : 'left 0.25s cubic-bezier(.34,1.56,.64,1), top 0.25s cubic-bezier(.34,1.56,.64,1)',
            zIndex:
              selectedCardId === card.id ? 10 : connectingFrom === card.id ? 5 : 1,
          }}
        >
          <Card
            card={card}
            isSelected={selectedCardId === card.id}
            isEditing={isEditing}
            isConnecting={toolMode === 'connect'}
            isDeleteMode={toolMode === 'delete'}
            editingContent={isEditing ? editingContent : undefined}
            hoveredPointType={
              hoveredConnectPoint?.cardId === card.id
                ? hoveredConnectPoint.point
                : null
            }
            onDoubleClick={handleDoubleClick}
            onDragStart={handleCardDragStart}
            onConnectStart={handleConnectStart}
            onDelete={deleteCard}
            onContentChange={handleContentChange}
            onEditEnd={handleEditEnd}
            onConnectPointEnter={(cid, pt) => {
              if (connectingState.current && cid !== connectingState.current.fromCardId) {
                connectingState.current.validTargetId = cid;
              }
              setHoveredConnectPoint({ cardId: cid, point: pt });
            }}
            onConnectPointLeave={(cid) => {
              if (
                hoveredConnectPoint &&
                hoveredConnectPoint.cardId === cid &&
                connectingState.current?.validTargetId === cid
              ) {
                connectingState.current.validTargetId = null;
              }
              setHoveredConnectPoint((prev) =>
                prev?.cardId === cid ? null : prev
              );
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
          background: 'rgba(30,41,59,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 0 96px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleToggleSnapshots}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: snapshotPanelOpen ? '#3b82f6' : 'rgba(71,85,105,0.5)',
              color: '#ffffff',
              border: snapshotPanelOpen ? '1px solid #60a5fa' : '1px solid #475569',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <span>📜</span>
            <span>历史快照</span>
            {snapshots.length > 0 && (
              <span
                style={{
                  background: snapshotPanelOpen ? '#ffffff' : '#ef4444',
                  color: snapshotPanelOpen ? '#3b82f6' : '#ffffff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 8,
                }}
              >
                {snapshots.length}
              </span>
            )}
          </button>
          <div
            style={{
              width: 1,
              height: 20,
              background: '#334155',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>
              {onlineCount} 在线
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            <span>💡 {cards.length}</span>
            <span>🔗 {connections.length}</span>
          </div>
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
          onSave={handleSaveSnapshot}
        />
      )}

      <div
        ref={canvasRef}
        className="canvas-grid"
        onMouseDown={handleCanvasMouseDown}
        style={{
          position: 'fixed',
          left: 76,
          top: 48,
          right: snapshotPanelOpen ? 320 : 0,
          bottom: 0,
          overflow: 'hidden',
          cursor: getCanvasCursor(),
          transition: 'right 220ms ease',
        }}
      >
        {renderGrid()}
        {renderConnections()}
        {renderCards()}

        {toolMode === 'delete' && (
          <div
            style={{
              position: 'fixed',
              bottom: 22,
              right: snapshotPanelOpen ? 340 : 22,
              background: 'rgba(239,68,68,0.95)',
              color: 'white',
              padding: '9px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              zIndex: 300,
              pointerEvents: 'none',
              transition: 'right 220ms ease',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
            }}
          >
            🗑️ 点击卡片或连线进行删除
          </div>
        )}

        {toolMode === 'connect' && (
          <div
            style={{
              position: 'fixed',
              bottom: 22,
              right: snapshotPanelOpen ? 340 : 22,
              background: 'rgba(59,130,246,0.95)',
              color: 'white',
              padding: '9px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              zIndex: 300,
              pointerEvents: 'none',
              transition: 'right 220ms ease',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}
          >
            🔗 按下卡片底部连接点 → 拖到目标卡片顶部连接点释放
          </div>
        )}

        {toolMode === 'add-card' && (
          <div
            style={{
              position: 'fixed',
              bottom: 22,
              right: snapshotPanelOpen ? 340 : 22,
              background: 'rgba(34,197,94,0.95)',
              color: 'white',
              padding: '9px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              zIndex: 300,
              pointerEvents: 'none',
              transition: 'right 220ms ease',
              boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
            }}
          >
            ➕ 点击画布任意位置添加新卡片
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        textarea::-webkit-scrollbar {
          width: 4px;
        }
        textarea::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: #64748b;
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
  const x2 =
    targetCardId && cardsById.has(targetCardId)
      ? cardsById.get(targetCardId)!.x + CARD_W / 2
      : toPos.x;
  const y2 =
    targetCardId && cardsById.has(targetCardId)
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
        strokeWidth={isValid ? 4 : 2.5}
        strokeDasharray="8,5"
        opacity={isValid ? 1 : 0.85}
        strokeLinecap="round"
      />
      <circle
        cx={x1}
        cy={y1}
        r={5}
        fill={fromCard.color}
        stroke="#ffffff"
        strokeWidth={2}
      />
      <circle
        cx={x2}
        cy={y2}
        r={isValid ? 9 : 6}
        fill={isValid ? '#22c55e' : fromCard.color}
        stroke="#ffffff"
        strokeWidth={3}
      />
      {isValid && (
        <g>
          <circle cx={x2} cy={y2} r={14} fill="none" stroke="#22c55e" strokeWidth={2} opacity={0.5}>
            <animate attributeName="r" from="10" to="18" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.8" to="0" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </g>
  );
});
