import React, { useMemo } from 'react';
import { useAppStore } from './store/useAppStore';
import DailyLog from './components/DailyLog';
import CardGallery from './components/CardGallery';
import {
  emotionColors,
  emotionIcons,
  emotionLabels,
  formatDateString,
} from './utils/emotionColors';

const ParticleField: React.FC<{ emotion: string }> = ({ emotion }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      angle: (360 / 30) * i + (Math.sin(i * 1.7) * 12),
      delay: (i * 0.1) % 3,
      distance: 50 + (i % 5) * 12,
    }));
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: '20px',
      }}
    >
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '40%',
            width: 0,
            height: 0,
            transform: `rotate(${p.angle}deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: emotionColors[emotion as keyof typeof emotionColors],
              animation: `particleMove 3s ease-in-out ${p.delay}s infinite`,
              left: '-2px',
              top: '-2px',
              boxShadow: `0 0 6px ${emotionColors[emotion as keyof typeof emotionColors]}60`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

const LogDetailModal: React.FC = () => {
  const selectedLog = useAppStore((s) => s.selectedLog);
  const setSelectedLog = useAppStore((s) => s.setSelectedLog);

  if (!selectedLog) return null;

  return (
    <div
      onClick={() => setSelectedLog(null)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        animation: 'fadeIn 0.3s ease-in-out',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '480px',
          maxWidth: '90vw',
          borderRadius: '20px',
          background: '#1A1A2E',
          border: '1px solid #2A2A44',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          padding: '40px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInScale 0.4s ease-in-out',
        }}
      >
        <ParticleField emotion={selectedLog.emotion} />

        <button
          onClick={() => setSelectedLog(null)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(58,58,92,0.6)',
            border: 'none',
            color: '#B0B0CC',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(58,58,92,1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(58,58,92,0.6)';
          }}
        >
          ✕
        </button>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '60px', lineHeight: 1 }}>
              {emotionIcons[selectedLog.emotion]}
            </span>
            <div>
              <div
                style={{
                  fontSize: '15px',
                  color: emotionColors[selectedLog.emotion],
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                {emotionLabels[selectedLog.emotion]}
              </div>
              <div style={{ fontSize: '13px', color: '#8888AA' }}>
                {formatDateString(selectedLog.date)}
              </div>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #3A3A5C, transparent)',
              marginBottom: '24px',
            }}
          />

          <p
            style={{
              fontSize: '16px',
              color: '#B0B0B0',
              lineHeight: 1.8,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {selectedLog.text}
          </p>

          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: '#555577',
              }}
            >
              {new Date(selectedLog.date).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const successMessage = useAppStore((s) => s.successMessage);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B0D17',
        position: 'relative',
      }}
    >
      {successMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 300,
            background: '#1E1E2E',
            border: '1px solid #6BCB77',
            borderRadius: '12px',
            padding: '10px 24px',
            color: '#6BCB77',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(107,203,119,0.2)',
            animation: 'successFade 2s ease-in-out forwards',
          }}
        >
          ✅ {successMessage}
        </div>
      )}

      <header
        style={{
          padding: '24px 24px 8px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#E8E8FF',
            margin: 0,
            letterSpacing: '1px',
          }}
        >
          🌈 情绪光影
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#666688',
            marginTop: '6px',
            marginBottom: 0,
          }}
        >
          用色彩记录每一天的心情波动
        </p>
      </header>

      <main
        style={{
          background: '#131528',
          borderRadius: '16px',
          margin: '16px 24px',
          minHeight: '60vh',
        }}
      >
        <CardGallery />
      </main>

      <DailyLog />
      <LogDetailModal />
    </div>
  );
};

export default App;
