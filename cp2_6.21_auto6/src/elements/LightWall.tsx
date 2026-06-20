import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { themes } from '../types';
import type { SceneElement } from '../types';

interface LightWallProps {
  element: SceneElement;
}

export function LightWall({ element }: LightWallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isSelected = useStore((state) => state.selectedElementId === element.id);
  const selectElement = useStore((state) => state.selectElement);
  const theme = useStore((state) => state.theme);

  const wallSize = element.wallSize || [4, 3];
  const flickerFrequency = element.flickerFrequency || 2;
  const sensitivity = element.sensitivity || 1;

  const beatIntensityRef = useRef(0);
  const lastBeatRef = useRef(0);
  const hueOffsetRef = useRef(0);

  const segmentsW = 20;
  const segmentsH = 15;

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const storeState = useStore.getState();
    const frequencyData = storeState.frequencyData;
    const currentTheme = storeState.theme;
    const themeColors = themes[currentTheme];

    const currentElement = storeState.elements.find((el) => el.id === element.id);
    const currentSensitivity = currentElement?.sensitivity ?? sensitivity;
    const currentScale = currentElement?.scale ?? element.scale;
    const currentFlickerFrequency = currentElement?.flickerFrequency ?? flickerFrequency;
    const currentWallSize = currentElement?.wallSize ?? wallSize;

    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    const lowEnd = Math.floor(frequencyData.length * 0.15);
    let lowSum = 0;
    for (let i = 0; i < lowEnd; i++) {
      lowSum += frequencyData[i];
    }
    const lowAvg = lowEnd > 0 ? lowSum / lowEnd : 0;
    const normalizedLow = (lowAvg / 255) * currentSensitivity;

    const currentTime = state.clock.elapsedTime;
    if (normalizedLow > 0.6 && currentTime - lastBeatRef.current > 0.2) {
      lastBeatRef.current = currentTime;
      beatIntensityRef.current = 1;
    }

    beatIntensityRef.current = Math.max(0, beatIntensityRef.current - delta * 3);

    hueOffsetRef.current += delta * 0.1 * currentFlickerFrequency;
    if (hueOffsetRef.current > 1) hueOffsetRef.current -= 1;

    const color1 = new THREE.Color(themeColors.primary);
    const color2 = new THREE.Color(themeColors.secondary);
    const color3 = new THREE.Color(themeColors.accent);

    const hueMix = (Math.sin(hueOffsetRef.current * Math.PI * 2) + 1) / 2;
    let currentColor: THREE.Color;
    if (hueMix < 0.5) {
      currentColor = color1.clone().lerp(color2, hueMix * 2);
    } else {
      currentColor = color2.clone().lerp(color3, (hueMix - 0.5) * 2);
    }

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.color.copy(currentColor);
    material.emissive.copy(currentColor);
    material.emissiveIntensity = 0.3 + beatIntensityRef.current * 0.5;
    material.opacity = 0.4 + normalizedLow * 0.4 + beatIntensityRef.current * 0.2;

    let totalVolume = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      totalVolume += frequencyData[i];
    }
    const normalizedVolume = (totalVolume / frequencyData.length / 255) * currentSensitivity;

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);

      const row = Math.floor((i % (segmentsW + 1)) / (segmentsW + 1) * 8);
      const col = Math.floor((i / (segmentsW + 1)) / segmentsH * 6);

      const freqIndex = (row * 8 + col) % frequencyData.length;
      const freqValue = frequencyData[freqIndex] || 0;
      const waveZ = Math.sin(x * 3 + currentTime * currentFlickerFrequency) * 0.1 +
        Math.cos(y * 2 + currentTime * currentFlickerFrequency * 1.3) * 0.1 +
        (freqValue / 255) * currentSensitivity * 0.2;

      positionAttribute.setZ(i, waveZ);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    meshRef.current.scale.set(
      currentWallSize[0] * currentScale * 0.5,
      currentWallSize[1] * currentScale * 0.5,
      1
    );
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
        scale={[
          wallSize[0] * element.scale * 0.5,
          wallSize[1] * element.scale * 0.5,
          1
        ]}
      >
        <planeGeometry args={[2, 2, segmentsW, segmentsH]} />
        <meshStandardMaterial
          color={themeColors.primary}
          emissive={themeColors.primary}
          emissiveIntensity={0.3}
          roughness={0.4}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {isSelected && (
        <mesh scale={[wallSize[0] * element.scale * 0.55, wallSize[1] * element.scale * 0.55, 1]}>
          <ringGeometry args={[1, 1.05, 64]} />
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

export default LightWall;
