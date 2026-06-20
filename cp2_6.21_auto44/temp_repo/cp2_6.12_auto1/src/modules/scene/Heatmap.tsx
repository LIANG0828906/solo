import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SunData, WeatherMode } from '../../types';

interface HeatmapProps {
  sunData: SunData;
  weather: WeatherMode;
  size: [number, number];
  position: [number, number, number];
  resolution?: number;
}

export function Heatmap({
  sunData,
  weather,
  size,
  position,
  resolution = 40,
}: HeatmapProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size[0], size[1], resolution, resolution);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [size, resolution]);

  useFrame(() => {
    if (!meshRef.current) return;

    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    if (!material.onBeforeCompile) return;

    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    const sunAltRad = (sunData.altitude * Math.PI) / 180;
    const sunAzRad = (sunData.azimuth * Math.PI) / 180;

    const sunDir = new THREE.Vector3(
      Math.cos(sunAltRad) * Math.sin(sunAzRad),
      Math.sin(sunAltRad),
      Math.cos(sunAltRad) * Math.cos(sunAzRad)
    ).normalize();

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      const halfW = size[0] / 2;
      const halfD = size[1] / 2;

      let directFactor = 0;

      if (sunData.altitude > 0) {
        const wallLeft = -halfW + 0.1;
        const wallRight = halfW - 0.1;
        const wallBack = -halfD + 0.1;
        const wallFront = halfD - 0.1;

        const tToBack = (position[2] - wallBack - position[2]) / (sunDir.z || 0.001);
        const tToFront = (wallFront - position[2]) / (sunDir.z || 0.001);
        const tToLeft = (wallLeft - x) / (sunDir.x || 0.001);
        const tToRight = (wallRight - x) / (sunDir.x || 0.001);

        let minT = Infinity;
        if (sunDir.z > 0 && tToFront > 0) minT = Math.min(minT, tToFront);
        if (sunDir.z < 0 && tToBack > 0) minT = Math.min(minT, tToBack);
        if (sunDir.x > 0 && tToRight > 0) minT = Math.min(minT, tToRight);
        if (sunDir.x < 0 && tToLeft > 0) minT = Math.min(minT, tToLeft);

        const heightAtWall = position[1] + sunDir.y * minT;
        directFactor = heightAtWall > 2.5 ? 0.8 : 0.3;
      }

      const ambientFactor = 0.3 + sunData.ambientIntensity * 0.3;

      const totalIntensity = Math.min(
        1,
        directFactor * sunData.directIntensity * 0.5 + ambientFactor
      );

      const color = new THREE.Color();
      color.setHSL(0.65 - totalIntensity * 0.65, 0.8, 0.3 + totalIntensity * 0.3);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  });

  const opacity = weather === 'sunny' ? 0.4 : weather === 'cloudy' ? 0.3 : 0.2;

  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshBasicMaterial vertexColors transparent opacity={opacity} />
    </mesh>
  );
}
