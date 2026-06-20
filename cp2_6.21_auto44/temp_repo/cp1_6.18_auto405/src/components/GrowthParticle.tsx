import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Seed, GrowthParams } from '@/types';

interface GrowthParticleProps {
  seed: Seed;
  params: GrowthParams;
  globalTime: number;
  totalParticles: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [1, 1, 1];
}

function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
}

export default function GrowthParticle({
  seed,
  params,
  globalTime,
  totalParticles,
}: GrowthParticleProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const groupRef = useRef<THREE.Group>(null);

  const useLineSegments = totalParticles < 2000;

  const { positions, colors, opacities, linePositions, lineColors, lineOpacities } = useMemo(() => {
    const particleCount = seed.particles.length;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);

    const lineCount = seed.connections.length;
    const linePositions = new Float32Array(lineCount * 6);
    const lineColors = new Float32Array(lineCount * 6);
    const lineOpacities = new Float32Array(lineCount * 2);

    const startRgb = hexToRgb(params.startColor);
    const endRgb = hexToRgb(params.endColor);

    const particleMap = new Map(seed.particles.map((p) => [p.id, p]));

    seed.particles.forEach((particle, i) => {
      const colorT = seed.maxDepth > 0 ? particle.depth / seed.maxDepth : 0;
      const color = lerpColor(startRgb, endRgb, colorT);

      positions[i * 3] = particle.position[0];
      positions[i * 3 + 1] = particle.position[1];
      positions[i * 3 + 2] = particle.position[2];

      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];

      opacities[i] = particle.opacity;
    });

    seed.connections.forEach((conn, i) => {
      const p1 = particleMap.get(conn[0]);
      const p2 = particleMap.get(conn[1]);
      if (!p1 || !p2) return;

      const colorT1 = seed.maxDepth > 0 ? p1.depth / seed.maxDepth : 0;
      const colorT2 = seed.maxDepth > 0 ? p2.depth / seed.maxDepth : 0;
      const color1 = lerpColor(startRgb, endRgb, colorT1);
      const color2 = lerpColor(startRgb, endRgb, colorT2);

      linePositions[i * 6] = p1.position[0];
      linePositions[i * 6 + 1] = p1.position[1];
      linePositions[i * 6 + 2] = p1.position[2];
      linePositions[i * 6 + 3] = p2.position[0];
      linePositions[i * 6 + 4] = p2.position[1];
      linePositions[i * 6 + 5] = p2.position[2];

      lineColors[i * 6] = color1[0];
      lineColors[i * 6 + 1] = color1[1];
      lineColors[i * 6 + 2] = color1[2];
      lineColors[i * 6 + 3] = color2[0];
      lineColors[i * 6 + 4] = color2[1];
      lineColors[i * 6 + 5] = color2[2];

      const dist = Math.sqrt(
        Math.pow(p2.position[0] - p1.position[0], 2) +
          Math.pow(p2.position[1] - p1.position[1], 2) +
          Math.pow(p2.position[2] - p1.position[2], 2)
      );
      const tailOpacity = Math.max(0.1, 1 - dist * 0.3);
      lineOpacities[i * 2] = p1.opacity * tailOpacity;
      lineOpacities[i * 2 + 1] = p2.opacity * tailOpacity;
    });

    return { positions, colors, opacities, linePositions, lineColors, lineOpacities };
  }, [seed.particles, seed.connections, seed.maxDepth, params.startColor, params.endColor]);

  useEffect(() => {
    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    }
    if (linesRef.current) {
      const geometry = linesRef.current.geometry;
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    }
  }, [positions, colors, linePositions, lineColors]);

  useFrame(() => {
    if (!groupRef.current) return;

    const breathScale = 1 + Math.sin(seed.breathPhase) * 0.05;
    groupRef.current.scale.setScalar(breathScale);

    if (seed.status === 'complete' || seed.status === 'fading') {
      const pointsGeometry = pointsRef.current?.geometry;
      if (pointsGeometry) {
        const posAttr = pointsGeometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        seed.particles.forEach((particle, i) => {
          const swingX = Math.sin(globalTime * particle.frequency + particle.phase) * 0.05;
          const swingY = Math.cos(globalTime * particle.frequency * 0.7 + particle.phase) * 0.05;
          const swingZ = Math.sin(globalTime * particle.frequency * 1.3 + particle.phase + 1) * 0.05;

          posArray[i * 3] = particle.originalPosition[0] + swingX;
          posArray[i * 3 + 1] = particle.originalPosition[1] + swingY;
          posArray[i * 3 + 2] = particle.originalPosition[2] + swingZ;
        });
        posAttr.needsUpdate = true;

        if (useLineSegments && linesRef.current) {
          const lineGeometry = linesRef.current.geometry;
          const linePosAttr = lineGeometry.attributes.position as THREE.BufferAttribute;
          const linePosArray = linePosAttr.array as Float32Array;

          const particleMap = new Map(
            seed.particles.map((p) => [
              p.id,
              {
                x: p.originalPosition[0] + Math.sin(globalTime * p.frequency + p.phase) * 0.05,
                y: p.originalPosition[1] + Math.cos(globalTime * p.frequency * 0.7 + p.phase) * 0.05,
                z: p.originalPosition[2] + Math.sin(globalTime * p.frequency * 1.3 + p.phase + 1) * 0.05,
              },
            ])
          );

          seed.connections.forEach((conn, i) => {
            const p1 = particleMap.get(conn[0]);
            const p2 = particleMap.get(conn[1]);
            if (!p1 || !p2) return;

            linePosArray[i * 6] = p1.x;
            linePosArray[i * 6 + 1] = p1.y;
            linePosArray[i * 6 + 2] = p1.z;
            linePosArray[i * 6 + 3] = p2.x;
            linePosArray[i * 6 + 4] = p2.y;
            linePosArray[i * 6 + 5] = p2.z;
          });
          linePosAttr.needsUpdate = true;
        }
      }
    }
  });

  if (seed.status === 'waiting') {
    return (
      <mesh position={seed.position}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.9} />
      </mesh>
    );
  }

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={seed.particles.length}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={seed.particles.length}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {useLineSegments && (
        <lineSegments ref={linesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={seed.connections.length * 2}
              array={linePositions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={seed.connections.length * 2}
              array={lineColors}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial vertexColors transparent opacity={0.8} linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}
