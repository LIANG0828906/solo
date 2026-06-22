import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioAnalysisData } from '../AudioAnalyzer';

interface ParticleCloudProps {
  audioDataRef: React.MutableRefObject<AudioAnalysisData>;
}

const PARTICLE_COUNT = 2500;
const SPHERE_RADIUS = 3;
const COLOR_CENTER = new THREE.Color('#ffcc66');
const COLOR_OUTER = new THREE.Color('#6677dd');

export function ParticleCloud({ audioDataRef }: ParticleCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const basePositions = useRef<Float32Array | null>(null);
  const baseDistances = useRef<Float32Array | null>(null);
  const targetPositions = useRef<Float32Array | null>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const distances = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * SPHERE_RADIUS;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const dist = Math.sqrt(x * x + y * y + z * z);
      distances[i] = dist;

      const t = dist / SPHERE_RADIUS;
      const color = new THREE.Color().lerpColors(COLOR_CENTER, COLOR_OUTER, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.05 + Math.random() * 0.15;
    }

    basePositions.current = positions.slice();
    baseDistances.current = distances;
    targetPositions.current = positions.slice();

    return { positions, colors, sizes };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !groupRef.current || !basePositions.current || !baseDistances.current || !targetPositions.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const audioData = audioDataRef.current;
    const lowFreq = audioData.lowFrequency;
    const highFreq = audioData.highFrequency;
    const bands = audioData.frequencyBands;

    groupRef.current.rotation.y += 0.5 * delta * (Math.PI / 180);

    const contractFactor = Math.min(lowFreq * 1.5, 1);
    const expandFactor = Math.min(highFreq * 0.8, 1);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const baseDist = baseDistances.current[i];
      const bandIndex = Math.floor((baseDist / SPHERE_RADIUS) * bands.length) % bands.length;
      const bandInfluence = bands[bandIndex] || 0;

      const targetDist = baseDist * (1 - contractFactor * 0.4 + expandFactor * 0.5 + bandInfluence * 0.3);

      const idx = i * 3;
      const ratio = baseDist > 0 ? targetDist / baseDist : 1;

      targetPositions.current[idx] = basePositions.current[idx] * ratio;
      targetPositions.current[idx + 1] = basePositions.current[idx + 1] * ratio;
      targetPositions.current[idx + 2] = basePositions.current[idx + 2] * ratio;

      positions[idx] += (targetPositions.current[idx] - positions[idx]) * 0.15;
      positions[idx + 1] += (targetPositions.current[idx + 1] - positions[idx + 1]) * 0.15;
      positions[idx + 2] += (targetPositions.current[idx + 2] - positions[idx + 2]) * 0.15;
    }

    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const currentPos = Math.sqrt(
        positions[idx] ** 2 + positions[idx + 1] ** 2 + positions[idx + 2] ** 2
      );
      const t = Math.min(currentPos / SPHERE_RADIUS, 1);
      const brightness = 1 - contractFactor * 0.3 + expandFactor * 0.2;
      
      const r = (COLOR_CENTER.r * (1 - t) + COLOR_OUTER.r * t) * brightness;
      const g = (COLOR_CENTER.g * (1 - t) + COLOR_OUTER.g * t) * brightness;
      const b = (COLOR_CENTER.b * (1 - t) + COLOR_OUTER.b * t) * brightness;

      colors[idx] = Math.min(r, 1);
      colors[idx + 1] = Math.min(g, 1);
      colors[idx + 2] = Math.min(b, 1);
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={PARTICLE_COUNT}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
