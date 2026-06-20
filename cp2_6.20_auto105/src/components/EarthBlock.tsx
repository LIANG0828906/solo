import React, { useMemo } from 'react';
import { GEOLOGIC_LAYERS } from '@/types';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0.5, 0.5, 0.5];
}

function adjustColorByDensity(
  baseColor: string,
  baseDensity: number,
  userDensity: number
): string {
  const [r, g, b] = hexToRgb(baseColor);

  const densityRatio = (userDensity - 1000) / (5000 - 1000);

  const darkBrownR = 0.25;
  const darkBrownG = 0.15;
  const darkBrownB = 0.08;

  const t = densityRatio;
  const newR = r + (darkBrownR - r) * t * 0.7;
  const newG = g + (darkBrownG - g) * t * 0.7;
  const newB = b + (darkBrownB - b) * t * 0.7;

  const ratio = baseDensity / 13000;
  const layerDarken = 1 - ratio * 0.15;

  return `rgb(${Math.round(Math.max(0, Math.min(1, newR * layerDarken)) * 255)}, ${Math.round(Math.max(0, Math.min(1, newG * layerDarken)) * 255)}, ${Math.round(Math.max(0, Math.min(1, newB * layerDarken)) * 255)})`;
}

interface EarthBlockProps {
  density: number;
}

const LayerMesh: React.FC<{
  color: string;
  size: [number, number, number];
  position: [number, number, number];
}> = ({ color, size, position }) => {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        side={2}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};

export const EarthBlock: React.FC<EarthBlockProps> = ({ density }) => {
  const layersWithColors = useMemo(() => {
    return GEOLOGIC_LAYERS.map((layer) => ({
      ...layer,
      color: adjustColorByDensity(layer.baseColor, layer.baseDensity, density),
    }));
  }, [density]);

  const meshes = useMemo(() => {
    return layersWithColors.map((layer, index) => {
      const height = layer.yMax - layer.yMin;
      const yCenter = (layer.yMax + layer.yMin) / 2;
      const size: [number, number, number] = [20, height, 20];
      const position: [number, number, number] = [0, yCenter, 0];

      return (
        <LayerMesh
          key={`layer-${index}`}
          color={layer.color}
          size={size}
          position={position}
        />
      );
    });
  }, [layersWithColors]);

  return (
    <group>
      {meshes}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[20, 10, 20]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          side={2}
          wireframe
        />
      </mesh>
    </group>
  );
};
