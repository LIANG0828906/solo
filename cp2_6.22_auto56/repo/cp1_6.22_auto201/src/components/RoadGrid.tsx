import { useMemo } from 'react';
import * as THREE from 'three';

export default function RoadGrid() {
  const gridSize = 200;
  const divisions = 20;

  const roadLines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const step = gridSize / divisions;

    for (let i = -gridSize / 2; i <= gridSize / 2; i += step) {
      points.push(new THREE.Vector3(-gridSize / 2, 0.02, i));
      points.push(new THREE.Vector3(gridSize / 2, 0.02, i));
      points.push(new THREE.Vector3(i, 0.02, -gridSize / 2));
      points.push(new THREE.Vector3(i, 0.02, gridSize / 2));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      <gridHelper
        args={[gridSize, divisions, '#334155', '#1e293b']}
        position={[0, 0.01, 0]}
      />

      <lineSegments geometry={roadLines}>
        <lineBasicMaterial color="#475569" linewidth={2} />
      </lineSegments>
    </group>
  );
}
