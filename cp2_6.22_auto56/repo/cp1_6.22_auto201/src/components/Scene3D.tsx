import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { HeatmapPoint } from '@/utils/dataProcessor';
import HeatmapParticles from './HeatmapParticles';
import CityBuildings from './CityBuildings';
import RoadGrid from './RoadGrid';

interface Scene3DContentProps {
  heatmapData: HeatmapPoint[];
  onPointClick?: (point: HeatmapPoint) => void;
  selectedPoint: HeatmapPoint | null;
  onPitchChange?: (pitch: number) => void;
  animationTime?: number;
}

function CameraPitchTracker({ onPitchChange }: { onPitchChange?: (pitch: number) => void }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (!onPitchChange) return;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const pitch = 90 - Math.atan2(
      -direction.y,
      Math.sqrt(direction.x * direction.x + direction.z * direction.z)
    ) * (180 / Math.PI);
    onPitchChange(Math.round(pitch));
  });

  return null;
}

function HighlightedBuilding({ point }: { point: HeatmapPoint }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.5;
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + pulse * 0.7;
  });

  const x = (point.lng - 116.4) * 500;
  const z = (40.0 - point.lat) * 500;

  return (
    <mesh ref={meshRef} position={[x, 5, z]}>
      <boxGeometry args={[10, 10, 10]} />
      <meshStandardMaterial
        color="#3B82F6"
        emissive="#3B82F6"
        emissiveIntensity={0.5}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

function Scene3DContent({
  heatmapData,
  onPointClick,
  selectedPoint,
  onPitchChange,
  animationTime
}: Scene3DContentProps) {
  return (
    <>
      <CameraPitchTracker onPitchChange={onPitchChange} />

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[50, 80, 30]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 50, 0]} intensity={0.5} color="#3B82F6" />

      <fog attach="fog" args={['#0F172A', 80, 250]} />

      <RoadGrid />
      <CityBuildings />

      <HeatmapParticles
        data={heatmapData}
        onPointClick={onPointClick}
        animationTime={animationTime}
      />

      {selectedPoint && <HighlightedBuilding point={selectedPoint} />}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={100}
        makeDefault
      />

      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.4}
        />
      </EffectComposer>
    </>
  );
}

interface Scene3DProps {
  heatmapData: HeatmapPoint[];
  onPointClick?: (point: HeatmapPoint) => void;
  selectedPoint: HeatmapPoint | null;
  onPitchChange?: (pitch: number) => void;
  animationTime?: number;
  className?: string;
}

export default function Scene3D({
  heatmapData,
  onPointClick,
  selectedPoint,
  onPitchChange,
  animationTime,
  className
}: Scene3DProps) {
  return (
    <Canvas
      className={className}
      camera={{ position: [60, 60, 60], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ background: '#0F172A' }}
    >
      <Scene3DContent
        heatmapData={heatmapData}
        onPointClick={onPointClick}
        selectedPoint={selectedPoint}
        onPitchChange={onPitchChange}
        animationTime={animationTime}
      />
    </Canvas>
  );
}
