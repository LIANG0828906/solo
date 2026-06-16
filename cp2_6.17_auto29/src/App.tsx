import { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import MenuOverlay from './components/MenuOverlay';

const CANVAS_W = 960;
const CANVAS_H = 640;
const BORDER_PAD = 8;

export default function App() {
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [tooSmall, setTooSmall] = useState(false);

  useEffect(() => {
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setTooSmall(window.innerWidth < CANVAS_W + BORDER_PAD * 2 || window.innerHeight < CANVAS_H + BORDER_PAD * 2);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scaleX = (viewport.w - BORDER_PAD * 2) / CANVAS_W;
  const scaleY = (viewport.h - BORDER_PAD * 2) / CANVAS_H;
  const scale = tooSmall ? Math.min(scaleX, scaleY, 1) : 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0F0A1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          padding: BORDER_PAD,
          background: '#0F0A1A',
          borderRadius: 4,
          boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(100,60,160,0.3)',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, background: '#1A0F2E' }}>
          <GameCanvas />
          <MenuOverlay />
        </div>

        {tooSmall && (
          <div
            style={{
              position: 'absolute',
              top: -32,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '6px 16px',
              background: 'rgba(255,120,80,0.9)',
              color: '#fff',
              fontSize: 12,
              borderRadius: 4,
              whiteSpace: 'nowrap',
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            窗口尺寸小于 960×640，画面已缩放
          </div>
        )}
      </div>
    </div>
  );
}
