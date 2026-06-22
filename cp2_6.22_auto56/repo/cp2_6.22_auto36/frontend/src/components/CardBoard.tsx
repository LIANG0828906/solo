import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { produce } from 'immer';
import type {
  BoardState,
  Card,
  CardColor,
  CardPriority,
  ClientEvent,
  Vote,
} from '@shared/types';
import {
  CARD_COLOR_LIST,
  CARD_COLORS,
  PRIORITY_LIST,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@shared/types';
import { CardItem, SNAP_THRESHOLD, SNAP_OFFSET } from './CardItem';
import type { useWebSocket } from '../hooks/useWebSocket';

type UseWebSocketReturn = ReturnType<typeof useWebSocket>;

interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

interface DragState {
  cardId: string;
  startX: number;
  startY: number;
  cardStartX: number;
  cardStartY: number;
  pointerId: number;
}

interface SnapGuide {
  type: 'h' | 'v';
  position: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const AUTO_SCROLL_EDGE = 80;
const CARD_WIDTH = 260;

export const CardBoard: React.FC<{ ws: UseWebSocketReturn }> = ({ ws }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [activeFilter, setActiveFilter] = useState<CardColor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [panState, setPanState] = useState<{
    startX: number;
    startY: number;
    vpStartX: number;
    vpStartY: number;
  } | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [dropPlaceholder, setDropPlaceholder] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const autoScrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubInit = ws.on('INIT_STATE', (payload: BoardState) => {
      setCards(payload.cards);
      setVotes(payload.votes);
      setUserId(payload.userId);
    });
    const unsubAdded = ws.on('CARD_ADDED', (card: Card) => {
      setCards((prev) =>
        produce(prev, (draft) => {
          if (!draft.find((c) => c.id === card.id)) {
            draft.push(card);
          }
        })
      );
    });
    const unsubMoved = ws.on(
      'CARD_MOVED',
      (payload: { id: string; x: number; y: number }) => {
        if (dragState?.cardId === payload.id) return;
        setCards((prev) =>
          produce(prev, (draft) => {
            const c = draft.find((cc) => cc.id === payload.id);
            if (c) {
              c.x = payload.x;
              c.y = payload.y;
            }
          })
        );
      }
    );
    const unsubUpdated = ws.on('CARD_UPDATED', (card: Card) => {
      setCards((prev) =>
        produce(prev, (draft) => {
          const idx = draft.findIndex((c) => c.id === card.id);
          if (idx >= 0) {
            draft[idx] = card;
          }
        })
      );
    });
    const unsubPriorityUpdated = ws.on(
      'CARD_PRIORITY_UPDATED',
      (p: { id: string; priority: CardPriority }) => {
        setCards((prev) =>
          produce(prev, (draft) => {
            const c = draft.find((cc) => cc.id === p.id);
            if (c) {
              c.priority = p.priority;
            }
          })
        );
      }
    );
    const unsubDeleted = ws.on('CARD_DELETED', (p: { id: string }) => {
      setCards((prev) => prev.filter((c) => c.id !== p.id));
      setVotes((prev) => prev.filter((v) => v.cardId !== p.id));
    });
    const unsubVoted = ws.on(
      'VOTE_TOGGLED',
      (p: { cardId: string; userId: string; voted: boolean; total: number }) => {
        setVotes((prev) => {
          const existing = prev.find(
            (v) => v.cardId === p.cardId && v.userId === p.userId
          );
          if (p.voted && !existing) {
            return [...prev, { cardId: p.cardId, userId: p.userId }];
          }
          if (!p.voted && existing) {
            return prev.filter(
              (v) => !(v.cardId === p.cardId && v.userId === p.userId)
            );
          }
          return prev;
        });
      }
    );
    const unsubErr = ws.on('ERROR', (p: { message: string }) => {
      console.warn('[board] error:', p.message);
    });

    return () => {
      unsubInit();
      unsubAdded();
      unsubMoved();
      unsubUpdated();
      unsubPriorityUpdated();
      unsubDeleted();
      unsubVoted();
      unsubErr();
    };
  }, [ws, dragState]);

  const send = ws.send;

  const voteCounts = useMemo(() => {
    const map = new Map<string, number>();
    votes.forEach((v) => {
      map.set(v.cardId, (map.get(v.cardId) || 0) + 1);
    });
    return map;
  }, [votes]);

  const userVotedSet = useMemo(() => {
    const set = new Set<string>();
    votes.forEach((v) => {
      if (v.userId === userId) set.add(v.cardId);
    });
    return set;
  }, [votes, userId]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!wrapRef.current) return;
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    setViewport((prev) => {
      const delta = -e.deltaY * 0.0015;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, prev.scale * (1 + delta))
      );
      const ratio = newScale / prev.scale;
      const newX = cx - (cx - prev.x) * ratio;
      const newY = cy - (cy - prev.y) * ratio;
      return { x: newX, y: newY, scale: newScale };
    });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
        setPanState({
          startX: e.clientX,
          startY: e.clientY,
          vpStartX: viewport.x,
          vpStartY: viewport.y,
        });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    },
    [viewport.x, viewport.y]
  );

  const clientToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      if (!wrapRef.current) return { x: 0, y: 0 };
      const rect = wrapRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - viewport.x) / viewport.scale;
      const y = (clientY - rect.top - viewport.y) / viewport.scale;
      return { x, y };
    },
    [viewport]
  );

  const computeSnapAndOffsets = useCallback(
    (
      dragCardId: string,
      dragX: number,
      dragY: number,
      currentCards: Card[]
    ): {
      snappedX: number;
      snappedY: number;
      guides: SnapGuide[];
      offsets: Map<string, { dx: number; dy: number }>;
      placeholder: { x: number; y: number; width: number; height: number };
    } => {
      const dragCard = currentCards.find((c) => c.id === dragCardId);
      if (!dragCard) {
        return {
          snappedX: dragX,
          snappedY: dragY,
          guides: [],
          offsets: new Map(),
          placeholder: { x: dragX, y: dragY, width: CARD_WIDTH, height: 160 },
        };
      }

      const dragW = dragCard.width;
      const dragH = 180;

      const others = currentCards.filter((c) => c.id !== dragCardId);
      let snappedX = dragX;
      let snappedY = dragY;
      const guides: SnapGuide[] = [];
      let minDX = Infinity;
      let minDY = Infinity;

      others.forEach((c) => {
        const oX = c.x;
        const oY = c.y;
        const oW = c.width;
        const oH = 180;

        const targetsX = [
          oX,
          oX + oW,
          oX + oW / 2 - dragW / 2,
          oX - dragW,
          oX + oW + SNAP_OFFSET,
        ];
        const targetsY = [
          oY,
          oY + oH,
          oY + oH / 2 - dragH / 2,
          oY - dragH,
          oY + oH + SNAP_OFFSET,
        ];

        targetsX.forEach((tx) => {
          const d = Math.abs(tx - dragX);
          if (d < SNAP_THRESHOLD && d < minDX) {
            minDX = d;
            snappedX = tx;
            if (Math.abs(tx - (oX + oW / 2 - dragW / 2)) < 0.5) {
              guides.push({ type: 'v', position: oX + oW / 2 });
            } else {
              guides.push({ type: 'v', position: tx });
            }
          }
        });

        targetsY.forEach((ty) => {
          const d = Math.abs(ty - dragY);
          if (d < SNAP_THRESHOLD && d < minDY) {
            minDY = d;
            snappedY = ty;
            if (Math.abs(ty - (oY + oH / 2 - dragH / 2)) < 0.5) {
              guides.push({ type: 'h', position: oY + oH / 2 });
            } else {
              guides.push({ type: 'h', position: ty });
            }
          }
        });
      });

      const offsets = new Map<string, { dx: number; dy: number }>();
      others.forEach((c) => {
        const oX = c.x;
        const oY = c.y;
        const oW = c.width;
        const oH = 180;

        const overlapX =
          snappedX < oX + oW + SNAP_OFFSET &&
          snappedX + dragW + SNAP_OFFSET > oX;
        const overlapY =
          snappedY < oY + oH + SNAP_OFFSET &&
          snappedY + dragH + SNAP_OFFSET > oY;

        if (overlapX && overlapY) {
          const dxRight = snappedX + dragW + SNAP_OFFSET - oX;
          const dxLeft = snappedX - (oX + oW + SNAP_OFFSET);
          const dyBottom = snappedY + dragH + SNAP_OFFSET - oY;
          const dyTop = snappedY - (oY + oH + SNAP_OFFSET);

          const moves = [
            { dx: dxRight, dy: 0, dist: Math.abs(dxRight) },
            { dx: dxLeft, dy: 0, dist: Math.abs(dxLeft) },
            { dx: 0, dy: dyBottom, dist: Math.abs(dyBottom) },
            { dx: 0, dy: dyTop, dist: Math.abs(dyTop) },
          ];
          moves.sort((a, b) => a.dist - b.dist);
          offsets.set(c.id, { dx: moves[0].dx, dy: moves[0].dy });
        }
      });

      return {
        snappedX,
        snappedY,
        guides: Array.from(
          new Map(guides.map((g) => [`${g.type}-${g.position}`, g])).values()
        ),
        offsets,
        placeholder: {
          x: snappedX,
          y: snappedY,
          width: dragW,
          height: dragH,
        },
      };
    },
    []
  );

  const autoScroll = useCallback(
    (clientX: number, clientY: number) => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      let scrollX = 0;
      let scrollY = 0;

      if (clientX - rect.left < AUTO_SCROLL_EDGE) {
        scrollX = -(AUTO_SCROLL_EDGE - (clientX - rect.left));
      } else if (rect.right - clientX < AUTO_SCROLL_EDGE) {
        scrollX = AUTO_SCROLL_EDGE - (rect.right - clientX);
      }
      if (clientY - rect.top < AUTO_SCROLL_EDGE) {
        scrollY = -(AUTO_SCROLL_EDGE - (clientY - rect.top));
      } else if (rect.bottom - clientY < AUTO_SCROLL_EDGE) {
        scrollY = AUTO_SCROLL_EDGE - (rect.bottom - clientY);
      }

      if (scrollX !== 0 || scrollY !== 0) {
        setViewport((prev) => ({
          ...prev,
          x: prev.x + scrollX * 0.15,
          y: prev.y + scrollY * 0.15,
        }));
        if (autoScrollRafRef.current == null) {
          const tick = () => {
            autoScrollRafRef.current = requestAnimationFrame(tick);
          };
          autoScrollRafRef.current = requestAnimationFrame(tick);
        }
      } else if (autoScrollRafRef.current != null) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
    },
    []
  );

  const [spaceOffsets, setSpaceOffsets] = useState<
    Map<string, { dx: number; dy: number }>
  >(new Map());

  const handleCardDragStart = useCallback(
    (cardId: string, e: React.PointerEvent<HTMLDivElement>) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setDragState({
        cardId,
        startX: e.clientX,
        startY: e.clientY,
        cardStartX: card.x,
        cardStartY: card.y,
        pointerId: e.pointerId,
      });
    },
    [cards]
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      const deltaCanvas = clientToCanvas(e.clientX, e.clientY);
      const startCanvas = clientToCanvas(dragState.startX, dragState.startY);
      const rawX = dragState.cardStartX + (deltaCanvas.x - startCanvas.x);
      const rawY = dragState.cardStartY + (deltaCanvas.y - startCanvas.y);

      const { snappedX, snappedY, guides, offsets, placeholder } =
        computeSnapAndOffsets(dragState.cardId, rawX, rawY, cards);

      setCards((prev) =>
        produce(prev, (draft) => {
          const c = draft.find((cc) => cc.id === dragState.cardId);
          if (c) {
            c.x = snappedX;
            c.y = snappedY;
          }
        })
      );
      setSnapGuides(guides);
      setSpaceOffsets(offsets);
      setDropPlaceholder(placeholder);

      const evt: ClientEvent = {
        type: 'MOVE_CARD',
        payload: { id: dragState.cardId, x: snappedX, y: snappedY },
      };
      send(evt);

      autoScroll(e.clientX, e.clientY);
    };

    const handleUp = () => {
      if (autoScrollRafRef.current != null) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
      setDragState(null);
      setSnapGuides([]);
      setSpaceOffsets(new Map());
      setDropPlaceholder(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragState, cards, clientToCanvas, computeSnapAndOffsets, send, autoScroll]);

  useEffect(() => {
    if (!panState) return;

    const handleMove = (e: PointerEvent) => {
      setViewport((prev) => ({
        ...prev,
        x: panState.vpStartX + (e.clientX - panState.startX),
        y: panState.vpStartY + (e.clientY - panState.startY),
      }));
    };
    const handleUp = () => setPanState(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [panState]);

  const handleToggleVote = useCallback(
    (cardId: string) => {
      const evt: ClientEvent = { type: 'TOGGLE_VOTE', payload: { cardId } };
      send(evt);
    },
    [send]
  );

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      const evt: ClientEvent = { type: 'DELETE_CARD', payload: { id: cardId } };
      send(evt);
    },
    [send]
  );

  const handleUpdatePriority = useCallback(
    (cardId: string, priority: CardPriority) => {
      const evt: ClientEvent = {
        type: 'UPDATE_CARD_PRIORITY',
        payload: { id: cardId, priority },
      };
      send(evt);
    },
    [send]
  );

  const handleUpdateCard = useCallback(
    (payload: {
      id: string;
      title: string;
      description: string;
      imageUrl?: string;
      color: CardColor;
    }) => {
      const evt: ClientEvent = {
        type: 'UPDATE_CARD',
        payload,
      };
      send(evt);
    },
    [send]
  );

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImg, setFormImg] = useState('');
  const [formColor, setFormColor] = useState<CardColor>('sky');
  const [formPriority, setFormPriority] = useState<CardPriority>('medium');

  const openAddModal = useCallback(() => {
    setFormTitle('');
    setFormDesc('');
    setFormImg('');
    setFormColor('sky');
    setFormPriority('medium');
    setShowAddModal(true);
  }, []);

  const submitAddCard = useCallback(() => {
    if (!formTitle.trim()) return;
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const centerClientX = rect.left + rect.width / 2;
    const centerClientY = rect.top + rect.height / 2;
    const { x, y } = clientToCanvas(centerClientX, centerClientY);

    const evt: ClientEvent = {
      type: 'ADD_CARD',
      payload: {
        title: formTitle.trim(),
        description: formDesc.trim(),
        imageUrl: formImg.trim() || undefined,
        color: formColor,
        priority: formPriority,
        x: x - CARD_WIDTH / 2,
        y: y - 90,
        width: CARD_WIDTH,
      },
    };
    send(evt);
    setShowAddModal(false);
  }, [formTitle, formDesc, formImg, formColor, formPriority, clientToCanvas, send]);

  return (
    <div className="board-app">
      <div className="board-topbar">
        <span className="board-topbar__title">创意看板</span>
        <div className="board-topbar__filters">
          <button
            className={[
              'filter-btn filter-btn--all',
              activeFilter === null ? 'filter-btn--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setActiveFilter(null)}
          >
            全部
          </button>
          {CARD_COLOR_LIST.map((color) => (
            <button
              key={color}
              className={[
                'filter-btn',
                activeFilter === color ? 'filter-btn--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ background: CARD_COLORS[color] }}
              onClick={() =>
                setActiveFilter((prev) => (prev === color ? null : color))
              }
              title={color}
            />
          ))}
        </div>
      </div>

      <button className="board-add-btn" onClick={openAddModal} title="添加卡片">
        +
      </button>

      <div
        ref={wrapRef}
        className={[
          'board-canvas-wrap',
          panState ? 'is-panning' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onPointerDown={handleCanvasPointerDown}
      >
        <div
          ref={canvasRef}
          className={[
            'board-canvas',
            dragState || panState ? 'no-transition' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          }}
        >
          {dropPlaceholder && (
            <div
              className="board-drop-placeholder"
              style={{
                left: dropPlaceholder.x,
                top: dropPlaceholder.y,
                width: dropPlaceholder.width,
                height: dropPlaceholder.height,
              }}
            />
          )}

          {snapGuides.map((g, i) => (
            <div
              key={`${g.type}-${g.position}-${i}`}
              className={[
                'board-guide-line',
                g.type === 'h' ? 'board-guide-line--h' : 'board-guide-line--v',
              ].join(' ')}
              style={
                g.type === 'h'
                  ? { top: g.position }
                  : { left: g.position }
              }
            />
          ))}

          {cards.map((card) => {
            const isFilteredOut =
              activeFilter !== null && card.color !== activeFilter;
            return (
              <div
                key={card.id}
                data-card-id={card.id}
                style={{ display: 'contents' }}
              >
                <CardItem
                  card={card}
                  voteCount={voteCounts.get(card.id) || 0}
                  isVoted={userVotedSet.has(card.id)}
                  isOwnCard={card.creatorId === userId}
                  isFiltered={isFilteredOut}
                  isDragging={dragState?.cardId === card.id}
                  spaceOffset={spaceOffsets.get(card.id) || null}
                  onDragStart={handleCardDragStart}
                  onToggleVote={handleToggleVote}
                  onDelete={handleDeleteCard}
                  onUpdatePriority={handleUpdatePriority}
                  onUpdateCard={handleUpdateCard}
                />
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-card__title">添加创意卡片</h3>
            <div className="form-field">
              <label className="form-field__label">标题</label>
              <input
                className="form-field__input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="输入卡片标题"
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-field__label">描述</label>
              <textarea
                className="form-field__textarea"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="简要描述创意要点"
              />
            </div>
            <div className="form-field">
              <label className="form-field__label">图片 URL（可选）</label>
              <input
                className="form-field__input"
                value={formImg}
                onChange={(e) => setFormImg(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="form-field">
              <label className="form-field__label">标签颜色</label>
              <div className="form-field__colors">
                {CARD_COLOR_LIST.map((color) => (
                  <button
                    key={color}
                    className={[
                      'form-color',
                      formColor === color ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ background: CARD_COLORS[color] }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="form-field">
              <label className="form-field__label">优先级</label>
              <div className="edit-form__priority-row">
                {PRIORITY_LIST.map((p) => (
                  <button
                    key={p}
                    className={[
                      'edit-form__priority-btn',
                      formPriority === p ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setFormPriority(p)}
                  >
                    <span
                      className="edit-form__priority-dot"
                      style={{ background: PRIORITY_COLORS[p] }}
                    />
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn--secondary"
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn--primary"
                onClick={submitAddCard}
                disabled={!formTitle.trim()}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="status-indicator">
        <span
          className={[
            'status-indicator__dot',
            ws.connected ? '' : 'offline',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <span>{ws.connected ? '已连接' : '连接中...'}</span>
      </div>
    </div>
  );
};
