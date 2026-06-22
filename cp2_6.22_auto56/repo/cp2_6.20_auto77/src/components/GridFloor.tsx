import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

export function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null);

  return (
    <group>
      <gridHelper
        ref={gridRef}
        args={[40, 40, '#444444', '#333333']}
        position={[0, 0.001, 0]}
        material-opacity={0.6}
        material-transparent={true}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#1a1a2e"
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}
