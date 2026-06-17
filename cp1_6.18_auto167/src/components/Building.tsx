import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BuildingData } from '@/types';
import { BUILDING_CONSTRAINTS, uiConfig } from '@/data/uiConfig';

interface BuildingMeshProps {
  data: BuildingData;
  animationProgress: number;
  onPointerOver: (e: THREE.Event, building: BuildingData) => void;
  onPointerOut: () => void;
  onClick: (e: THREE.Event, building: BuildingData) => void;
}

const easeOutCubic = uiConfig.animation.easeOutCubic;

export function BuildingMesh({ data, animationProgress, onPointerOver, onPointerOut, onClick }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const prevSelected = useRef(data.selected);
  const prevHovered = useRef(data.hovered);

  const easedProgress = easeOutCubic(Math.min(1, Math.max(0, animationProgress)));
  const currentHeight = Math.max(0.01, data.size[1] * easedProgress);
  const yPos = data.position[1] + currentHeight / 2;

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);
  const edgeColor = useMemo(
    () => new THREE.Color(data.hovered ? uiConfig.colorPalette.highlight : 'rgba(0,0,0,0.15)'),
    [data.hovered],
  );

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  useEffect(() => {
    prevSelected.current = data.selected;
    prevHovered.current = data.hovered;
  }, [data.selected, data.hovered]);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.scale.set(data.size[0], currentHeight, data.size[2]);
    meshRef.current.position.set(data.position[0], yPos, data.position[2]);

    if (edgesRef.current) {
      edgesRef.current.scale.set(data.size[0], currentHeight, data.size[2]);
      edgesRef.current.position.set(data.position[0], yPos, data.position[2]);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver(e, data);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e, data);
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={BUILDING_CONSTRAINTS.glowIntensity * easedProgress}
          roughness={0.7}
          metalness={0.1}
          transparent
          opacity={Math.min(1, easedProgress * 1.2)}
        />
      </mesh>
      <lineSegments ref={edgesRef} geometry={edgeGeometry}>
        <lineBasicMaterial
          color={edgeColor}
          linewidth={1}
          transparent
          opacity={data.hovered ? 1 : 0.3}
        />
      </lineSegments>
    </group>
  );
}

export default BuildingMesh;
