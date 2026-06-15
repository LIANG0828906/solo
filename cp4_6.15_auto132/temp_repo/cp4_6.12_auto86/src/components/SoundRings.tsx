import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioAnalysisData } from '../AudioAnalyzer';

interface SoundRingsProps {
  audioDataRef: React.MutableRefObject<AudioAnalysisData>;
}

const RING_COUNT = 4;
const BASE_RADIUS = 1.5;
const RING_WIDTH = 0.3;
const RING_SEGMENTS = 128;

export function SoundRings({ audioDataRef }: SoundRingsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const baseRadii = useRef<number[]>([]);

  const ringsData = useMemo(() => {
    const data: Array<{
      geometry: THREE.BufferGeometry;
      material: THREE.MeshBasicMaterial;
      baseRadius: number;
    }> = [];

    for (let i = 0; i < RING_COUNT; i++) {
      const baseRadius = BASE_RADIUS + i * RING_WIDTH * 1.5;
      baseRadii.current[i] = baseRadius;

      const innerRadius = baseRadius;
      const outerRadius = baseRadius + RING_WIDTH;

      const shape = new THREE.Shape();
      shape.moveTo(outerRadius, 0);
      for (let j = 1; j <= RING_SEGMENTS; j++) {
        const angle = (j / RING_SEGMENTS) * Math.PI * 2;
        shape.lineTo(
          outerRadius * Math.cos(angle),
          outerRadius * Math.sin(angle)
        );
      }

      const hole = new THREE.Path();
      hole.moveTo(innerRadius, 0);
      for (let j = 1; j <= RING_SEGMENTS; j++) {
        const angle = (j / RING_SEGMENTS) * Math.PI * 2;
        hole.lineTo(
          innerRadius * Math.cos(angle),
          innerRadius * Math.sin(angle)
        );
      }
      shape.holes.push(hole);

      const geometry = new THREE.ShapeGeometry(shape);
      geometry.rotateX(-Math.PI / 2);

      const t = i / RING_COUNT;
      const color = new THREE.Color().lerpColors(
        new THREE.Color('#6677dd'),
        new THREE.Color('#aa88ff'),
        t
      );

      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });

      data.push({ geometry, material, baseRadius });
    }

    return data;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const audioData = audioDataRef.current;
    const energy = audioData.energy;
    const scaleRange = 0.5 + Math.min(energy * 1.5, 1.5);

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;

      const phase = (i / RING_COUNT) * Math.PI * 2 + state.clock.elapsedTime * 0.5;
      const waveOffset = Math.sin(phase) * 0.1;
      const energyOffset = energy * 0.3 * (1 + i * 0.3);

      const targetScale = scaleRange + waveOffset + energyOffset;
      const currentScale = ring.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.12;

      ring.scale.setScalar(newScale);

      const material = ring.material as THREE.MeshBasicMaterial;
      const pulseOpacity = 0.3 + Math.min(energy * 0.5, 0.3);
      material.opacity += (pulseOpacity - material.opacity) * 0.1;
    });
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {ringsData.map((data, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) ringRefs.current[i] = el;
          }}
          geometry={data.geometry}
          material={data.material}
        />
      ))}
    </group>
  );
}
