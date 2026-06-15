import { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useOceanStore } from './store';
import OceanScene from './oceanScene';
import ControlPanel from './controlPanel';
import SpeciesDetail from './speciesDetail';
import SimulationProgress from './simulationProgress';
import ReportPreview from './reportPreview';
import HoverTooltip from './oceanScene/components/HoverTooltip';

export default function App() {
  const initialize = useOceanStore((s) => s.initialize);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize();
    setReady(true);
  }, [initialize]);

  if (!ready) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a1628 0%, #000510 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '16px',
            color: '#00e5ff',
            letterSpacing: '4px',
            marginBottom: '12px',
          }}>
            OCEAN ECOSYSTEM
          </div>
          <div style={{
            width: '120px',
            height: '2px',
            background: 'rgba(0, 229, 255, 0.2)',
            borderRadius: '1px',
            margin: '0 auto',
            overflow: 'hidden',
          }}>
            <div style={{
              width: '40%',
              height: '100%',
              background: '#00e5ff',
              borderRadius: '1px',
              animation: 'loading 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [20, 15, 20], fov: 55, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: 'linear-gradient(180deg, #0a1628 0%, #000510 100%)' }}
      >
        <Suspense fallback={null}>
          <OceanScene />
        </Suspense>
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          panSpeed={0.5}
          minDistance={5}
          maxDistance={100}
          maxPolarAngle={Math.PI * 0.85}
        />
      </Canvas>

      <HoverTooltip />
      <ControlPanel />
      <SpeciesDetail />
      <SimulationProgress />
      <ReportPreview />

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 50,
          display: 'flex',
          gap: '8px',
          opacity: 0.4,
          fontSize: '10px',
          color: 'rgba(255,255,255,0.5)',
          transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; }}
      >
        <span>拖拽旋转</span>
        <span>·</span>
        <span>滚轮缩放</span>
        <span>·</span>
        <span>右键平移</span>
        <span>·</span>
        <span>点击球体查看详情</span>
      </div>
    </div>
  );
}
