import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { ShadowPolygon } from '@/types';

interface ShadowProjectionProps {
  shadowPolygons: ShadowPolygon[];
}

export function ShadowProjection({ shadowPolygons }: ShadowProjectionProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    if (!meshRef.current) return;

    const allVertices: number[] = [];
    const allIndices: number[] = [];
    let vertexOffset = 0;

    for (const polygon of shadowPolygons) {
      if (polygon.points.length < 3) continue;

      for (const [x, z] of polygon.points) {
        allVertices.push(x, 0.02, z);
      }

      for (let i = 1; i < polygon.points.length - 1; i++) {
        allIndices.push(vertexOffset, vertexOffset + i, vertexOffset + i + 1);
      }

      vertexOffset += polygon.points.length;
    }

    if (!geometryRef.current) {
      geometryRef.current = new THREE.BufferGeometry();
      meshRef.current.geometry = geometryRef.current;
    }

    const geo = geometryRef.current;
    const positionAttr = geo.getAttribute('position') as THREE.BufferAttribute;

    if (!positionAttr || positionAttr.count * 3 !== allVertices.length) {
      geo.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
    } else {
      const arr = positionAttr.array as Float32Array;
      for (let i = 0; i < allVertices.length; i++) {
        arr[i] = allVertices[i];
      }
      positionAttr.needsUpdate = true;
    }

    const indexAttr = geo.getIndex();
    if (!indexAttr || indexAttr.count !== allIndices.length) {
      geo.setIndex(allIndices);
    } else {
      const arr = indexAttr.array as Uint32Array;
      for (let i = 0; i < allIndices.length; i++) {
        arr[i] = allIndices[i];
      }
      indexAttr.needsUpdate = true;
    }

    geo.computeVertexNormals();
  }, [shadowPolygons]);

  return (
    <mesh ref={meshRef} material={material} renderOrder={-1}>
      <bufferGeometry />
    </mesh>
  );
}
