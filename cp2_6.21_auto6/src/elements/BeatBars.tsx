import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { themes } from '../types';
import type { SceneElement } from '../types';

interface BeatBarsProps {
  element: SceneElement;
}

export function BeatBars({ element }: BeatBarsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const isSelected = useStore((state) => state.selectedElementId === element.id);
  const selectElement = useStore((state) => state.selectElement);
  const theme = useStore((state) => state.theme);

  const barCount = element.barCount || 32;
  const sensitivity = element.sensitivity || 1;

  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    const spacing = 0.3;
    const totalWidth = (barCount - 1) * spacing;
    for (let i = 0; i < barCount; i++) {
      pos.push([i * spacing - totalWidth / 2, 0, 0]);
    }
    return pos;
  }, [barCount]);

  useFrame(() => {
    if (!meshRef.current) return;

    const storeState = useStore.getState();
    const frequencyData = storeState.frequencyData;
    const currentTheme = storeState.theme;
    const themeColors = themes[currentTheme];
    const primaryColor = new THREE.Color(themeColors.primary);
    const secondaryColor = new THREE.Color(themeColors.secondary);

    const currentElement = storeState.elements.find((el) => el.id === element.id);
    const currentSensitivity = currentElement?.sensitivity ?? sensitivity;
    const currentScale = currentElement?.scale ?? element.scale;
    const currentRotationSpeed = currentElement?.rotationSpeed ?? element.rotationSpeed;

    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor((i / barCount) * frequencyData.length * 0.3);
      const value = frequencyData[freqIndex] || 0;
      const normalizedValue = (value / 255) * currentSensitivity;
      const height = 0.5 + normalizedValue * 1.5;

      dummy.position.set(
        positions[i][0] * currentScale,
        (height / 2) * currentScale,
        positions[i][2] * currentScale
      );
      dummy.scale.set(
        0.2 * currentScale,
        height * currentScale,
        0.2 * currentScale
      );

      const colorMix = Math.min(normalizedValue * 1.5, 1);
      const mixedColor = primaryColor.clone().lerp(secondaryColor, colorMix);
      meshRef.current.setColorAt(i, mixedColor);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }

    if (currentRotationSpeed) {
      meshRef.current.rotation.y += currentRotationSpeed * 0.01;
    }

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.emissive.set(themeColors.primary);
    material.emissiveIntensity = isSelected ? 0.5 : 0.3;
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectElement(element.id);
  };

  const themeColors = themes[theme];

  return (
    <group position={element.position} rotation={element.rotation as any}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, barCount]}
        onClick={handleClick}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          emissive={themeColors.primary}
          emissiveIntensity={0.3}
          roughness={0.4}
          toneMapped={false}
        />
      </instancedMesh>
      {isSelected && (
        <mesh scale={element.scale * 1.1}>
          <ringGeometry args={[1.5, 1.6, 64]} />
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

export default BeatBars;
