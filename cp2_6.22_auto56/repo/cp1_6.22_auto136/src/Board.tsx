import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { BoardData, BoardColumn, TaskCard, WSMessage } from './types';
import Card from './Card';
import CreateCard from './CreateCard';
import './Board.css';

const WS_URL = window.location.origin.replace(/^http/, 'ws') + '/ws';

const Board: React.FC = () => {
  const [boardData, setBoardData] = useState<BoardData>({
    columns: [],
    columnOrder: [],
    cards: {},
  });
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [createCardColumnId, setCreateCardColumnId] = useState<string | null>(
    null
  );
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');
  const [mountedColumns, setMountedColumns] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>('');

  const fetchBoardData = useCallback(async () => {
    try {
      const res = await fetch('/api/board');
      const data = await res.json();
      setBoardData({
        columns: data.columns,
        columnOrder: data.columnOrder,
        cards: data.cards,
      });
      setOnlineCount(data.onlineCount || 0);
    } catch (e) {
      console.error('Failed to fetch board:', e);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'SYNC_STATE':
              clientIdRef.current = msg.payload.clientId;
              setBoardData(msg.payload.boardData);
              setOnlineCount(msg.payload.onlineCount);
              break;
            case 'BOARD_UPDATED':
            case 'CARDS_REORDERED':
              setBoardData(msg.payload);
              break;
            case 'COLUMN_CREATED': {
              const { column } = msg.payload;
              setBoardData((prev) => ({
                ...prev,
                columns: [...prev.columns, column],
                columnOrder: [...prev.columnOrder, column.id],
              }));
              break;
            }
            case 'COLUMN_RENAMED': {
              const { columnId, title } = msg.payload;
              setBoardData((prev) => ({
                ...prev,
                columns: prev.columns.map((c) =>
                  c.id === columnId ? { ...c, title } : c
                ),
              }));
              break;
            }
            case 'CARD_CREATED': {
              const { columnId, card } = msg.payload;
              setBoardData((prev) => ({
                ...prev,
                cards: { ...prev.cards, [card.id]: card },
                columns: prev.columns.map((c) =>
                  c.id === columnId
                    ? { ...c, cardIds: [...c.cardIds, card.id] }
                    : c
                ),
              }));
              break;
            }
            case 'CARD_UPDATED': {
              const { card } = msg.payload;
              setBoardData((prev) => ({
                ...prev,
                cards: { ...prev.cards, [card.id]: card },
              }));
              break;
            }
            case 'CARD_DELETED': {
              const { cardId } = msg.payload;
              setBoardData((prev) => {
                const newCards = { ...prev.cards };
                delete newCards[cardId];
                return {
                  ...prev,
                  cards: newCards,
                  columns: prev.columns.map((c) => ({
                    ...c,
                    cardIds: c.cardIds.filter((id) => id !== cardId),
                  })),
                };
              });
              break;
            }
            case 'USER_CONNECTED':
            case 'USER_DISCONNECTED':
              setOnlineCount(msg.payload.onlineCount);
              break;
          }
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.error('WS connection error:', e);
      setTimeout(connectWebSocket, 2000);
    }
  }, []);

  const sendWS = useCallback(
    (type: WSMessage['type'], payload: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type,
            payload,
            timestamp: Date.now(),
            senderId: clientIdRef.current,
          })
        );
      }
    },
    []
  );

  useEffect(() => {
    fetchBoardData();
    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, [fetchBoardData, connectWebSocket]);

  useEffect(() => {
    boardData.columnOrder.forEach((colId, index) => {
      if (!mountedColumns.includes(colId)) {
        setTimeout(() => {
          setMountedColumns((prev) => [...prev, colId]);
        }, index * 100);
      }
    });
  }, [boardData.columnOrder, mountedColumns]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    let newBoardData: BoardData;

    if (type === 'column') {
      const newColumnOrder = Array.from(boardData.columnOrder);
      const [removed] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, removed);
      newBoardData = {
        ...boardData,
        columnOrder: newColumnOrder,
      };
    } else {
      const startCol = boardData.columns.find(
        (c) => c.id === source.droppableId
      )!;
      const endCol = boardData.columns.find(
        (c) => c.id === destination.droppableId
      )!;
      const startCardIds = Array.from(startCol.cardIds);
      const endCardIds =
        source.droppableId === destination.droppableId
          ? startCardIds
          : Array.from(endCol.cardIds);

      const [moved] = startCardIds.splice(source.index, 1);
      endCardIds.splice(destination.index, 0, moved);

      const newColumns = boardData.columns.map((col) => {
        if (col.id === startCol.id) return { ...col, cardIds: startCardIds };
        if (col.id === endCol.id) return { ...col, cardIds: endCardIds };
        return col;
      });

      newBoardData = {
        ...boardData,
        columns: newColumns,
      };
    }

    setBoardData(newBoardData);

    try {
      await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination, draggableId, type }),
      });
      sendWS('CARDS_REORDERED', newBoardData);
    } catch (e) {
      console.error('Reorder failed:', e);
    }
  };

  const handleCreateColumn = async () => {
    if (!newColumnTitle.trim()) return;
    try {
      const res = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newColumnTitle.trim() }),
      });
      const column: BoardColumn = await res.json();
      sendWS('COLUMN_CREATED', { column });
      setNewColumnTitle('');
      setShowColumnPanel(false);
    } catch (e) {
      console.error('Create column failed:', e);
    }
  };

  const handleRenameColumn = async (columnId: string) => {
    if (!editingColumnTitle.trim() || !editingColumnId) return;
    try {
      await fetch(`/api/columns/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingColumnTitle.trim() }),
      });
      sendWS('COLUMN_RENAMED', {
        columnId,
        title: editingColumnTitle.trim(),
      });
    } catch (e) {
      console.error('Rename column failed:', e);
    }
    setEditingColumnId(null);
    setEditingColumnTitle('');
  };

  const startEditColumn = (column: BoardColumn) => {
    setEditingColumnId(column.id);
    setEditingColumnTitle(column.title);
  };

  const handleCreateCard = async (
    columnId: string,
    cardData: Omit<TaskCard, 'id' | 'createdAt'>
  ) => {
    try {
      const res = await fetch(`/api/columns/${columnId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });
      const card: TaskCard = await res.json();
      sendWS('CARD_CREATED', { columnId, card });
    } catch (e) {
      console.error('Create card failed:', e);
    }
  };

  const handleUpdateCard = async (
    cardId: string,
    updates: Partial<TaskCard>
  ) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const card: TaskCard = await res.json();
      sendWS('CARD_UPDATED', { card });
    } catch (e) {
      console.error('Update card failed:', e);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
      });
      sendWS('CARD_DELETED', { cardId });
    } catch (e) {
      console.error('Delete card failed:', e);
    }
  };

  const getCardsForColumn = (column: BoardColumn) =>
    column.cardIds
      .map((id) => boardData.cards[id])
      .filter(Boolean) as TaskCard[];

  const orderedColumns = boardData.columnOrder
    .map((id) => boardData.columns.find((c) => c.id === id))
    .filter(Boolean) as BoardColumn[];

  return (
    <div className="board-app">
      <nav className="board-navbar">
        <div className="navbar-left">
          <h1 className="navbar-title">极简看板</h1>
          <div className="online-status" title={isConnected ? '在线' : '断线'}>
            <span
              className={`status-dot ${isConnected ? 'status-online' : 'status-offline'}`}
            />
            <span className="online-count">{onlineCount} 人在线</span>
          </div>
        </div>
        <div className="navbar-right">
          <button
            className="btn-add-column"
            onClick={() => setShowColumnPanel(true)}
          >
            <span className="btn-icon">+</span>
            新建看板列
          </button>
          <div className="user-avatar" title="用户">
            U
          </div>
        </div>
      </nav>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board-main">
          <Droppable
            droppableId="all-columns"
            direction="horizontal"
            type="column"
          >
            {(provided) => (
              <div
                className="board-columns"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {orderedColumns.map((column, index) => (
                  <Draggable
                    key={column.id}
                    draggableId={column.id}
                    index={index}
                  >
                    {(colProvided, colSnapshot) => (
                      <div
                        ref={colProvided.innerRef}
                        {...colProvided.draggableProps}
                        className={`board-column ${
                          mountedColumns.includes(column.id)
                            ? 'column-mounted'
                            : ''
                        } ${colSnapshot.isDragging ? 'column-dragging' : ''}`}
                      >
                        <div
                          className="column-header"
                          {...colProvided.dragHandleProps}
                        >
                          {editingColumnId === column.id ? (
                            <input
                              type="text"
                              className="column-title-input"
                              value={editingColumnTitle}
                              onChange={(e) =>
                                setEditingColumnTitle(e.target.value)
                              }
                              onBlur={() => handleRenameColumn(column.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                  handleRenameColumn(column.id);
                                if (e.key === 'Escape') {
                                  setEditingColumnId(null);
                                  setEditingColumnTitle('');
                                }
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <h3
                              className="column-title"
                              onDoubleClick={() => startEditColumn(column)}
                            >
                              {column.title}
                            </h3>
                          )}
                          <span className="column-count">
                            {column.cardIds.length}
                          </span>
                        </div>

                        <Droppable droppableId={column.id} type="card">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`column-cards ${
                                snapshot.isDraggingOver
                                  ? 'dragging-over'
                                  : ''
                              }`}
                            >
                              {getCardsForColumn(column).map((card, idx) => (
                                <Draggable
                                  key={card.id}
                                  draggableId={card.id}
                                  index={idx}
                                >
                                  {(cardProvided, cardSnapshot) => (
                                    <div
                                      ref={cardProvided.innerRef}
                                      {...cardProvided.draggableProps}
                                      {...cardProvided.dragHandleProps}
                                    >
                                      <Card
                                        card={card}
                                        isDragging={
                                          cardSnapshot.isDragging
                                        }
                                        onUpdate={handleUpdateCard}
                                        onDelete={handleDeleteCard}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              <button
                                className="btn-add-card"
                                onClick={() =>
                                  setCreateCardColumnId(column.id)
                                }
                              >
                                + 添加卡片
                              </button>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      <div
        className={`column-panel-overlay ${showColumnPanel ? 'overlay-visible' : ''}`}
        onClick={() => setShowColumnPanel(false)}
      />
      <div className={`column-panel ${showColumnPanel ? 'panel-visible' : ''}`}>
        <div className="panel-header">
          <h3>新建看板列</h3>
          <button
            className="panel-close"
            onClick={() => setShowColumnPanel(false)}
          >
            ×
          </button>
        </div>
        <div className="panel-body">
          <label className="panel-label">列名称</label>
          <input
            type="text"
            className="panel-input"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="例如：待办、进行中..."
            onKeyDown={(e) => e.key === 'Enter' && handleCreateColumn()}
            autoFocus
          />
          <button className="panel-create-btn" onClick={handleCreateColumn}>
            创建列
          </button>
        </div>
      </div>

      <CreateCard
        isOpen={createCardColumnId !== null}
        columnId={createCardColumnId || ''}
        onClose={() => setCreateCardColumnId(null)}
        onSubmit={(cardData) => {
          if (createCardColumnId) {
            handleCreateCard(createCardColumnId, cardData);
          }
        }}
      />
    </div>
  );
};

export default Board;
