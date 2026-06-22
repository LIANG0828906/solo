import React, { useMemo } from 'react';
import * as THREE from 'three';

export const Globe: React.FC = () => {
  const gridMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#4FC3F7',
      transparent: true,
      opacity: 0.25,
    });
  }, []);

  const gridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const radius = 5.01;
    const latSegments = 12;
    const lngSegments = 24;

    for (let i = 0; i <= latSegments; i++) {
      const lat = (i / latSegments) * Math.PI - Math.PI / 2;
      for (let j = 0; j <= lngSegments; j++) {
        const lng = (j / lngSegments) * Math.PI * 2 - Math.PI;
        const x = radius * Math.cos(lat) * Math.cos(lng);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.sin(lng);
        points.push(new THREE.Vector3(x, y, z));
        if (j < lngSegments) {
          const lng2 = ((j + 1) / lngSegments) * Math.PI * 2 - Math.PI;
          const x2 = radius * Math.cos(lat) * Math.cos(lng2);
          const y2 = radius * Math.sin(lat);
          const z2 = radius * Math.cos(lat) * Math.sin(lng2);
          points.push(new THREE.Vector3(x2, y2, z2));
        }
      }
    }

    for (let j = 0; j <= lngSegments; j++) {
      const lng = (j / lngSegments) * Math.PI * 2 - Math.PI;
      for (let i = 0; i <= latSegments; i++) {
        const lat = (i / latSegments) * Math.PI - Math.PI / 2;
        const x = radius * Math.cos(lat) * Math.cos(lng);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.sin(lng);
        points.push(new THREE.Vector3(x, y, z));
        if (i < latSegments) {
          const lat2 = ((i + 1) / latSegments) * Math.PI - Math.PI / 2;
          const x2 = radius * Math.cos(lat2) * Math.cos(lng);
          const y2 = radius * Math.sin(lat2);
          const z2 = radius * Math.cos(lat2) * Math.sin(lng);
          points.push(new THREE.Vector3(x2, y2, z2));
        }
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, []);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[5, 64, 64]} />
        <meshStandardMaterial
          color="#1A237E"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[4.99, 64, 64]} />
        <meshStandardMaterial
          color="#0A0E27"
          transparent
          opacity={0.9}
          side={THREE.FrontSide}
        />
      </mesh>

      <lineSegments geometry={gridGeometry} material={gridMaterial} />
    </group>
  );
};
