import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface DunesProps {
  size?: number;
  segments?: number;
}

export function Dunes({ size = 200, segments = 128 }: DunesProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colorArray = new Float32Array(positions.count * 3);

    const sandLight = new THREE.Color('#e8d5a3');
    const sandDark = new THREE.Color('#8b6b3a');

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const height =
        Math.sin(x * 0.03) * 2.5 +
        Math.cos(z * 0.025) * 3 +
        Math.sin(x * 0.01 + z * 0.015) * 4 +
        Math.sin((x + z) * 0.02) * 2 +
        (Math.random() - 0.5) * 0.3;

      positions.setY(i, height);

      const normalizedHeight = (height + 5) / 15;
      const color = sandLight.clone().lerp(sandDark, Math.max(0, Math.min(1, normalizedHeight * 0.8)));

      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();

    return { geometry: geo, colors: colorArray };
  }, [size, segments]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: false,
    });
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
