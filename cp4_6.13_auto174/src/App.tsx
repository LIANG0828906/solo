import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Toolbar } from './Toolbar';
import { Whiteboard } from './Whiteboard';
import { Tool, WhiteboardElement, Operation, User, StickyElement } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  joined: boolean;
  userName: string;
  roomId: string;
  currentUser: User | null;
  users: User[];
  error: string;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    joined: false,
    userName: '',
    roomId: '',
    currentUser: null,
    users: [],
    error: '',
  });
  const [inputName, setInputName] = useState('');
  const [inputRoom, setInputRoom] = useState('');
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const lastSeqRef = useRef<number>(0);

  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('user:joined', (user: User) => {
      setState((prev) => ({
        ...prev,
        users: [...prev.users, user],
      }));
    });

    socket.on('user:left', (user: User) => {
      setState((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== user.id),
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const validateRoomId = (id: string): string | null => {
    if (!/^\d{6}$/.test(id)) {
      return '房间号必须是6位数字';
    }
    return null;
  };

  const handleCreate = () => {
    const err = validateRoomId(inputRoom);
    if (err) {
      setState((s) => ({ ...s, error: err }));
      return;
    }
    if (!inputName.trim()) {
      setState((s) => ({ ...s, error: '昵称不能为空' }));
      return;
    }
    setState((s) => ({ ...s, error: '' }));

    socketRef.current?.emit(
      'room:create',
      { roomId: inputRoom, userName: inputName },
      (res: any) => {
        if (!res.success) {
          setState((s) => ({ ...s, error: res.error }));
          return;
        }
        setState({
          joined: true,
          userName: inputName,
          roomId: inputRoom,
          currentUser: res.user,
          users: res.users,
          error: '',
        });
      }
    );
  };

  const handleJoin = () => {
    const err = validateRoomId(inputRoom);
    if (err) {
      setState((s) => ({ ...s, error: err }));
      return;
    }
    if (!inputName.trim()) {
      setState((s) => ({ ...s, error: '昵称不能为空' }));
      return;
    }
    setState((s) => ({ ...s, error: '' }));

    socketRef.current?.emit(
      'room:join',
      { roomId: inputRoom, userName: inputName },
      (res: any) => {
        if (!res.success) {
          setState((s) => ({ ...s, error: res.error }));
          return;
        }
        setState({
          joined: true,
          userName: inputName,
          roomId: inputRoom,
          currentUser: res.user,
          users: res.users,
          error: '',
        });
      }
    );
  };

  const renderLobby = () => (
    <div className="lobby">
      <div className="lobby-card glass-panel">
        <div className="lobby-title">TeamBoard</div>
        <div className="lobby-subtitle">实时团队协作白板</div>

        <div className="form-group">
          <label className="form-label">昵称</label>
          <input
            className="form-input"
            placeholder="请输入昵称"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label className="form-label">房间号（6位数字）</label>
          <input
            className="form-input"
            placeholder="请输入6位数字房间号"
            value={inputRoom}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
              setInputRoom(v);
            }}
            maxLength={6}
          />
        </div>

        <div className="form-error">{state.error}</div>

        <div className="button-row">
          <button className="btn btn-secondary" onClick={handleCreate}>
            创建房间
          </button>
          <button className="btn btn-primary" onClick={handleJoin}>
            加入房间
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className={`sidebar glass-panel ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-title">在线成员</div>
      <div className="room-info">{state.roomId}</div>
      <div className="user-list">
        {state.users.map((user) => (
          <div key={user.id} className="user-card">
            <div
              className="user-avatar"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-name">{user.name}</div>
            <div className="tooltip">{user.name}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!state.joined) {
    return <div className="app-container">{renderLobby()}</div>;
  }

  return (
    <div className="app-container">
      <Toolbar
        currentTool={currentTool}
        color={color}
        strokeWidth={strokeWidth}
        onToolChange={setCurrentTool}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onAddSticky={() => {
          setCurrentTool('sticky');
        }}
        onClearCanvas={() => {
          socketRef.current?.emit('canvas:clear');
        }}
      />

      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        👥
      </button>

      {renderUsers()}

      <Whiteboard
        socket={socketRef.current!}
        currentTool={currentTool}
        color={color}
        strokeWidth={strokeWidth}
        userId={state.currentUser!.id}
        onToolConsumed={(tool) => {
          if (tool === 'sticky') setCurrentTool('pen');
        }}
      />
    </div>
  );
};

export default App;
