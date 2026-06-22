import React from 'react';
import ReactDOM from 'react-dom/client';
import { StateProvider } from './state';
import CanvasArea from './ui/CanvasArea';
import LayerPanel from './ui/LayerPanel';
import ControlBar from './ui/ControlBar';

function App() {
  return (
    <StateProvider>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#1a1a2e',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 20px',
            background: '#16213e',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4fc3f7, #a29bfe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ✦ 动态壁纸生成器
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#7a8aa8',
            }}
          >
            1920 × 1080 · 60fps
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <CanvasArea />
          <LayerPanel />
        </div>

        <ControlBar />
      </div>
    </StateProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
