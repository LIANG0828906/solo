import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AppState,
  AppAction,
  AppContextType,
  AppProviderProps,
  Shape,
  Connection,
  CanvasTransform
} from './types';
import Whiteboard from './Whiteboard';
import Toolbar from './Toolbar';
import InfoBar from './InfoBar';
import ShapeEditor from './ShapeEditor';

const AppContext = createContext<AppContextType | undefined>(undefined);

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const PRESET_COLORS = [
  '#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF',
  '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB', '#F39C12',
  '#95A5A6', '#2C3E50'
];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const initialState: AppState = {
  shapes: [],
  connections: [],
  selectedTool: 'select',
  selectedShapeId: null,
  selectedConnectionId: null,
  transform: { scale: 0.7, offsetX: 0, offsetY: 0 },
  editingShapeId: null,
  roomCode: generateRoomCode(),
  onlineCount: 1,
  isMobile: false,
  showMobileMenu: false,
  pendingArrowSource: null,
  contextMenuConnection: null,
  copiedTip: false
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, selectedTool: action.payload, pendingArrowSource: action.payload === 'arrow' ? null : state.pendingArrowSource };
    case 'ADD_SHAPE':
      return { ...state, shapes: [...state.shapes, action.payload] };
    case 'UPDATE_SHAPE':
      return {
        ...state,
        shapes: state.shapes.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        )
      };
    case 'DELETE_SHAPE':
      return {
        ...state,
        shapes: state.shapes.filter(s => s.id !== action.payload),
        connections: state.connections.filter(c => c.sourceId !== action.payload && c.targetId !== action.payload),
        selectedShapeId: state.selectedShapeId === action.payload ? null : state.selectedShapeId,
        editingShapeId: state.editingShapeId === action.payload ? null : state.editingShapeId
      };
    case 'SELECT_SHAPE':
      return { ...state, selectedShapeId: action.payload, selectedConnectionId: null, contextMenuConnection: null };
    case 'SELECT_CONNECTION':
      return { ...state, selectedConnectionId: action.payload, selectedShapeId: null };
    case 'ADD_CONNECTION':
      return { ...state, connections: [...state.connections, action.payload] };
    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter(c => c.id !== action.payload),
        contextMenuConnection: null,
        selectedConnectionId: state.selectedConnectionId === action.payload ? null : state.selectedConnectionId
      };
    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        )
      };
    case 'SET_TRANSFORM':
      return { ...state, transform: action.payload };
    case 'START_EDITING':
      return { ...state, editingShapeId: action.payload };
    case 'STOP_EDITING':
      return { ...state, editingShapeId: null };
    case 'SET_PENDING_ARROW_SOURCE':
      return { ...state, pendingArrowSource: action.payload };
    case 'SHOW_CONTEXT_MENU':
      return { ...state, contextMenuConnection: action.payload };
    case 'SET_MOBILE_MENU':
      return { ...state, showMobileMenu: action.payload };
    case 'SET_COPIED_TIP':
      return { ...state, copiedTip: action.payload };
    case 'SYNC_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const listenersRef = useRef<Set<(action: AppAction) => void>>(new Set());

  const wsBroadcast = useCallback((action: AppAction) => {
    setTimeout(() => {
      listenersRef.current.forEach(listener => {
        try {
          listener(action);
        } catch (e) {
          console.error('WS listener error:', e);
        }
      });
    }, 50);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('wb_room_' + state.roomCode);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.shapes && parsed.connections) {
          dispatch({ type: 'SYNC_STATE', payload: { shapes: parsed.shapes, connections: parsed.connections } });
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const data = { shapes: state.shapes, connections: state.connections };
    sessionStorage.setItem('wb_room_' + state.roomCode, JSON.stringify(data));
  }, [state.shapes, state.connections, state.roomCode]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'wb_room_' + state.roomCode && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          dispatch({ type: 'SYNC_STATE', payload: { shapes: parsed.shapes, connections: parsed.connections } });
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [state.roomCode]);

  return (
    <AppContext.Provider value={{ state, dispatch, wsBroadcast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { A4_WIDTH, A4_HEIGHT, PRESET_COLORS, hexToRgba };

function AppContent() {
  const { state } = useApp();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    import('./types').then(() => {});
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5', position: 'relative' }}>
      {!isMobile && <InfoBar />}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {!isMobile && <Toolbar />}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Whiteboard isMobile={isMobile} />
          {state.editingShapeId && <ShapeEditorWrapper />}
          {state.contextMenuConnection && <ContextMenuWrapper />}
          {isMobile && <MobileMenu />}
          {state.copiedTip && <CopiedTip />}
        </div>
      </div>
    </div>
  );
}

function ShapeEditorWrapper() {
  const { state } = useApp();
  const shape = state.shapes.find(s => s.id === state.editingShapeId);
  if (!shape) return null;

  const canvasRect = document.getElementById('whiteboard-canvas')?.getBoundingClientRect();
  if (!canvasRect) return null;

  const containerRect = canvasRect;
  const screenX = shape.x + shape.width + 10;
  const screenY = shape.y;
  const viewportX = screenX * state.transform.scale + state.transform.offsetX;
  const viewportY = screenY * state.transform.scale + state.transform.offsetY;

  let style: React.CSSProperties = {
    position: 'absolute',
    top: Math.max(10, viewportY + 48),
    left: Math.min(viewportX + 60, window.innerWidth - 300),
    zIndex: 1000
  };

  if (window.innerWidth < 768) {
    style = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000
    };
  }

  return (
    <div style={style}>
      <ShapeEditor shape={shape} />
    </div>
  );
}

function ContextMenuWrapper() {
  const { state, dispatch, wsBroadcast } = useApp();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        dispatch({ type: 'SHOW_CONTEXT_MENU', payload: null });
      }
    };
    setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dispatch]);

  const handleDelete = () => {
    const connId = state.contextMenuConnection!.id;
    dispatch({ type: 'UPDATE_CONNECTION', payload: { id: connId, updates: { opacity: 0 } } });
    wsBroadcast({ type: 'UPDATE_CONNECTION', payload: { id: connId, updates: { opacity: 0 } } });
    setTimeout(() => {
      dispatch({ type: 'DELETE_CONNECTION', payload: connId });
      wsBroadcast({ type: 'DELETE_CONNECTION', payload: connId });
    }, 200);
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        zIndex: 2000,
        backgroundColor: 'white',
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '8px 0',
        minWidth: 120,
        border: '1px solid #eee'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleDelete}
        style={{
          display: 'block',
          width: '100%',
          padding: '10px 16px',
          textAlign: 'left',
          backgroundColor: 'transparent',
          color: '#e74c3c',
          fontSize: 14,
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        🗑 删除连线
      </button>
    </div>
  );
}

function MobileMenu() {
  const { state, dispatch } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);

  const tools = [
    { type: 'select' as const, label: '选择', icon: '↖' },
    { type: 'rectangle' as const, label: '矩形', icon: '▭' },
    { type: 'circle' as const, label: '圆形', icon: '○' },
    { type: 'arrow' as const, label: '箭头', icon: '→' },
    { type: 'text' as const, label: '文本', icon: 'T' }
  ];

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: '#333',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          zIndex: 1500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s'
        }}
        onClick={() => dispatch({ type: 'SET_MOBILE_MENU', payload: !state.showMobileMenu })}
      >
        {state.showMobileMenu ? '✕' : '☰'}
      </div>
      {state.showMobileMenu && (
        <div
          ref={containerRef}
          style={{
            position: 'fixed',
            right: 20,
            bottom: 80,
            backgroundColor: 'rgba(51,51,51,0.95)',
            borderRadius: 12,
            padding: 8,
            zIndex: 1500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div
            style={{
              color: 'white',
              padding: '10px 14px',
              fontSize: 12,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 4
            }}
          >
            房间: {state.roomCode} | 在线: {state.onlineCount}
          </div>
          {tools.map(t => (
            <button
              key={t.type}
              onClick={() => {
                dispatch({ type: 'SET_TOOL', payload: t.type });
                dispatch({ type: 'SET_MOBILE_MENU', payload: false });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 6,
                backgroundColor: state.selectedTool === t.type ? '#555' : 'transparent',
                color: 'white',
                fontSize: 14,
                transition: 'background-color 0.2s'
              }}
            >
              <span style={{ width: 20, textAlign: 'center' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function CopiedTip() {
  const { dispatch } = useApp();
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_COPIED_TIP', payload: false });
    }, 1500);
    return () => clearTimeout(timer);
  }, [dispatch]);
  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(51,51,51,0.9)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: 6,
        fontSize: 13,
        zIndex: 3000,
        animation: 'fadeInOut 1.5s ease forwards'
      }}
    >
      ✓ 已复制
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -10px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -10px); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export type { Shape, Connection, CanvasTransform };
