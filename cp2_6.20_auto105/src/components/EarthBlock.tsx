import React, { useMemo } from 'react';
import { GEOLOGIC_LAYERS } from '@/types';
import type { GeologicLayer } from '@/types';

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

function rgbToHex(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function adjustColorByDensity(
  baseColor: string,
  _baseDensity: number,
  currentDensity: number
): string {
  const [r, g, b] = hexToRgb(baseColor);
  const densityRatio = (currentDensity - 1000) / (5000 - 1000);
  const darkenFactor = 1 - densityRatio * 0.5;
  return rgbToHex(r * darkenFactor, g * darkenFactor * 0.95, b * darkenFactor * 0.9);
}

interface EarthBlockProps {
  density: number;
}

interface LayerMeshProps {
  layer?: GeologicLayer;
  color: string;
  size: [number, number, number];
  position: [number, number, number];
}

const LayerMesh: React.FC<LayerMeshProps> = ({ color, size, position }) => {
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
