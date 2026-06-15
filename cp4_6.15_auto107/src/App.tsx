import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import ParticleScene from './modules/render/ParticleScene';
import ControlPanel from './modules/ui/ControlPanel';
import InfoPanel from './modules/ui/InfoPanel';
import { useUniverseStore } from './store/universeStore';

function App() {
  const sceneRef = useRef<THREE.Points | null>(null);
  const { setIsMobile, selectParticle, clearSelection } = useUniverseStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'CANVAS') {
      selectParticle(null);
    }
  };

  return (
    <div 
      className="w-screen h-screen overflow-hidden bg-[#0a0a12] relative"
      onClick={handleCanvasClick}
    >
      <Canvas
        camera={{ position: [0, 0, 200], fov: 60, near: 1, far: 1000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0a0a12']} />
        <ParticleScene sceneRef={sceneRef} />
      </Canvas>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10
                      text-center pointer-events-none">
        <h1 
          className="text-white font-bold text-xl tracking-[0.3em]
                     drop-shadow-[0_0_20px_rgba(76,201,240,0.5)]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          COSMOS EXPLORER
        </h1>
        <p 
          className="text-gray-500 text-xs mt-1 tracking-wider"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          粒子宇宙演化可视化 · 拖拽旋转 · 滚轮缩放 · 点击查询 · Shift+框选
        </p>
      </div>

      <ControlPanel />
      <InfoPanel />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
                      pointer-events-none">
        <div 
          className="text-[10px] text-gray-600 tracking-wider"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          5000 GALAXIES · 60 FPS · R3F + THREE.JS
        </div>
      </div>
    </div>
  );
}

export default App;
