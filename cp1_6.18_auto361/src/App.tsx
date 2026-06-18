import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useMineralStore } from './store/mineralStore';
import SceneControls from './control/SceneControls';
import ControlPanel from './control/ControlPanel';
import CrystalInfoPanel from './control/CrystalInfoPanel';
import CrystalRenderer from './render/CrystalRenderer';
import SeedPointRenderer from './render/SeedPointRenderer';
import ParticlesRenderer from './render/ParticlesRenderer';
import SceneManager from './render/SceneManager';
import FPSCounter from './render/FPSCounter';

const SceneLights: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.6} color={0xffffff} />
      <pointLight
        position={[2, 5, 3]}
        intensity={1.2}
        color={0xffffff}
        distance={20}
        decay={2}
        castShadow
      />
      <pointLight
        position={[-3, -2, -2]}
        intensity={0.3}
        color={0x8888ff}
        distance={15}
      />
      <pointLight
        position={[0, -4, 2]}
        intensity={0.2}
        color={0xff8888}
        distance={15}
      />
    </>
  );
};

interface SceneBackgroundProps {}

const SceneBackground: React.FC<SceneBackgroundProps> = () => {
  const gridRef = useRef<THREE.GridHelper>(null);

  return (
    <>
      <gridHelper
        ref={gridRef}
        args={[20, 40, 0x222244, 0x111122]}
        position={[0, -3.5, 0]}
      />
    </>
  );
};

const App: React.FC = () => {
  const { loadMineralData, generateInitialSeeds, crystals } = useMineralStore();

  useEffect(() => {
    loadMineralData();
    generateInitialSeeds();
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, 6],
          fov: 60,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #000000 0%, #0a0a1a 50%, #050510 100%)',
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[0x000000]} />
        <fog attach="fog" args={[0x000000, 8, 18]} />

        <SceneLights />
        <SceneBackground />
        <SceneManager />

        <SceneControls>
          <SeedPointRenderer />
          <CrystalRenderer />
          <ParticlesRenderer />
          <CrystalInfoPanel />
        </SceneControls>

        <EffectComposer multisampling={8} autoClear={false}>
          <Bloom
            intensity={0.3}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <ControlPanel />
      <FPSCounter />

      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          color: 'rgba(255,255,255,0.85)',
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '1px',
            marginBottom: '4px',
            textShadow: '0 0 20px rgba(79, 195, 247, 0.5)',
          }}
        >
          矿物晶簇三维探测器
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.5px',
          }}
        >
          拖拽旋转 · 滚轮缩放 · 点击晶体查看信息 · 空白处拖拽生成新晶体
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '16px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        晶体数量: {crystals.length}
      </div>
    </div>
  );
};

export default App;
