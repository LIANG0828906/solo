import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Point3D } from './PointCloudData';

interface PointCloudRendererProps {
  points: Point3D[];
}

const PointCloudRenderer: React.FC<PointCloudRendererProps> = ({ points }) => {
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(points.length * 3);
    const col = new Float32Array(points.length * 3);

    if (points.length === 0) {
      return { positions: pos, colors: col };
    }

    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < points.length; i++) {
      if (points[i].z < minZ) minZ = points[i].z;
      if (points[i].z > maxZ) maxZ = points[i].z;
    }
    const zRange = maxZ - minZ || 1;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;

      const t = (p.z - minZ) / zRange;
      const hue = (1 - t) * 240;
      const c = new THREE.Color().setHSL(hue / 360, 1, 0.5);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return { positions: pos, colors: col };
  }, [points]);

  const geomRef = useRef<THREE.BufferGeometry>(null);

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={points.length}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
};

export default PointCloudRenderer;
