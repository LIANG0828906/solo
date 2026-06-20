import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { DragControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/store';
import { getTerrainHeight } from '@/simulator';

interface TurbineProps {
  id: string;
  position: [number, number, number];
  windSpeed: number;
  power: number;
  heightMap: number[][];
}

export default function Turbine({
  id,
  position,
  windSpeed,
  power,
  heightMap,
}: TurbineProps) {
  const bladesRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const updateTurbine = useStore((state) => state.updateTurbine);
  const updateTurbinePower = useStore((state) => state.updateTurbinePower);

  useFrame((_, delta) => {
    if (bladesRef.current) {
      const rotationSpeed = 1 + windSpeed * 0.2;
      bladesRef.current.rotation.z += delta * rotationSpeed;
    }

    const noise = (Math.random() - 0.5) * 0.5;
    const currentPower = Math.max(0, power + noise);
    const currentSpeed = Math.max(0, windSpeed + noise * 0.2);
    updateTurbinePower(id, currentPower, currentSpeed);
  });

  const handleDragEnd = () => {
    setIsDragging(false);
    if (!groupRef.current) return;
    const pos = groupRef.current.position;
    const newX = Math.max(-95, Math.min(95, pos.x));
    const newZ = Math.max(-95, Math.min(95, pos.z));
    const newY = getTerrainHeight(heightMap, newX, newZ) + 0.1;
    updateTurbine(id, [newX, newY, newZ]);
  };

  return (
    <DragControls
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <group ref={groupRef} position={position}>
        <mesh position={[0, 4, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.5, 8, 8]} />
          <meshStandardMaterial color="#e0e0e0" metalness={0.5} roughness={0.3} />
        </mesh>

        <mesh position={[0, 8.2, 0]} castShadow>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial color="#bdbdbd" metalness={0.6} roughness={0.2} />
        </mesh>

        <group ref={bladesRef} position={[0, 8.2, 0.6]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} castShadow>
              <boxGeometry args={[0.15, 4, 0.1]} />
              <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
            </mesh>
          ))}
        </group>

        <Html
          position={[0, 10, 0]}
          center
          distanceFactor={10}
          zIndexRange={[100, 0]}
        >
          <div
            className="px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
            style={{
              background: 'rgba(30, 30, 30, 0.9)',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {windSpeed.toFixed(1)} m/s
          </div>
        </Html>
      </group>
    </DragControls>
  );
}
