import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';

const GRID_EXTENT = 6;

const lerpColor = (color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color => {
  return new THREE.Color().lerpColors(color1, color2, t);
};

const getHeatmapColor = (value: number): THREE.Color => {
  const clamped = Math.max(0, Math.min(1, value));
  const highColor = new THREE.Color(0x0000ff);
  const midColor = new THREE.Color(0x00ff00);
  const lowColor = new THREE.Color(0xff0000);
  
  if (clamped < 0.5) {
    const t = clamped * 2;
    return lerpColor(lowColor, midColor, t);
  } else {
    const t = (clamped - 0.5) * 2;
    return lerpColor(midColor, highColor, t);
  }
};

const Heatmap = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const heatmapData = useSceneStore((state) => state.heatmapData);
  const isSimulating = useSceneStore((state) => state.isSimulating);

  const { geometry, colors } = useMemo(() => {
    const gridSize = heatmapData.gridSize;
    const cellSize = heatmapData.cellSize;
    const halfSize = (gridSize * cellSize) / 2;

    const geometry = new THREE.PlaneGeometry(
      gridSize * cellSize,
      gridSize * cellSize,
      gridSize - 1,
      gridSize - 1
    );

    geometry.rotateX(-Math.PI / 2);

    const colors = new Float32Array(geometry.attributes.position.count * 3);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const index = i * gridSize + j;
        const value = heatmapData.values[i]?.[j] || 0;
        const color = getHeatmapColor(value);

        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry, colors };
  }, [heatmapData.gridSize, heatmapData.cellSize]);

  useEffect(() => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry as THREE.BufferGeometry;
    const colorAttribute = geometry.getAttribute('color') as THREE.BufferAttribute;

    if (!colorAttribute) {
      geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(new Float32Array(colors), 3)
      );
      return;
    }

    const gridSize = heatmapData.gridSize;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const index = i * gridSize + j;
        const value = heatmapData.values[i]?.[j] || 0;
        const color = getHeatmapColor(value);

        colorAttribute.setXYZ(index, color.r, color.g, color.b);
      }
    }

    colorAttribute.needsUpdate = true;
  }, [heatmapData.values]);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <planeGeometry
        args={[GRID_EXTENT * 2, GRID_EXTENT * 2, heatmapData.gridSize - 1, heatmapData.gridSize - 1]}
      />
      <meshBasicMaterial 
        vertexColors 
        transparent 
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default Heatmap;
