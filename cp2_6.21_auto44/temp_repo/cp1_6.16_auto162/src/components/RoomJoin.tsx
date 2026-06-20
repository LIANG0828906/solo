import { useState, useEffect } from 'react';
import { useEditorStore, type Frame } from '../stores/editorStore';
import { socketClient } from '../utils/socketClient';

export function RoomJoin({ onJoined }: { onJoined: () => void }) {
  const { setRoom, setUserName, setOnlineUsers, setFrames, setPixels, setExpressionId } =
    useEditorStore();
  const [roomInput, setRoomInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedRoom = localStorage.getItem('pixel_collab_room');
    const savedName = localStorage.getItem('pixel_collab_name');
    if (savedRoom) setRoomInput(savedRoom);
    if (savedName) setNameInput(savedName);

    const un = socketClient.on('room_state', (data: unknown) => {
      const d = data as {
        pixels: (string | null)[][];
        expressionId: string | null;
        frames: Frame[];
        currentFrameIndex: number;
      };
      if (d.pixels) setPixels(d.pixels);
      if (d.expressionId) setExpressionId(d.expressionId);
      if (d.frames) setFrames(d.frames, d.currentFrameIndex);
      setLoading(false);
      onJoined();
    });

    return () => un();
  }, [setPixels, setExpressionId, setFrames, onJoined]);

  const handleJoin = () => {
    setError('');
    const room = roomInput.trim();
    const name = nameInput.trim();

    if (!/^\d{4}$/.test(room)) {
      setError('房间号必须是4位数字');
      return;
    }
    if (name.length < 1) {
      setError('请输入昵称');
      return;
    }

    setLoading(true);
    localStorage.setItem('pixel_collab_room', room);
    localStorage.setItem('pixel_collab_name', name);
    setRoom(room);
    setUserName(name);
    socketClient.connect();
    socketClient.joinRoom(room, name);
  };

  const handleQuickRoom = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomInput(random);
  };

  useEffect(() => {
    const un = socketClient.on('users_update', (data: unknown) => {
      const users = data as { id: string; name: string; color: string }[];
      setOnlineUsers(users);
    });
    return () => un();
  }, [setOnlineUsers]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 30% 20%, #1e3a3a 0%, #1A1A1A 45%), radial-gradient(circle at 70% 80%, #2a2a3a 0%, #1A1A1A 50%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#2C2C2C',
          borderRadius: 16,
          border: '1px solid #333333',
          padding: 36,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              fontSize: 44,
              marginBottom: 10,
              letterSpacing: 4,
            }}
          >
            🎨
          </div>
          <h1
            style={{
              fontSize: 24,
              color: '#E0E0E0',
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            像素表情包协作编辑器
          </h1>
          <p style={{ fontSize: 13, color: '#888888', lineHeight: 1.6 }}>
            输入房间号与昵称，和你的搭档一起实时创作像素角色表情
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: '#E0E0E0',
                marginBottom: 6,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              房间号（4位数字）
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setRoomInput(v);
                }}
                placeholder="例如: 1234"
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: '#1A1A1A',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#E0E0E0',
                  fontSize: 15,
                  fontFamily: 'monospace',
                  letterSpacing: 4,
                  outline: 'none',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#00BFA5';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#555555';
                }}
                maxLength={4}
              />
              <button
                onClick={handleQuickRoom}
                title="随机房间号"
                style={{
                  padding: '0 14px',
                  background: '#3a3a3a',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#E0E0E0',
                  cursor: 'pointer',
                  fontSize: 18,
                  transition: 'all 0.2s',
                }}
              >
                🎲
              </button>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: '#E0E0E0',
                marginBottom: 6,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              昵称
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 12))}
              placeholder="请输入你的昵称"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#1A1A1A',
                border: '1px solid #555555',
                borderRadius: 8,
                color: '#E0E0E0',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#00BFA5';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#555555';
              }}
              maxLength={12}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                color: '#FF6B6B',
                fontSize: 13,
                padding: '10px 14px',
                borderRadius: 8,
              }}
            >
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#00BFA5',
              color: '#1A1A1A',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
              letterSpacing: 1,
              marginTop: 4,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.background = '#00d4b8';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 6px 20px rgba(0,191,165,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#00BFA5';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            {loading ? '连接中...' : '🚀 加入协作'}
          </button>
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid #333333',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {[
            { icon: '🎨', text: '像素画笔' },
            { icon: '👥', text: '实时协作' },
            { icon: '🎬', text: '帧动画' },
          ].map((f) => (
            <div
              key={f.text}
              style={{
                textAlign: 'center',
                padding: 12,
                background: '#1A1A1A',
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
              <div style={{ fontSize: 11, color: '#888888' }}>{f.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
