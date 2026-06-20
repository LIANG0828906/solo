import React, { useState, useEffect } from 'react';
import { CollageProvider, useCollage } from './context/CollageContext';
import CollageCanvas from './components/CollageCanvas';
import LayerPanel from './components/LayerPanel';
import FilterPanel from './components/FilterPanel';
import MaterialPanel from './components/MaterialPanel';
import Toolbar from './components/Toolbar';

const AppContent: React.FC<{ roomId: string; userName: string }> = ({
  roomId,
  userName,
}) => {
  const { users } = useCollage();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    } else {
      setLeftPanelOpen(true);
      setRightPanelOpen(true);
    }
  }, [isMobile]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Toolbar userName={userName} roomId={roomId} userCount={users.length} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {isMobile && (
          <>
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              style={{
                position: 'absolute',
                left: 12,
                top: 12,
                zIndex: 100,
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: '#1f2937',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              📁
            </button>
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                zIndex: 100,
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: '#1f2937',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              📚
            </button>
          </>
        )}

        {leftPanelOpen && (
          <div
            style={{
              position: isMobile ? 'absolute' : 'relative',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 50,
              animation: 'slideInLeft 0.3s ease-out',
            }}
          >
            <MaterialPanel />
          </div>
        )}

        <CollageCanvas />

        {rightPanelOpen && (
          <div
            style={{
              position: isMobile ? 'absolute' : 'relative',
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              width: 280,
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <FilterPanel />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  margin: '0 12px 12px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <LayerPanel />
              </div>
            </div>
          </div>
        )}

        {isMobile && (leftPanelOpen || rightPanelOpen) && (
          <div
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 40,
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    if (roomId.trim() && userName.trim()) {
      setJoined(true);
    }
  };

  if (!joined) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
        }}
      >
        <div
          style={{
            backgroundColor: '#1f2937',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 48 }}>🎨</span>
            <h1 style={{ color: '#fff', fontSize: 24, marginTop: 12 }}>拼贴协作</h1>
            <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
              多人实时协作创作数字拼贴画
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ color: '#d1d5db', fontSize: 13, marginBottom: 6, display: 'block' }}>
                房间号
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="输入或创建房间号"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4ecdc4')}
                onBlur={(e) => (e.target.style.borderColor = '#374151')}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            <div>
              <label style={{ color: '#d1d5db', fontSize: 13, marginBottom: 6, display: 'block' }}>
                用户名
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="输入你的名字"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4ecdc4')}
                onBlur={(e) => (e.target.style.borderColor = '#374151')}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!roomId.trim() || !userName.trim()}
              style={{
                width: '100%',
                minHeight: 44,
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor:
                  !roomId.trim() || !userName.trim() ? '#4b5563' : '#4ecdc4',
                color: '#fff',
                fontSize: 15,
                fontWeight: 500,
                cursor:
                  !roomId.trim() || !userName.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginTop: 8,
              }}
              onMouseEnter={(e) => {
                if (roomId.trim() && userName.trim()) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#3db8b0';
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  !roomId.trim() || !userName.trim() ? '#4b5563' : '#4ecdc4';
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              进入房间
            </button>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #374151' }}>
            <p style={{ color: '#6b7280', fontSize: 12, textAlign: 'center' }}>
              支持 PNG / JPG / SVG 格式 · 多人实时协作
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CollageProvider roomId={roomId} userName={userName}>
      <AppContent roomId={roomId} userName={userName} />
    </CollageProvider>
  );
};

export default App;
