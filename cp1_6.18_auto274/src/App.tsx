import { useState, useEffect } from 'react';
import { LoginPanel } from './components/LoginPanel';
import { SceneViewer } from './components/SceneViewer';
import { Sidebar } from './components/Sidebar';
import { TimeSlider } from './components/TimeSlider';
import { ExportButton } from './components/ExportButton';
import { useMarkersStore } from './store/markersStore';
import { initSocket, joinRoom } from './utils/socket';

function App() {
  const [isJoined, setIsJoined] = useState(false);
  const [roomCreatedAt, setRoomCreatedAt] = useState(Date.now());
  const { roomId, reset } = useMarkersStore();

  useEffect(() => {
    const socket = initSocket();
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = (nickname: string, roomId: string) => {
    joinRoom(nickname, roomId);
    setIsJoined(true);
    setRoomCreatedAt(Date.now());
  };

  const handleLogout = () => {
    reset();
    setIsJoined(false);
  };

  if (!isJoined || !roomId) {
    return <LoginPanel onJoin={handleJoin} />;
  }

  return (
    <div className="app-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <SceneViewer />
      <Sidebar onLogout={handleLogout} />
      <ExportButton />
      <TimeSlider roomCreatedAt={roomCreatedAt} />

      <style>{`
        .app-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 0 !important;
          }
          
          .time-slider-container {
            width: 95% !important;
            bottom: 12px !important;
            padding: 8px 12px !important;
          }
          
          .time-slider-container > div:first-of-type {
            margin-bottom: 4px !important;
          }
          
          .time-slider-container > div:nth-of-type(3) {
            margin-top: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
