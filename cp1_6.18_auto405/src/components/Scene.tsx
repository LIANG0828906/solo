import { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import useGrowthStore from '@/store/useGrowthStore';
import GrowthParticle from './GrowthParticle';
import SeedBurst from './SeedBurst';

interface ClickPlaneProps {
  onSeed: (position: [number, number, number]) => void;
}

function ClickPlane({ onSeed }: ClickPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback((event: any) => {
    const point = event.point;
    if (point) {
      onSeed([point.x, point.y, point.z]);
    }
  }, [onSeed]);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      renderOrder={999}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        transparent
        opacity={0.001}
        side={THREE.DoubleSide}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function SceneUpdater() {
  const update = useGrowthStore((state) => state.update);

  useFrame((_, delta) => {
    update(delta);
  });

  return null;
}

function SceneContent() {
  const seeds = useGrowthStore((state) => state.seeds);
  const params = useGrowthStore((state) => state.params);
  const time = useGrowthStore((state) => state.time);
  const totalParticles = useGrowthStore((state) => state.totalParticles);
  const [burstPositions, setBurstPositions] = useState<{ id: string; position: [number, number, number] }[]>([]);

  const handleSeed = useCallback((position: [number, number, number]) => {
    const seed = useGrowthStore.getState().seed;
    seed(position);

    const burstId = `burst-${Date.now()}`;
    setBurstPositions((prev) => [...prev, { id: burstId, position }]);
  }, []);

  const handleBurstComplete = useCallback((burstId: string) => {
    setBurstPositions((prev) => prev.filter((b) => b.id !== burstId));
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#45B7D1" />

      <gridHelper
        args={[50, 50, 0xffffff, 0xffffff]}
        position={[0, -0.01, 0]}
      >
        <lineBasicMaterial attach="material" transparent opacity={0.2} />
      </gridHelper>

      <ClickPlane onSeed={handleSeed} />

      {seeds.map((seed) => (
        <GrowthParticle
          key={`${seed.id}-${seed.status}-${seed.particles.length}`}
          seed={seed}
          params={params}
          globalTime={time}
          totalParticles={totalParticles}
        />
      ))}

      {burstPositions.map((burst) => (
        <SeedBurst
          key={burst.id}
          position={burst.position}
          onComplete={() => handleBurstComplete(burst.id)}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />

      <SceneUpdater />
    </>
  );
}

export default function Scene() {
  return (
    <div className="w-full h-full relative">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0A0A1A 0%, #1A1A3E 100%)',
        }}
      />
      <Canvas
        camera={{ position: [3, 3, 3], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#1A1A3E', 15, 40]} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
