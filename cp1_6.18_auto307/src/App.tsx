import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSceneStore, GLOW_COLOR_PRESETS, type GlowColorPreset } from './store/sceneStore';

const App: React.FC = () => {
  const { setFPS, fps, density, glowColor, setDensity, setGlowColor, triggerRefresh } = useSceneStore((state) => ({
    setFPS: state.setFPS,
    fps: state.fps,
    density: state.density,
    glowColor: state.glowColor,
    setDensity: state.setDensity,
    setGlowColor: state.setGlowColor,
    triggerRefresh: state.triggerRefresh,
  }));

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        const currentFPS = Math.round((frameCountRef.current * 1000) / elapsed);
        setFPS(currentFPS);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationId);
  }, [setFPS]);

  const colorPresets: GlowColorPreset[] = GLOW_COLOR_PRESETS;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000510' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(0, 10, 30, 0.75)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 14,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 188, 212, 0.3)',
        }}
      >
        FPS: <span style={{ color: fps >= 50 ? '#69F0AE' : fps >= 30 ? '#FFD740' : '#FF4081', fontWeight: 'bold' }}>{fps}</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(0, 10, 30, 0.75)',
          color: '#fff',
          padding: 20,
          borderRadius: 12,
          fontFamily: 'system-ui, sans-serif',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 188, 212, 0.3)',
          minWidth: 260,
        }}
      >
        <h3 style={{ marginBottom: 16, color: '#00BCD4', fontSize: 16, fontWeight: 600 }}>控制面板</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#a0aec0' }}>
            水母密度: <span style={{ color: '#fff', fontWeight: 600 }}>{density}</span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={density}
            onChange={(e) => setDensity(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              accentColor: glowColor,
              cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#718096', marginTop: 4 }}>
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#a0aec0' }}>
            发光颜色
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {colorPresets.map((color) => (
              <button
                key={color}
                onClick={() => setGlowColor(color)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: glowColor === color ? '2px solid #fff' : '2px solid transparent',
                  background: color,
                  cursor: 'pointer',
                  boxShadow: glowColor === color ? `0 0 12px ${color}` : 'none',
                  transition: 'all 0.2s ease',
                }}
                aria-label={`设置颜色为 ${color}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={triggerRefresh}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #00BCD4 0%, #7C4DFF 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 188, 212, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          刷新场景
        </button>
      </div>
    </div>
  );
};

export default App;
