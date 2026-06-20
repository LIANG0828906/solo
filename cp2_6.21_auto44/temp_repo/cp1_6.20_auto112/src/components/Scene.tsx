import React, { useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import DNAHelix from './DNAHelix';
import Starfield from './Starfield';
import { useDNAContext } from '../context/DNAContext';

const CameraTargetTracker: React.FC = () => {
  const { setCameraTarget } = useDNAContext();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (controlsRef.current) {
      const t = controlsRef.current.target;
      setCameraTarget([t.x, t.y, t.z]);
    } else {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const target = camera.position.clone().add(dir.multiplyScalar(5));
      setCameraTarget([target.x, target.y, target.z]);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.8}
      zoomSpeed={0.9}
      panSpeed={0.8}
      minDistance={2}
      maxDistance={40}
    />
  );
};

const Scene: React.FC = () => {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <PerspectiveCamera makeDefault position={[4.5, 2.5, 6.5]} fov={50} />
      <CameraTargetTracker />

      <color attach="background" args={[0x000000]} />
      <fog attach="fog" args={[0x000000, 20, 60]} />

      <ambientLight intensity={0.45} color="#88aaff" />
      <directionalLight position={[5, 8, 5]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-5, -3, -5]} intensity={0.55} color="#3b82f6" />
      <pointLight position={[0, 0, 0]} intensity={0.6} color="#60a5fa" distance={15} />

      <Starfield count={1800} />
      <DNAHelix />
    </Canvas>
  );
};

export default Scene;
