import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { wsClient } from './WebSocketClient';
import { Shape, ToolType, Point, UserInfo, ServerMessage } from './types';

const USER_COLORS = [
  '#00e676',
  '#ff5252',
  '#448aff',
  '#ffd740',
  '#e040fb',
  '#ff6e40',
  '#18ffff',
  '#ff80ab',
  '#b388ff',
  '#69f0ae',
  '#ffab40',
  '#40c4ff',
];

const generateUserName = (): string => {
  const adjectives = ['快乐的', '聪明的', '勇敢的', '可爱的', '神秘的', '闪亮的', '温柔的'];
  const nouns = ['小画家', '设计师', '艺术家', '创作者', '绘图员'];
  return (
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    nouns[Math.floor(Math.random() * nouns.length)]
  );
};

const App: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#00e676');
  const [thickness, setThickness] = useState<number>(4);
  const [userId, setUserId] = useState<string>('');
  const [userColor, setUserColor] = useState<string>(USER_COLORS[0]);
  const [userName, setUserName] = useState<string>(generateUserName());
  const [onlineUsers, setOnlineUsers] = useState<UserInfo[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const remoteCursors = useRef<Map<string, { position: Point | null; color: string }>>(new Map());
  const [, forceRerender] = useState(0);
  const localHistory = useRef<Shape[]>([]);
  const historyIndex = useRef<number>(-1);
  const shapesVersion = useRef<number>(0);

  const canUndo = useMemo(() => historyIndex.current >= 0, [shapesVersion.current]);
  const canRedo = useMemo(
    () => historyIndex.current < localHistory.current.length - 1,
    [shapesVersion.current],
  );

  useEffect(() => {
    const assignedColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    setUserColor(assignedColor);

    const unsub = wsClient.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case 'init':
          setUserId(msg.userId);
          setShapes(msg.shapes);
          localHistory.current = [...msg.shapes];
          historyIndex.current = msg.shapes.length - 1;
          setOnlineUsers(msg.onlineUsers);
          setConnected(true);
          setConnectError(null);
          shapesVersion.current++;
          break;
        case 'draw':
          setShapes((prev) => {
            const next = [...prev, msg.shape];
            if (msg.shape.userId !== userId) {
              localHistory.current = next;
              historyIndex.current = next.length - 1;
              shapesVersion.current++;
            }
            return next;
          });
          break;
        case 'undo': {
          if (msg.userId === userId) break;
          setShapes((prev) => {
            const byUser = prev.filter((s) => s.userId === msg.userId);
            if (byUser.length === 0) return prev;
            const lastIdx = prev.lastIndexOf(byUser[byUser.length - 1]);
            const next = prev.slice(0, lastIdx);
            localHistory.current = next;
            historyIndex.current = next.length - 1;
            shapesVersion.current++;
            return next;
          });
          break;
        }
        case 'redo': {
          if (msg.userId === userId) break;
          break;
        }
        case 'cursor': {
          if (msg.userId === userId) break;
          remoteCursors.current.set(msg.userId, { position: msg.position, color: msg.color });
          forceRerender((n) => n + 1);
          break;
        }
        case 'user-join':
          setOnlineUsers((prev) => {
            if (prev.some((u) => u.id === msg.user.id)) return prev;
            return [...prev, msg.user];
          });
          break;
        case 'user-leave':
          setOnlineUsers((prev) => prev.filter((u) => u.id !== msg.userId));
          remoteCursors.current.delete(msg.userId);
          forceRerender((n) => n + 1);
          break;
        case 'online-users':
          setOnlineUsers(msg.users);
          break;
      }
    });

    wsClient
      .connect()
      .catch((err) => {
        console.error('WebSocket connection failed:', err);
        setConnectError('连接服务器失败，将以离线模式运行');
        setConnected(false);
        setUserId('local-' + Math.random().toString(36).slice(2, 10));
      });

    return () => {
      unsub();
      wsClient.disconnect();
    };
  }, []);

  useEffect(() => {
    const me: UserInfo = { id: userId, color: userColor, name: userName };
    setOnlineUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== userId);
      return [me, ...filtered];
    });
  }, [userId, userColor, userName]);

  const handleShapeComplete = useCallback(
    (shape: Shape) => {
      setShapes((prev) => {
        const trimmed = prev.slice(0, historyIndex.current + 1);
        const next = [...trimmed, shape];
        localHistory.current = next;
        historyIndex.current = next.length - 1;
        shapesVersion.current++;
        return next;
      });
      if (connected) {
        wsClient.sendDraw(shape);
      }
    },
    [connected],
  );

  const handleCursorMove = useCallback(
    (position: Point | null) => {
      if (connected) {
        wsClient.sendCursor(position, userColor);
      }
    },
    [connected, userColor],
  );

  const handleUndo = useCallback(() => {
    if (historyIndex.current < 0) return;
    const myShapes = localHistory.current
      .slice(0, historyIndex.current + 1)
      .filter((s) => s.userId === userId);
    if (myShapes.length === 0) return;
    const lastMyShape = myShapes[myShapes.length - 1];
    const idx = localHistory.current.indexOf(lastMyShape);
    historyIndex.current = idx - 1;
    setShapes(localHistory.current.slice(0, historyIndex.current + 1));
    shapesVersion.current++;
    if (connected) {
      wsClient.sendUndo();
    }
  }, [connected, userId]);

  const handleRedo = useCallback(() => {
    if (historyIndex.current >= localHistory.current.length - 1) return;
    const remaining = localHistory.current.slice(historyIndex.current + 1);
    const nextMyShape = remaining.find((s) => s.userId === userId);
    if (!nextMyShape) return;
    const targetIdx = localHistory.current.indexOf(nextMyShape);
    historyIndex.current = targetIdx;
    setShapes(localHistory.current.slice(0, historyIndex.current + 1));
    shapesVersion.current++;
    if (connected) {
      wsClient.sendRedo();
    }
  }, [connected, userId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  return (
    <div className="app-root">
      <Toolbar
        tool={tool}
        color={color}
        thickness={thickness}
        onToolChange={setTool}
        onColorChange={setColor}
        onThicknessChange={setThickness}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <main className="main-area">
        <header className="app-header">
          <div className="header-left">
            <div
              className="status-indicator"
              style={{ backgroundColor: connected ? '#00e676' : '#ff5252' }}
            />
            <span className="status-text">
              {connected ? '已连接' : connectError || '连接中...'}
            </span>
          </div>
          <div className="header-right">
            <div className="user-badge" style={{ borderColor: userColor }}>
              <span className="user-dot" style={{ backgroundColor: userColor }} />
              <span className="user-name">{userName}</span>
            </div>
          </div>
        </header>

        <Canvas
          shapes={shapes}
          tool={tool}
          color={color}
          thickness={thickness}
          userId={userId}
          remoteCursors={remoteCursors.current}
          onlineUsers={onlineUsers}
          onShapeComplete={handleShapeComplete}
          onCursorMove={handleCursorMove}
        />
      </main>
    </div>
  );
};

export default App;
