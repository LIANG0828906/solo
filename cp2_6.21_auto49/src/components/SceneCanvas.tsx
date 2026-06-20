import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useLightStore } from '@/store/lightStore';

function colorDistance(c1: THREE.Color, c2: THREE.Color): number {
  const r = c1.r - c2.r;
  const g = c1.g - c2.g;
  const b = c1.b - c2.b;
  return Math.sqrt(r * r + g * g + b * b);
}

function SceneContent() {
  const sun = useLightStore((s) => s.sun);
  const moon = useLightStore((s) => s.moon);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const pointRef = useRef<THREE.PointLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const warmFillRef = useRef<THREE.DirectionalLight>(null);
  const coolFillRef = useRef<THREE.PointLight>(null);

  const sunPos = useMemo(() => {
    const d = 8;
    const el = (sun.elevation * Math.PI) / 180;
    const az = (sun.azimuth * Math.PI) / 180;
    return [
      d * Math.cos(el) * Math.sin(az),
      d * Math.sin(el),
      d * Math.cos(el) * Math.cos(az),
    ] as [number, number, number];
  }, [sun.elevation, sun.azimuth]);

  const moonPos = useMemo(() => {
    const d = 6;
    const el = (moon.elevation * Math.PI) / 180;
    const az = (moon.azimuth * Math.PI) / 180;
    return [
      d * Math.cos(el) * Math.sin(az),
      d * Math.sin(el),
      d * Math.cos(el) * Math.cos(az),
    ] as [number, number, number];
  }, [moon.elevation, moon.azimuth]);

  const { hemiSky, hemiGround, warmStrength, coolStrength } = useMemo(() => {
    const sc = new THREE.Color(sun.color);
    const mc = new THREE.Color(moon.color);

    const warmStart = new THREE.Color('#ffaa00');
    const warmEnd = new THREE.Color('#ff6600');
    const warmMid = new THREE.Color().lerpColors(warmStart, warmEnd, 0.5);
    const warmRange = colorDistance(warmStart, warmEnd) * 1.5;
    const warmDist = colorDistance(sc, warmMid);
    const warmth = Math.max(0, Math.min(1, 1 - warmDist / Math.max(warmRange, 0.3))) * (sc.r > 0.6 ? 1 : 0);

    const coolStart = new THREE.Color('#aaccff');
    const coolEnd = new THREE.Color('#4466ff');
    const coolMid = new THREE.Color().lerpColors(coolStart, coolEnd, 0.5);
    const coolRange = colorDistance(coolStart, coolEnd) * 1.5;
    const coolDist = colorDistance(mc, coolMid);
    const coolness = Math.max(0, Math.min(1, 1 - coolDist / Math.max(coolRange, 0.3))) * (mc.b > 0.5 ? 1 : 0);

    const sky = new THREE.Color('#f0f0f0').lerp(new THREE.Color('#fff0c8'), warmth * 0.5);
    const gnd = new THREE.Color('#556677').lerp(new THREE.Color('#6699cc'), coolness * 0.6);

    return {
      hemiSky: sky,
      hemiGround: gnd,
      warmStrength: warmth,
      coolStrength: coolness,
    };
  }, [sun.color, moon.color]);

  useFrame(() => {
    if (dirRef.current) {
      dirRef.current.position.set(sunPos[0], sunPos[1], sunPos[2]);
      dirRef.current.target.position.set(0, 0, 0);
    }
    if (warmFillRef.current) {
      warmFillRef.current.position.set(sunPos[0], sunPos[1], sunPos[2]);
      warmFillRef.current.target.position.set(0, 0, 0);
      warmFillRef.current.intensity = warmStrength * 0.6;
    }
    if (pointRef.current) {
      pointRef.current.position.set(moonPos[0], moonPos[1], moonPos[2]);
    }
    if (coolFillRef.current) {
      coolFillRef.current.position.set(-moonPos[0] * 0.3, 1, -moonPos[2] * 0.3);
      coolFillRef.current.intensity = coolStrength * 0.8;
    }
    if (hemiRef.current) {
      hemiRef.current.color.copy(hemiSky);
      hemiRef.current.groundColor.copy(hemiGround);
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />

      <hemisphereLight ref={hemiRef} args={[hemiSky, hemiGround, 0.4]} />

      <directionalLight
        ref={dirRef}
        position={sunPos}
        intensity={sun.intensity}
        color={sun.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-bias={-0.001}
        shadow-radius={3}
      />

      <directionalLight
        ref={warmFillRef}
        position={sunPos}
        intensity={0}
        color="#ffcc66"
      />

      <pointLight
        ref={pointRef}
        position={moonPos}
        intensity={moon.intensity}
        color={moon.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
        shadow-radius={3}
        distance={20}
        decay={1}
      />

      <pointLight
        ref={coolFillRef}
        position={[-moonPos[0] * 0.3, 1, -moonPos[2] * 0.3]}
        intensity={0}
        color="#6688cc"
        distance={15}
        decay={2}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          color="#777777"
          roughness={0.9}
          metalness={0.1}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>

      <Grid
        position={[0, 0.001, 0]}
        args={[10, 10]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#999999"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#bbbbbb"
        fadeDistance={15}
        infiniteGrid={false}
      />

      <mesh position={[-2, 0.75, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial
          color="#ff6b6b"
          roughness={0.4}
          metalness={0.1}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[2, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color="#4ecdc4"
          roughness={0.4}
          metalness={0.1}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.75, -2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.5, 32]} />
        <meshStandardMaterial
          color="#ffe66d"
          roughness={0.4}
          metalness={0.1}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.75, 2]} castShadow receiveShadow>
        <coneGeometry args={[0.5, 1.5, 32]} />
        <meshStandardMaterial
          color="#95e1d3"
          roughness={0.4}
          metalness={0.1}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

export default function SceneCanvas() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 15, 35]} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
