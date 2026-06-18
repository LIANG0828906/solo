import React, { useState, useEffect, useCallback } from 'react';
import RoomScene from './RoomScene';
import ControlPanel from './ControlPanel';

const App: React.FC = () => {
  const [sceneWidth, setSceneWidth] = useState('calc(100% - 280px)');

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      if (windowWidth < 768) {
        setSceneWidth('100%');
      } else {
        setSceneWidth('calc(100% - 280px)');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const appStyle: React.CSSProperties = {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: '#1A1A2E',
    margin: 0,
    padding: 0,
    fontFamily: "'Fira Code', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const sceneContainerStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    minWidth: 0,
  };

  const fpsCounterStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 10,
    padding: '8px 12px',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: "'Fira Code', monospace",
    fontSize: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    pointerEvents: 'none',
  };

  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let lastUpdate = performance.now();
    let animationId: number;

    const updateFPS = () => {
      const now = performance.now();
      frameCount++;

      const delta = now - lastUpdate;
      if (delta >= 500) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        const avgFrameTime = delta / frameCount;
        setFps(currentFps);
        setFrameTime(avgFrameTime);
        frameCount = 0;
        lastUpdate = now;
      }

      lastTime = now;
      animationId = requestAnimationFrame(updateFPS);
    };

    animationId = requestAnimationFrame(updateFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const getFpsColor = useCallback((currentFps: number) => {
    if (currentFps >= 50) return '#00FF88';
    if (currentFps >= 30) return '#FFCC00';
    return '#FF4444';
  }, []);

  return (
    <div style={appStyle}>
      <div style={sceneContainerStyle}>
        <div style={fpsCounterStyle}>
          <div>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>FPS: </span>
            <span style={{ color: getFpsColor(fps), fontWeight: 600 }}>{fps}</span>
          </div>
          <div style={{ marginTop: '2px' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Frame: </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{frameTime.toFixed(1)}ms</span>
          </div>
        </div>

        <RoomScene width={sceneWidth} height="100%" />
      </div>

      <ControlPanel width={280} />

      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #1A1A2E;
        }

        #root {
          width: 100vw;
          height: 100vh;
          margin: 0;
          padding: 0;
        }

        * {
          box-sizing: border-box;
        }

        input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }

        input[type='range']::-webkit-slider-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #00FF88;
          border-radius: 50%;
          cursor: pointer;
          margin-top: -5px;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
          transition: transform 0.15s ease;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type='range']::-moz-range-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #00FF88;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        input[type='range']:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed !important;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .control-panel {
            position: fixed;
            right: 0;
            top: 0;
            height: 100vh;
            transform: translateX(100%);
            transition: transform 0.3s ease;
          }

          .control-panel.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default App;
