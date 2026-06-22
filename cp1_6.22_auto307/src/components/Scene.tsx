import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { CloudGenerator } from '../CloudGenerator';
import { RainSystem } from '../RainSystem';
import { CloudParams, DEFAULT_PARAMS } from '../types';

interface SceneProps {
  params: CloudParams;
  onStatusUpdate: (status: string, probability: number) => void;
}

const CloudParticles: React.FC<{ generator: CloudGenerator }> = ({ generator }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = generator.getParticles();

  useFrame(() => {
    if (!meshRef.current) return;

    particles.forEach((particle, i) => {
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.setScalar(particle.radius);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, new THREE.Color(particle.color));
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, particles.length]}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        transparent
        opacity={0.6}
        depthWrite={false}
        roughness={1}
        metalness={0}
      />
    </instancedMesh>
  );
};

const RainDrops: React.FC<{ system: RainSystem }> = ({ system }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    const drops = system.getRainDrops();
    drops.forEach((drop, i) => {
      dummy.position.set(drop.x, drop.y, drop.z);
      dummy.rotation.x = Math.PI / 2;
      dummy.scale.set(1, 1, 0.2);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.count = drops.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, 300]}
    >
      <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
      <meshStandardMaterial
        color="#4fc3f7"
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </instancedMesh>
  );
};

const Ground: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[20, 64]} />
      <meshStandardMaterial color="#4caf50" roughness={0.8} />
    </mesh>
  );
};

const Trees: React.FC = () => {
  const treeData = useMemo(() => {
    const trees = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 14;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 0.5 + Math.random() * 0.5;
      trees.push({ x, z, height });
    }
    return trees;
  }, []);

  return (
    <group>
      {treeData.map((tree, i) => (
        <group key={i} position={[tree.x, 0, tree.z]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.6, 6]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
          <mesh position={[0, 0.6 + tree.height * 0.3, 0]} castShadow>
            <coneGeometry args={[tree.height * 0.4, tree.height * 0.6, 6]} />
            <meshStandardMaterial color="#388e3c" />
          </mesh>
          <mesh position={[0, 0.6 + tree.height * 0.55, 0]} castShadow>
            <coneGeometry args={[tree.height * 0.32, tree.height * 0.5, 6]} />
            <meshStandardMaterial color="#388e3c" />
          </mesh>
          <mesh position={[0, 0.6 + tree.height * 0.75, 0]} castShadow>
            <coneGeometry args={[tree.height * 0.24, tree.height * 0.4, 6]} />
            <meshStandardMaterial color="#388e3c" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const SkyGradient: React.FC = () => {
  const scene = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (scene.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, '#87ceeb');
      gradient.addColorStop(1, '#dcdcdc');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2, 256);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      scene.current.background = texture;
    }
  }, []);

  return <scene ref={scene} />;
};

const SceneContent: React.FC<{
  cloudGenerator: CloudGenerator;
  rainSystem: RainSystem;
  params: CloudParams;
  onStatusUpdate: (status: string, probability: number) => void;
}> = ({ cloudGenerator, rainSystem, params, onStatusUpdate }) => {
  const lastUpdateRef = useRef(0);

  useFrame((_, delta) => {
    const now = performance.now();
    if (now - lastUpdateRef.current > 16) {
      cloudGenerator.update(delta);
      rainSystem.setCloudBounds(cloudGenerator.getCloudBounds());
      rainSystem.update(delta);
      onStatusUpdate(rainSystem.getStatus(), rainSystem.getRainProbability());
      lastUpdateRef.current = now;
    }
  });

  useEffect(() => {
    cloudGenerator.setParams(params);
    rainSystem.setParams(params);
  }, [params, cloudGenerator, rainSystem]);

  return (
    <>
      <CloudParticles generator={cloudGenerator} />
      <RainDrops system={rainSystem} />
    </>
  );
};

export const Scene: React.FC<SceneProps> = ({ params, onStatusUpdate }) => {
  const cloudGenerator = useMemo(() => new CloudGenerator(DEFAULT_PARAMS), []);
  const rainSystem = useMemo(() => new RainSystem(DEFAULT_PARAMS), []);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 20], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
    >
      <SkyGradient />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <hemisphereLight args={['#87ceeb', '#4caf50', 0.3]} />

      <Ground />
      <Trees />

      <Stars
        radius={100}
        depth={50}
        count={50}
        factor={4}
        saturation={0}
        fade
        speed={0}
      />

      <SceneContent
        cloudGenerator={cloudGenerator}
        rainSystem={rainSystem}
        params={params}
        onStatusUpdate={onStatusUpdate}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.1}
        enablePan={false}
      />
    </Canvas>
  );
};
