import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_COUNT } from '../../utils/constants';

const Starfield = () => {
  const starsRef = useRef<THREE.Points>(null);
  const nebulaRef = useRef<THREE.Points>(null);

  const [starPositions, starColors] = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        colors[i3] = 0.7 + Math.random() * 0.3;
        colors[i3 + 1] = 0.7 + Math.random() * 0.3;
        colors[i3 + 2] = 1.0;
      } else if (colorChoice < 0.8) {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i3 + 2] = 0.6 + Math.random() * 0.2;
      } else {
        colors[i3] = 0.8 + Math.random() * 0.2;
        colors[i3 + 1] = 0.6 + Math.random() * 0.2;
        colors[i3 + 2] = 1.0;
      }
    }

    return [positions, colors];
  }, []);

  const nebulaPositions = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = (Math.random() - 0.5) * 80;
      positions[i3 + 2] = (Math.random() - 0.5) * 80;
    }
    return positions;
  }, []);

  useFrame((_, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.01;
    }
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y -= delta * 0.005;
      nebulaRef.current.rotation.x += delta * 0.002;
    }
  });

  return (
    <group>
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={starPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={starColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>

      <points ref={nebulaRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={200}
            array={nebulaPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={3}
          color="#6c63ff"
          transparent
          opacity={0.1}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

export default Starfield;
