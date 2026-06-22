import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface DragonAvatar3DProps {
  color: string;
  element: string;
  size?: number;
  autoRotate?: boolean;
  breathing?: boolean;
}

function PixelDragon({ color, element }: { color: string; element: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin(time * 2) * 0.05;
      groupRef.current.rotation.y = time * 0.5;
    }
    if (headRef.current) {
      const time = state.clock.elapsedTime;
      headRef.current.rotation.x = Math.sin(time * 1.5) * 0.1;
    }
  });

  const eyeColor = useMemo(() => {
    switch (element) {
      case 'fire':
        return '#ffdd00';
      case 'water':
        return '#00ffff';
      case 'wind':
        return '#aaffaa';
      case 'earth':
        return '#ffaa00';
      case 'light':
        return '#ffffff';
      default:
        return '#ffffff';
    }
  }, [element]);

  const secondaryColor = useMemo(() => {
    switch (element) {
      case 'fire':
        return '#ff4400';
      case 'water':
        return '#0088ff';
      case 'wind':
        return '#00aa44';
      case 'earth':
        return '#885500';
      case 'light':
        return '#ffee88';
      default:
        return color;
    }
  }, [element, color]);

  return (
    <group ref={groupRef}>
      <mesh ref={bodyRef} position={[0, -0.2, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      <mesh position={[0, 0.2, 0.3]} ref={headRef}>
        <boxGeometry args={[0.45, 0.4, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      <mesh position={[-0.12, 0.25, 0.5]}>
        <boxGeometry args={[0.08, 0.08, 0.05]} />
        <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.12, 0.25, 0.5]}>
        <boxGeometry args={[0.08, 0.08, 0.05]} />
        <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={0.5} />
      </mesh>

      <mesh position={[0, 0.45, 0.15]}>
        <boxGeometry args={[0.1, 0.25, 0.1]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[-0.15, 0.4, 0.1]}>
        <boxGeometry args={[0.08, 0.18, 0.08]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0.15, 0.4, 0.1]}>
        <boxGeometry args={[0.08, 0.18, 0.08]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.4} roughness={0.4} />
      </mesh>

      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.3, 0.05, 0.25]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.3} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.3, 0.05, 0.25]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.3} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, -0.45, -0.3]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      <mesh position={[-0.2, -0.5, 0]}>
        <boxGeometry args={[0.12, 0.15, 0.12]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0.2, -0.5, 0]}>
        <boxGeometry args={[0.12, 0.15, 0.12]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      <pointLight color={color} intensity={0.5} distance={2} />
    </group>
  );
}

function Scene({ color, element }: { color: string; element: string }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#8888ff" />
      <PixelDragon color={color} element={element} />
    </>
  );
}

export default function DragonAvatar3D({
  color,
  element,
  size = 120,
  autoRotate = true,
}: DragonAvatar3DProps) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <Scene color={color} element={element} />
        {autoRotate && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />}
        {!autoRotate && <OrbitControls enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}
