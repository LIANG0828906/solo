import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { generateTerrainHeights } from '../utils/terrain';

interface TerrainProps {
  onClick?: (point: THREE.Vector3) => void;
}

export function Terrain({ onClick }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const size = 20;
  const segments = 20;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const heights = generateTerrainHeights();
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const y = heights[i];
      positions.setY(i, y);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (onClick) {
      onClick(event.point);
    }
  };

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      receiveShadow
      onClick={handleClick}
    >
      <meshStandardMaterial
        color="#6b8e23"
        roughness={0.8}
        metalness={0.1}
        flatShading={false}
      />
      <gridHelper
        args={[size, segments, '#4a5d23', '#4a5d23']}
        position={[0, 0.01, 0]}
      />
    </mesh>
  );
}
