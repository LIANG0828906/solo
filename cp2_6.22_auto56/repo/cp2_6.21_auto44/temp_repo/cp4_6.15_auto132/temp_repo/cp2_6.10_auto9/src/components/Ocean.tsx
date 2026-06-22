import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import oceanVertex from '@/shaders/oceanVertex.glsl';
import oceanFragment from '@/shaders/oceanFragment.glsl';
import { useStore } from '@/store/useStore';
import { WIND_LEVELS, WindLevel } from '@/types';

const Ocean = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const waveHeight = useStore((state) => state.waveHeight);
  const windLevel = useStore((state) => state.windLevel);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaveHeight: { value: 0.3 },
      uWaveFrequency: { value: 0.5 },
      uWindLevel: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      const windConfig = WIND_LEVELS[windLevel as WindLevel] || WIND_LEVELS[0];
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uWaveHeight.value = waveHeight;
      materialRef.current.uniforms.uWaveFrequency.value = windConfig.waveFrequency;
      materialRef.current.uniforms.uWindLevel.value = windLevel;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[200, 200, 256, 256]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={oceanVertex}
        fragmentShader={oceanFragment}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default Ocean;
