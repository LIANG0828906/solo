import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useLightStore } from '@/store/lightStore';

function LightSources() {
  const sun = useLightStore((s) => s.sun);
  const moon = useLightStore((s) => s.moon);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const pointRef = useRef<THREE.PointLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const sunPos = useMemo(() => {
    const d = 8;
    const el = (sun.elevation * Math.PI) / 180;
    const az = (sun.azimuth * Math.PI) / 180;
    return new THREE.Vector3(
      d * Math.cos(el) * Math.sin(az),
      d * Math.sin(el),
      d * Math.cos(el) * Math.cos(az)
    );
  }, [sun.elevation, sun.azimuth]);

  const moonPos = useMemo(() => {
    const d = 6;
    const el = (moon.elevation * Math.PI) / 180;
    const az = (moon.azimuth * Math.PI) / 180;
    return new THREE.Vector3(
      d * Math.cos(el) * Math.sin(az),
      d * Math.sin(el),
      d * Math.cos(el) * Math.cos(az)
    );
  }, [moon.elevation, moon.azimuth]);

  const { skyColor, groundColor } = useMemo(() => {
    const sc = new THREE.Color(sun.color);
    const mc = new THREE.Color(moon.color);
    const warmth = Math.max(0, Math.min(1, (sc.r - sc.b) * 2.5));
    const coolness = Math.max(0, Math.min(1, (mc.b - mc.r) * 2.5));
    const sky = new THREE.Color('#ffffff').lerp(new THREE.Color('#fff0c8'), warmth * 0.35);
    const gnd = new THREE.Color('#444466').lerp(new THREE.Color('#6688cc'), coolness * 0.4);
    return { skyColor: sky, groundColor: gnd };
  }, [sun.color, moon.color]);

  useEffect(() => {
    if (dirRef.current) {
      dirRef.current.shadow.mapSize.width = 1024;
      dirRef.current.shadow.mapSize.height = 1024;
      dirRef.current.shadow.camera.left = -10;
      dirRef.current.shadow.camera.right = 10;
      dirRef.current.shadow.camera.top = 10;
      dirRef.current.shadow.camera.bottom = -10;
      dirRef.current.shadow.camera.near = 0.1;
      dirRef.current.shadow.camera.far = 50;
      dirRef.current.shadow.radius = 3;
      dirRef.current.shadow.camera.updateProjectionMatrix();
    }
  }, []);

  useFrame(() => {
    if (dirRef.current) {
      dirRef.current.position.copy(sunPos);
      dirRef.current.target.position.set(0, 0, 0);
      dirRef.current.color.set(sun.color);
      dirRef.current.intensity = sun.intensity;
    }
    if (pointRef.current) {
      pointRef.current.position.copy(moonPos);
      pointRef.current.color.set(moon.color);
      pointRef.current.intensity = moon.intensity;
    }
    if (hemiRef.current) {
      hemiRef.current.color.copy(skyColor);
      hemiRef.current.groundColor.copy(groundColor);
    }
  });

  return (
    <>
      <directionalLight
        ref={dirRef}
        position={sunPos.toArray() as [number, number, number]}
        intensity={sun.intensity}
        color={sun.color}
        castShadow
      />
      <pointLight
        ref={pointRef}
        position={moonPos.toArray() as [number, number, number]}
        intensity={moon.intensity}
        color={moon.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-radius={3}
        distance={20}
        decay={1}
      />
      <hemisphereLight
        ref={hemiRef}
        args={[skyColor, groundColor, 0.35]}
      />
      <ambientLight intensity={0.05} />
    </>
  );
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#555555" roughness={0.9} metalness={0.1} />
      </mesh>
      <Grid
        position={[0, 0.001, 0]}
        args={[10, 10]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#888888"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#999999"
        fadeDistance={15}
        infiniteGrid={false}
      />
    </group>
  );
}

function Geometries() {
  return (
    <group>
      <mesh position={[-2, 0.75, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial color="#ff6b6b" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[2, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#4ecdc4" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.75, -2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.5, 32]} />
        <meshStandardMaterial color="#ffe66d" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.75, 2]} castShadow receiveShadow>
        <coneGeometry args={[0.5, 1.5, 32]} />
        <meshStandardMaterial color="#95e1d3" roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
}

function ShadowConfig() {
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.shadowMap.needsUpdate = true;
  }, [gl]);
  return null;
}

export default function SceneCanvas() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <ShadowConfig />
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 15, 35]} />
        <LightSources />
        <Ground />
        <Geometries />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
    </div>
  );
}
