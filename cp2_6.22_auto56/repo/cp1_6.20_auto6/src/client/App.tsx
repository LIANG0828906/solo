import React, { useEffect, useRef, useState, useCallback } from 'react';
import type {
  Task,
  ColumnData,
  Priority,
  ClientMessage,
  ServerMessage,
} from './types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from './types';
import Column from './Column';

const WS_PROTO = window.location.protocol === 'https:' ? 'wss' : 'ws';
const WS_URL = `${WS_PROTO}://${window.location.host}/ws`;

function useWebSocket(): {
  ready: boolean;
  send: (msg: ClientMessage) => void;
  onMessage: (handler: (msg: ServerMessage) => void) => void;
} {
  const wsRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);
  const handlersRef = useRef<Array<(msg: ServerMessage) => void>>([]);
  const pendingRef = useRef<ClientMessage[]>([]);

  useEffect(() => {
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setReady(true);
        while (pendingRef.current.length > 0) {
          const m = pendingRef.current.shift()!;
          ws.send(JSON.stringify(m));
        }
      };

      ws.onmessage = (e) => {
        try {
          const data: ServerMessage = JSON.parse(e.data);
          handlersRef.current.forEach((h) => h(data));
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setReady(false);
        if (!closed) {
          retryTimer = setTimeout(connect, 1500);
        }
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          // ignore
        }
      };
    };

    connect();
    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      pendingRef.current.push(msg);
    }
  }, []);

  const onMessage = useCallback((handler: (msg: ServerMessage) => void) => {
    handlersRef.current.push(handler);
    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h !== handler);
    };
  }, []);

  return { ready, send, onMessage };
}

const App: React.FC = () => {
  const { ready, send, onMessage } = useWebSocket();
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingFromColumnId, setDraggingFromColumnId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');

  useEffect(() => {
    onMessage((msg) => {
      switch (msg.type) {
        case 'STATE': {
          setColumns(msg.payload.columns);
          setTasks(msg.payload.tasks);
          break;
        }
        case 'TASK_ADDED': {
          setTasks((prev) => [...prev, msg.payload]);
          break;
        }
        case 'TASK_DELETED': {
          setTasks((prev) => prev.filter((t) => t.id !== msg.payload.taskId));
          break;
        }
        case 'TASK_UPDATED': {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === msg.payload.id ? { ...t, ...msg.payload } : t
            )
          );
          break;
        }
        case 'TASK_MOVED': {
          const { taskId, toColumnId, newIndex } = msg.payload;
          setTasks((prev) => {
            const idx = prev.findIndex((t) => t.id === taskId);
            if (idx === -1) return prev;
            const [task] = prev.splice(idx, 1);
            task.columnId = toColumnId;
            const colTasks = prev.filter((t) => t.columnId === toColumnId);
            const rest = prev.filter((t) => t.columnId !== toColumnId);
            const insert = Math.max(0, Math.min(newIndex, colTasks.length));
            colTasks.splice(insert, 0, task);
            return [...rest, ...colTasks];
          });
          break;
        }
      }
    });
  }, [onMessage]);

  const handleCardDragStart = (
    e: React.DragEvent,
    taskId: string,
    columnId: string
  ) => {
    setDraggingTaskId(taskId);
    setDraggingFromColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/task-id', taskId);
    e.dataTransfer.setData('application/from-column-id', columnId);
  };

  const handleCardDragEnd = () => {
    setDraggingTaskId(null);
    setDraggingFromColumnId(null);
  };

  const handleDropTask = (
    taskId: string,
    toColumnId: string,
    newIndex: number
  ) => {
    send({
      type: 'MOVE_TASK',
      payload: { taskId, toColumnId, newIndex },
    });
  };

  const handleUpdateTitle = (taskId: string, title: string) => {
    send({ type: 'UPDATE_TASK_TITLE', payload: { taskId, title } });
  };

  const handleDelete = (taskId: string) => {
    send({ type: 'DELETE_TASK', payload: { taskId } });
  };

  const handleUpdatePriority = (taskId: string, priority: Priority) => {
    send({ type: 'UPDATE_TASK_PRIORITY', payload: { taskId, priority } });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || columns.length === 0) return;
    send({
      type: 'ADD_TASK',
      payload: {
        title,
        priority: newPriority,
        columnId: columns[0].id,
      },
    });
    setNewTitle('');
    setNewPriority('medium');
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f4f5f7',
      }}
    >
      <header
        style={{
          padding: '16px 28px',
          background: '#ffffff',
          borderBottom: '1px solid #e4e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background:
                'linear-gradient(135deg, #3498db 0%, #2c3e50 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            K
          </div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#2c3e50',
              letterSpacing: 0.2,
            }}
          >
            团队协作看板
          </h1>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ready ? '#2ecc71' : '#e74c3c',
              boxShadow: ready
                ? '0 0 8px rgba(46,204,113,0.5)'
                : '0 0 8px rgba(231,76,60,0.5)',
            }}
          />
          <span style={{ color: ready ? '#2ecc71' : '#e74c3c', fontWeight: 500 }}>
            {ready ? '已连接 · 实时同步中' : '连接中...'}
          </span>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: 16,
          display: 'flex',
          gap: 16,
          overflow: 'hidden',
          minHeight: 0,
        }}
        className="board-columns"
      >
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.columnId === col.id);
          return (
            <Column
              key={col.id}
              column={col}
              tasks={colTasks}
              draggingTaskId={draggingTaskId}
              draggingFromColumnId={draggingFromColumnId}
              onUpdateTitle={handleUpdateTitle}
              onDelete={handleDelete}
              onUpdatePriority={handleUpdatePriority}
              onCardDragStart={handleCardDragStart}
              onCardDragEnd={handleCardDragEnd}
              onDropTask={handleDropTask}
            />
          );
        })}
      </main>

      <footer
        style={{
          padding: '16px 28px 20px',
          background: '#ffffff',
          borderTop: '1px solid #e4e7eb',
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 -1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <form
          onSubmit={handleCreate}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            width: '100%',
            maxWidth: 680,
          }}
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="输入新任务标题..."
            style={{
              flex: 1,
              height: 40,
              padding: '0 14px',
              fontSize: 14,
              border: '1px solid #d8dde2',
              borderRadius: 8,
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              color: '#2c3e50',
              background: '#fff',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3498db';
              e.currentTarget.style.boxShadow =
                '0 0 0 3px rgba(52,152,219,0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d8dde2';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            style={{
              height: 40,
              padding: '0 12px',
              fontSize: 14,
              border: '1px solid #d8dde2',
              borderRadius: 8,
              outline: 'none',
              background: '#fff',
              color: '#2c3e50',
              cursor: 'pointer',
              minWidth: 100,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3498db';
              e.currentTarget.style.boxShadow =
                '0 0 0 3px rgba(52,152,219,0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d8dde2';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {(['high', 'medium', 'low'] as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}优先级
              </option>
            ))}
          </select>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px',
              height: 40,
              border: '1px solid #d8dde2',
              borderRadius: 8,
              background: '#fafbfc',
              minWidth: 110,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: PRIORITY_COLORS[newPriority],
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: '#5c6b7a',
                fontWeight: 500,
              }}
            >
              将加入「{columns[0]?.title || '待办'}」
            </span>
          </div>
          <button
            type="submit"
            disabled={!newTitle.trim()}
            style={{
              height: 40,
              padding: '0 20px',
              background: newTitle.trim() ? '#3498db' : '#b0b8bf',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: newTitle.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
            }}
            onMouseEnter={(e) => {
              if (newTitle.trim()) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  '#2e86c1';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = newTitle
                .trim()
                ? '#3498db'
                : '#b0b8bf';
            }}
            onMouseDown={(e) => {
              if (newTitle.trim()) {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  'scale(0.97)';
              }
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            创建任务
          </button>
        </form>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .board-columns {
            flex-direction: column !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          .board-columns > * {
            max-width: none !important;
            width: 100% !important;
            height: auto !important;
            min-height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
