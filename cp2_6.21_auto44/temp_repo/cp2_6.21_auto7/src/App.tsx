import { Canvas } from '@react-three/fiber';
import Earth from './Earth';
import UIPanel from './UIPanel';

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 30%, #0f172a 0%, #0a1020 35%, #050510 70%, #020308 100%)',
        }}
      />

      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <h1
          className="text-xl font-bold text-white tracking-wider"
          style={{
            textShadow:
              '0 0 20px rgba(59, 130, 246, 0.5), 0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          🌊 全球洋流可视化系统
        </h1>
        <p className="text-xs text-white/60 mt-1 font-mono tracking-widest">
          GLOBAL OCEAN CURRENTS · 3D VISUALIZATION
        </p>
      </div>

      <Canvas
        camera={{
          position: [0, 0, 6],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: 'grab',
        }}
      >
        <Earth />
      </Canvas>

      <UIPanel />

      <div className="absolute bottom-3 left-4 z-30 pointer-events-none">
        <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            <span>LIVE</span>
          </div>
          <span>·</span>
          <span>THREE.JS + R3F</span>
          <span>·</span>
          <span>TEMP -10°C ~ +30°C</span>
        </div>
      </div>
    </div>
  );
}
