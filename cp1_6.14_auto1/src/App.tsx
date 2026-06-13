import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Canvas, { type CanvasHandle } from './components/Canvas';
import StickyNote from './components/StickyNote';
import { socketService } from './utils/socket';
import { useHistory } from './hooks/useHistory';
import type { Shape, StickyNote as StickyNoteType, ToolType, User, RoomState } from './types';
import './App.css';

const ROOM_ID = 'default-room';
const USER_STORAGE_KEY = 'whiteboard-user-name';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
  const [tool, setTool] = useState<ToolType>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<'shape' | 'sticky' | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => {
    try {
      return localStorage.getItem(USER_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [showNameInput, setShowNameInput] = useState(true);
  const [draftName, setDraftName] = useState(userName);

  const canvasRef = useRef<CanvasHandle>(null);
  const stickyLayerRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef(shapes);
  const stickiesRef = useRef(stickyNotes);

  useEffect(() => { shapesRef.current = shapes; }, [shapes]);
  useEffect(() => { stickiesRef.current = stickyNotes; }, [stickyNotes]);

  const historyHandlers = useMemo(() => ({
    onShapeAdd: (shape: Shape) => {
      setShapes((prev) => (prev.some((s) => s.id === shape.id) ? prev : [...prev, shape]));
      socketService.addShape(shape);
    },
    onShapeUpdate: (shape: Shape) => {
      setShapes((prev) => prev.map((s) => (s.id === shape.id ? shape : s)));
      socketService.updateShape(shape);
    },
    onShapeDelete: (shapeId: string) => {
      setShapes((prev) => prev.filter((s) => s.id !== shapeId));
      socketService.deleteShape(shapeId);
      setSelectedId((cur) => (cur === shapeId ? null : cur));
    },
    onStickyAdd: (sticky: StickyNoteType) => {
      setStickyNotes((prev) => (prev.some((s) => s.id === sticky.id) ? prev : [...prev, sticky]));
      socketService.addSticky(sticky);
    },
    onStickyUpdate: (sticky: StickyNoteType) => {
      setStickyNotes((prev) => prev.map((s) => (s.id === sticky.id ? sticky : s)));
      socketService.updateSticky(sticky);
    },
    onStickyDelete: (stickyId: string) => {
      setStickyNotes((prev) => prev.filter((s) => s.id !== stickyId));
      socketService.deleteSticky(stickyId);
      setSelectedId((cur) => (cur === stickyId ? null : cur));
    },
  }), []);

  const history = useHistory(historyHandlers);

  useEffect(() => { history.updateShapeCache(shapes); }, [shapes, history]);
  useEffect(() => { history.updateStickyCache(stickyNotes); }, [stickyNotes, history]);

  const handleLocalShapeAdd = useCallback(
    (shape: Shape) => history.recordShapeAdd(shape),
    [history],
  );

  const handleLocalShapeUpdate = useCallback(
    (shape: Shape) => history.recordShapeUpdate(shape),
    [history],
  );

  const handleLocalShapeDelete = useCallback(
    (shapeId: string) => history.recordShapeDelete(shapeId),
    [history],
  );

  const handleLocalStickyAdd = useCallback(
    (sticky: StickyNoteType) => history.recordStickyAdd(sticky),
    [history],
  );

  const handleLocalStickyUpdate = useCallback(
    (sticky: StickyNoteType) => history.recordStickyUpdate(sticky),
    [history],
  );

  const handleLocalStickyDelete = useCallback(
    (stickyId: string) => history.recordStickyDelete(stickyId),
    [history],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await socketService.connect();
        if (mounted) setIsConnected(true);
      } catch (err) {
        console.error('Socket connection failed:', err);
      }
    })();

    const unsubRoom = socketService.onRoomState((state: RoomState) => {
      setShapes(state.shapes);
      setStickyNotes(state.stickyNotes);
      setUsers(state.users);
    });

    const unsubSelf = socketService.onSelfUser((user: User) => {
      setCurrentUser(user);
    });

    const unsubUserJoin = socketService.onUserJoin((user: User) => {
      setUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
    });

    const unsubUserLeave = socketService.onUserLeave((userId: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    const unsubShapeAdd = socketService.onShapeAdd((shape: Shape) => {
      setShapes((prev) => (prev.some((s) => s.id === shape.id) ? prev : [...prev, shape]));
    });

    const unsubShapeUpdate = socketService.onShapeUpdate((shape: Shape) => {
      setShapes((prev) => prev.map((s) => (s.id === shape.id ? shape : s)));
    });

    const unsubShapeDelete = socketService.onShapeDelete((shapeId: string) => {
      setShapes((prev) => prev.filter((s) => s.id !== shapeId));
      setSelectedId((cur) => (cur === shapeId ? null : cur));
    });

    const unsubStickyAdd = socketService.onStickyAdd((sticky: StickyNoteType) => {
      setStickyNotes((prev) => (prev.some((s) => s.id === sticky.id) ? prev : [...prev, sticky]));
    });

    const unsubStickyUpdate = socketService.onStickyUpdate((sticky: StickyNoteType) => {
      setStickyNotes((prev) => prev.map((s) => (s.id === sticky.id ? sticky : s)));
    });

    const unsubStickyDelete = socketService.onStickyDelete((stickyId: string) => {
      setStickyNotes((prev) => prev.filter((s) => s.id !== stickyId));
      setSelectedId((cur) => (cur === stickyId ? null : cur));
    });

    return () => {
      mounted = false;
      unsubRoom();
      unsubSelf();
      unsubUserJoin();
      unsubUserLeave();
      unsubShapeAdd();
      unsubShapeUpdate();
      unsubShapeDelete();
      unsubStickyAdd();
      unsubStickyUpdate();
      unsubStickyDelete();
      socketService.disconnect();
    };
  }, []);

  const handleJoinRoom = () => {
    const name = draftName.trim() || `用户-${Math.floor(Math.random() * 1000)}`;
    try { localStorage.setItem(USER_STORAGE_KEY, name); } catch { /* noop */ }
    setUserName(name);
    setShowNameInput(false);
    socketService.joinRoom(ROOM_ID, name);
  };

  const handleToolChange = (newTool: ToolType) => {
    if (newTool === 'undo') {
      history.undo();
      return;
    }
    setTool(newTool);
    setSelectedId(null);
    setSelectedKind(null);
    setSidebarOpen(false);
  };

  const handleSelect = (id: string | null, kind?: 'shape' | 'sticky') => {
    setSelectedId(id);
    setSelectedKind(id ? (kind ?? null) : null);
  };

  const handleCreateSticky = useCallback(
    (x: number, y: number) => {
      if (!currentUser) return;
      const sticky: StickyNoteType = {
        id: uuidv4(),
        x,
        y,
        width: 200,
        height: 150,
        content: '',
        creatorId: currentUser.id,
        creatorColor: currentUser.color,
      };
      setStickyNotes((prev) => [...prev, sticky]);
      handleLocalStickyAdd(sticky);
      socketService.addSticky(sticky);
      setSelectedId(sticky.id);
      setSelectedKind('sticky');
    },
    [currentUser, handleLocalStickyAdd],
  );

  const handleStickyDragMove = useCallback((id: string, x: number, y: number) => {
    setStickyNotes((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  }, []);

  const handleStickyDragStart = useCallback((id: string) => {
    setSelectedId(id);
    setSelectedKind('sticky');
  }, []);

  const handleStickyDragEnd = useCallback(
    (sticky: StickyNoteType) => {
      handleLocalStickyUpdate(sticky);
      socketService.updateSticky(sticky);
    },
    [handleLocalStickyUpdate],
  );

  const handleStickyUpdate = useCallback(
    (sticky: StickyNoteType) => {
      setStickyNotes((prev) => prev.map((s) => (s.id === sticky.id ? sticky : s)));
      handleLocalStickyUpdate(sticky);
      socketService.updateSticky(sticky);
    },
    [handleLocalStickyUpdate],
  );

  const handleStickyDelete = useCallback(
    (id: string) => {
      handleLocalStickyDelete(id);
    },
    [handleLocalStickyDelete],
  );

  const handleExport = () => {
    canvasRef.current?.exportToImage();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.target && (e.target as HTMLElement).isContentEditable) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        history.undo();
      } else if ((ctrl && e.key.toLowerCase() === 'z' && e.shiftKey) || (ctrl && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        history.redo();
      } else if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExport();
      } else if (e.key === 'Escape') {
        setTool('select');
        setSelectedId(null);
        setSelectedKind(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [history]);

  const tools: { id: ToolType; label: string; icon: React.ReactNode; activeOn?: ToolType[] }[] = [
    { id: 'select', label: '选择', icon: <span className="tool-icon select-icon" /> },
    { id: 'rect', label: '矩形', icon: <span className="tool-icon rect-icon" /> },
    { id: 'circle', label: '圆形', icon: <span className="tool-icon circle-icon" /> },
    { id: 'line', label: '线条', icon: <span className="tool-icon line-icon" /> },
    { id: 'sticky', label: '便签', icon: <span className="tool-icon sticky-icon" /> },
  ];

  const activeTool = tool;

  return (
    <div className="app-root">
      {showNameInput && (
        <div className="name-modal-overlay">
          <div className="name-modal">
            <h1>欢迎使用协作白板</h1>
            <p>请输入您的昵称加入房间</p>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="输入昵称..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinRoom();
              }}
            />
            <button type="button" className="join-btn" onClick={handleJoinRoom}>
              加入房间
            </button>
            <div className="connection-status">
              {isConnected ? <span className="status-online">● 服务器已连接</span> : <span className="status-offline">● 连接中...</span>}
            </div>
          </div>
        </div>
      )}

      <header className={`toolbar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="toolbar-inner">
          <div className="brand">
            <div className="brand-logo" />
            <span className="brand-name">协作白板</span>
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="菜单"
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`tools-nav ${sidebarOpen ? 'show' : ''}`}>
            {tools.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tool-btn ${activeTool === t.id ? 'active' : ''}`}
                onClick={() => handleToolChange(t.id)}
                title={t.label}
              >
                {t.icon}
                <span className="tool-label">{t.label}</span>
              </button>
            ))}
            <div className="tool-divider" />
            <button
              type="button"
              className={`tool-btn ${!history.canUndo ? 'disabled' : ''}`}
              onClick={() => history.undo()}
              disabled={!history.canUndo}
              title={`撤销${history.canUndo ? '' : '（无历史）'}`}
            >
              <span className="tool-icon undo-icon" />
              <span className="tool-label">撤销</span>
            </button>
            <button
              type="button"
              className={`tool-btn ${!history.canRedo ? 'disabled' : ''}`}
              onClick={() => history.redo()}
              disabled={!history.canRedo}
              title="重做"
            >
              <span className="tool-icon redo-icon" />
              <span className="tool-label">重做</span>
            </button>
            <div className="tool-divider" />
            <button
              type="button"
              className="tool-btn export-btn"
              onClick={handleExport}
              title="导出为PNG"
            >
              <span className="tool-icon export-icon" />
              <span className="tool-label">导出</span>
            </button>
          </nav>

          <div className="toolbar-right">
            <div className="users-indicator" title={`在线用户：${users.length}`}>
              <div className="user-avatars">
                {users.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="user-avatar"
                    style={{ backgroundColor: u.color }}
                    title={`${u.name}${u.id === currentUser?.id ? '（我）' : ''}`}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {users.length > 5 && (
                  <div className="user-avatar more">+{users.length - 5}</div>
                )}
              </div>
              <span className="users-count">{users.length}</span>
            </div>
            {currentUser && (
              <div className="current-user">
                <div
                  className="current-user-dot"
                  style={{ backgroundColor: currentUser.color }}
                />
                <span className="current-user-name">{currentUser.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-area">
        <Canvas
          ref={canvasRef}
          tool={tool}
          currentUser={currentUser}
          shapes={shapes}
          onShapesChange={setShapes}
          onLocalShapeAdd={handleLocalShapeAdd}
          onLocalShapeUpdate={handleLocalShapeUpdate}
          onLocalShapeDelete={handleLocalShapeDelete}
          onStickyCreate={handleCreateSticky}
          selectedId={selectedKind === 'shape' ? selectedId : null}
          onSelectChange={(id) => handleSelect(id, 'shape')}
          stickyNotesContainerRef={stickyLayerRef}
          canvasScale={canvasScale}
          onCanvasScaleChange={setCanvasScale}
        />
        <div ref={stickyLayerRef} className="sticky-notes-layer">
          {stickyNotes.map((sticky) => (
            <StickyNote
              key={sticky.id}
              sticky={sticky}
              isSelected={selectedId === sticky.id && selectedKind === 'sticky'}
              stageScale={canvasScale}
              onSelect={(id) => handleSelect(id, 'sticky')}
              onDragStart={handleStickyDragStart}
              onDragMove={handleStickyDragMove}
              onDragEnd={handleStickyDragEnd}
              onUpdate={handleStickyUpdate}
              onDelete={handleStickyDelete}
            />
          ))}
        </div>
      </main>

      <button
        type="button"
        className="undo-fab"
        onClick={() => history.undo()}
        disabled={!history.canUndo}
        title="撤销 (Ctrl+Z)"
      >
        <span aria-hidden>↶</span>
        {history.canUndo && <span className="badge" aria-hidden>{5 - (5 - history.canUndo ? 1 : 0)}</span>}
        {!history.canUndo && (
          <span className="undo-fab-tooltip">暂无撤销记录</span>
        )}
        {history.canUndo && (
          <span className="undo-fab-tooltip">点击撤销 · 还可撤销 {5} 步以内</span>
        )}
      </button>

      {history.canRedo && (
        <button
          type="button"
          className="redo-fab"
          onClick={() => history.redo()}
          title="重做 (Ctrl+Shift+Z)"
        >
          ↷
        </button>
      )}

      <div className="scale-indicator">
        <span className="label">缩放</span>
        <span className="value">{Math.round(canvasScale * 100)}%</span>
        <span className="hint" style={{ opacity: 0.5, marginLeft: 8 }}>Ctrl + 滚轮调整</span>
      </div>
    </div>
  );
};

export default App;
