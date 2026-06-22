import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useRainStore } from '@/store/useRainStore';
import { CityScene } from '@/modules/city/CityScene';
import { RainSimulator } from '@/modules/rain-simulator/RainSimulator';
import { FloodRisk } from '@/modules/flood-risk/FloodRisk';
import { UIControlPanel } from '@/components/UIControlPanel';
import { InfoPanel } from '@/components/InfoPanel';
import { RAIN_CONFIGS } from '@/modules/rain-simulator/rainConfig';
import type { RainType } from '@/types';

function SceneBackground() {
  const currentType = useRainStore((s) => s.currentType);
  const transitionProgress = useRainStore((s) => s.transitionProgress);
  const prevTypeRef = useRainStore((s) => s.currentType);

  const bgColor = useMemo(() => {
    const target = new THREE.Color(RAIN_CONFIGS[currentType].bgColor);
    const base = new THREE.Color('#0B132B');
    const deep = new THREE.Color('#1C2541');
    const t = Math.max(0.3, transitionProgress * 0.85);
    const mixedBase = base.clone().lerp(target, t * 0.35);
    const mixedDeep = deep.clone().lerp(target, t * 0.25);
    return { base: `#${mixedBase.getHexString()}`, deep: `#${mixedDeep.getHexString()}` };
  }, [currentType, transitionProgress, prevTypeRef]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentType}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${bgColor.base} 0%, ${bgColor.deep} 70%, #050810 100%)`,
          zIndex: -1,
        }}
      />
    </AnimatePresence>
  );
}

export default function App() {
  const currentType: RainType = useRainStore((s) => s.currentType);

  const fogColor = RAIN_CONFIGS[currentType].bgColor;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SceneBackground />

      <Canvas
        shadows
        camera={{ position: [80, 70, 80], fov: 45, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[0x000000]} />
        <fog attach="fog" args={[fogColor, 120, 260]} />

        <ambientLight intensity={0.45} color="#b8c4d8" />
        <directionalLight
          position={[60, 100, 40]}
          intensity={0.9}
          color="#fff6e6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-120}
          shadow-camera-right={120}
          shadow-camera-top={120}
          shadow-camera-bottom={-120}
          shadow-camera-near={1}
          shadow-camera-far={300}
          shadow-bias={-0.0005}
        />
        <directionalLight position={[-40, 40, -60]} intensity={0.25} color="#9fb8d6" />

        <CityScene />
        <RainSimulator />
        <FloodRisk />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={40}
          maxDistance={220}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 6}
          target={[0, 5, 0]}
        />
      </Canvas>

      <UIControlPanel />
      <InfoPanel />

      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'monospace',
          fontSize: 11,
          letterSpacing: 3,
          pointerEvents: 'none',
          zIndex: 5,
          textShadow: '0 0 12px rgba(0,0,0,0.6)',
        }}
      >
        拖拽旋转 · 滚轮缩放 · 选择雨型观察内涝风险
      </div>
    </div>
  );
}
