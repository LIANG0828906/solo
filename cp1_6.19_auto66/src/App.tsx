import MapScene from './map/MapScene';
import HudOverlay from './hud/HudOverlay';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <MapScene />
      <HudOverlay />
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          borderRadius: '8px',
          background: 'rgba(15, 15, 30, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1001,
          textAlign: 'center',
        }}
      >
        鼠标拖拽移动 · 滚轮缩放 · 点击地标锁定目标
      </div>
    </div>
  );
}

export default App;
