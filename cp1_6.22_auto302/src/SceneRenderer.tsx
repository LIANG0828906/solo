import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PARTICLE_COUNT } from './WaveParticleEngine';

interface ParticleSystemProps {
  getPositions: () => Float32Array;
}

function ParticleSystem({ getPositions }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  const colors = useMemo(() => {
    const colorArray = new Float32Array(PARTICLE_COUNT * 3);
    const colorStart = new THREE.Color('#1a237e');
    const colorEnd = new THREE.Color('#00e5ff');

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const gridSize = Math.ceil(Math.sqrt(PARTICLE_COUNT));
      const gridY = Math.floor(i / gridSize) / (gridSize - 1);
      const color = colorStart.clone().lerp(colorEnd, gridY);
      const idx = i * 3;
      colorArray[idx] = color.r;
      colorArray[idx + 1] = color.g;
      colorArray[idx + 2] = color.b;
    }
    return colorArray;
  }, []);

  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  useFrame(() => {
    if (geometryRef.current) {
      const newPositions = getPositions();
      const posAttribute = geometryRef.current.attributes.position;
      const posArray = posAttribute.array as Float32Array;
      posArray.set(newPositions);
      posAttribute.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
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
      </bufferGeometry>
      <pointsMaterial
        size={3}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

interface SceneRendererProps {
  getPositions: () => Float32Array;
}

export function SceneRenderer({ getPositions }: SceneRendererProps) {
  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 60 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0b0b1a']} />
      <fog attach="fog" args={['#0b0b1a', 8, 15]} />
      <ParticleSystem getPositions={getPositions} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={15}
        enablePan={true}
      />
    </Canvas>
  );
}
