import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTerrainStore, type ViewMode } from '../store/useTerrainStore';
import TerrainGenerator from './TerrainGenerator';
import LightController from './LightController';

interface CameraRigProps {
  viewMode: ViewMode;
}

const CameraRig: React.FC<CameraRigProps> = ({ viewMode }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const cameraPosition = useTerrainStore((s) => s.cameraPosition);
  const cameraTarget = useTerrainStore((s) => s.cameraTarget);
  const setCameraPosition = useTerrainStore((s) => s.setCameraPosition);
  const setCameraTarget = useTerrainStore((s) => s.setCameraTarget);

  useEffect(() => {
    if (viewMode === 'first') {
      camera.position.set(...cameraPosition);
      if (controlsRef.current) {
        controlsRef.current.target.set(...cameraTarget);
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.05;
      }
    } else {
      camera.position.set(0, 30, 50);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.08;
      }
    }
  }, [viewMode, camera, cameraPosition, cameraTarget]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
      setCameraPosition([camera.position.x, camera.position.y, camera.position.z]);
      setCameraTarget([
        controlsRef.current.target.x,
        controlsRef.current.target.y,
        controlsRef.current.target.z,
      ]);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      minDistance={viewMode === 'third' ? 10 : 0.1}
      maxDistance={viewMode === 'third' ? 200 : 100}
      maxPolarAngle={Math.PI / 2 - 0.01}
    />
  );
};

const SceneViewContent: React.FC = () => {
  const heightScale = useTerrainStore((s) => s.heightScale);
  const frequency = useTerrainStore((s) => s.frequency);
  const vegetationDensity = useTerrainStore((s) => s.vegetationDensity);
  const lightAngle = useTerrainStore((s) => s.lightAngle);
  const viewMode = useTerrainStore((s) => s.viewMode);
  const seed = useTerrainStore((s) => s.seed);

  return (
    <>
      <color attach="background" args={['#0a0a1a']} />
      <fog attach="fog" args={['#0a0a1a', 60, 150]} />

      <LightController lightAngle={lightAngle} />

      <TerrainGenerator
        heightScale={heightScale}
        frequency={frequency}
        vegetationDensity={vegetationDensity}
        seed={seed}
      />

      <CameraRig viewMode={viewMode} />
    </>
  );
};

const SceneView: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 30, 50] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <SceneViewContent />
    </Canvas>
  );
};

export default SceneView;
