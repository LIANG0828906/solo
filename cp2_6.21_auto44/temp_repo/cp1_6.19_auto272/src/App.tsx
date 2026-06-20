import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AuroraScene } from './AuroraScene';
import { useAuroraStore } from './store';

function ControlPanel() {
  const triggerStorm = useAuroraStore((s) => s.triggerStorm);
  const stormIntensity = useAuroraStore((s) => s.stormIntensity);
  const isStormActive = useAuroraStore((s) => s.isStormActive);
  const isStormTriggered = useAuroraStore((s) => s.isStormTriggered);
  const resetStormPulse = useAuroraStore((s) => s.resetStormPulse);
  const speedMultiplier = useAuroraStore((s) => s.speedMultiplier);
  const pulseAmplitude = useAuroraStore((s) => s.pulseAmplitude);
  const setSpeedMultiplier = useAuroraStore((s) => s.setSpeedMultiplier);
  const setPulseAmplitude = useAuroraStore((s) => s.setPulseAmplitude);
  const fps = useAuroraStore((s) => s.fps);

  const [pulseActive, setPulseActive] = useState(false);
  const pulseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isStormTriggered) {
      setPulseActive(true);
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = window.setTimeout(() => {
        setPulseActive(false);
        resetStormPulse();
      }, 500);
    }
    return () => {
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
    };
  }, [isStormTriggered, resetStormPulse]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerStorm();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [triggerStorm]);

  const stormProgress = Math.round(stormIntensity * 100);

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 14 }}>
        <div style={titleStyle}>极光粒子模拟器</div>
        <div style={subtitleStyle}>Aurora & Geomagnetic Storm</div>
      </div>

      <button
        onClick={triggerStorm}
        disabled={isStormActive}
        style={{
          ...stormButtonStyle,
          boxShadow: pulseActive ? '0 0 15px 4px rgba(255,51,85,0.6)' : '0 0 0 rgba(255,51,85,0)',
          opacity: isStormActive ? 0.6 : 1,
          cursor: isStormActive ? 'not-allowed' : 'pointer',
          transition: 'box-shadow 0.5s ease, background 0.2s ease, opacity 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isStormActive) (e.currentTarget as HTMLButtonElement).style.background = '#FF5566';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = isStormActive ? '#FF3355' : '#FF3355';
        }}
      >
        {isStormActive ? `风暴进行中 ${stormProgress}%` : '触发地磁风暴'}
      </button>

      <div style={dividerStyle} />

      <div style={controlRowStyle}>
        <div style={labelRowStyle}>
          <span style={labelStyle}>粒子流动速度</span>
          <span style={valueStyle}>{speedMultiplier.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={speedMultiplier}
          onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={controlRowStyle}>
        <div style={labelRowStyle}>
          <span style={labelStyle}>粒子脉动幅度</span>
          <span style={valueStyle}>{pulseAmplitude.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={pulseAmplitude}
          onChange={(e) => setPulseAmplitude(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={dividerStyle} />

      <div style={fpsRowStyle}>
        <span style={labelStyle}>帧率 FPS</span>
        <span style={fpsValueStyle}>{fps}</span>
      </div>

      <div style={hintStyle}>
        提示：按 <kbd style={kbdStyle}>空格</kbd> 可快速触发风暴
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  right: 20,
  bottom: 20,
  width: 280,
  padding: '18px 20px',
  background: 'rgba(0, 10, 20, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#D0E8FF',
  fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  zIndex: 10,
  userSelect: 'none',
};

const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: 0.5,
  color: '#D0E8FF',
  marginBottom: 2,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(208, 232, 255, 0.5)',
  letterSpacing: 0.8,
  textTransform: 'uppercase',
};

const stormButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: '#FF3355',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 0.5,
  outline: 'none',
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  background: 'rgba(255,255,255,0.08)',
  margin: '14px 0',
};

const controlRowStyle: React.CSSProperties = {
  marginBottom: 14,
};

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(208, 232, 255, 0.8)',
};

const valueStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#88DDFF',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: 4,
  appearance: 'none',
  WebkitAppearance: 'none',
  background: '#2A3A50',
  borderRadius: 2,
  outline: 'none',
  cursor: 'pointer',
  accentColor: '#88DDFF',
};

const fpsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const fpsValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#00FF88',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  textShadow: '0 0 8px rgba(0,255,136,0.4)',
};

const hintStyle: React.CSSProperties = {
  marginTop: 14,
  paddingTop: 12,
  borderTop: '1px solid rgba(255,255,255,0.06)',
  fontSize: 11,
  color: 'rgba(208, 232, 255, 0.45)',
  lineHeight: 1.6,
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'inherit',
  color: '#D0E8FF',
};

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0e1a' }}>
      <Canvas
        camera={{ position: [0, 20, 100], fov: 55, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <AuroraScene />
      </Canvas>
      <ControlPanel />
      <style>{sliderCssOverride}</style>
    </div>
  );
}

const sliderCssOverride = `
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #88DDFF;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 0 6px rgba(136,221,255,0.5);
}
input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.17);
  box-shadow: 0 0 10px rgba(136,221,255,0.7);
}
input[type='range']::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #88DDFF;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 6px rgba(136,221,255,0.5);
  transition: transform 0.15s ease;
}
input[type='range']::-moz-range-thumb:hover {
  transform: scale(1.17);
  box-shadow: 0 0 10px rgba(136,221,255,0.7);
}
`;

export default App;
