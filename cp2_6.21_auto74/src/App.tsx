import { Scene3D } from '@/components/Scene3D';
import { ControlsPanel } from '@/components/ControlsPanel';
import { ToolBar } from '@/components/ToolBar';

export function App() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'linear-gradient(to bottom, #0a0e1c, #1a2340)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '280px',
          right: 0,
          bottom: '88px',
        }}
      >
        <Scene3D />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '280px',
          right: 0,
          height: '100%',
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at left, transparent 0%, transparent 30%, rgba(10, 14, 28, 0.4) 100%), radial-gradient(ellipse at right, transparent 0%, transparent 30%, rgba(10, 14, 28, 0.4) 100%), radial-gradient(ellipse at bottom, transparent 0%, transparent 60%, rgba(10, 14, 28, 0.6) 100%)',
          zIndex: 10,
        }}
      />

      <ControlsPanel />
      <ToolBar />

      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 40,
          textAlign: 'right',
        }}
      >
        <h1
          style={{
            color: '#d0d0e0',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '1px',
            marginBottom: '4px',
          }}
        >
          N-Body Simulator
        </h1>
        <p style={{ color: '#8888a0', fontSize: '11px' }}>
          多体系统混沌运动模拟器
        </p>
      </div>
    </div>
  );
}
