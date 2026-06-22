import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getSocket = (): Socket => {
    return io({ transports: ['websocket', 'polling'] });
  };

  const handleCreate = () => {
    if (!nickname.trim()) {
      setError('请输入您的雅号');
      return;
    }
    setLoading(true);
    setError(null);
    const socket = getSocket();

    socket.once('roomCreated', ({ roomId, playerId }: { roomId: string; playerId: string }) => {
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('nickname', nickname);
      socket.disconnect();
      navigate(`/room/${roomId}`);
    });

    socket.once('error', ({ message }: { message: string }) => {
      setError(message);
      setLoading(false);
      socket.disconnect();
    });

    socket.emit('createRoom', { nickname: nickname.trim() });
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError('请输入您的雅号');
      return;
    }
    if (!roomId.trim()) {
      setError('请输入房间号');
      return;
    }
    setLoading(true);
    setError(null);
    const socket = getSocket();

    socket.once('roomJoined', ({ roomId, playerId }: { roomId: string; playerId: string }) => {
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('nickname', nickname);
      socket.disconnect();
      navigate(`/room/${roomId}`);
    });

    socket.once('error', ({ message }: { message: string }) => {
      setError(message);
      setLoading(false);
      socket.disconnect();
    });

    socket.emit('joinRoom', { roomId: roomId.trim(), nickname: nickname.trim() });
  };

  return (
    <div className="home-wrapper">
      <div className="scroll-frame" style={{ maxWidth: 560, width: '100%' }}>
        <div className="text-center mb-6">
          <h1 className="brush-title">诗 词 接 龙</h1>
          <p className="mt-4" style={{ color: '#5a4a3a', fontSize: '1rem', fontStyle: 'italic' }}>
            ～ 以诗会友 · 墨韵留香 ～
          </p>
        </div>

        <div className="form-row">
          <label className="form-label">雅号（昵称）</label>
          <input
            className="ink-input"
            placeholder="请输入您的雅号，如：青莲居士"
            value={nickname}
            maxLength={12}
            onChange={(e) => setNickname(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <label className="form-label">房间号（加入房间时填写）</label>
          <input
            className="ink-input"
            placeholder="创建房间可留空"
            value={roomId}
            maxLength={6}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            disabled={loading}
            style={{ textTransform: 'uppercase', letterSpacing: '0.15em' }}
          />
        </div>

        {error && (
          <div
            className="mb-4"
            style={{
              padding: '0.8rem 1rem',
              background: 'rgba(201, 48, 44, 0.1)',
              border: '1px solid rgba(201, 48, 44, 0.3)',
              color: '#9e2522',
              borderRadius: 4,
              fontSize: '0.95rem',
            }}
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center mt-6">
          <button
            className="brush-btn primary"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? '创建中...' : '创 建 房 间'}
          </button>
          <button
            className="brush-btn"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? '加入中...' : '加 入 房 间'}
          </button>
        </div>

        <div className="mt-6 text-center" style={{ fontSize: '0.85rem', color: '#8a7a6a' }}>
          <p>游戏规则：每位玩家轮流对诗，输入的诗句首字需与上句尾字相同或押韵</p>
          <p className="mt-2">每轮限时60秒，最多8位诗人同场对弈</p>
        </div>
      </div>
    </div>
  );
}
