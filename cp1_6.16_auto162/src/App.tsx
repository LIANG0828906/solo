import { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { CanvasEditor } from './components/CanvasEditor';
import { ExpressionPalette } from './components/ExpressionPalette';
import { FramePanel } from './components/FramePanel';
import { RoomJoin } from './components/RoomJoin';
import { UserPanel } from './components/UserPanel';
import { useEditorStore } from './stores/editorStore';
import { socketClient } from './utils/socketClient';

function App() {
  const [joined, setJoined] = useState(false);
  const { room, setOnlineUsers } = useEditorStore();

  useEffect(() => {
    const un = socketClient.on('users_update', (data: unknown) => {
      const users = data as { id: string; name: string; color: string }[];
      setOnlineUsers(users);
    });

    const savedRoom = localStorage.getItem('pixel_collab_room');
    const savedName = localStorage.getItem('pixel_collab_name');
    if (savedRoom && savedName && room) {
      setJoined(true);
    }

    return () => un();
  }, [room, setOnlineUsers]);

  if (!joined || !room) {
    return <RoomJoin onJoined={() => setJoined(true)} />;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1A1A1A',
        color: '#E0E0E0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
        }}
        className="app-layout"
      >
        <div className="toolbar-wrapper">
          <Toolbar />
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            position: 'relative',
          }}
        >
          <UserPanel />
          <CanvasEditor />
        </div>
        <div
          style={{
            width: 280,
            background: '#2C2C2C',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #333333',
            flexShrink: 0,
            overflow: 'hidden',
          }}
          className="right-panel"
        >
          <ExpressionPalette />
          <FramePanel />
        </div>
      </div>

      <style>{`
        @media (min-width: 1440px) {
          .app-layout {
            flex-direction: row !important;
          }
        }
        @media (max-width: 768px) {
          .app-layout {
            flex-direction: column !important;
          }
          .toolbar-wrapper {
            width: 100% !important;
            height: auto !important;
            position: sticky;
            top: 0;
            z-index: 100;
            border-right: none !important;
            border-bottom: 1px solid #333333;
          }
          .toolbar-wrapper > div:first-child {
            width: 100% !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            padding: 8px 12px !important;
            gap: 8px !important;
          }
          .right-panel {
            width: 100% !important;
            max-height: 50vh !important;
            border-left: none !important;
            border-top: 1px solid #333333;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
