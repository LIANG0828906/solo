import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Bell } from './Bell';
import { ScalePlatforms } from './ScalePlatform';
import { Particles } from './Particles';
import { useGameStore } from '@/store/useGameStore';
import { COLORS } from '@/utils/constants';

const Cloud: React.FC<{ position: [number, number, number]; scale: number; speed: number }> = ({
  position,
  scale,
  speed,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const cloudMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.cloud,
        transparent: true,
        opacity: 0.7,
        roughness: 1,
        metalness: 0,
      }),
    []
  );

  const cloudParts = useMemo(() => {
    const parts: { pos: [number, number, number]; size: number }[] = [];
    for (let i = 0; i < 8; i++) {
      parts.push({
        pos: [
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 1,
          (Math.random() - 0.5) * 3,
        ],
        size: 0.5 + Math.random() * 0.8,
      });
    }
    return parts;
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const time = clock.getElapsedTime();
      groupRef.current.position.x = position[0] + Math.sin(time * speed * 0.1) * 2;
      groupRef.current.position.z = position[2] + Math.cos(time * speed * 0.15) * 2;
      groupRef.current.position.y = position[1] + Math.sin(time * speed * 0.2) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {cloudParts.map((part, i) => (
        <mesh key={i} position={part.pos}>
          <sphereGeometry args={[part.size, 16, 16]} />
          <primitive object={cloudMaterial} attach="material" />
        </mesh>
      ))}
    </group>
  );
};

const CloudPlatform: React.FC = () => {
  const platformGeometry = useMemo(
    () => new THREE.CylinderGeometry(10, 12, 0.5, 64),
    []
  );

  const platformMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.cloud,
        transparent: true,
        opacity: 0.8,
        roughness: 0.9,
        metalness: 0.1,
      }),
    []
  );

  const lowerClouds = useMemo(() => {
    const clouds: { pos: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const radius = 8 + Math.random() * 3;
      clouds.push({
        pos: [Math.cos(angle) * radius, -0.3 - Math.random() * 0.5, Math.sin(angle) * radius],
        scale: 0.8 + Math.random() * 0.6,
      });
    }
    return clouds;
  }, []);

  return (
    <group>
      <mesh geometry={platformGeometry} material={platformMaterial} position={[0, -0.25, 0.8]} receiveShadow />

      {lowerClouds.map((cloud, i) => (
        <mesh key={i} position={cloud.pos} scale={cloud.scale}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial
            color={COLORS.cloud}
            transparent
            opacity={0.6}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
};

const SceneContent: React.FC = () => {
  const { bells } = useGameStore();

  const clouds = useMemo(() => {
    const cloudData: { pos: [number, number, number]; scale: number; speed: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      cloudData.push({
        pos: [Math.cos(angle) * radius, 5 + Math.random() * 5, Math.sin(angle) * radius],
        scale: 1.5 + Math.random() * 2,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
    return cloudData;
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-5, 8, -5]} intensity={0.4} color={COLORS.sky} />
      <pointLight position={[5, 6, -5]} intensity={0.3} color={COLORS.bronzeLight} />

      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.52}
        azimuth={0.25}
        rayleigh={0.5}
        turbidity={10}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <fog attach="fog" args={[COLORS.sky, 20, 60]} />

      {clouds.map((cloud, i) => (
        <Cloud key={i} position={cloud.pos} scale={cloud.scale} speed={cloud.speed} />
      ))}

      <CloudPlatform />
      <ScalePlatforms />

      {bells.map((bell) => (
        <Bell key={bell.id} bell={bell} />
      ))}

      <Particles />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 + 0.2}
        minPolarAngle={Math.PI / 6}
        enablePan={false}
      />

      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
};

export const CloudScene: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 6, 16], fov: 55 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[COLORS.sky]} />
      <SceneContent />
    </Canvas>
  );
};
