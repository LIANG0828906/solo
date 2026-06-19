import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/store';
import { getTerrainHeight, calculateWindSpeedAtPoint, calculateTurbinePower } from '@/simulator';

interface ParticlesProps {
  count: number;
  heightMap: number[][];
}

export default function Particles({ count, heightMap }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = useStore((state) => state.particleCount);
  const turbines = useStore((state) => state.turbines);
  const updateTurbinePower = useStore((state) => state.updateTurbinePower);

  const { positions, colors, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    const colorStart = new THREE.Color('#64b5f6');
    const colorEnd = new THREE.Color('#1e88e5');

    for (let i = 0; i < count; i++) {
      const z = (Math.random() - 0.5) * 200;
      const x = -100 + Math.random() * 20;
      const y = Math.random() * 30 + 5;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const colorMix = Math.random();
      const color = colorStart.clone().lerp(colorEnd, colorMix);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      velocities[i * 3] = 0.5 + Math.random() * 0.5;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    return { positions, colors, velocities };
  }, [count]);

  useEffect(() => {
    for (const turbine of turbines) {
      const windSpeed = calculateWindSpeedAtPoint(
        turbine.position[0],
        turbine.position[2],
        heightMap,
        turbines.filter((t) => t.id !== turbine.id)
      );
      const power = calculateTurbinePower(windSpeed);
      updateTurbinePower(turbine.id, power, windSpeed);
    }
  }, [turbines.length, heightMap]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const posAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttribute.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x = posArray[i3];
      let y = posArray[i3 + 1];
      let z = posArray[i3 + 2];

      const terrainHeight = getTerrainHeight(heightMap, x, z);
      const windSpeed = calculateWindSpeedAtPoint(x, z, heightMap, turbines);

      let vx = velocities[i3] + windSpeed * 0.05;
      let vy = velocities[i3 + 1];
      let vz = velocities[i3 + 2];

      const targetY = terrainHeight + 5 + Math.random() * 10;
      vy += (targetY - y) * 0.01;

      for (const turbine of turbines) {
        const dx = x - turbine.position[0];
        const dy = y - (turbine.position[1] + 5);
        const dz = z - turbine.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 10) {
          const force = (10 - dist) / 10;
          vx += dx * force * 0.1;
          vy += dy * force * 0.05;
          vz += dz * force * 0.1;

          vx += (Math.random() - 0.5) * force * 0.5;
          vy += (Math.random() - 0.5) * force * 0.3;
          vz += (Math.random() - 0.5) * force * 0.5;
        }
      }

      vy -= (y - terrainHeight - 30) * 0.001;

      x += vx * delta * 30;
      y += vy * delta * 10;
      z += vz * delta * 20;

      y = Math.max(terrainHeight + 1, Math.min(60, y));

      if (x > 105 || z > 105 || z < -105 || y > 80) {
        x = -100 + Math.random() * 10;
        z = (Math.random() - 0.5) * 200;
        y = Math.random() * 20 + 5;
      }

      posArray[i3] = x;
      posArray[i3 + 1] = y;
      posArray[i3 + 2] = z;
    }

    posAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}
