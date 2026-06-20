import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, getFrequencyData, getCurrentTheme, getElementById } from '../store/useStore';
import { themes } from '../types';
import type { SceneElement } from '../types';

interface ParticleGalaxyProps {
  element: SceneElement;
}

export function ParticleGalaxy({ element }: ParticleGalaxyProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const isSelected = useStore((state) => state.selectedElementId === element.id);
  const selectElement = useStore((state) => state.selectElement);
  const theme = useStore((state) => state.theme);

  const smoothColorRef = useRef(new THREE.Color('#ffffff'));
  const currentThemeRef = useRef(theme);

  const particleCount = Math.min(element.particleCount || 1000, 3000);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.3;
      pos[i * 3 + 2] = radius * Math.cos(phi);

      col[i * 3] = 1;
      col[i * 3 + 1] = 1;
      col[i * 3 + 2] = 1;

      siz[i] = Math.random() * 0.05 + 0.02;
    }

    return { positions: pos, colors: col, sizes: siz };
  }, [particleCount]);

  const originalPositions = useMemo(() => {
    return new Float32Array(positions);
  }, [positions]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const frequencyData = getFrequencyData();
    const currentTheme = getCurrentTheme();
    const currentElement = getElementById(element.id);

    const currentSensitivity = currentElement?.sensitivity ?? element.sensitivity ?? 1;
    const currentScale = currentElement?.scale ?? element.scale;
    const currentRotationSpeed = currentElement?.rotationSpeed ?? element.rotationSpeed ?? 0.5;

    const themeColors = themes[currentTheme];
    const targetColor = new THREE.Color(themeColors.primary);

    if (currentThemeRef.current !== currentTheme) {
      currentThemeRef.current = currentTheme;
    }
    smoothColorRef.current.lerp(targetColor, 0.05);

    const primaryColor = new THREE.Color(themeColors.primary);
    const secondaryColor = new THREE.Color(themeColors.secondary);
    const accentColor = new THREE.Color(themeColors.accent);

    const geometry = pointsRef.current.geometry;
    const colorAttribute = geometry.attributes.color as THREE.BufferAttribute;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    const midHighStart = Math.floor(frequencyData.length * 0.4);
    const midHighEnd = Math.floor(frequencyData.length * 0.8);
    let midHighSum = 0;
    for (let i = midHighStart; i < midHighEnd; i++) {
      midHighSum += frequencyData[i];
    }
    const midHighAvg = midHighEnd > midHighStart ? midHighSum / (midHighEnd - midHighStart) : 0;
    const normalizedMidHigh = (midHighAvg / 255) * currentSensitivity;

    for (let i = 0; i < particleCount; i++) {
      const freqIndex = Math.floor((i / particleCount) * frequencyData.length * 0.5) + Math.floor(frequencyData.length * 0.3);
      const clampedIndex = Math.min(freqIndex, frequencyData.length - 1);
      const value = frequencyData[clampedIndex] || 0;
      const normalizedValue = (value / 255) * currentSensitivity;

      const colorMix = Math.min(normalizedValue * 2, 1);
      const baseColor = primaryColor.clone().lerp(secondaryColor, (i / particleCount) * 0.5 + 0.25);
      const finalColor = baseColor.clone().lerp(accentColor, colorMix * 0.5);

      colorAttribute.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);

      const pulse = 1 + normalizedValue * 0.3;
      const ox = originalPositions[i * 3];
      const oy = originalPositions[i * 3 + 1];
      const oz = originalPositions[i * 3 + 2];
      positionAttribute.setXYZ(i, ox * pulse, oy * pulse, oz * pulse);
    }

    colorAttribute.needsUpdate = true;
    positionAttribute.needsUpdate = true;

    const rotationSpeed = currentRotationSpeed * (0.5 + normalizedMidHigh) * 0.01;
    pointsRef.current.rotation.y += rotationSpeed;
    pointsRef.current.scale.setScalar(currentScale);
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectElement(element.id);
  };

  const themeColors = themes[theme];

  return (
    <group position={element.position} rotation={element.rotation as any}>
      <points
        ref={pointsRef}
        onClick={handleClick}
        scale={element.scale}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleCount}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {isSelected && (
        <mesh scale={2.5}>
          <ringGeometry args={[1.5, 1.55, 64]} />
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

export default ParticleGalaxy;
