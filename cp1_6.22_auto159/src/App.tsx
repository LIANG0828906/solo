import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import GalleryScene from './components/GalleryScene';
import AdminPanel from './components/AdminPanel';
import { fetchVisitorCount } from './utils/api';

type View = 'gallery' | 'admin';

const App: React.FC = () => {
  const [view, setView] = useState<View>('gallery');
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('visitors:update', (data: { count: number; positions: { id: string; x: number; y: number; z: number }[] }) => {
      setVisitorCount(data.count);
    });

    newSocket.emit('visitor:join');

    return () => {
      newSocket.emit('visitor:leave');
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const data = await fetchVisitorCount();
        if (active) {
          setVisitorCount(data.count);
        }
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{
      backgroundColor: '#1A1A1A',
      color: '#E0E0E0',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #333',
      }}>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>
          VirtualGallery - {visitorCount} visitors online
        </div>
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setView('gallery')}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: view === 'gallery' ? '#6366F1' : '#333',
              color: view === 'gallery' ? '#fff' : '#E0E0E0',
              transition: 'background-color 0.2s',
            }}
          >
            Gallery
          </button>
          <button
            onClick={() => setView('admin')}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: view === 'admin' ? '#6366F1' : '#333',
              color: view === 'admin' ? '#fff' : '#E0E0E0',
              transition: 'background-color 0.2s',
            }}
          >
            Admin
          </button>
        </nav>
      </header>
      <main>
        {view === 'gallery' ? <GalleryScene /> : <AdminPanel />}
      </main>
    </div>
  );
};

export default App;
