import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import { User } from './types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  joinedRoomId: string | null;
  setJoinedRoomId: React.Dispatch<React.SetStateAction<string | null>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash);
};

const generateColor = (nickname: string): string => {
  const hue = hashCode(nickname) % 360;
  return `hsl(${hue}, 65%, 55%)`;
};

const HomePage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const { setCurrentUser, setJoinedRoomId } = useAppContext();
  const navigate = useNavigate();

  const handleJoin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim()) return;
      const finalRoomId = roomId.trim() || Math.random().toString(36).slice(2, 8).toUpperCase();
      const user: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        nickname: nickname.trim(),
        color: generateColor(nickname.trim()),
        socketId: '',
      };
      setCurrentUser(user);
      setJoinedRoomId(finalRoomId);
      navigate(`/room/${finalRoomId}`);
    },
    [nickname, roomId, setCurrentUser, setJoinedRoomId, navigate]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        className="fade-in"
        style={{
          background: '#fff',
          padding: '48px 40px',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: 420,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎵</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
            实时歌词同步编辑器
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>多人协作 · 实时同步 · 卡拉OK预览</p>
        </div>
        <form onSubmit={handleJoin}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8,
              }}
            >
              昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入你的昵称"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: 14,
                border: '2px solid #e5e7eb',
                borderRadius: 10,
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              maxLength={16}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8,
              }}
            >
              房间号（留空自动创建）
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="例如：MUSIC2024"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: 14,
                border: '2px solid #e5e7eb',
                borderRadius: 10,
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                letterSpacing: 1,
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              maxLength={16}
            />
          </div>
          <button
            type="submit"
            disabled={!nickname.trim()}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background: nickname.trim()
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#9ca3af',
              border: 'none',
              borderRadius: 10,
              cursor: nickname.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              transform: nickname.trim() ? 'none' : 'none',
            }}
          >
            加入/创建房间
          </button>
        </form>
      </div>
    </div>
  );
};

const RoomPageWrapper: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser, joinedRoomId } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !roomId) {
      navigate('/');
    }
  }, [currentUser, roomId, navigate]);

  if (!currentUser || !roomId) return null;
  return <EditorPage roomId={roomId} user={currentUser} />;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, joinedRoomId, setJoinedRoomId }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPageWrapper />} />
      </Routes>
    </AppContext.Provider>
  );
};

export default App;
