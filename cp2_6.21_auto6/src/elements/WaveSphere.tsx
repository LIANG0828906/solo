import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { themes } from '../types';
import type { SceneElement } from '../types';

interface WaveSphereProps {
  element: SceneElement;
}

export function WaveSphere({ element }: WaveSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const theme = useStore((state) => state.theme);
  const frequencyData = useStore((state) => state.frequencyData);
  const isSelected = useStore((state) => state.selectedElementId === element.id);
  const selectElement = useStore((state) => state.selectElement);

  const detail = Math.min(element.waveDetail || 32, 64);
  const sensitivity = element.sensitivity || 1;

  const originalPositions = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, detail, detail);
    const pos = geometry.attributes.position.array.slice();
    geometry.dispose();
    return pos;
  }, [detail]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    const totalVolume = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
    const normalizedVolume = (totalVolume / 255) * sensitivity;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < positionAttribute.count; i++) {
      const ix = i * 3;
      const ox = originalPositions[ix];
      const oy = originalPositions[ix + 1];
      const oz = originalPositions[ix + 2];

      const dist = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
      const nx = ox / dist;
      const ny = oy / dist;
      const nz = oz / dist;

      const freqIndex = Math.floor(((ny + 1) / 2) * frequencyData.length * 0.5);
      const freqValue = frequencyData[freqIndex] || 0;
      const normalizedFreq = (freqValue / 255) * sensitivity;

      const waveNoise = Math.sin(nx * 5 + time * 2) * 0.1 +
        Math.cos(ny * 7 + time * 1.5) * 0.05 +
        Math.sin(nz * 6 + time * 1.8) * 0.08;

      const displacement = 1 + normalizedVolume * 0.5 + waveNoise * normalizedFreq;

      positionAttribute.setXYZ(
        i,
        nx * dist * displacement,
        ny * dist * displacement,
        nz * dist * displacement
      );
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    if (element.rotationSpeed) {
      meshRef.current.rotation.y += element.rotationSpeed * 0.01;
    }

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    const emissiveIntensity = 0.3 + normalizedVolume * 0.3;
    material.emissiveIntensity = emissiveIntensity;
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectElement(element.id);
  };

  const themeColors = themes[theme];

  return (
    <group position={element.position} rotation={element.rotation as any}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        scale={element.scale}
      >
        <sphereGeometry args={[1, detail, detail]} />
        <meshStandardMaterial
          color={themeColors.primary}
          emissive={themeColors.secondary}
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      {isSelected && (
        <mesh scale={element.scale * 1.3}>
          <ringGeometry args={[1.2, 1.25, 64]} />
          <meshBasicMaterial
            color={themeColors.accent}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

export default WaveSphere;
