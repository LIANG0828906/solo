import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { FURNITURE_DEFINITIONS } from '@/models/furnitureData';
import { getThemeColors } from '@/utils/colorUtils';

export function DragPreview() {
  const isDraggingNew = useAppStore((s) => s.isDraggingNew);
  const previewPosition = useAppStore((s) => s.previewPosition);
  const groupRef = useRef<THREE.Group>(null);

  if (isDraggingNew === null || previewPosition === null) {
    return null;
  }

  const def = FURNITURE_DEFINITIONS.find((d) => d.id === isDraggingNew);
  if (!def) return null;

  const themeColors = getThemeColors(def.defaultMaterial.color, 5);
  const color = themeColors[0];

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = previewPosition[1] + Math.sin(t * 3) * 0.05;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[previewPosition[0], previewPosition[1], previewPosition[2]]}
      rotation={[0, 0, 0]}
      scale={1}
    >
      {def.geometries.map((geom, idx) => {
        const scale = geom.scale ?? [1, 1, 1];
        let geometry: JSX.Element;

        switch (geom.type) {
          case 'box':
            geometry = <boxGeometry args={[scale[0], scale[1], scale[2]]} />;
            break;
          case 'cylinder':
            geometry = <cylinderGeometry args={[scale[0], scale[1], scale[2], 32]} />;
            break;
          case 'sphere':
            geometry = <sphereGeometry args={[scale[0], 32, 32]} />;
            break;
          case 'cone':
            geometry = <coneGeometry args={[scale[0], scale[1], 32]} />;
            break;
          default:
            geometry = <boxGeometry args={[scale[0], scale[1], scale[2]]} />;
        }

        const meshColor = geom.color ?? color;
        const materialRoughness = geom.roughness ?? def.defaultMaterial.roughness;

        return (
          <mesh
            key={idx}
            position={geom.position}
            rotation={geom.rotation ?? [0, 0, 0]}
            castShadow={false}
            receiveShadow={false}
          >
            {geometry}
            <meshPhysicalMaterial
              color={meshColor}
              roughness={materialRoughness}
              clearcoat={def.defaultMaterial.clearcoat}
              clearcoatRoughness={0.6}
              metalness={geom.metalness ?? 0}
              transparent
              opacity={0.35}
            />
          </mesh>
        );
      })}
    </group>
  );
}
