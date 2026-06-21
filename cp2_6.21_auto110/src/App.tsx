import { GravitationalLensCanvas, ControlPanel, LevelSelectPanel, SuccessEffect } from './ui';

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0b0c10',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 10
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #00ffff, #4488ff, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 1
          }}
        >
          引力透镜模拟器
        </h1>
        <p style={{ fontSize: 12, color: '#667', marginTop: 4 }}>
          Gravitational Lens Simulator
        </p>
      </div>

      <div
        style={{
          width: 'min(80vh, 80vw)',
          height: 'min(80vh, 80vw)',
          aspectRatio: '1 / 1'
        }}
      >
        <GravitationalLensCanvas />
      </div>

      <ControlPanel />
      <LevelSelectPanel />
      <SuccessEffect />

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          color: '#445',
          zIndex: 5
        }}
      >
        基于广义相对论的光线偏折模拟 · 拖拽蓝色透镜调整位置 · 滚轮缩放
      </div>
    </div>
  );
}

export default App;
