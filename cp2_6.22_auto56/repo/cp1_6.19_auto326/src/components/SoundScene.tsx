import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useSoundStore, Vec3, ReflectionPath } from '@/store/useSoundStore';

const getOpacityForReflection = (count: number): number => {
  switch (count) {
    case 0: return 0.8;
    case 1: return 0.6;
    case 2: return 0.45;
    case 3: return 0.3;
    default: return 0.3;
  }
};

interface RoomWallsProps {
  width: number;
  height: number;
  depth: number;
}

function RoomWalls({ width, height, depth }: RoomWallsProps) {
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  const wallConfigs = useMemo(() => [
    {
      args: [width, height, 1] as [number, number, number],
      position: [0, halfH, halfD] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    },
    {
      args: [width, height, 1] as [number, number, number],
      position: [0, halfH, -halfD] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    },
    {
      args: [depth, height, 1] as [number, number, number],
      position: [-halfW, halfH, 0] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
    },
    {
      args: [depth, height, 1] as [number, number, number],
      position: [halfW, halfH, 0] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
    },
    {
      args: [width, depth, 1] as [number, number, number],
      position: [0, 0, 0] as [number, number, number],
      rotation: [Math.PI / 2, 0, 0] as [number, number, number],
    },
    {
      args: [width, depth, 1] as [number, number, number],
      position: [0, height, 0] as [number, number, number],
      rotation: [Math.PI / 2, 0, 0] as [number, number, number],
    },
  ], [width, height, depth, halfW, halfH, halfD]);

  return (
    <group>
      {wallConfigs.map((config, i) => (
        <mesh key={i} position={config.position} rotation={config.rotation}>
          <boxGeometry args={config.args} />
          <meshBasicMaterial
            color="#0F0F1F"
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

interface SourceBallProps {
  position: Vec3;
}

function SourceBall({ position }: SourceBallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const targetPos = useRef(new THREE.Vector3(position.x, position.y, position.z));

  useFrame(() => {
    targetPos.current.set(position.x, position.y, position.z);
    if (meshRef.current) {
      meshRef.current.position.lerp(targetPos.current, 0.1);
    }
    if (lightRef.current) {
      lightRef.current.position.lerp(targetPos.current, 0.1);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color="#FF5252"
          emissive="#FF5252"
          emissiveIntensity={0.8}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[position.x, position.y, position.z]}
        color="#FF5252"
        intensity={0.5}
        distance={5}
      />
    </group>
  );
}

interface ReceiverBallProps {
  position: Vec3;
}

function ReceiverBall({ position }: ReceiverBallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const targetPos = useRef(new THREE.Vector3(position.x, position.y, position.z));

  useFrame(() => {
    targetPos.current.set(position.x, position.y, position.z);
    if (meshRef.current) {
      meshRef.current.position.lerp(targetPos.current, 0.1);
    }
    if (lightRef.current) {
      lightRef.current.position.lerp(targetPos.current, 0.1);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color="#448AFF"
          emissive="#448AFF"
          emissiveIntensity={0.8}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[position.x, position.y, position.z]}
        color="#448AFF"
        intensity={0.5}
        distance={5}
      />
    </group>
  );
}

interface PathLineProps {
  path: ReflectionPath;
  isSelected: boolean;
  hasSelection: boolean;
  onSelect: (id: string) => void;
}

function PathLine({ path, isSelected, hasSelection, onSelect }: PathLineProps) {
  const points: [number, number, number][] = path.points.map(
    (p) => [p.x, p.y, p.z] as [number, number, number]
  );

  const baseOpacity = getOpacityForReflection(path.reflectionCount);
  const opacity = isSelected
    ? baseOpacity
    : hasSelection
      ? 0.15
      : baseOpacity;

  const color = isSelected ? '#FFD700' : '#00E5FF';
  const lineWidth = isSelected ? 3 : 2;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(path.id);
      }}
    />
  );
}

function SceneContent() {
  const sourcePos = useSoundStore((state) => state.sourcePos);
  const receiverPos = useSoundStore((state) => state.receiverPos);
  const reflectionPaths = useSoundStore((state) => state.reflectionPaths);
  const selectedPathId = useSoundStore((state) => state.selectedPathId);
  const setSelectedPathId = useSoundStore((state) => state.setSelectedPathId);
  const roomWidth = useSoundStore((state) => state.roomWidth);
  const roomHeight = useSoundStore((state) => state.roomHeight);
  const roomDepth = useSoundStore((state) => state.roomDepth);

  const hasSelection = selectedPathId !== null;

  return (
    <>
      <color attach="background" args={['#0F0F1F']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} />

      <OrbitControls
        makeDefault
        target={[0, roomHeight / 2, 0]}
      />

      <RoomWalls width={roomWidth} height={roomHeight} depth={roomDepth} />
      <SourceBall position={sourcePos} />
      <ReceiverBall position={receiverPos} />

      {reflectionPaths.map((path) => (
        <PathLine
          key={path.id}
          path={path}
          isSelected={selectedPathId === path.id}
          hasSelection={hasSelection}
          onSelect={setSelectedPathId}
        />
      ))}
    </>
  );
}

export default function SoundScene() {
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ position: [10, 8, 10], fov: 50 }}
    >
      <SceneContent />
    </Canvas>
  );
}
