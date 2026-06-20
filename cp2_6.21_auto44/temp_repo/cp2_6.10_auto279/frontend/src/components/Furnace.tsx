import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { RuneShard, RuneElement } from '@/types';
import { ELEMENT_COLORS } from '@/types';
import { useGameStore } from '@/store/useGameStore';

interface LavaParticlesProps {
  count: number;
  isOverheated: boolean;
}

const LavaParticles = ({ count, isOverheated }: LavaParticlesProps) => {
  const meshRef = useRef<THREE.Points>(null);
  
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.5;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = -0.8 + Math.random() * 1.2;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
      
      const color = new THREE.Color();
      if (isOverheated) {
        color.setHSL(0.02 + Math.random() * 0.03, 1, 0.5 + Math.random() * 0.3);
      } else {
        color.setHSL(0.05 + Math.random() * 0.05, 1, 0.4 + Math.random() * 0.3);
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = 0.03 + Math.random() * 0.05;
    }
    
    return { positions, colors, sizes };
  }, [count, isOverheated]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const geometry = meshRef.current.geometry;
    const posAttribute = geometry.attributes.position as THREE.BufferAttribute;
    const positions = posAttribute.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += 0.01 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.005;
      if (positions[i * 3 + 1] > 0.8) {
        positions[i * 3 + 1] = -0.8;
      }
    }
    posAttribute.needsUpdate = true;
    
    meshRef.current.rotation.y += 0.002;
  });
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

interface FusionParticlesProps {
  isFusing: boolean;
  shards: RuneShard[];
}

const FusionParticles = ({ isFusing, shards }: FusionParticlesProps) => {
  const meshRef = useRef<THREE.Points>(null);
  const startTime = useRef<number>(0);
  
  const particleCount = 50;
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      const elementIndex = i % Math.max(shards.length, 1);
      const element = shards[elementIndex]?.element || 'fire';
      const color = new THREE.Color(ELEMENT_COLORS[element]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, colors };
  }, [shards]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    if (isFusing && startTime.current === 0) {
      startTime.current = state.clock.elapsedTime;
    }
    
    if (!isFusing) {
      startTime.current = 0;
      return;
    }
    
    const elapsed = state.clock.elapsedTime - startTime.current;
    const geometry = meshRef.current.geometry;
    const posAttribute = geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttribute.array as Float32Array;
    
    if (elapsed < 1) {
      const progress = elapsed;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 1 - progress;
        posArray[i * 3] = Math.cos(angle) * radius;
        posArray[i * 3 + 1] = Math.sin(angle * 3) * (1 - progress) * 0.5;
        posArray[i * 3 + 2] = Math.sin(angle) * radius;
      }
    } else if (elapsed < 1.5) {
      const progress = (elapsed - 1) * 2;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = progress * 2;
        posArray[i * 3] = Math.cos(angle) * radius;
        posArray[i * 3 + 1] = (Math.random() - 0.5) * progress * 2;
        posArray[i * 3 + 2] = Math.sin(angle) * radius;
      }
    }
    
    posAttribute.needsUpdate = true;
  });
  
  if (!isFusing) return null;
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const FurnaceModel = ({ isOverheated, isFusing }: { isOverheated: boolean; isFusing: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.003;
  });
  
  const vertices = useMemo(() => {
    const sides = 8;
    const verts: number[] = [];
    const radius = 1.5;
    const height = 1.2;
    
    for (let i = 0; i < sides; i++) {
      const angle1 = (i / sides) * Math.PI * 2;
      const angle2 = ((i + 1) / sides) * Math.PI * 2;
      
      const x1 = Math.cos(angle1) * radius;
      const z1 = Math.sin(angle1) * radius;
      const x2 = Math.cos(angle2) * radius;
      const z2 = Math.sin(angle2) * radius;
      
      verts.push(x1, height / 2, z1, x2, height / 2, z2, x1, -height / 2, z1);
      verts.push(x2, height / 2, z2, x2, -height / 2, z2, x1, -height / 2, z1);
    }
    
    return new Float32Array(verts);
  }, []);
  
  const edgeColor = useMemo(() => {
    return isOverheated ? '#ff3300' : isFusing ? '#ffaa00' : '#ff6600';
  }, [isOverheated, isFusing]);
  
  return (
    <group ref={groupRef}>
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={vertices.length / 3}
            array={vertices}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-normal"
            count={vertices.length / 3}
            array={new Float32Array(vertices.length).fill(1)}
            itemSize={3}
          />
        </bufferGeometry>
        <meshStandardMaterial
          color="#2a2a2a"
          metalness={0.8}
          roughness={0.3}
          emissive={edgeColor}
          emissiveIntensity={isOverheated ? 0.5 : isFusing ? 0.3 : 0.1}
        />
      </mesh>
      
      <mesh position={[0, 0.61, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.5, 8]} />
        <meshStandardMaterial
          color={edgeColor}
          emissive={edgeColor}
          emissiveIntensity={isOverheated ? 1 : isFusing ? 0.8 : 0.5}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      
      <mesh position={[0, -0.61, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 8]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>
      
      <pointLight
        position={[0, 0, 0]}
        color={isOverheated ? '#ff2200' : '#ff6600'}
        intensity={isOverheated ? 3 : isFusing ? 2 : 1}
        distance={5}
      />
    </group>
  );
};

const FloatingShard = ({ shard, index, total }: { shard: RuneShard; index: number; total: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = ELEMENT_COLORS[shard.element as RuneElement];
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const angle = (index / Math.max(total, 1)) * Math.PI * 2 + state.clock.elapsedTime * 0.5;
    const radius = 1.8;
    meshRef.current.position.x = Math.cos(angle) * radius;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + index) * 0.3;
    meshRef.current.position.z = Math.sin(angle) * radius;
    meshRef.current.rotation.x += 0.02;
    meshRef.current.rotation.y += 0.03;
  });
  
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.6}
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
    </Float>
  );
};

const FurnaceScene = () => {
  const { isFusing, isOverheated, fusionShards } = useGameStore();
  
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 60 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffaa66" />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#00aaff" />
      
      <FurnaceModel isOverheated={isOverheated} isFusing={isFusing} />
      <LavaParticles count={150} isOverheated={isOverheated} />
      <FusionParticles isFusing={isFusing} shards={fusionShards} />
      
      {fusionShards.map((shard, index) => (
        <FloatingShard
          key={shard.id}
          shard={shard}
          index={index}
          total={fusionShards.length}
        />
      ))}
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
};

interface FurnaceProps {
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragOver: boolean;
}

export const Furnace = ({ onDrop, onDragOver, onDragLeave, isDragOver }: FurnaceProps) => {
  const { performFusion, fusionShards, isFusing, isOverheated, clearFusionShards } = useGameStore();
  
  return (
    <div className="relative w-full h-full">
      <div
        className={`w-full h-full relative rounded-2xl transition-all duration-300 ${
          isDragOver ? 'ring-4 ring-orange-500 ring-opacity-80 scale-105' : ''
        } ${isOverheated ? 'animate-pulse' : ''}`}
        style={{
          background: isOverheated
            ? 'radial-gradient(circle, rgba(255,50,0,0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,102,0,0.2) 0%, transparent 70%)',
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <FurnaceScene />
        
        {isOverheated && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg animate-bounce font-bold">
            🔥 熔炉过热！请勿操作！
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button
          onClick={performFusion}
          disabled={fusionShards.length < 2 || isFusing || isOverheated}
          className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            fusionShards.length >= 2 && !isFusing && !isOverheated
              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isFusing ? '融合中...' : '🔥 开始融合'}
        </button>
        
        <button
          onClick={clearFusionShards}
          disabled={fusionShards.length === 0 || isFusing}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            fusionShards.length > 0 && !isFusing
              ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          清空
        </button>
      </div>
      
      {fusionShards.length > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
          <span className="text-white">已选择 {fusionShards.length} 个碎片</span>
        </div>
      )}
    </div>
  );
};
