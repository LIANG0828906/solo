import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { SceneManager } from './modules/scene/SceneManager';
import { DataVisualizer } from './modules/data/DataVisualizer';

function TitleOverlay() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 24,
        fontSize: 24,
        fontWeight: 200,
        color: '#E0E0E0',
        textShadow: '0 0 20px rgba(0, 255, 255, 0.31)',
        zIndex: 100,
        pointerEvents: 'none',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        letterSpacing: 2,
      }}
    >
      深海热液生态模拟
    </div>
  );
}

function ControlsHint() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.375)',
        zIndex: 100,
        pointerEvents: 'none',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        lineHeight: 1.8,
      }}
    >
      <div>鼠标拖拽 · 旋转视角</div>
      <div>滚轮 · 缩放视图</div>
      <div>点击生物 · 查看详情</div>
      <div>R 键 · 重置视角</div>
      <div>S 键 · 切换剖面视图</div>
    </div>
  );
}

function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{
          fov: 60,
          near: 0.1,
          far: 2000,
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <SceneManager />
      </Canvas>
      <TitleOverlay />
      <DataVisualizer />
      <ControlsHint />
    </div>
  );
}

export default App;
