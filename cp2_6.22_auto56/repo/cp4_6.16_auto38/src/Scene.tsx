import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Building } from './Building';
import { useAppStore } from './store';
import buildingsData from './data/buildings.json';
import type { BuildingData } from './types';

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[120, 120, 50, 50]} />
      <meshStandardMaterial
        color="#0a0a1a"
        transparent
        opacity={0.8}
        metalness={0.5}
        roughness={0.8}
      />
    </mesh>
  );
}

function Grid() {
  return (
    <gridHelper
      args={[120, 60, '#1a3a6a', '#0f2040']}
      position={[0, 0.001, 0]}
    />
  );
}

function BuildingsGroup() {
  const buildings = useAppStore((state) => state.buildings);
  const flowData = useAppStore((state) => state.flowData);

  return (
    <>
      {buildings.map((building) => {
        const buildingFlow = flowData?.buildings.find(
          (b) => b.buildingId === building.id
        );
        return (
          <Building
            key={building.id}
            building={building}
            flowData={buildingFlow}
          />
        );
      })}
    </>
  );
}

function EnvironmentMap() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1a1a4e');
    gradient.addColorStop(0.3, '#2a2a6e');
    gradient.addColorStop(0.5, '#3d3d8e');
    gradient.addColorStop(0.7, '#2e2e6e');
    gradient.addColorStop(1, '#15153e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 200;
      const r = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
      ctx.fill();
    }
    
    const cityGradient = ctx.createLinearGradient(0, 300, 0, 512);
    cityGradient.addColorStop(0, 'rgba(100, 150, 255, 0.1)');
    cityGradient.addColorStop(1, 'rgba(60, 100, 200, 0.3)');
    ctx.fillStyle = cityGradient;
    ctx.fillRect(0, 300, 512, 212);
    
    for (let i = 0; i < 80; i++) {
      const x = (i / 80) * 512 + (Math.random() - 0.5) * 20;
      const h = 50 + Math.random() * 120;
      const w = 8 + Math.random() * 20;
      const y = 512 - h;
      ctx.fillStyle = `rgba(${30 + Math.random() * 40}, ${50 + Math.random() * 60}, ${100 + Math.random() * 80}, 0.6)`;
      ctx.fillRect(x - w / 2, y, w, h);
      
      for (let j = 0; j < 5; j++) {
        if (Math.random() > 0.5) {
          const wx = x - w / 2 + 2 + Math.random() * (w - 4);
          const wy = y + 5 + Math.random() * (h - 10);
          ctx.fillStyle = `rgba(255, 220, 150, ${0.3 + Math.random() * 0.5})`;
          ctx.fillRect(wx, wy, 1.5, 2);
        }
      }
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <>
      <primitive object={texture} attach="environment" />
      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
      </mesh>
    </>
  );
}

function CameraRig() {
  const controlsRef = useRef<any>(null);
  
  useFrame((state) => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={15}
      maxDistance={80}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={Math.PI / 6}
      enableDamping
      dampingFactor={0.05}
      target={[0, 3, 0]}
    />
  );
}

function SceneContent() {
  const setBuildings = useAppStore((state) => state.setBuildings);
  const updateFlowData = useAppStore((state) => state.updateFlowData);

  useEffect(() => {
    setBuildings(buildingsData as BuildingData[]);
  }, [setBuildings]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateFlowData();
    }, 10000);

    return () => clearInterval(interval);
  }, [updateFlowData]);

  return (
    <>
      <color attach="background" args={['#0a0a1e']} />
      <fog attach="fog" args={['#0a0a1e', 40, 100]} />
      
      <ambientLight intensity={0.3} color="#a0a0ff" />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <directionalLight
        position={[-15, 10, -15]}
        intensity={0.4}
        color="#4466ff"
      />
      <pointLight position={[0, 20, 0]} intensity={0.6} color="#6688ff" />
      
      <Stars
        radius={150}
        depth={60}
        count={5000}
        factor={5}
        saturation={0}
        fade
        speed={0.5}
      />
      
      <EnvironmentMap />
      
      <hemisphereLight args={['#6a8aff', '#1a1030', 0.4]} />
      <rectAreaLight
        position={[30, 25, 30]}
        width={40}
        height={40}
        intensity={0.8}
        color="#aabbff"
      />
      <rectAreaLight
        position={[-30, 25, -30]}
        width={40}
        height={40}
        intensity={0.5}
        color="#88aaff"
      />
      
      <Ground />
      <Grid />
      
      <BuildingsGroup />
      
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={120}
        blur={2.5}
        far={20}
        resolution={1024}
      />
      
      <CameraRig />
    </>
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [25, 18, 25], fov: 50 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
    >
      <SceneContent />
    </Canvas>
  );
}
