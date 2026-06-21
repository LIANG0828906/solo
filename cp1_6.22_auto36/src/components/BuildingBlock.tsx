import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Building } from '@/types';

interface BuildingBlockProps {
  building: Building;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function BuildingBlock({ building, selected, onSelect }: BuildingBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3(...building.position));
  const targetScale = useRef(new THREE.Vector3(building.width, building.height, building.depth));
  const targetColor = useRef(new THREE.Color(building.color));
  const currentColor = useRef(new THREE.Color(building.color));
  const lineStartRef = useRef(new THREE.Vector3());
  const lineEndRef = useRef(new THREE.Vector3());

  const linePoints = useMemo<[number, number, number][]>(() => {
    const y = building.position[1] - building.height / 2;
    return [
      [building.position[0], 0.01, building.position[2]],
      [building.position[0], y, building.position[2]],
    ];
  }, [building.position[0], building.position[2], building.position[1], building.height]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      targetPos.current.set(...building.position);
      targetScale.current.set(building.width, building.height, building.depth);
      targetColor.current.set(building.color);

      meshRef.current.position.lerp(targetPos.current, Math.min(delta * 4, 1));
      meshRef.current.scale.lerp(targetScale.current, Math.min(delta * 4, 1));

      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      currentColor.current.lerp(targetColor.current, Math.min(delta * 3, 1));
      material.color.copy(currentColor.current);

      const groundY = meshRef.current.position.y - building.height / 2;
      lineStartRef.current.set(meshRef.current.position.x, 0.01, meshRef.current.position.z);
      lineEndRef.current.set(meshRef.current.position.x, groundY, meshRef.current.position.z);
    }
  });

  const handlePointerDown = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(building.id);
  };

  const lineColor = selected ? '#ffdd00' : '#64c8ff';
  const baseOpacity = selected ? 0.8 : 0.4;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={building.position}
        castShadow
        onPointerDown={handlePointerDown}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={building.color}
          transparent
          opacity={0.85}
          roughness={0.3}
          metalness={0.1}
        />
        {selected && (
          <Edges color="#ffffff" threshold={15} scale={1.01} opacity={0.9} transparent />
        )}
      </mesh>

      <ProjectionLine
        start={lineStartRef.current}
        end={lineEndRef.current}
        color={lineColor}
        baseOpacity={baseOpacity}
        pulse={selected}
      />
    </group>
  );
}

interface ProjectionLineProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  baseOpacity: number;
  pulse: boolean;
}

function ProjectionLine({ start, end, color, baseOpacity, pulse }: ProjectionLineProps) {
  const lineRef = useRef<any>(null);

  useFrame(() => {
    if (lineRef.current) {
      const points = lineRef.current.geometry.attributes.position.array as Float32Array;
      points[0] = start.x;
      points[1] = start.y;
      points[2] = start.z;
      points[3] = end.x;
      points[4] = end.y;
      points[5] = end.z;
      lineRef.current.geometry.attributes.position.needsUpdate = true;

      if (pulse) {
        const pulseVal = (Math.sin(performance.now() * 0.008) + 1) / 2;
        lineRef.current.material.opacity = baseOpacity * (0.5 + pulseVal * 0.5);
      } else {
        lineRef.current.material.opacity = baseOpacity;
      }
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[start, end]}
      color={color}
      transparent
      opacity={baseOpacity}
      lineWidth={1}
    />
  );
}
