import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import EditorPage from './EditorPage';
import PlayerPage from './PlayerPage';
import './styles.css';
import type { RoomLayout } from './types';

function HomePage({ onNavigate }: { onNavigate: (page: string, roomId?: string) => void }) {
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rooms')
      .then(r => r.json())
      .then(data => {
        setRooms(data.rooms || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 className="copper-text" style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 900 }}>
          暗 夜 密 室
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
          逃脱谜题编辑器 · 创造与探索你的专属密室
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '60px', justifyContent: 'center' }}>
        <button className="btn-copper" style={{ fontSize: '18px', padding: '16px 48px' }}
          onClick={() => onNavigate('editor')}>
          ✎ 设计师模式
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 className="copper-text" style={{ fontSize: '24px', marginBottom: '20px' }}>
          已发布密室
        </h2>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
        ) : rooms.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            暂无已发布密室，进入设计师模式创建第一个密室吧！
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {rooms.map(room => (
              <div key={room.id} className="glass-panel room-list-item fade-in"
                onClick={() => onNavigate('player', room.id)}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--accent-copper-mid)' }}>
                  {room.name}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  点击开始解谜
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const handleNavigate = (page: string, roomId?: string) => {
    setCurrentPage(page);
    if (roomId) setCurrentRoomId(roomId);
  };

  if (currentPage === 'editor') {
    return <EditorPage onBack={() => setCurrentPage('home')} />;
  }
  if (currentPage === 'player' && currentRoomId) {
    return <PlayerPage roomId={currentRoomId} onBack={() => setCurrentPage('home')} />;
  }
  return <HomePage onNavigate={handleNavigate} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
