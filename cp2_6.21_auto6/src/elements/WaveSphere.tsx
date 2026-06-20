import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, getFrequencyData, getCurrentTheme, getElementById } from '../store/useStore';
import { themes } from '../types';
import type { SceneElement } from '../types';

interface WaveSphereProps {
  element: SceneElement;
}

export function WaveSphere({ element }: WaveSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isSelected = useStore((state) => state.selectedElementId === element.id);
  const selectElement = useStore((state) => state.selectElement);
  const theme = useStore((state) => state.theme);

  const smoothColorRef = useRef(new THREE.Color('#ffffff'));
  const smoothEmissiveRef = useRef(new THREE.Color('#000000'));

  const detail = Math.min(element.waveDetail || 32, 64);

  const originalPositions = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, detail, detail);
    const pos = geometry.attributes.position.array.slice();
    geometry.dispose();
    return pos;
  }, [detail]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const frequencyData = getFrequencyData();
    const currentTheme = getCurrentTheme();
    const currentElement = getElementById(element.id);

    const currentSensitivity = currentElement?.sensitivity ?? element.sensitivity ?? 1;
    const currentScale = currentElement?.scale ?? element.scale;
    const currentRotationSpeed = currentElement?.rotationSpeed ?? element.rotationSpeed ?? 0.5;

    const themeColors = themes[currentTheme];
    const targetColor = new THREE.Color(themeColors.primary);
    const targetEmissive = new THREE.Color(themeColors.secondary);
    smoothColorRef.current.lerp(targetColor, 0.08);
    smoothEmissiveRef.current.lerp(targetEmissive, 0.08);

    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    let totalVolume = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      totalVolume += frequencyData[i];
    }
    const normalizedVolume = (totalVolume / frequencyData.length / 255) * currentSensitivity;

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
      const normalizedFreq = (freqValue / 255) * currentSensitivity;

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

    if (currentRotationSpeed) {
      meshRef.current.rotation.y += currentRotationSpeed * 0.01;
    }

    meshRef.current.scale.setScalar(currentScale);

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.color.copy(smoothColorRef.current);
    material.emissive.copy(smoothEmissiveRef.current);
    material.emissiveIntensity = 0.3 + normalizedVolume * 0.3;
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
