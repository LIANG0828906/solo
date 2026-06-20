import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useTerrainStore, type ViewMode } from '@/store/useTerrainStore';
import TerrainGenerator from './TerrainGenerator';
import LightController from './LightController';
import CameraController from './CameraController';

interface SceneContentProps {
  onCameraUpdate: (position: [number, number, number], target: [number, number, number]) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({ onCameraUpdate }) => {
  const heightScale = useTerrainStore((s) => s.heightScale);
  const frequency = useTerrainStore((s) => s.frequency);
  const vegetationDensity = useTerrainStore((s) => s.vegetationDensity);
  const lightAngle = useTerrainStore((s) => s.lightAngle);
  const viewMode = useTerrainStore((s) => s.viewMode);
  const seed = useTerrainStore((s) => s.seed);

  return (
    <>
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#0a0a1a', 40, 200]} />

      <Stars
        radius={300}
        depth={100}
        count={3000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.5}
      />

      <LightController lightAngle={lightAngle} />

      <TerrainGenerator
        heightScale={heightScale}
        frequency={frequency}
        vegetationDensity={vegetationDensity / 100}
        seed={seed}
      />

      <CameraController
        viewMode={viewMode}
        seed={seed}
        heightScale={heightScale}
        frequency={frequency}
        onCameraUpdate={onCameraUpdate}
      />
    </>
  );
};

interface SceneViewProps {
  onCameraUpdate: (position: [number, number, number], target: [number, number, number]) => void;
}

const SceneView: React.FC<SceneViewProps> = ({ onCameraUpdate }) => {
  return (
    <Canvas
      shadows
      camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 10, 20] }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      dpr={[1, 2]}
    >
      <SceneContent onCameraUpdate={onCameraUpdate} />
    </Canvas>
  );
};

export default SceneView;
