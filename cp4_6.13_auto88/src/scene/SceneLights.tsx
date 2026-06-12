import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudioStore } from '@/store/audioStore';

interface SceneLightsProps {
  children?: React.ReactNode;
}

export function SceneLights({ children }: SceneLightsProps) {
  const pointLightRef = useRef<THREE.PointLight>(null);
  const pointLight2Ref = useRef<THREE.PointLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  const amplitude = useAudioStore((state) => state.amplitude);
  const bass = useAudioStore((state) => state.bass);
  const beatDetected = useAudioStore((state) => state.beatDetected);

  useFrame((_state, delta) => {
    if (pointLightRef.current) {
      const intensity = 1 + amplitude * 2;
      pointLightRef.current.intensity = intensity;
      pointLightRef.current.color.setHSL(
        0.75 + bass * 0.15,
        0.8,
        0.5 + amplitude * 0.3
      );
      if (beatDetected) {
        pointLightRef.current.intensity = intensity * 1.5;
      }
    }

    if (pointLight2Ref.current) {
      pointLight2Ref.current.intensity = 0.8 + amplitude * 1.5;
      pointLight2Ref.current.color.setHSL(
        0.5 + bass * 0.2,
        0.7,
        0.5 + amplitude * 0.2
      );
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = 0.3 + amplitude * 0.2;
    }

    delta;
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.4} color="#ffffff" />

      <pointLight
        ref={pointLightRef}
        position={[5, 5, 5]}
        intensity={1}
        distance={20}
        decay={2}
      />

      <pointLight
        ref={pointLight2Ref}
        position={[-5, 3, -5]}
        intensity={0.8}
        distance={15}
        decay={2}
        color="#22D3EE"
      />

      <directionalLight
        position={[0, 10, 0]}
        intensity={0.5}
        color="#ffffff"
        castShadow
      />

      {children}
    </>
  );
}
