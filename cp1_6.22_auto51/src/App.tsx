import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Canvas, { type CanvasHandle } from './Canvas';
import Toolbar from './Toolbar';
import { WebSocketManager, type ConnectionStatus } from './WebSocketManager';
import type {
  DrawPath,
  StickyNote as NoteT,
  Point,
  WSMessage,
  ToolbarState,
  ActionItem,
} from './types';
import { PALETTE_COLORS, THICKNESS_OPTIONS } from './types';
import { generateNickname, clamp, easeInOutCubic } from './utils';

const MAX_HISTORY = 10;

const App: React.FC = () => {
  // User identity
  const [userId, setUserId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [displayNickname, setDisplayNickname] = useState<string>('');
  const [userCount, setUserCount] = useState<number>(1);

  // Connection
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsMgrRef = useRef<WebSocketManager | null>(null);

  // Board state
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [notes, setNotes] = useState<NoteT[]>([]);

  // History stacks (for local user only)
  const undoStackRef = useRef<ActionItem[]>([]);
  const redoStackRef = useRef<ActionItem[]>([]);
  const [, setHistoryTick] = useState(0);

  // Toolbar state
  const [toolbar, setToolbar] = useState<ToolbarState>({
    activeColor: PALETTE_COLORS[5],
    thickness: 5,
    activeTool: 'pen',
  });

  // Clear animation
  const [clearProgress, setClearProgress] = useState(0);
  const clearAnimRef = useRef<number | null>(null);
  const clearStartTsRef = useRef<number>(0);
  const CLEAR_DURATION = 650;

  const canvasRef = useRef<CanvasHandle>(null);

  // Initialize WS manager once
  useEffect(() => {
    const mgr = new WebSocketManager();
    wsMgrRef.current = mgr;

    const offStatus = mgr.onStatusChange(setStatus);
    const offMsg = mgr.onMessage(handleWSMessage);

    mgr.connect();

    return () => {
      offStatus();
      offMsg();
      mgr.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nickname typewriter effect
  useEffect(() => {
    if (!nickname) return;
    const chars = nickname.split('');
    let idx = 0;
    setDisplayNickname('');
    const timer = window.setInterval(() => {
      idx++;
      setDisplayNickname(chars.slice(0, idx).join(''));
      if (idx >= chars.length) window.clearInterval(timer);
    }, 90);
    return () => window.clearInterval(timer);
  }, [nickname]);

  // Local nickname fallback until WS init
  useEffect(() => {
    if (!nickname) {
      setNickname(generateNickname());
    }
  }, [nickname]);

  const pushHistory = (item: ActionItem) => {
    const s = undoStackRef.current;
    s.push(item);
    if (s.length > MAX_HISTORY) s.shift();
    redoStackRef.current = [];
    setHistoryTick((t) => t + 1);
  };

  // ===== WS Message Handlers =====
  const handleWSMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'init': {
        setUserId(msg.yourId);
        setNickname(msg.nickname);
        setPaths(msg.state.paths.map((p) => ({ ...p, opacity: 1 })));
        setNotes(msg.state.notes);
        break;
      }
      case 'user-join': {
        setUserCount(msg.userCount);
        break;
      }
      case 'user-leave': {
        setUserCount(msg.userCount);
        break;
      }
      case 'draw-start': {
        if (msg.userId === userId) break;
        setPaths((prev) => [
          ...prev,
          {
            ...msg.path,
            isRemote: true,
            isDrawing: true,
            animationState: {
              kind: 'appearing',
              progress: 0,
              startTime: performance.now(),
            },
          },
        ]);
        break;
      }
      case 'draw-point': {
        if (msg.userId === userId) break;
        setPaths((prev) => {
          const idx = prev.findIndex((p) => p.id === msg.pathId);
          if (idx === -1) return prev;
          const next = prev.slice();
          next[idx] = { ...next[idx], points: [...next[idx].points, msg.point] };
          return next;
        });
        break;
      }
      case 'draw-end': {
        if (msg.userId === userId) break;
        setPaths((prev) =>
          prev.map((p) => (p.id === msg.pathId ? { ...p, isDrawing: false } : p)),
        );
        break;
      }
      case 'note-add': {
        if (msg.userId === userId) break;
        setNotes((prev) => [
          ...prev,
          {
            ...msg.note,
            animationState: {
              kind: 'entering',
              progress: 0,
              startTime: performance.now(),
            },
          },
        ]);
        break;
      }
      case 'note-update': {
        setNotes((prev) =>
          prev.map((n) => (n.id === msg.note.id ? { ...n, ...msg.note } : n)),
        );
        break;
      }
      case 'undo': {
        if (msg.userId === userId) break;
        if (msg.actionType === 'path') {
          setPaths((prev) =>
            prev.map((p) =>
              p.id === msg.actionId
                ? {
                    ...p,
                    animationState: {
                      kind: 'erasing',
                      progress: 0,
                      startTime: performance.now(),
                    },
                  }
                : p,
            ),
          );
          setTimeout(() => {
            setPaths((prev) => prev.filter((p) => p.id !== msg.actionId));
          }, 400);
        } else if (msg.actionType === 'note') {
          setTimeout(() => {
            setNotes((prev) => prev.filter((n) => n.id !== msg.actionId));
          }, 100);
        }
        break;
      }
      case 'redo': {
        if (msg.userId === userId) break;
        if (msg.actionType === 'path') {
          const action = msg.action as DrawPath;
          setPaths((prev) => [
            ...prev.filter((p) => p.id !== action.id),
            {
              ...action,
              animationState: {
                kind: 'redrawing',
                progress: 0,
                startTime: performance.now(),
              },
            },
          ]);
        } else if (msg.actionType === 'note') {
          const action = msg.action as NoteT;
          setNotes((prev) => [
            ...prev.filter((n) => n.id !== action.id),
            {
              ...action,
              animationState: {
                kind: 'entering',
                progress: 0,
                startTime: performance.now(),
              },
            },
          ]);
        }
        break;
      }
      case 'clear': {
        if (msg.userId === userId) break;
        triggerClearAnimation();
        break;
      }
    }
  }, [userId]);

  // ===== Clear animation =====
  const triggerClearAnimation = useCallback(() => {
    clearStartTsRef.current = performance.now();
    if (clearAnimRef.current !== null) cancelAnimationFrame(clearAnimRef.current);
    const tick = (now: number) => {
      const p = clamp((now - clearStartTsRef.current) / CLEAR_DURATION, 0, 1);
      const eased = easeInOutCubic(p);
      setClearProgress(eased);
      if (p >= 1) {
        setPaths([]);
        setNotes([]);
        setClearProgress(0);
        clearAnimRef.current = null;
      } else {
        clearAnimRef.current = requestAnimationFrame(tick);
      }
    };
    clearAnimRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => {
      if (clearAnimRef.current) cancelAnimationFrame(clearAnimRef.current);
    };
  }, []);

  // ===== Local Drawing Handlers =====
  const handleDrawStart = (path: DrawPath) => {
    setPaths((prev) => [...prev, path]);
    pushHistory(path);
    wsMgrRef.current?.send({
      type: 'draw-start',
      path: {
        ...path,
        points: [path.points[0]],
        animationState: undefined,
      },
    });
  };

  const handleDrawPoint = (pathId: string, point: Point) => {
    setPaths((prev) => {
      const idx = prev.findIndex((p) => p.id === pathId);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], points: [...next[idx].points, point] };
      return next;
    });
    wsMgrRef.current?.send({ type: 'draw-point', pathId, point });
  };

  const handleDrawEnd = (pathId: string) => {
    setPaths((prev) => prev.map((p) => (p.id === pathId ? { ...p, isDrawing: false } : p)));
    wsMgrRef.current?.send({ type: 'draw-end', pathId });
  };

  // ===== Notes =====
  const handleAddNote = () => {
    if (!canvasRef.current) canvasRef.current?.requestRender();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const note: NoteT = {
      id: (crypto.randomUUID && crypto.randomUUID()) || `n-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'note',
      userId,
      x: clamp(w / 2 - 110, 40, w - 260),
      y: clamp(h / 2 - 90, 80, h - 240),
      width: 220,
      height: 180,
      text: '',
      createdAt: Date.now(),
      animationState: {
        kind: 'entering',
        progress: 0,
        startTime: performance.now(),
      },
    };
    setNotes((prev) => [...prev, note]);
    pushHistory(note);
    wsMgrRef.current?.send({ type: 'note-add', note });
  };

  const noteUpdateDebounceRef = useRef<Map<string, number>>(new Map());
  const handleNoteUpdate = (noteId: string, partial: Partial<NoteT>) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...partial } : n)));

    // Debounce WS updates for text
    const existing = noteUpdateDebounceRef.current.get(noteId);
    if (existing !== undefined) window.clearTimeout(existing);
    const id = window.setTimeout(() => {
      const currentNote = notes.find((n) => n.id === noteId);
      if (currentNote) {
        wsMgrRef.current?.send({
          type: 'note-update',
          note: { ...currentNote, ...partial },
        });
      }
      noteUpdateDebounceRef.current.delete(noteId);
    }, 80);
    noteUpdateDebounceRef.current.set(noteId, id);
  };

  // ===== Undo / Redo =====
  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  const handleUndo = () => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const action = stack.pop()!;
    redoStackRef.current.push(action);
    setHistoryTick((t) => t + 1);

    if (action.type === 'path') {
      setPaths((prev) =>
        prev.map((p) =>
          p.id === action.id
            ? {
                ...p,
                animationState: {
                  kind: 'erasing',
                  progress: 0,
                  startTime: performance.now(),
                },
              }
            : p,
        ),
      );
      setTimeout(() => {
        setPaths((prev) => prev.filter((p) => p.id !== action.id));
      }, 400);
    } else {
      setTimeout(() => {
        setNotes((prev) => prev.filter((n) => n.id !== action.id));
      }, 80);
    }

    wsMgrRef.current?.send({ type: 'undo', actionId: action.id, actionType: action.type });
  };

  const handleRedo = () => {
    const redo = redoStackRef.current;
    if (redo.length === 0) return;
    const action = redo.pop()!;
    undoStackRef.current.push(action);
    setHistoryTick((t) => t + 1);

    if (action.type === 'path') {
      setPaths((prev) => [
        ...prev.filter((p) => p.id !== action.id),
        {
          ...action,
          animationState: {
            kind: 'redrawing',
            progress: 0,
            startTime: performance.now(),
          },
        },
      ]);
    } else {
      setNotes((prev) => [
        ...prev.filter((n) => n.id !== action.id),
        {
          ...action,
          animationState: {
            kind: 'entering',
            progress: 0,
            startTime: performance.now(),
          },
        },
      ]);
    }

    wsMgrRef.current?.send({
      type: 'redo',
      actionId: action.id,
      actionType: action.type,
      action,
    });
  };

  const handleClear = () => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setHistoryTick((t) => t + 1);
    triggerClearAnimation();
    wsMgrRef.current?.send({ type: 'clear' });
  };

  const connectionDotColor = useMemo(() => {
    switch (status) {
      case 'connected':
        return '#22c55e';
      case 'connecting':
      case 'reconnecting':
        return '#f59e0b';
      default:
        return '#ef4444';
    }
  }, [status]);

  return (
    <>
      <style>{appCSS}</style>
      <div className="app-root">
        <div className="nickname-badge">
          <span className="avatar-dot" style={{ background: connectionDotColor }} />
          <span className="nickname-text">
            {displayNickname}
            <span className="cursor-blink">|</span>
          </span>
        </div>

        <Canvas
          ref={canvasRef}
          paths={paths}
          notes={notes}
          toolbar={toolbar}
          currentUserId={userId}
          clearProgress={clearProgress}
          onDrawStart={handleDrawStart}
          onDrawPoint={handleDrawPoint}
          onDrawEnd={handleDrawEnd}
          onNoteUpdate={handleNoteUpdate}
        />

        <Toolbar
          state={toolbar}
          onChange={(next) => setToolbar((prev) => ({ ...prev, ...next }))}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onAddNote={handleAddNote}
          status={status}
          userCount={userCount}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>
    </>
  );
};

const appCSS = `
.app-root {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  isolation: isolate;
}

.nickname-badge {
  position: fixed;
  top: 18px;
  left: 20px;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 10px;
  border-radius: 999px;
  background: rgba(22, 33, 62, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(233, 69, 96, 0.15);
  box-shadow: 0 6px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03) inset;
  animation: fadeSlideDown 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  max-width: 70vw;
}
.avatar-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
  flex-shrink: 0;
}
.nickname-text {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.3px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cursor-blink {
  display: inline-block;
  margin-left: 1px;
  animation: blink 1s steps(1) infinite;
  color: var(--accent);
  font-weight: 300;
  opacity: 0.75;
}
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.board-canvas {
  touch-action: none;
  display: block;
}

@media (max-width: 767px) {
  .nickname-badge {
    top: 10px;
    left: 10px;
    padding: 6px 12px 6px 8px;
    gap: 8px;
  }
  .nickname-text { font-size: 13px; }
}
`;

export default App;
