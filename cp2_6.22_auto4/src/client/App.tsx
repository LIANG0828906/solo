import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import { ToolSettings, DrawPath, User } from '../shared/types';

type AppScreen = 'login' | 'whiteboard';

function App() {
  const [screen, setScreen] = useState<AppScreen>('login');
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    type: 'pen',
    color: '#212121',
    size: 5,
  });
  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initSocket = useCallback(() => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    return socket;
  }, []);

  const drawRemotePath = (ctx: CanvasRenderingContext2D, path: DrawPath) => {
    if (path.points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = path.isEraser ? '#ffffff' : path.color;
    ctx.lineWidth = path.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (path.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  };

  const handleJoinRoom = () => {
    if (!userName.trim() || !roomId.trim()) return;

    const socket = initSocket();

    socket.emit('room:join', { roomId, userName }, (roomUsers: User[]) => {
      setUsers(roomUsers);
      setScreen('whiteboard');
    });

    socket.on('draw:path', (path: DrawPath) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawRemotePath(ctx, path);
    });

    socket.on('canvas:clear', () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('canvas:snapshot', (dataUrl: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = dataUrl;
    });

    socket.on('room:users', (roomUsers: User[]) => {
      setUsers(roomUsers);
    });

    socket.on('canvas:requestSnapshot', () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      socket.emit('canvas:saveSnapshot', dataUrl);
    });

    socket.on('snapshot:saved', () => {
      showSaveToast('快照自动保存成功');
    });
  };

  const handleDrawPath = (path: DrawPath) => {
    if (socketRef.current) {
      socketRef.current.emit('draw:path', path);
    }
  };

  const handleHistoryChange = (canUndoVal: boolean, canRedoVal: boolean) => {
    setCanUndo(canUndoVal);
    setCanRedo(canRedoVal);
  };

  const handleClearCanvas = () => {
    if (socketRef.current) {
      socketRef.current.emit('canvas:clear');
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current as any;
    if (canvas?.undo) {
      canvas.undo();
    }
  };

  const handleRedo = () => {
    const canvas = canvasRef.current as any;
    if (canvas?.redo) {
      canvas.redo();
    }
  };

  const handleLocalClear = () => {
    const canvas = canvasRef.current as any;
    if (canvas?.clearCanvas) {
      canvas.clearCanvas();
    }
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('room:leave');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setScreen('login');
    setUsers([]);
    setUserName('');
  };

  const showSaveToast = (message: string) => {
    setSaveToast(message);
    setTimeout(() => setSaveToast(null), 2000);
  };

  const handleManualSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !socketRef.current) return;
    const dataUrl = canvas.toDataURL('image/png');
    socketRef.current.emit('canvas:saveSnapshot', dataUrl);
    showSaveToast('快照保存成功');
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  if (screen === 'login') {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">虚拟白板</h1>
          <p className="login-subtitle">在线协作教育平台</p>
          <div className="login-form">
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="请输入您的名字"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>房间号</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="请输入房间号"
                className="form-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJoinRoom();
                }}
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={!userName.trim() || !roomId.trim()}
              className="join-btn"
            >
              加入房间
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header-bar">
        <div className="room-badge">
          <span className="room-id">房间: {roomId}</span>
          <span className="online-count">
            <span className="online-dot"></span>
            {users.length} 人在线
          </span>
        </div>
        <div className="user-section">
          <button onClick={handleManualSave} className="save-btn">
            💾 保存快照
          </button>
          <span className="user-name">{userName}</span>
          <button onClick={handleLeaveRoom} className="leave-btn">
            退出
          </button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          ref={canvasRef}
          toolSettings={toolSettings}
          onDrawPath={handleDrawPath}
          onClear={handleClearCanvas}
          onHistoryChange={handleHistoryChange}
        />
      </div>

      <div className="desktop-toolbar">
        <Toolbar
          toolSettings={toolSettings}
          onToolChange={setToolSettings}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleLocalClear}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>

      <button
        className={`mobile-toolbar-toggle ${isMobileToolbarOpen ? 'hidden' : ''}`}
        onClick={() => setIsMobileToolbarOpen(!isMobileToolbarOpen)}
      >
        🎨 工具
      </button>

      {isMobileToolbarOpen && (
        <div className="mobile-toolbar-drawer">
          <div className="drawer-handle" onClick={() => setIsMobileToolbarOpen(false)}>
            <div className="handle-bar"></div>
          </div>
          <Toolbar
            toolSettings={toolSettings}
            onToolChange={setToolSettings}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleLocalClear}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      )}

      {saveToast && <div className="save-toast">{saveToast}</div>}

      <div className="user-list-panel">
        <h4>在线用户</h4>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <span className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="user-list-name">{user.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
