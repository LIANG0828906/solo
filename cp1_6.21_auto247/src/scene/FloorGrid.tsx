import { useMemo } from 'react';
import * as THREE from 'three';

export const GRID_UNIT = 16;
export const GRID_SIZE = 20;

export default function FloorGrid() {
  const lines = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];

    const totalSize = GRID_SIZE * GRID_UNIT;
    const halfSize = totalSize / 2;

    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * GRID_UNIT - halfSize;
      vertices.push(pos, 0, -halfSize);
      vertices.push(pos, 0, halfSize);
      vertices.push(-halfSize, 0, pos);
      vertices.push(halfSize, 0, pos);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, []);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#374151" linewidth={1} />
    </lineSegments>
  );
}
