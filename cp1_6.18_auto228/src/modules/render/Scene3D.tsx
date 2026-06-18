import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import GrowingPath from './GrowingPath';
import ParticleSystem from './ParticleSystem';
import { useAppStore } from '../../store/appStore';

const CameraController: React.FC = () => {
  const { camera } = useThree();
  const { setCameraPosition } = useAppStore();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    camera.position.set(0, 6, 8);
    camera.lookAt(0, 0.5, 0);
  }, [camera]);

  useFrame(() => {
    setCameraPosition({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={30}
      target={[0, 0.5, 0]}
    />
  );
};

const GridFloor: React.FC = () => {
  return (
    <group position={[0, -0.01, 0]}>
      <gridHelper
        args={[20, 10, '#FFFFFF', '#FFFFFF']}
      >
        <meshBasicMaterial
          attach="material"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </gridHelper>
    </group>
  );
};

const BackgroundGradient: React.FC = () => {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0B0B1A');
    gradient.addColorStop(1, '#1A1A3E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
    return () => {
      texture.dispose();
    };
  }, [scene]);

  return null;
};

const AmbientParticles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 100;

  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = Math.random() * 5 - 1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, []);

  const velocities = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.003;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;
    const geo = particlesRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];
      if (arr[i * 3] > 20) arr[i * 3] = -20;
      if (arr[i * 3] < -20) arr[i * 3] = 20;
      if (arr[i * 3 + 1] > 4) arr[i * 3 + 1] = -1;
      if (arr[i * 3 + 1] < -1) arr[i * 3 + 1] = 4;
      if (arr[i * 3 + 2] > 20) arr[i * 3 + 2] = -20;
      if (arr[i * 3 + 2] < -20) arr[i * 3 + 2] = 20;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#FFFFFF"
        transparent
        opacity={0.1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const Scene3D: React.FC = () => {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <CameraController />
      <BackgroundGradient />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#4FC3F7" />
      <pointLight position={[-10, 5, -10]} intensity={0.8} color="#FF6B6B" />
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#FFD93D" />
      <Stars radius={50} depth={50} count={1000} factor={4} fade speed={0.5} />
      <GridFloor />
      <AmbientParticles />
      <GrowingPath />
      <ParticleSystem />
    </Canvas>
  );
};

export default Scene3D;
