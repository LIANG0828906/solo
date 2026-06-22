import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  BoardState,
  ToolMode,
  OnlineUser,
  WSMessage,
} from './types';
import Whiteboard from './modules/whiteboard/Whiteboard';
import Toolbar from './modules/whiteboard/Toolbar';
import Playback from './modules/recording/Playback';
import { wsService } from './modules/websocket/WebSocketService';

const AVATAR_COLORS = [
  '#3B82F6', '#EF4444', '#22C55E', '#F97316', '#A855F7',
  '#EC4899', '#14B8A6', '#EAB308',
];

const emptyBoard: BoardState = { strokes: [], stickies: [], images: [] };

function Lobby() {
  const [name, setName] = useState('');
  const [sessionInput, setSessionInput] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim()) return;
    const res = await axios.post('/api/sessions', { userName: name.trim() });
    navigate(`/board/${res.data.sessionId}?user=${encodeURIComponent(res.data.userId)}`);
  };

  const handleJoin = async () => {
    if (!name.trim() || !sessionInput.trim()) return;
    const res = await axios.post(`/api/sessions/${sessionInput.trim()}/join`, { userName: name.trim() });
    navigate(`/board/${sessionInput.trim()}?user=${encodeURIComponent(res.data.userId)}`);
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <h1 className="lobby-title">虚拟白板</h1>
        <p className="lobby-subtitle">团队协作 · 实时绘图 · 录制回放</p>
        <input
          className="lobby-input"
          placeholder="输入你的名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />
        <button className="lobby-btn primary" onClick={handleCreate} disabled={!name.trim()}>
          创建新白板
        </button>
        <div className="lobby-divider"><span>或加入已有白板</span></div>
        <input
          className="lobby-input"
          placeholder="输入会话ID"
          value={sessionInput}
          onChange={(e) => setSessionInput(e.target.value)}
        />
        <button
          className="lobby-btn secondary"
          onClick={handleJoin}
          disabled={!name.trim() || !sessionInput.trim()}
        >
          加入白板
        </button>
      </div>
    </div>
  );
}

function Board() {
  const { sessionId = '' } = useParams();
  const userId = new URLSearchParams(window.location.search).get('user') || '';
  const [boardState, setBoardState] = useState<BoardState>(emptyBoard);
  const [tool, setTool] = useState<ToolMode>('pen');
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(3);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showPlayback, setShowPlayback] = useState(false);
  const [screenWarning, setScreenWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const whiteboardRef = useRef<ReturnType<typeof Whiteboard> | null>(null);

  useEffect(() => {
    const checkWidth = () => {
      setScreenWarning(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    if (!sessionId || !userId) return;

    axios.get(`/api/sessions/${sessionId}/state`).then((res) => {
      if (res.data.state) setBoardState(res.data.state);
    }).catch(() => {});

    wsService.connect(sessionId, userId);

    const unsub = wsService.onMessage((msg: WSMessage) => {
      if (msg.type === 'init' && msg.state) {
        setBoardState(msg.state);
      }
      if (msg.type === 'user_join' && msg.userId) {
        setOnlineUsers((prev) => {
          if (prev.find((u) => u.id === msg.userId)) return prev;
          return [
            ...prev,
            {
              id: msg.userId,
              name: (msg.params?.name as string) || msg.userId.slice(0, 4),
              color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length],
            },
          ];
        });
      }
      if (msg.type === 'user_leave' && msg.userId) {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== msg.userId));
      }
    });

    return () => {
      unsub();
      wsService.disconnect();
    };
  }, [sessionId, userId]);

  const handleToolChange = (newTool: ToolMode) => {
    setTool(newTool);
    if (newTool === 'sticky' && whiteboardRef.current) {
      whiteboardRef.current.addSticky();
    }
  };

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && whiteboardRef.current) {
      whiteboardRef.current.addImage(file);
    }
    e.target.value = '';
  };

  const wb = Whiteboard({
    sessionId,
    userId,
    boardState,
    onStateChange: setBoardState,
    tool,
    penColor,
    penWidth,
  });
  whiteboardRef.current = wb;

  if (screenWarning) {
    return (
      <div className="screen-warning">
        <div className="screen-warning-content">
          <h2>请使用横屏模式</h2>
          <p>虚拟白板需要更宽的屏幕空间，请旋转设备或使用更大的屏幕。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <header className="top-bar">
        <div className="session-info">
          <span className="session-name">白板: {sessionId.slice(0, 8)}</span>
        </div>
        <div className="online-users">
          {onlineUsers.map((user) => (
            <div
              key={user.id}
              className="user-avatar"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <button className="playback-toggle" onClick={() => setShowPlayback(!showPlayback)}>
          {showPlayback ? '返回白板' : '回放'}
        </button>
      </header>

      {showPlayback ? (
        <Playback onClose={() => setShowPlayback(false)} />
      ) : (
        <div className="board-area">
          <Toolbar
            tool={tool}
            onToolChange={handleToolChange}
            penColor={penColor}
            onPenColorChange={setPenColor}
            penWidth={penWidth}
            onPenWidthChange={setPenWidth}
            onUndo={wb.undo}
            onRedo={wb.redo}
            canUndo={wb.canUndo}
            canRedo={wb.canRedo}
            onUploadImage={handleUploadImage}
          />
          {wb.render}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelected}
            hidden
          />
        </div>
      )}
    </div>
  );
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/board/:sessionId" element={<Board />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
