import React, { useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlantStore } from '../stores/plantStore';

const SceneSetup: React.FC = () => {
  const { environment } = usePlantStore();
  const { scene } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  useMemo(() => {
    scene.background = new THREE.Color('#1a1a2e');
    scene.fog = new THREE.Fog('#1a1a2e', 20, 60);
  }, [scene]);

  useFrame(() => {
    if (dirLightRef.current) {
      dirLightRef.current.intensity = environment.lightIntensity;
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = environment.lightIntensity * 0.4;
    }
  });

  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(40, 40, '#2d2d5e', '#2d2d5e');
    const material = grid.material as THREE.Material;
    material.transparent = true;
    material.opacity = 0.4;
    return grid;
  }, []);

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.6} color="#ffffff" />
      <directionalLight
        ref={dirLightRef}
        position={[10, 20, 10]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.3}
        color="#4a90e2"
      />
      <primitive object={gridHelper} position={[0, -0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#1a1a2e"
          transparent
          opacity={0.8}
        />
      </mesh>
    </>
  );
};

export default SceneSetup;
