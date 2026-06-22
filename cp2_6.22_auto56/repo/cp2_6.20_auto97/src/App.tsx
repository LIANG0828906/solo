import React from 'react';
import {
  PlayerPanel,
  ChestSelector,
  MethodSelector,
  OpenButton,
  InscriptionPanel,
  OpenResultModal,
  GameOverModal,
} from './components/UI';

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d0a14 0%, #1a1427 100%)',
        color: '#d4c8f0',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(106,90,205,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(218,112,214,0.08) 0%, transparent 60%)
          `,
        }}
      />

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(30, 20, 40, 0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #3a2a5a',
        }}
      >
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #6a5acd, #da70d6, #9370DB, #6a5acd, #da70d6)',
            backgroundSize: '300% 100%',
            animation: 'glowLine 4s ease-in-out infinite',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />
        <div
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>🏰</span>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #e8dff5 0%, #da70d6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '2px',
                }}
              >
                暗影秘境 · 开箱
              </h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#6b5a8a', letterSpacing: '1px' }}>
                SHADOW REALM TREASURE HUNT
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#a898c8' }}>
            <span>🗡️ v1.0</span>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: '20px',
            gridTemplateColumns: '1fr',
          }}
        >
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr' }}>
            <PlayerPanel style={{ gridRow: 'span 1' }} />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <ChestSelector />
            <MethodSelector />
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 20px 0' }}>
              <OpenButton />
            </div>
          </div>

          <InscriptionPanel style={{ gridRow: 'span 1' }} />
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          main > div {
            grid-template-columns: 1fr !important;
          }
          main > div > div:first-child {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
          }
        }
        @media (min-width: 1024px) {
          main > div {
            grid-template-columns: 320px 1fr 320px !important;
            grid-template-rows: auto !important;
          }
          main > div > div:first-child {
            display: block !important;
            grid-template-columns: none !important;
            gap: 0 !important;
          }
        }
      `}</style>

      <OpenResultModal />
      <GameOverModal />
    </div>
  );
};

export default App;
