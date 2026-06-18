import { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import ShadowControls from './components/ShadowControls';

export default function App() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle: React.CSSProperties = isMobile
    ? {
        width: '100%',
        height: '100%',
        position: 'relative' as const,
        background: '#1A202C',
      }
    : {
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#1A202C',
        padding: '16px',
        gap: '16px',
      };

  const sceneWrapperStyle: React.CSSProperties = isMobile
    ? {
        width: '100%',
        height: '100%',
      }
    : {
        flex: '0 0 calc(75% - 8px)',
        height: '100%',
        borderRadius: '16px',
        overflow: 'hidden' as const,
        border: '1px solid #2D3748',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        position: 'relative' as const,
      };

  const headerBadge: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
    padding: '8px 16px',
    background: 'rgba(26,32,44,0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: '10px',
    border: '1px solid #2D3748',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    pointerEvents: 'none' as const,
  };

  return (
    <div style={containerStyle}>
      <div style={sceneWrapperStyle}>
        <div style={headerBadge}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#63B3ED',
              boxShadow: '0 0 8px #63B3ED',
            }}
          />
          <span
            style={{
              color: '#E2E8F0',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            城市场景 · 实时渲染
          </span>
        </div>
        <Scene3D />
      </div>
      {!isMobile && (
        <div
          style={{
            flex: '0 0 calc(25% - 8px)',
            height: '100%',
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <ShadowControls />
        </div>
      )}
      {isMobile && <ShadowControls />}
    </div>
  );
}
