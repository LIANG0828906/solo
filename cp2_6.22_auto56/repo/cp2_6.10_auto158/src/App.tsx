import { useCallback, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { StarField } from '@/components/StarField';
import { ConstellationLines } from '@/components/ConstellationLines';
import { ControlPanel } from '@/components/ControlPanel';
import { InfoCard } from '@/components/InfoCard';
import { useStore } from '@/store/useStore';
import type { Star } from '@/types';

function Scene() {
  const { camera } = useThree();
  const setSelectedStarId = useStore((state) => state.setSelectedStarId);

  const handleStarClick = useCallback((star: Star) => {
    setSelectedStarId(star.id);
  }, [setSelectedStarId]);

  const handleCanvasClick = useCallback(() => {
    setSelectedStarId(null);
  }, [setSelectedStarId]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[100, 100, 100]} intensity={0.5} color="#ffffff" />
      
      <Stars radius={300} depth={60} count={2000} factor={4} saturation={0} fade speed={0.5} />
      
      <mesh>
        <sphereGeometry args={[95, 64, 64]} />
        <meshBasicMaterial 
          color="#0a0e27" 
          side={THREE.BackSide}
          transparent
          opacity={0.5}
        />
      </mesh>
      
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[98, 98.5, 64]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[96, 96.2, 64]} />
        <meshBasicMaterial color="#5f9ea0" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      
      <group onClick={handleCanvasClick}>
        <StarField onStarClick={handleStarClick} />
        <ConstellationLines />
      </group>
      
      <OrbitControls
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={40}
        maxDistance={300}
        autoRotate={false}
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

function CameraSetup() {
  const { camera } = useThree();
  
  camera.position.set(0, 150, 0.1);
  camera.lookAt(0, 0, 0);
  
  return null;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <Canvas
        camera={{ position: [0, 150, 0.1], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#0a0e27');
          scene.background = new THREE.Color('#0a0e27');
          scene.fog = new THREE.FogExp2('#0a0e27', 0.002);
        }}
        style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #000000 100%)' }}
      >
        <CameraSetup />
        <Scene />
      </Canvas>
      
      <div className="ui-layer">
        <ControlPanel />
        <InfoCard />
        
        <div className="absolute top-5 right-5 text-right">
          <h1 className="font-seal text-4xl text-[var(--color-star-gold)] tracking-widest drop-shadow-lg">
            璇玑玉衡
          </h1>
          <p className="font-kai text-sm text-[var(--color-parchment)]/80 mt-1">
            北宋·司天监 · 二十八宿星图
          </p>
        </div>
        
        <div className="absolute bottom-5 right-5 font-kai text-xs text-[var(--color-parchment)]/50">
          <p>拖拽旋转 · 滚轮缩放 · 点击星体查看详情</p>
        </div>
      </div>
    </div>
  );
}
