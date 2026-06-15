import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Socket } from 'socket.io-client';

interface RoomItem {
  code: string;
  name: string;
  maxPlayers: number;
  players: { id: string; name: string; color: string; completedTasks: string[] }[];
  createdAt: string;
}

interface LobbyProps {
  socket: Socket;
}

const Lobby: React.FC<LobbyProps> = ({ socket }) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [playerName] = useState(() => 'Player' + Math.floor(Math.random() * 900 + 100));

  const fetchRooms = async () => {
    try {
      const res = await axios.get<RoomItem[]>('/api/rooms');
      setRooms(res.data);
    } catch {
      setRooms([]);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    const handler = () => {
      fetchRooms();
    };
    socket.on('room-updated', handler);
    return () => {
      socket.off('room-updated', handler);
    };
  }, [socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      radius: number;
      angle: number;
    }

    const particles: Particle[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.1,
      radius: Math.random() * 2 + 1,
      angle: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.angle += (Math.random() - 0.5) * 0.02;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        gradient.addColorStop(0, `rgba(142, 45, 226, ${p.opacity})`);
        gradient.addColorStop(1, `rgba(142, 45, 226, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 130, 255, ${p.opacity + 0.2})`;
        ctx.fill();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) return;
    try {
      await axios.post(`/api/rooms/${roomCode.toUpperCase()}/join`, { playerName });
      navigate(`/room/${roomCode.toUpperCase()}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    try {
      const res = await axios.post<{ code: string }>('/api/rooms', {
        name: roomName,
        maxPlayers,
      });
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 6);
    setRoomCode(val);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#1a1a2e', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        <h1
          style={{
            textAlign: 'center',
            color: '#e0e0ff',
            fontFamily: '"Segoe UI", sans-serif',
            fontSize: '2.5rem',
            marginBottom: 8,
            textShadow: '0 0 20px rgba(142, 45, 226, 0.6)',
          }}
        >
          ESCAPE ROOM
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: '#8888bb',
            fontFamily: '"Segoe UI", sans-serif',
            fontSize: '1rem',
            marginBottom: 40,
          }}
        >
          玩家: {playerName}
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          {rooms.length === 0 && (
            <p style={{ color: '#6666aa', fontSize: '1.1rem', textAlign: 'center', width: '100%' }}>
              暂无房间，创建一个吧！
            </p>
          )}
          {rooms.map((room) => (
            <div
              key={room.code}
              onClick={async () => {
                try {
                  await axios.post(`/api/rooms/${room.code}/join`, { playerName });
                  navigate(`/room/${room.code}`);
                } catch (err) {
                  console.error(err);
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #4a00e0, #8e2de2)',
                borderRadius: 16,
                padding: '24px 28px',
                width: 260,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(74, 0, 224, 0.3)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 8px 40px rgba(142, 45, 226, 0.6)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 4px 20px rgba(74, 0, 224, 0.3)';
              }}
            >
              <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>
                {room.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d0c0ff', fontSize: '0.9rem' }}>
                <span>👤 {room.players ? room.players.length : 0}/{room.maxPlayers}</span>
                <span>{new Date(room.createdAt).toLocaleTimeString()}</span>
              </div>
              <div style={{ color: '#a090cc', fontSize: '0.8rem', marginTop: 8 }}>
                房间代码: {room.code}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'rgba(30, 30, 60, 0.8)',
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            margin: '0 auto',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(142, 45, 226, 0.2)',
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ color: '#c0b0ee', fontSize: '1.1rem', marginBottom: 12 }}>加入房间</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                value={roomCode}
                onChange={handleCodeChange}
                placeholder="输入房间代码"
                maxLength={6}
                style={{
                  flex: 1,
                  background: 'rgba(20, 20, 50, 0.8)',
                  border: '1px solid rgba(142, 45, 226, 0.4)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  color: '#e0e0ff',
                  fontSize: '1rem',
                  outline: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  fontFamily: 'monospace',
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'rgba(142, 45, 226, 0.8)';
                  (e.target as HTMLInputElement).style.boxShadow =
                    '0 0 12px rgba(142, 45, 226, 0.3)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'rgba(142, 45, 226, 0.4)';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleJoinRoom}
                style={{
                  background: 'linear-gradient(135deg, #6a0dad, #9b30ff)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 24px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.target as HTMLButtonElement).style.boxShadow =
                    '0 4px 20px rgba(155, 48, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.target as HTMLButtonElement).style.boxShadow = 'none';
                }}
                onMouseDown={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }}
              >
                加入房间
              </button>
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(142, 45, 226, 0.4), transparent)',
              marginBottom: 28,
            }}
          />

          <div>
            <h3 style={{ color: '#c0b0ee', fontSize: '1.1rem', marginBottom: 12 }}>创建房间</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="房间名称"
                style={{
                  background: 'rgba(20, 20, 50, 0.8)',
                  border: '1px solid rgba(142, 45, 226, 0.4)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  color: '#e0e0ff',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'rgba(142, 45, 226, 0.8)';
                  (e.target as HTMLInputElement).style.boxShadow =
                    '0 0 12px rgba(142, 45, 226, 0.3)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'rgba(142, 45, 226, 0.4)';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                style={{
                  background: 'rgba(20, 20, 50, 0.8)',
                  border: '1px solid rgba(142, 45, 226, 0.4)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  color: '#e0e0ff',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={2}>2 人</option>
                <option value={3}>3 人</option>
                <option value={4}>4 人</option>
              </select>
              <button
                onClick={handleCreateRoom}
                style={{
                  background: 'linear-gradient(135deg, #7b2ff7, #c471f5)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '14px 24px',
                  color: '#fff',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  letterSpacing: 1,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.target as HTMLButtonElement).style.boxShadow =
                    '0 6px 28px rgba(196, 113, 245, 0.5)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.target as HTMLButtonElement).style.boxShadow = 'none';
                }}
                onMouseDown={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }}
              >
                创建房间
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
