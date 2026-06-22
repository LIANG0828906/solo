import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import RoomSelect, { getRandomColor, MAGIC_COLORS } from './components/RoomSelect';
import type { Player, Room, Notification, Page, Stroke, Point } from './types';

interface SocketContextValue {
  socket: any;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false
});

export function useSocket() {
  return useContext(SocketContext);
}

const MOCK_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: '创作天地',
    players: [
      { id: 'p1', nickname: '小明', avatarColor: MAGIC_COLORS[0] },
      { id: 'p2', nickname: '小红', avatarColor: MAGIC_COLORS[1] }
    ],
    maxPlayers: 8,
    hasPassword: false
  },
  {
    id: 'room-2',
    name: '艺术工作室',
    players: [
      { id: 'p3', nickname: '画家A', avatarColor: MAGIC_COLORS[2] },
      { id: 'p4', nickname: '画家B', avatarColor: MAGIC_COLORS[3] },
      { id: 'p5', nickname: '画家C', avatarColor: MAGIC_COLORS[4] }
    ],
    maxPlayers: 6,
    hasPassword: true
  },
  {
    id: 'room-3',
    name: '快乐涂鸦',
    players: [
      { id: 'p6', nickname: '涂鸦王', avatarColor: MAGIC_COLORS[5] }
    ],
    maxPlayers: 10,
    hasPassword: false
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('room-select');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [selectedColor, setSelectedColor] = useState(MAGIC_COLORS[0]);
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  const addNotification = useCallback((type: Notification['type'], message: string, duration: number = 3000) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = { id, type, message, duration };
    setNotifications(prev => [...prev, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSocketConnected(true);
      addNotification('success', '已连接到服务器');
    }, 500);
    return () => clearTimeout(timer);
  }, [addNotification]);

  const createRoom = useCallback((roomName: string, nickname: string) => {
    const playerId = `player-${Date.now()}`;
    const avatarColor = getRandomColor();
    const newPlayer: Player = {
      id: playerId,
      nickname,
      avatarColor
    };

    const roomId = `room-${Date.now()}`;
    const newRoom: Room = {
      id: roomId,
      name: roomName,
      players: [newPlayer],
      maxPlayers: 8,
      hasPassword: false
    };

    setRooms(prev => [newRoom, ...prev]);
    setCurrentPlayer(newPlayer);
    setCurrentRoom(newRoom);
    setStrokes([]);
    setCurrentPage('drawing');
    addNotification('success', `房间「${roomName}」创建成功！`);
  }, [addNotification]);

  const joinRoom = useCallback((roomId: string, nickname: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      addNotification('error', '房间不存在');
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      addNotification('error', '房间已满');
      return;
    }

    const playerId = `player-${Date.now()}`;
    const avatarColor = getRandomColor();
    const newPlayer: Player = {
      id: playerId,
      nickname,
      avatarColor
    };

    setRooms(prev => prev.map(r =>
      r.id === roomId
        ? { ...r, players: [...r.players, newPlayer] }
        : r
    ));
    setCurrentPlayer(newPlayer);
    setCurrentRoom({ ...room, players: [...room.players, newPlayer] });
    setStrokes([]);
    setCurrentPage('drawing');
    addNotification('success', `已加入房间「${room.name}」`);
  }, [rooms, addNotification]);

  const leaveRoom = useCallback(() => {
    if (currentRoom && currentPlayer) {
      setRooms(prev => prev.map(r =>
        r.id === currentRoom.id
          ? { ...r, players: r.players.filter(p => p.id !== currentPlayer.id) }
          : r
      ).filter(r => r.players.length > 0));
    }
    setCurrentRoom(null);
    setCurrentPage('room-select');
    addNotification('info', '已离开房间');
  }, [currentRoom, currentPlayer, addNotification]);

  const socketContextValue = useMemo<SocketContextValue>(() => ({
    socket: null,
    connected: socketConnected
  }), [socketConnected]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentPlayer) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    const newStroke: Stroke = {
      id: `stroke-${Date.now()}`,
      points: [{ x, y }],
      color: selectedColor,
      width: brushSize,
      playerId: currentPlayer.id
    };
    setCurrentStroke(newStroke);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentStroke(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        points: [...prev.points, { x, y }]
      };
    });
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  useEffect(() => {
    const canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;
    allStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, currentStroke]);

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke(null);
    addNotification('info', '画布已清空');
  };

  const getInitial = (name: string): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <SocketContext.Provider value={socketContextValue}>
      <div className="app-container">
        {currentPage === 'room-select' && (
          <RoomSelect
            rooms={rooms}
            currentPlayer={currentPlayer}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onAddNotification={addNotification}
          />
        )}

        {currentPage === 'drawing' && currentRoom && (
          <div className="drawing-page">
            <div className="drawing-header">
              <h2 className="drawing-room-name">🎨 {currentRoom.name}</h2>
              <div className="drawing-players">
                {currentRoom.players.map(player => (
                  <div
                    key={player.id}
                    className="player-avatar"
                    style={{
                      backgroundColor: player.avatarColor,
                      marginRight: 0,
                      position: 'static'
                    }}
                    title={player.nickname}
                  >
                    {getInitial(player.nickname)}
                  </div>
                ))}
                <button className="btn btn-secondary" onClick={leaveRoom}>
                  离开房间
                </button>
              </div>
            </div>

            <div className="drawing-canvas-container">
              <canvas
                id="drawing-canvas"
                className="drawing-canvas"
                width={900}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>

            <div className="drawing-toolbar">
              <div className="color-picker">
                {MAGIC_COLORS.map(color => (
                  <div
                    key={color}
                    className={`color-option ${selectedColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              <div className="brush-size">
                <span className="brush-label">粗细</span>
                <input
                  type="range"
                  className="brush-slider"
                  min="1"
                  max="30"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
                <span className="brush-label">{brushSize}px</span>
              </div>
              <button className="btn btn-secondary" onClick={clearCanvas}>
                清空画布
              </button>
            </div>
          </div>
        )}

        <div className="notification-container">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification notification-${notification.type}`}
              onClick={() => removeNotification(notification.id)}
            >
              <span className="notification-icon">
                {notification.type === 'info' && 'ℹ️'}
                {notification.type === 'success' && '✅'}
                {notification.type === 'error' && '❌'}
                {notification.type === 'warning' && '⚠️'}
              </span>
              <span className="notification-content">{notification.message}</span>
            </div>
          ))}
        </div>
      </div>
    </SocketContext.Provider>
  );
}
