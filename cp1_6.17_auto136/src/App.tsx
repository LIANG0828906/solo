import React, { useState, useCallback } from 'react';
import { useRoomStore } from './store';
import RoomManager from './RoomManager';
import ChatPanel from './ChatPanel';
import SpectrumView from './SpectrumView';
import { analyzeEmotions, EmotionResult } from './EmotionAnalyzer';

const navStyle: React.CSSProperties = {
  height: '60px',
  background: '#F5E6F0',
  borderBottom: '1px solid #E0D0DC',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '32px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const navTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 300,
  color: '#4A3F4F',
};

const mainStyle: React.CSSProperties = {
  display: 'flex',
  height: 'calc(100vh - 60px)',
  background: '#FFF8F0',
};

const leftStyle: React.CSSProperties = {
  width: '70%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
};

const rightStyle: React.CSSProperties = {
  width: '30%',
  background: '#FAF4F8',
  borderRadius: '12px',
  margin: '12px',
  padding: '12px',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
};

const exportBtnStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '8px 24px',
  borderRadius: '8px',
  background: '#6C5B7B',
  color: '#FFF',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background 0.2s ease',
  zIndex: 200,
};

export default function App() {
  const { roomId, messages } = useRoomStore();
  const [allEmotions, setAllEmotions] = useState<EmotionResult[]>([]);
  const [bgPhase, setBgPhase] = useState(false);

  const handleNewMessage = useCallback((emotions: EmotionResult[]) => {
    setAllEmotions((prev) => [...prev, ...emotions]);
  }, []);

  const handleExport = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/export`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poetry-healing-${roomId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const exportData = { roomId, messages, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poetry-healing-${roomId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [roomId, messages]);

  React.useEffect(() => {
    if (roomId) {
      const timer = setTimeout(() => setBgPhase(true), 10);
      return () => clearTimeout(timer);
    } else {
      setBgPhase(false);
    }
  }, [roomId]);

  if (!roomId) {
    return <RoomManager />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bgPhase ? '#FFF8F0' : '#F0E6F6',
        transition: 'background 2s ease-in-out',
      }}
    >
      <nav style={navStyle}>
        <span style={navTitleStyle}>诗语疗愈</span>
      </nav>
      <div className="app-main" style={mainStyle}>
        <div style={leftStyle}>
          <ChatPanel onNewMessage={handleNewMessage} />
        </div>
        <div className="app-right" style={rightStyle}>
          <SpectrumView emotions={allEmotions} />
        </div>
      </div>
      <button
        style={exportBtnStyle}
        onClick={handleExport}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#5A4A69')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#6C5B7B')}
      >
        导出对话记录
      </button>
      <style>{`
        @media (max-width: 900px) {
          .app-main {
            flex-direction: column !important;
          }
          .app-main > div:first-child {
            width: 100% !important;
          }
          .app-right {
            width: calc(100% - 24px) !important;
            height: 120px !important;
            margin: 0 12px 80px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
