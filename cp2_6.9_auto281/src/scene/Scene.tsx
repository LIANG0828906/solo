import { useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import { AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Terrain } from './Terrain';
import { Flag } from './Flag';
import { PathLine } from './PathLine';
import { FlagData, PathData } from '../types';

interface SceneContentProps {
  flags: FlagData[];
  paths: PathData[];
  selectedFlags: string[];
  onGroundClick: (position: [number, number, number]) => void;
  onSelectFlag: (id: string) => void;
}

function SceneContent({
  flags,
  paths,
  selectedFlags,
  onGroundClick,
  onSelectFlag,
}: SceneContentProps) {
  const { camera } = useThree();

  const handleGroundClick = useCallback(
    (point: THREE.Vector3) => {
      onGroundClick([point.x, point.y, point.z]);
    },
    [onGroundClick]
  );

  return (
    <>
      <ambientLight intensity={0.4} color="#87ceeb" />
      <hemisphereLight args={['#87ceeb', '#6b8e23', 0.5]} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        color="#ffe4b5"
      />

      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.5}
        azimuth={0.25}
        turbidity={8}
        rayleigh={2}
      />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <fog attach="fog" args={['#1a1a2e', 15, 40]} />

      <Terrain onClick={handleGroundClick} />

      <AnimatePresence>
        {flags.map((flag) => (
          <Flag
            key={flag.id}
            flag={flag}
            isSelected={selectedFlags.includes(flag.id)}
            onSelect={onSelectFlag}
          />
        ))}
      </AnimatePresence>

      {paths.map((path) => (
        <PathLine key={path.id} path={path} />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={25}
        minPolarAngle={Math.PI / 18}
        maxPolarAngle={(Math.PI * 80) / 180}
        enablePan
        panSpeed={0.5}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        screenSpacePanning={false}
      />
    </>
  );
}

interface SceneProps {
  flags: FlagData[];
  paths: PathData[];
  selectedFlags: string[];
  onGroundClick: (position: [number, number, number]) => void;
  onSelectFlag: (id: string) => void;
}

export function Scene({
  flags,
  paths,
  selectedFlags,
  onGroundClick,
  onSelectFlag,
}: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [12, 12, 12], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
      dpr={[1, 2]}
    >
      <SceneContent
        flags={flags}
        paths={paths}
        selectedFlags={selectedFlags}
        onGroundClick={onGroundClick}
        onSelectFlag={onSelectFlag}
      />
    </Canvas>
  );
}
