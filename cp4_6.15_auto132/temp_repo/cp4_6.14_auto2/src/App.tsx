import { useState, useEffect, useCallback, useRef } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import { syncManager } from './utils/syncManager';
import type {
  ToolType,
  Point,
  DrawEvent,
  StickyNote,
} from './utils/drawEngine';
import {
  createHistoryStack,
  pushHistory,
  undoHistory,
  redoHistory,
} from './utils/drawEngine';
import type { User } from './utils/syncManager';
import './styles/global.css';

const USER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#A78BFA',
  '#FF9F43',
];

interface DrawState {
  events: DrawEvent[];
  stickies: StickyNote[];
}

export default function App() {
  const [username, setUsername] = useState('');
  const [inputName, setInputName] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentTool, setCurrentTool] = useState<ToolType>('pen-medium');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 200, y: 100 });
  const [remoteCursors, setRemoteCursors] = useState<
    Map<string, { x: number; y: number; username: string; color: string }>
  >(new Map());

  const historyStackRef = useRef(createHistoryStack<DrawState>({
    events: [],
    stickies: [],
  }));

  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  const drawEvents = historyStackRef.current.present.events;
  const stickies = historyStackRef.current.present.stickies;

  const canUndo = historyStackRef.current.past.length > 0;
  const canRedo = historyStackRef.current.future.length > 0;

  const cursorThrottleRef = useRef<number>(0);

  useEffect(() => {
    if (!username) return;

    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

    syncManager.setCallbacks({
      onUsersUpdate: (userList) => {
        setUsers(userList);
      },
      onUserJoined: () => {},
      onUserLeft: (userId) => {
        setRemoteCursors((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      },
      onDrawHistory: (events) => {
        historyStackRef.current.present.events = events;
        rerender();
      },
      onDraw: (event) => {
        if (event.userId === currentUser?.id) return;
        historyStackRef.current.present.events = [
          ...historyStackRef.current.present.events,
          event,
        ];
        rerender();
      },
      onCursor: (data) => {
        if (data.userId === currentUser?.id) return;
        setRemoteCursors((prev) => {
          const next = new Map(prev);
          next.set(data.userId, {
            x: data.x,
            y: data.y,
            username: data.username,
            color: data.color,
          });
          return next;
        });
      },
      onStickyUpdate: (sticky: StickyNote) => {
        if (sticky.userId === currentUser?.id) return;
        const idx = historyStackRef.current.present.stickies.findIndex(
          (s) => s.id === sticky.id,
        );
        const stickiesArr = [...historyStackRef.current.present.stickies];
        if (idx >= 0) {
          stickiesArr[idx] = sticky;
        } else {
          stickiesArr.push(sticky);
        }
        historyStackRef.current.present.stickies = stickiesArr;
        rerender();
      },
    });

    const SERVER_URL =
      import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

    syncManager
      .connect(SERVER_URL, username, color)
      .then((user) => {
        setCurrentUser(user);
      })
      .catch((err) => {
        console.error('连接失败:', err);
      });

    return () => {
      syncManager.disconnect();
    };
  }, [username, rerender]);

  useEffect(() => {
    if (currentUser) {
      setUsers((prev) => (prev.find((u) => u.id === currentUser.id) ? prev : [...prev, currentUser]));
    }
  }, [currentUser]);

  const handleToolChange = useCallback((tool: ToolType) => {
    setCurrentTool(tool);
  }, []);

  const handleDrawStart = useCallback((event: DrawEvent) => {
    syncManager.sendDraw(event);
  }, []);

  const handleDrawMove = useCallback((event: DrawEvent) => {
    syncManager.sendDraw(event);
  }, []);

  const handleDrawEnd = useCallback((event: DrawEvent) => {
    const current = historyStackRef.current.present;
    const nextState: DrawState = {
      events: [...current.events, event],
      stickies: current.stickies,
    };
    historyStackRef.current = pushHistory(historyStackRef.current, nextState);
    syncManager.sendDraw(event);
    rerender();
  }, [rerender]);

  const handleStickyCreate = useCallback(
    (sticky: StickyNote) => {
      const current = historyStackRef.current.present;
      const nextState: DrawState = {
        events: current.events,
        stickies: [...current.stickies, sticky],
      };
      historyStackRef.current = pushHistory(historyStackRef.current, nextState);
      syncManager.sendSticky(sticky);
      rerender();
    },
    [rerender],
  );

  const handleStickyUpdate = useCallback(
    (sticky: StickyNote) => {
      const current = historyStackRef.current.present;
      const idx = current.stickies.findIndex((s) => s.id === sticky.id);
      const newStickies = [...current.stickies];
      if (idx >= 0) {
        newStickies[idx] = sticky;
      } else {
        newStickies.push(sticky);
      }
      historyStackRef.current.present.stickies = newStickies;
      syncManager.sendSticky(sticky);
      rerender();
    },
    [rerender],
  );

  const handleCursorMove = useCallback(
    (x: number, y: number) => {
      if (!currentUser) return;
      const now = performance.now();
      if (now - cursorThrottleRef.current < 30) return;
      cursorThrottleRef.current = now;
      syncManager.sendCursor(x, y, currentUser.username, currentUser.color);
    },
    [currentUser],
  );

  const handleUndo = useCallback(() => {
    const result = undoHistory(historyStackRef.current);
    if (result) {
      historyStackRef.current = result;
      syncManager.sendUndo(currentUser?.id || '');
      rerender();
    }
  }, [currentUser, rerender]);

  const handleRedo = useCallback(() => {
    const result = redoHistory(historyStackRef.current);
    if (result) {
      historyStackRef.current = result;
      syncManager.sendRedo(currentUser?.id || '');
      rerender();
    }
  }, [currentUser, rerender]);

  const handleScaleChange = useCallback((newScale: number, newOffset: Point) => {
    setScale(newScale);
    setOffset(newOffset);
  }, []);

  const handleOffsetChange = useCallback((newOffset: Point) => {
    setOffset(newOffset);
  }, []);

  const handleJoin = useCallback(() => {
    if (inputName.trim()) {
      setUsername(inputName.trim());
    }
  }, [inputName]);

  if (!username) {
    return (
      <div className="username-modal">
        <div className="modal-content">
          <h2>加入协作白板</h2>
          <input
            type="text"
            placeholder="请输入你的名字"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            autoFocus
            maxLength={16}
          />
          <button onClick={handleJoin}>加入</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        currentTool={currentTool}
        userColor={currentUser?.color || '#888'}
        userId={currentUser?.id || ''}
        username={currentUser?.username || ''}
        drawHistory={drawEvents}
        stickies={stickies}
        remoteCursors={remoteCursors}
        onDrawStart={handleDrawStart}
        onDrawMove={handleDrawMove}
        onDrawEnd={handleDrawEnd}
        onStickyCreate={handleStickyCreate}
        onStickyUpdate={handleStickyUpdate}
        onCursorMove={handleCursorMove}
        scale={scale}
        offset={offset}
        onScaleChange={handleScaleChange}
        onOffsetChange={handleOffsetChange}
      />

      <Toolbar
        currentTool={currentTool}
        onToolChange={handleToolChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="user-list">
        {users.map((user) => (
          <div
            key={user.id}
            className="user-avatar"
            style={{ background: user.color }}
            title={user.username}
          >
            {user.username.slice(0, 2)}
          </div>
        ))}
      </div>

      <div className="zoom-indicator">{Math.round(scale * 100)}%</div>
    </div>
  );
}
