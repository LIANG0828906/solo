import React, { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { Globe } from './Globe';
import { AQIBarChart } from './AQIBarChart';
import { HeatmapPoint } from './HeatmapPoint';
import { PulseRipple } from './PulseRipple';
import { useAQIStore } from '../store/aqiStore';
import type { PerspectivePreset } from '../types';

const AnimatedCameraGroup = a('group');

interface CameraControllerProps {
  activePreset: string | null;
  presets: PerspectivePreset[];
}

const CameraController: React.FC<CameraControllerProps> = ({ activePreset, presets }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const preset = activePreset ? presets.find((p) => p.name === activePreset) : null;

  const { posX, posY, posZ, targetX, targetY, targetZ } = useSpring({
    posX: preset ? preset.position[0] : camera.position.x,
    posY: preset ? preset.position[1] : camera.position.y,
    posZ: preset ? preset.position[2] : camera.position.z,
    targetX: preset ? preset.target[0] : 0,
    targetY: preset ? preset.target[1] : 0,
    targetZ: preset ? preset.target[2] : 0,
    config: { duration: 1500 },
  });

  useEffect(() => {
    if (!preset) return;
    const id = setInterval(() => {
      if (controlsRef.current) {
      }
    }, 50);
    return () => clearInterval(id);
  }, [preset]);

  useFrame(() => {
    if (!preset) return;
    camera.position.set(posX.get(), posY.get(), posZ.get();
    if (controlsRef.current) {
      controlsRef.current.target.set(targetX.get(), targetY.get(), targetZ.get());
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.05}
      minDistance={8}
      maxDistance={25}
    />
  );
};

export const GlobeMap: React.FC = () => {
  const cities = useAQIStore((s) => s.cities);
  const currentYear = useAQIStore((s) => s.currentYear);
  const viewMode = useAQIStore((s) => s.viewMode);
  const pulseRipples = useAQIStore((s) => s.pulseRipples);
  const activePreset = useAQIStore((s) => s.activePreset);
  const perspectivePresets = useAQIStore((s) => s.perspectivePresets);

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#0A0E27'), 1);
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

      <Globe />

      {cities.map((city) =>
        viewMode === 'bars' ? (
          <AQIBarChart key={city.id} city={city} currentYear={currentYear} />
        ) : (
          <HeatmapPoint key={city.id} city={city} currentYear={currentYear} />
        )
      )}

      {pulseRipples.map((ripple) => (
        <PulseRipple
          key={ripple.id}
          position={ripple.position}
          createdAt={ripple.createdAt}
        />
      ))}

      <CameraController activePreset={activePreset} presets={perspectivePresets} />
    </Canvas>
  );
};
