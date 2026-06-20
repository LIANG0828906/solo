import { memo } from 'react';
import { Edges } from '@react-three/drei';
import { FURNITURE_DEFINITIONS } from '@/models/furnitureData';
import { getThemeColors } from '@/utils/colorUtils';
import type { FurnitureInstance } from '@/models/types';

interface FurnitureItemProps {
  instance: FurnitureInstance;
  isSelected: boolean;
}

function FurnitureItemComponent({ instance, isSelected }: FurnitureItemProps) {
  const def = FURNITURE_DEFINITIONS.find((d) => d.id === instance.definitionId);
  if (!def) return null;

  const themeColors = getThemeColors(def.defaultMaterial.color, 5);
  const color = themeColors[instance.themeColorIndex] ?? def.defaultMaterial.color;

  return (
    <group
      position={instance.position}
      rotation={[0, instance.rotationY, 0]}
      scale={instance.scale}
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
            castShadow
            receiveShadow
          >
            {geometry}
            <meshPhysicalMaterial
              color={meshColor}
              roughness={materialRoughness}
              clearcoat={def.defaultMaterial.clearcoat}
              clearcoatRoughness={0.6}
              metalness={geom.metalness ?? 0}
            />
          </mesh>
        );
      })}

      {isSelected && (
        <Edges threshold={15} color="#ffcc00" scale={1.02} lineWidth={1}>
          <mesh>
            <boxGeometry args={[
              def.defaultSize[0],
              def.defaultSize[1],
              def.defaultSize[2],
            ]} />
            <lineBasicMaterial color="#ffcc00" />
          </mesh>
        </Edges>
      )}
    </group>
  );
}

export const FurnitureItem = memo(FurnitureItemComponent);
