import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Building } from '../editor/editorStore';

interface BuildingMeshProps {
  building: Building;
  maxHeight: number;
}

const BuildingMesh: React.FC<BuildingMeshProps> = ({ building, maxHeight }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = useMemo(() => {
    const heightRatio = building.height / maxHeight;
    const warmColor = new THREE.Color('#e8a87c');
    const coolColor = new THREE.Color('#4a90b8');
    return warmColor.lerp(coolColor, heightRatio);
  }, [building.height, maxHeight]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(t * 0.5 + building.x * 0.01) * 0.05;
  });

  const scale = 0.05;
  const width = building.width * scale;
  const height = building.height * scale;
  const depth = 50 * scale;
  const x = building.x * scale - 40;
  const y = height / 2;
  const z = -2;

  return (
    <group position={[x, y, z]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.6}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>

      <mesh position={[0, height / 2 - 0.01, depth / 2 + 0.001]}>
        <planeGeometry args={[width * 0.9, height * 0.95]} />
        <meshStandardMaterial
          color="#1a1a2e"
          emissive="#4a90b8"
          emissiveIntensity={0.15}
          transparent
          opacity={0.8}
        />
      </mesh>

      {Array.from({ length: Math.floor(height / 0.5) }).map((_, i) => (
        <React.Fragment key={i}>
          {Array.from({ length: Math.floor(width / 0.4) }).map((_, j) => (
            <mesh
              key={`${i}-${j}`}
              position={[
                -width / 2 + 0.2 + j * 0.4,
                -height / 2 + 0.3 + i * 0.5,
                depth / 2 + 0.002,
              ]}
            >
              <planeGeometry args={[0.15, 0.2]} />
              <meshStandardMaterial
                color={Math.random() > 0.3 ? '#ffd700' : '#1a1a2e'}
                emissive={Math.random() > 0.3 ? '#ffd700' : '#000000'}
                emissiveIntensity={Math.random() > 0.3 ? 0.5 : 0}
              />
            </mesh>
          ))}
        </React.Fragment>
      ))}
    </group>
  );
};

const Ground: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 100]} />
      <meshStandardMaterial
        color="#0a0a1a"
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

const Road: React.FC = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]}>
        <planeGeometry args={[200, 3]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {Array.from({ length: 50 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-95 + i * 4, 0.02, 2]}
        >
          <planeGeometry args={[2, 0.15]} />
          <meshStandardMaterial
            color="#ffff99"
            emissive="#ffff99"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
};

interface SceneProps {
  buildings: Building[];
}

const Scene: React.FC<SceneProps> = ({ buildings }) => {
  const maxHeight = useMemo(
    () => Math.max(...buildings.map((b) => b.height), 100),
    [buildings]
  );

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.4} color="#4a90b8" />
      <pointLight position={[10, 5, 10]} intensity={0.3} color="#e8a87c" />

      <Stars radius={300} depth={60} count={5000} factor={4} saturation={0} fade speed={1} />

      <Ground />
      <Road />

      {buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          maxHeight={maxHeight}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
      />
    </>
  );
};

interface Preview3DProps {
  buildings: Building[];
}

export const Preview3D: React.FC<Preview3DProps> = ({ buildings }) => {
  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Canvas
        shadows
        camera={{ position: [15, 12, 20], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <fog attach="fog" args={['#0a0a1a', 30, 80]} />
        <Scene buildings={buildings} />
      </Canvas>

      <div
        className="absolute top-4 left-4 px-4 py-2 rounded-xl text-xs text-gray-300 backdrop-blur-md flex items-center gap-3"
        style={{ background: 'rgba(15, 52, 96, 0.6)' }}
      >
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        3D 预览模式
      </div>

      <div
        className="absolute bottom-4 right-4 px-4 py-2 rounded-xl text-xs text-gray-400 backdrop-blur-md"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        🖱️ 拖拽旋转 · 滚轮缩放
      </div>
    </div>
  );
};
