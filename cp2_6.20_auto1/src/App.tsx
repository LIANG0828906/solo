import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CanvasBoard from './canvas/CanvasBoard';
import NotePanel from './note/NotePanel';
import { ToolType, DrawingPath, NoteData, NoteColor, HistoryState, WebSocketMessage } from './types';

const COLORS = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
const NOTE_COLORS: NoteColor[] = ['red', 'yellow', 'blue', 'green'];

const MAX_HISTORY = 10;
const ROOM_ID = 'default-room';
const WS_URL = 'ws://localhost:8000/ws';

const App: React.FC = () => {
  const [drawings, setDrawings] = useState<DrawingPath[]>([]);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [userCount, setUserCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [, forceUpdate] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const historyRef = useRef<HistoryState[]>([]);
  const historyIndexRef = useRef(-1);
  const isRemoteUpdateRef = useRef(false);
  const pendingNoteUpdateRef = useRef<{ [key: string]: NoteData }>({});
  const noteUpdateTimeoutRef = useRef<{ [key: string]: number }>({});
  const isDraggingNoteRef = useRef(false);
  const isEditingNoteRef = useRef(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const pushHistoryState = useCallback((state: HistoryState) => {
    if (isRemoteUpdateRef.current) return;

    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }

    historyRef.current.push({
      drawings: [...state.drawings],
      notes: [...state.notes],
    });

    if (historyRef.current.length > MAX_HISTORY + 1) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }

    forceUpdate((n) => n + 1);
  }, []);

  const saveCurrentStateToHistory = useCallback(() => {
    pushHistoryState({ drawings, notes });
  }, [drawings, notes, pushHistoryState]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;

    historyIndexRef.current--;
    const state = historyRef.current[historyIndexRef.current];
    isRemoteUpdateRef.current = true;
    setDrawings([...state.drawings]);
    setNotes([...state.notes]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'undo_redo_state',
        data: {
          drawings: state.drawings,
          notes: state.notes,
        },
      }));
    }

    forceUpdate((n) => n + 1);

    setTimeout(() => {
      isRemoteUpdateRef.current = false;
    }, 0);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    historyIndexRef.current++;
    const state = historyRef.current[historyIndexRef.current];
    isRemoteUpdateRef.current = true;
    setDrawings([...state.drawings]);
    setNotes([...state.notes]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'undo_redo_state',
        data: {
          drawings: state.drawings,
          notes: state.notes,
        },
      }));
    }

    forceUpdate((n) => n + 1);

    setTimeout(() => {
      isRemoteUpdateRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    const initialState: HistoryState = {
      drawings: [],
      notes: [],
    };
    historyRef.current.push(initialState);
    historyIndexRef.current = 0;
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/${ROOM_ID}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      isRemoteUpdateRef.current = true;

      switch (message.type) {
        case 'init':
          if (message.drawings) setDrawings(message.drawings);
          if (message.notes) setNotes(message.notes);
          if (message.userCount !== undefined) setUserCount(message.userCount);
          break;
        case 'draw':
          if (message.data) {
            setDrawings((prev) => [...prev, message.data]);
          }
          break;
        case 'add_note':
          if (message.data) {
            setNotes((prev) => [...prev, message.data]);
          }
          break;
        case 'update_note':
          if (message.data) {
            setNotes((prev) =>
              prev.map((n) => (n.id === message.data.id ? message.data : n))
            );
          }
          break;
        case 'delete_note':
          if (message.data) {
            setNotes((prev) => prev.filter((n) => n.id !== message.data.id));
          }
          break;
        case 'clear':
          setDrawings([]);
          setNotes([]);
          break;
        case 'undo_redo_state':
          if (message.data) {
            setDrawings(message.data.drawings || []);
            setNotes(message.data.notes || []);
          }
          break;
        case 'user_count':
          if (message.userCount !== undefined) setUserCount(message.userCount);
          break;
      }

      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 0);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDrawEnd = useCallback(
    (path: DrawingPath) => {
      saveCurrentStateToHistory();
      const newDrawings = [...drawings, path];
      setDrawings(newDrawings);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'draw',
          data: path,
        }));
      }
    },
    [drawings, saveCurrentStateToHistory]
  );

  const handleAddNote = useCallback(() => {
    saveCurrentStateToHistory();

    const container = canvasContainerRef.current;
    const rect = container?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 - 90 : 200;
    const centerY = rect ? rect.height / 2 - 60 : 150;

    const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const newNote: NoteData = {
      id: uuidv4(),
      x: centerX + Math.random() * 40 - 20,
      y: centerY + Math.random() * 40 - 20,
      content: '',
      color: randomColor,
    };

    const newNotes = [...notes, newNote];
    setNotes(newNotes);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'add_note',
        data: newNote,
      }));
    }
  }, [notes, saveCurrentStateToHistory]);

  const handleNoteDragStart = useCallback(() => {
    if (isDraggingNoteRef.current) return;
    isDraggingNoteRef.current = true;
    saveCurrentStateToHistory();
  }, [saveCurrentStateToHistory]);

  const handleNoteDragEnd = useCallback(() => {
    isDraggingNoteRef.current = false;
  }, []);

  const handleNoteEditStart = useCallback(() => {
    if (isEditingNoteRef.current) return;
    isEditingNoteRef.current = true;
    saveCurrentStateToHistory();
  }, [saveCurrentStateToHistory]);

  const handleNoteEditEnd = useCallback(() => {
    isEditingNoteRef.current = false;
  }, []);

  const handleNoteColorChange = useCallback(() => {
    saveCurrentStateToHistory();
  }, [saveCurrentStateToHistory]);

  const handleUpdateNote = useCallback(
    (note: NoteData) => {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        if (noteUpdateTimeoutRef.current[note.id]) {
          window.clearTimeout(noteUpdateTimeoutRef.current[note.id]);
        }

        pendingNoteUpdateRef.current[note.id] = note;

        noteUpdateTimeoutRef.current[note.id] = window.setTimeout(() => {
          if (pendingNoteUpdateRef.current[note.id] && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'update_note',
              data: pendingNoteUpdateRef.current[note.id],
            }));
          }
          delete pendingNoteUpdateRef.current[note.id];
          delete noteUpdateTimeoutRef.current[note.id];
        }, 50);
      }
    },
    []
  );

  const handleDeleteNote = useCallback(
    (id: string) => {
      saveCurrentStateToHistory();
      setNotes((prev) => prev.filter((n) => n.id !== id));

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'delete_note',
          data: { id },
        }));
      }
    },
    [saveCurrentStateToHistory]
  );

  const handleClear = useCallback(() => {
    setShowClearConfirm(false);
    saveCurrentStateToHistory();
    setDrawings([]);
    setNotes([]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'clear',
      }));
    }
  }, [saveCurrentStateToHistory]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const toolButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: active ? '#4a9eff' : '#2d2d44',
    color: 'white',
    cursor: 'pointer',
    fontSize: 14,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#1a1a2e' }}>
      <div
        style={{
          padding: 12,
          backgroundColor: '#16162a',
          borderBottom: '1px solid #2d2d44',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            gap: 12,
            alignItems: 'center',
            minWidth: 'max-content',
          }}
        >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#aaa', marginRight: 8 }}>工具:</span>
          <button style={toolButtonStyle(tool === 'pen')} onClick={() => setTool('pen')}>
            ✏️ 画笔
          </button>
          <button style={toolButtonStyle(tool === 'rectangle')} onClick={() => setTool('rectangle')}>
            ⬜ 矩形
          </button>
          <button style={toolButtonStyle(tool === 'circle')} onClick={() => setTool('circle')}>
            ⭕ 圆形
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#aaa', marginRight: 8 }}>颜色:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: color === c ? '2px solid white' : '2px solid transparent',
                  backgroundColor: c,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#aaa', marginRight: 8 }}>粗细: {lineWidth}px</span>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{ width: 80 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            style={{
              ...toolButtonStyle(false),
              opacity: canUndo ? 1 : 0.4,
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
          >
            ↩️ 撤销
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            style={{
              ...toolButtonStyle(false),
              opacity: canRedo ? 1 : 0.4,
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }}
          >
            ↪️ 重做
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleAddNote}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#6bff8e',
              color: '#1a1a2e',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            📝 添加便签
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{
              ...toolButtonStyle(false),
              backgroundColor: '#ff6b6b',
              color: 'white',
            }}
          >
            🗑️ 清空
          </button>
        </div>

        <div style={{ marginLeft: 0, marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#6bff8e' : '#ff6b6b',
            }}
          />
          <span style={{ fontSize: 14, color: '#aaa' }}>
            在线: {userCount} 人
          </span>
        </div>
        </div>
      </div>

      <div ref={canvasContainerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <CanvasBoard
          drawings={drawings}
          tool={tool}
          color={color}
          lineWidth={lineWidth}
          onDrawEnd={handleDrawEnd}
        />
        <NotePanel
          notes={notes}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onNoteDragStart={handleNoteDragStart}
          onNoteDragEnd={handleNoteDragEnd}
          onNoteEditStart={handleNoteEditStart}
          onNoteEditEnd={handleNoteEditEnd}
          onNoteColorChange={handleNoteColorChange}
        />
      </div>

      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            style={{
              backgroundColor: '#16162a',
              padding: 24,
              borderRadius: 12,
              minWidth: 300,
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16, color: 'white' }}>确认清空画布？</h3>
            <p style={{ marginBottom: 20, color: '#aaa', fontSize: 14 }}>
              所有绘制内容和便签将被清除，此操作可撤销
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={toolButtonStyle(false)}
              >
                取消
              </button>
              <button
                onClick={handleClear}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
