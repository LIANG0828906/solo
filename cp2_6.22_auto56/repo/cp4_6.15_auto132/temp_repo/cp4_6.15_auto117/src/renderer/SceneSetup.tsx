import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useSequenceStore } from '@/store/sequenceStore';

interface SceneSetupProps {
  children: React.ReactNode;
}

export function SceneSetup({ children }: SceneSetupProps) {
  const sceneRef = useRef<THREE.Group>(null);
  const { viewParams, selectedBaseIndex } = useSequenceStore();
  const { autoRotate, rotationSpeed, zoom } = viewParams;

  useFrame((_state, delta) => {
    if (autoRotate && !selectedBaseIndex && sceneRef.current) {
      sceneRef.current.rotation.y += rotationSpeed * delta * 60;
    }
  });

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{
        position: [0, 5, 15],
        fov: 60,
        zoom,
      }}
    >
      <ambientLight intensity={0.4} />
      <spotLight
        position={[10, 20, 10]}
        intensity={1.5}
        angle={0.3}
        penumbra={1}
        castShadow
      />
      <pointLight
        position={[-10, 5, -10]}
        intensity={0.8}
        color="#ffaa66"
      />

      <group ref={sceneRef}>
        {children}
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
      />
      <Environment preset="city" />
    </Canvas>
  );
}
