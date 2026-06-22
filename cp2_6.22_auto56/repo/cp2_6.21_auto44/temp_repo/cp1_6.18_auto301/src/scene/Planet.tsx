import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../data/planets';
import { useSolarSystemStore } from '../store/useSolarSystemStore';

interface PlanetProps {
  data: PlanetData;
  angle: number;
  rotation: number;
  isHovered: boolean;
  isSelected: boolean;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: () => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

function createNoiseTexture(baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = Math.random() * 3 + 1;
    const variance = Math.floor(Math.random() * 60) - 30;
    const nr = Math.max(0, Math.min(255, r + variance));
    const ng = Math.max(0, Math.min(255, g + variance));
    const nb = Math.max(0, Math.min(255, b + variance));
    ctx.fillStyle = `rgba(${nr},${ng},${nb},${Math.random() * 0.6 + 0.2})`;
    ctx.fillRect(x, y, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function Planet({
  data,
  angle,
  rotation,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onClick,
}: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => createNoiseTexture(data.color), [data.color]);

  const x = Math.cos(angle) * data.orbitRadius;
  const z = Math.sin(angle) * data.orbitRadius;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = rotation;
    }
    if (glowRef.current && isHovered) {
      const pulse = 1.2 + Math.sin(performance.now() * 0.00628) * 0.3;
      glowRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <mesh
        ref={meshRef}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <sphereGeometry args={[data.radius, 32, 32]} />
        <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} />
      </mesh>

      {data.hasRings && (
        <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[data.radius * 1.4, data.radius * 2.2, 64]} />
          <meshBasicMaterial
            color="#C8B896"
            side={THREE.DoubleSide}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {(isHovered || isSelected) && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[data.radius, 32, 32]} />
          <meshBasicMaterial
            color={data.color}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {isHovered && (
        <Html position={[0, data.radius + 0.5, 0]} center distanceFactor={10}>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: '14px',
              fontFamily: 'sans-serif',
              textShadow:
                '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {data.nameCN}
          </div>
        </Html>
      )}
    </group>
  );
}
