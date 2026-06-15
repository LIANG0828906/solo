import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Plant from './scene/Plant';
import ControlPanel from './components/ControlPanel';

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[2.5, 32]} />
      <meshStandardMaterial
        color="#3a5a30"
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  );
}

function SkyDome() {
  return (
    <mesh>
      <sphereGeometry args={[15, 16, 16]} />
      <meshBasicMaterial
        color="#6ba3a0"
        side={THREE.BackSide}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} color="#c8d8c0" />
      <directionalLight
        position={[3, 5, 2]}
        intensity={1.2}
        color="#fff8e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight
        args={['#87ceeb', '#2d5a2d', 0.4]}
      />
    </>
  );
}

export default function App() {
  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(180deg, #1a2e28 0%, #2D3A32 40%, #2a3a30 100%)',
  };

  const wrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  };

  const camPos: [number, number, number] = [
    2.1,
    2.1,
    2.1,
  ];

  return (
    <div style={wrapperStyle}>
      <Canvas
        shadows
        camera={{
          position: camPos,
          fov: 50,
          near: 0.1,
          far: 50,
        }}
        style={canvasStyle}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#1a2e28']} />
        <fog attach="fog" args={['#1a2e28', 8, 18]} />
        <Lights />
        <SkyDome />
        <Ground />
        <Plant />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={8}
          target={[0, 0.6, 0]}
          maxPolarAngle={Math.PI / 2 + 0.2}
        />
      </Canvas>
      <ControlPanel />
    </div>
  );
}
