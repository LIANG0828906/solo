import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import ControlPanel from './components/ControlPanel';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
      }}
    >
      <h1
        style={{
          fontSize: isMobile ? 16 : 22,
          color: '#2e7d32',
          margin: isMobile ? '8px 0 4px' : '12px 0 8px',
          fontWeight: 700,
          letterSpacing: 1,
          textAlign: 'center',
        }}
      >
        🌿 交互式3D植物生长模拟
      </h1>
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: isMobile ? 'flex-start' : 'center',
          padding: isMobile ? '0 8px 8px' : '0 16px 16px',
          maxWidth: 1200,
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <div
          style={{
            width: isMobile ? '100%' : 800,
            maxWidth: '100%',
            height: isMobile ? '55vh' : 600,
            maxHeight: 'calc(100vh - 80px)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.4)',
            flexShrink: 0,
          }}
        >
          <Canvas
            shadows
            camera={{ position: [0, 5, 12], fov: 45, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: false }}
            onCreated={({ gl }) => {
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
            style={{ background: '#e8f5e9' }}
          >
            <Scene />
          </Canvas>
        </div>
        <div
          style={{
            position: isMobile ? 'relative' : 'absolute',
            right: isMobile ? 'auto' : 16,
            top: isMobile ? 'auto' : '50%',
            transform: isMobile ? 'none' : 'translateY(-50%)',
            zIndex: 10,
            marginTop: isMobile ? 8 : 0,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <ControlPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
