import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useWindStore, WindTurbineData } from '@/store/windStore';
import { WindTurbine } from './WindTurbine';

const DynamicSky: React.FC = () => {
  const sunPositionRef = useRef(new THREE.Vector3(100, 50, 100));
  const { scene } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.005;
    const angle = t % (Math.PI * 2);
    const sunY = Math.sin(angle) * 80 + 20;
    const sunX = Math.cos(angle) * 200;
    sunPositionRef.current.set(sunX, sunY, 100);

    const r = THREE.MathUtils.lerp(0.08, 0.12, (sunY + 50) / 150);
    const g = THREE.MathUtils.lerp(0.08, 0.15, (sunY + 50) / 150);
    const b = THREE.MathUtils.lerp(0.18, 0.3, (sunY + 50) / 150);
    scene.background = new THREE.Color(r, g, b);
    scene.fog = new THREE.Fog(new THREE.Color(r, g, b), 800, 3000);
  });

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[sunPositionRef.current.x, sunPositionRef.current.y, sunPositionRef.current.z]}
        inclination={0.52}
        azimuth={0.25}
        turbidity={3}
        rayleigh={1.5}
      />
      <Stars radius={200} depth={60} count={2000} factor={3} saturation={0} fade speed={0.5} />
    </>
  );
};

const Ground: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[5000, 5000, 100, 100]} />
      <meshStandardMaterial
        color="#2d4a3e"
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
};

const SceneContent: React.FC = () => {
  const turbines = useWindStore((s) => s.turbines);
  const selectedTurbineId = useWindStore((s) => s.selectedTurbineId);
  const selectTurbine = useWindStore((s) => s.selectTurbine);
  const updateAnimationTimestamp = useWindStore((s) => s.updateAnimationTimestamp);
  const { viewport } = useThree();
  const [viewportScale, setViewportScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const scale = Math.min(1.5, Math.max(0.7, 1000 / window.innerWidth));
      setViewportScale(scale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useFrame((state) => {
    updateAnimationTimestamp(state.clock.elapsedTime);
  });

  const handleSceneClick = (e: any) => {
    if (e.target === e.currentTarget) {
      selectTurbine(null);
    }
  };

  return (
    <>
      <DynamicSky />

      <ambientLight intensity={0.35} color="#a5c8ff" />
      <directionalLight
        position={[200, 400, 150]}
        intensity={1.1}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={2000}
        shadow-camera-left={-1500}
        shadow-camera-right={1500}
        shadow-camera-top={1500}
        shadow-camera-bottom={-1500}
      />
      <hemisphereLight args={['#87ceeb', '#2d4a3e', 0.3]} />

      <Ground />

      <group onClick={handleSceneClick}>
        {turbines.map((turbine: WindTurbineData) => (
          <WindTurbine
            key={turbine.id}
            data={turbine}
            isSelected={selectedTurbineId === turbine.id}
            onClick={() => selectTurbine(turbine.id)}
            viewportScale={viewportScale}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={200}
        maxDistance={3000}
        enableDamping={true}
        dampingFactor={0.08}
        target={[0, 50, 0]}
      />
    </>
  );
};

const CameraSetup: React.FC = () => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(600, 700, 900);
    camera.lookAt(0, 50, 0);
  }, [camera]);

  return null;
};

export const WindFarmScene: React.FC = () => {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ fov: 50, near: 1, far: 5000 }}
      style={{ width: '100%', height: '100%' }}
    >
      <CameraSetup />
      <SceneContent />
    </Canvas>
  );
};
