import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  count?: number;
}

export default function AmbientParticles({ count = 80 }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = -Math.random() * 28 - 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return arr;
  }, [count]);

  const velocities = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.02;
      arr[i * 3 + 1] = Math.random() * 0.01 + 0.002;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return arr;
  }, [count]);

  const phase = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) arr[i] = Math.random() * Math.PI * 2;
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArr[i3] += velocities[i3] + Math.sin(t * 0.4 + phase[i]) * 0.003;
      posArr[i3 + 1] += velocities[i3 + 1];
      posArr[i3 + 2] += velocities[i3 + 2] + Math.cos(t * 0.3 + phase[i]) * 0.003;

      if (posArr[i3 + 1] > 1) {
        posArr[i3 + 1] = -28;
        posArr[i3] = (Math.random() - 0.5) * 60;
        posArr[i3 + 2] = (Math.random() - 0.5) * 60;
      }
      if (Math.abs(posArr[i3]) > 35) {
        posArr[i3] = (Math.random() - 0.5) * 60;
      }
      if (Math.abs(posArr[i3 + 2]) > 35) {
        posArr[i3 + 2] = (Math.random() - 0.5) * 60;
      }
    }
    posAttr.needsUpdate = true;

    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.4 + Math.sin(t * 1.2) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.18}
        color="#aaddff"
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
