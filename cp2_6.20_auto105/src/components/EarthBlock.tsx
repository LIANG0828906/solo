import React, { useMemo } from 'react';
import { useSceneStore } from '@/store/useSceneStore';
import { selectGeologicLayers, selectDensity } from '@/store/useSceneStore';
import type { GeologicLayerConfig } from '@/types';

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

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function adjustColorByDensity(
  baseColor: string,
  baseDensity: number,
  userDensity: number,
  _layerOpacity: number
): string {
  const [r, g, b] = hexToRgb(baseColor);

  const densityRatio = (userDensity - 1000) / (5000 - 1000);

  const darkBrownR = 0.2;
  const darkBrownG = 0.1;
  const darkBrownB = 0.05;

  const t = densityRatio;
  const newR = r + (darkBrownR - r) * t * 0.6;
  const newG = g + (darkBrownG - g) * t * 0.6;
  const newB = b + (darkBrownB - b) * t * 0.6;

  const layerDensityFactor = Math.min(1, baseDensity / 5000);
  const brightness = 1 - layerDensityFactor * 0.4;

  const finalR = newR * brightness * 0.9 + 0.1;
  const finalG = newG * brightness * 0.85 + 0.08;
  const finalB = newB * brightness * 0.8 + 0.05;

  return rgbToString(finalR, finalG, finalB);
}

interface LayerMeshProps {
  layer: GeologicLayerConfig;
  yCenter: number;
  color: string;
  opacity: number;
  size: [number, number, number];
  position: [number, number, number];
  layerIndex: number;
}

const LayerMesh: React.FC<LayerMeshProps> = ({
  layer,
  color,
  opacity,
  size,
  position,
  layerIndex,
}) => {
  void layer;
  const renderOrder = 100 - layerIndex;

  return (
    <group>
      <mesh position={position} castShadow receiveShadow renderOrder={renderOrder}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={2}
          roughness={0.85}
          metalness={0.05}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[position[0], position[1] + size[1] / 2, position[2]]} renderOrder={renderOrder + 1}>
        <boxGeometry args={[size[0], 0.02, size[2]]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          side={2}
          metalness={0.3}
          roughness={0.2}
          emissive="#ffffff"
          emissiveIntensity={0.05}
        />
      </mesh>

      <mesh position={[position[0], position[1] - size[1] / 2, position[2]]} renderOrder={renderOrder + 1}>
        <boxGeometry args={[size[0], 0.02, size[2]]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.15}
          side={2}
        />
      </mesh>
    </group>
  );
};

interface GridHelperProps {
  size: number;
  divisions: number;
  position: [number, number, number];
  opacity: number;
}

const GridHelper: React.FC<GridHelperProps> = ({ size, divisions, position, opacity }) => {
  const lines = useMemo(() => {
    const result: React.ReactElement[] = [];
    const step = size / divisions;
    const halfSize = size / 2;

    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      const isMainLine = i % 5 === 0;
      const lineOpacity = isMainLine ? opacity * 1.5 : opacity * 0.6;
      const lineWidth = isMainLine ? 0.015 : 0.008;

      result.push(
        <mesh
          key={`x-${i}`}
          position={[0, position[1], pos]}
          rotation={[0, 0, 0]}
        >
          <boxGeometry args={[size, lineWidth, lineWidth]} />
          <meshBasicMaterial
            color="#4fc3f7"
            transparent
            opacity={lineOpacity}
            depthWrite={false}
          />
        </mesh>
      );

      result.push(
        <mesh
          key={`z-${i}`}
          position={[pos, position[1], 0]}
          rotation={[0, 0, 0]}
        >
          <boxGeometry args={[lineWidth, lineWidth, size]} />
          <meshBasicMaterial
            color="#4fc3f7"
            transparent
            opacity={lineOpacity}
            depthWrite={false}
          />
        </mesh>
      );
    }

    return result;
  }, [size, divisions, position, opacity]);

  return <group>{lines}</group>;
};

const WireframeBox: React.FC<{ size: [number, number, number]; position: [number, number, number] }> = ({
  size,
  position,
}) => {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.08}
        side={2}
        wireframe
        wireframeLinewidth={1}
      />
    </mesh>
  );
};

export const EarthBlock: React.FC = () => {
  const geologicLayers = useSceneStore(selectGeologicLayers);
  const density = useSceneStore(selectDensity);

  const { layers, showGrid, gridOpacity } = geologicLayers;

  const layersWithGeometry = useMemo(() => {
    let currentY = 5;

    return layers.map((layer, index) => {
      const height = layer.thickness;
      const yCenter = currentY - height / 2;
      currentY -= height;

      const color = adjustColorByDensity(layer.baseColor, layer.baseDensity, density, layer.opacity);
      const size: [number, number, number] = [20, height, 20];
      const position: [number, number, number] = [0, yCenter, 0];

      return {
        ...layer,
        yCenter,
        color,
        size,
        position,
        layerIndex: index,
      };
    });
  }, [layers, density]);

  const layerMeshes = useMemo(() => {
    return layersWithGeometry.map((layer) => (
      <LayerMesh
        key={`layer-${layer.name}-${layer.layerIndex}`}
        layer={layer}
        yCenter={layer.yCenter}
        color={layer.color}
        opacity={layer.opacity}
        size={layer.size}
        position={layer.position}
        layerIndex={layer.layerIndex}
      />
    ));
  }, [layersWithGeometry]);

  const gridHelpers = useMemo(() => {
    if (!showGrid) return null;

    const grids: React.ReactElement[] = [];
    let currentY = 5;

    layersWithGeometry.forEach((layer, index) => {
      if (index === 0) {
        grids.push(
          <GridHelper
            key={`grid-top`}
            size={20}
            divisions={20}
            position={[0, 5, 0]}
            opacity={gridOpacity}
          />
        );
      }

      currentY -= layer.thickness;
      grids.push(
        <GridHelper
          key={`grid-${layer.layerIndex}`}
          size={20}
          divisions={20}
          position={[0, currentY, 0]}
          opacity={gridOpacity * 0.7}
        />
      );
    });

    return grids;
  }, [showGrid, gridOpacity, layersWithGeometry]);

  return (
    <group>
      {layerMeshes}
      {gridHelpers}
      <WireframeBox size={[20, 10, 20]} position={[0, 0, 0]} />
    </group>
  );
};
