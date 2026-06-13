import React, { useState, useEffect, useRef, useCallback } from 'react';
import Canvas, { StrokeData, RemoteStroke } from './components/Canvas';
import { v4 as uuidv4 } from 'uuid';

type MessageType =
  | { type: 'create_room'; userId: string }
  | { type: 'join_room'; roomCode: string; userId: string }
  | { type: 'stroke'; roomCode: string; userId: string; data: StrokeData }
  | { type: 'stroke_end'; roomCode: string; userId: string }
  | { type: 'clear_canvas'; roomCode: string; userId: string }
  | { type: 'kick_user'; roomCode: string; userId: string; targetUserId: string }
  | { type: 'room_created'; roomCode: string; isHost: boolean }
  | { type: 'room_joined'; roomCode: string; users: string[]; isHost: boolean }
  | { type: 'user_joined'; userId: string }
  | { type: 'user_left'; userId: string }
  | { type: 'remote_stroke'; userId: string; data: StrokeData }
  | { type: 'remote_stroke_end'; userId: string }
  | { type: 'canvas_cleared' }
  | { type: 'error'; message: string }
  | { type: 'kicked' };

interface User {
  id: string;
  name: string;
}

const COLORS = [
  '#ff4757', '#ff6b35', '#ffa502', '#2ed573',
  '#1e90ff', '#5352ed', '#a55eea', '#ff6b9d',
];

const App: React.FC = () => {
  const [userId] = useState(() => uuidv4());
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [brushColor, setBrushColor] = useState('#ff4757');
  const [brushSize, setBrushSize] = useState(6);
  const [brushAlpha, setBrushAlpha] = useState(0.9);
  const [panelVisible, setPanelVisible] = useState(true);
  const [error, setError] = useState('');
  const [clearTrigger, setClearTrigger] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const remoteStrokesRef = useRef<Map<string, RemoteStroke>>(new Map());
  const [, forceUpdate] = useState(0);

  const sendMessage = useCallback((msg: MessageType) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const msg: MessageType = JSON.parse(event.data);

      switch (msg.type) {
        case 'room_created':
          setRoomCode(msg.roomCode);
          setIsHost(msg.isHost);
          setUsers([{ id: userId, name: '我 (房主)' }]);
          setError('');
          break;
        case 'room_joined':
          setRoomCode(msg.roomCode);
          setIsHost(msg.isHost);
          setUsers(msg.users.map((id, i) => ({
            id,
            name: id === userId ? '我' : `用户 ${i + 1}`,
          })));
          setError('');
          break;
        case 'user_joined':
          setUsers(prev => {
            if (prev.find(u => u.id === msg.userId)) return prev;
            return [...prev, { id: msg.userId, name: `用户 ${prev.length + 1}` }];
          });
          break;
        case 'user_left':
          setUsers(prev => prev.filter(u => u.id !== msg.userId));
          remoteStrokesRef.current.delete(msg.userId);
          forceUpdate(n => n + 1);
          break;
        case 'remote_stroke': {
          const strokes = remoteStrokesRef.current;
          const existing = strokes.get(msg.userId) || {
            userId: msg.userId,
            color: msg.data.color,
            size: msg.data.size,
            alpha: msg.data.alpha,
            points: [],
            isDrawing: true,
          };
          existing.points.push({ x: msg.data.x, y: msg.data.y, timestamp: performance.now() });
          existing.color = msg.data.color;
          existing.size = msg.data.size;
          existing.alpha = msg.data.alpha;
          existing.isDrawing = true;
          existing.points = existing.points.slice(-100);
          strokes.set(msg.userId, existing);
          forceUpdate(n => n + 1);
          break;
        }
        case 'remote_stroke_end': {
          const stroke = remoteStrokesRef.current.get(msg.userId);
          if (stroke) {
            stroke.isDrawing = false;
          }
          forceUpdate(n => n + 1);
          break;
        }
        case 'canvas_cleared':
          remoteStrokesRef.current.clear();
          setClearTrigger(n => n + 1);
          forceUpdate(n => n + 1);
          break;
        case 'error':
          setError(msg.message);
          break;
        case 'kicked':
          setRoomCode('');
          setIsHost(false);
          setUsers([]);
          setError('你已被房主移出房间');
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  const createRoom = () => {
    sendMessage({ type: 'create_room', userId });
  };

  const joinRoom = () => {
    if (inputRoomCode.length !== 4) {
      setError('请输入4位房间码');
      return;
    }
    sendMessage({ type: 'join_room', roomCode: inputRoomCode.toUpperCase(), userId });
  };

  const handleStroke = (data: StrokeData) => {
    sendMessage({ type: 'stroke', roomCode, userId, data });
  };

  const handleStrokeEnd = () => {
    sendMessage({ type: 'stroke_end', roomCode, userId });
  };

  const clearCanvas = () => {
    sendMessage({ type: 'clear_canvas', roomCode, userId });
    setClearTrigger(n => n + 1);
  };

  const kickUser = (targetUserId: string) => {
    sendMessage({ type: 'kick_user', roomCode, userId, targetUserId });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        brushColor={brushColor}
        brushSize={brushSize}
        brushAlpha={brushAlpha}
        userId={userId}
        onStroke={handleStroke}
        onStrokeEnd={handleStrokeEnd}
        remoteStrokes={remoteStrokesRef.current}
        clearTrigger={clearTrigger}
      />

      <button
        onClick={() => setPanelVisible(v => !v)}
        style={{
          position: 'absolute',
          top: 20,
          left: panelVisible ? 340 : 20,
          width: 40,
          height: 40,
          borderRadius: 10,
          border: 'none',
          background: 'rgba(255,255,255,0.3)',
          backdropFilter: 'blur(12px)',
          color: '#fff',
          fontSize: 20,
          cursor: 'pointer',
          zIndex: 100,
          transition: 'left 0.3s ease',
        }}
      >
        {panelVisible ? '◀' : '▶'}
      </button>

      <div
        style={{
          position: 'absolute',
          top: 20,
          left: panelVisible ? 20 : -320,
          width: 300,
          padding: 20,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#fff',
          zIndex: 10,
          transition: 'left 0.3s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>🎨 RhythmCanvas</h2>

        {!roomCode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              {connected ? '🟢 已连接服务器' : '🔴 连接中...'}
            </div>
            <button
              onClick={createRoom}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              创建房间
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="输入房间码"
                maxLength={4}
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              />
              <button
                onClick={joinRoom}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                加入
              </button>
            </div>
            {error && (
              <div style={{ fontSize: 12, color: '#ff6b6b', padding: '8px 12px', background: 'rgba(255,107,107,0.15)', borderRadius: 8 }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>房间码</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6 }}>{roomCode}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                房间成员 ({users.length}/4)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {users.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.1)',
                      fontSize: 13,
                    }}
                  >
                    <span>{u.name}</span>
                    {isHost && u.id !== userId && (
                      <button
                        onClick={() => kickUser(u.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: 'rgba(255,71,87,0.7)',
                          color: '#fff',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        移出
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>画笔颜色</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBrushColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: brushColor === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                      background: c,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                画笔大小: {brushSize}px
              </div>
              <input
                type="range"
                min={2}
                max={30}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                透明度: {Math.round(brushAlpha * 100)}%
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={brushAlpha * 100}
                onChange={(e) => setBrushAlpha(Number(e.target.value) / 100)}
                style={{ width: '100%' }}
              />
            </div>

            {isHost && (
              <button
                onClick={clearCanvas}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                🗑️ 清空画布
              </button>
            )}

            {error && (
              <div style={{ fontSize: 12, color: '#ff6b6b', padding: '8px 12px', background: 'rgba(255,107,107,0.15)', borderRadius: 8 }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(12px)',
        color: '#fff',
        fontSize: 12,
        opacity: 0.7,
      }}>
        在画布上绘制以创造音乐粒子
      </div>
    </div>
  );
};

export default App;
