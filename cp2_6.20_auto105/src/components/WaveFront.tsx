import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WaveData, Hypocenter } from '@/types';

interface WaveFrontProps {
  waveData: WaveData;
  hypocenter: Hypocenter;
  magnitude: number;
}

export const WaveFront: React.FC<WaveFrontProps> = ({ waveData, hypocenter, magnitude }) => {
  const pWaveRef = useRef<THREE.Mesh>(null);
  const sWaveRef = useRef<THREE.Mesh>(null);
  const pWaveOuterRef = useRef<THREE.Mesh>(null);
  const sWaveOuterRef = useRef<THREE.Mesh>(null);

  const maxRadius = 15;

  const magnitudeScale = 1 + (magnitude - 5) * 0.1;

  const fadeOpacity = (radius: number, max: number): number => {
    if (radius <= 0) return 0;
    const ratio = radius / max;
    if (ratio < 0.1) return ratio * 10;
    if (ratio > 0.8) return (1 - ratio) * 5;
    return 0.7;
  };

  useFrame(() => {
    const pScale = Math.min(waveData.pWaveRadius, maxRadius) * magnitudeScale;
    const sScale = Math.min(waveData.sWaveRadius, maxRadius) * magnitudeScale;

    const pOpacity = fadeOpacity(waveData.pWaveRadius, maxRadius);
    const sOpacity = fadeOpacity(waveData.sWaveRadius, maxRadius);

    if (pWaveRef.current) {
      pWaveRef.current.scale.setScalar(pScale);
      const material = pWaveRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = pOpacity * 0.6;
    }

    if (pWaveOuterRef.current) {
      pWaveOuterRef.current.scale.setScalar(pScale * 1.05);
      const material = pWaveOuterRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = pOpacity * 0.3;
    }

    if (sWaveRef.current) {
      sWaveRef.current.scale.setScalar(sScale);
      const material = sWaveRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = sOpacity * 0.6;
    }

    if (sWaveOuterRef.current) {
      sWaveOuterRef.current.scale.setScalar(sScale * 1.05);
      const material = sWaveOuterRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = sOpacity * 0.3;
    }
  });

  const reflectionMarkers = useMemo(() => {
    return waveData.reflections.map((reflection, index) => (
      <mesh
        key={`reflection-${index}`}
        position={reflection.position}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    ));
  }, [waveData.reflections]);

  const refractionMarkers = useMemo(() => {
    return waveData.refractions.map((refraction, index) => (
      <group key={`refraction-${index}`} position={refraction.position}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
        </mesh>
        <mesh
          position={[
            refraction.direction[0] * 0.5,
            refraction.direction[1] * 0.5,
            refraction.direction[2] * 0.5,
          ]}
        >
          <coneGeometry args={[0.08, 0.2, 8]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
        </mesh>
      </group>
    ));
  }, [waveData.refractions]);

  return (
    <group position={[hypocenter.x, hypocenter.y, hypocenter.z]}>
      <mesh ref={pWaveOuterRef} scale={0}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#42a5f5"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={pWaveRef} scale={0}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#4fc3f7"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
          wireframe={false}
        />
      </mesh>

      <mesh ref={sWaveOuterRef} scale={0}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#66bb6a"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={sWaveRef} scale={0}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#81c784"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
          wireframe={false}
        />
      </mesh>

      {reflectionMarkers}
      {refractionMarkers}
    </group>
  );
};
