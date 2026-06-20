import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { themes } from '../types';
import type { SceneElement } from '../types';

interface ParticleGalaxyProps {
  element: SceneElement;
}

export function ParticleGalaxy({ element }: ParticleGalaxyProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const theme = useStore((state) => state.theme);
  const frequencyData = useStore((state) => state.frequencyData);
  const isSelected = useStore((state) => state.selectedElementId === element.id);
  const selectElement = useStore((state) => state.selectElement);

  const particleCount = Math.min(element.particleCount || 1000, 3000);
  const sensitivity = element.sensitivity || 1;

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

  useFrame((state) => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const colorAttribute = geometry.attributes.color as THREE.BufferAttribute;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    const themeColors = themes[theme];
    const primaryColor = new THREE.Color(themeColors.primary);
    const secondaryColor = new THREE.Color(themeColors.secondary);
    const accentColor = new THREE.Color(themeColors.accent);

    const midHighSum = frequencyData.slice(
      Math.floor(frequencyData.length * 0.4),
      Math.floor(frequencyData.length * 0.8)
    );
    const midHighAvg = midHighSum.length > 0
      ? midHighSum.reduce((a, b) => a + b, 0) / midHighSum.length
      : 0;
    const normalizedMidHigh = (midHighAvg / 255) * sensitivity;

    for (let i = 0; i < particleCount; i++) {
      const freqIndex = Math.floor((i / particleCount) * frequencyData.length * 0.5) + Math.floor(frequencyData.length * 0.3);
      const value = frequencyData[Math.min(freqIndex, frequencyData.length - 1)] || 0;
      const normalizedValue = (value / 255) * sensitivity;

      const colorMix = Math.min(normalizedValue * 2, 1);
      const baseColor = primaryColor.clone().lerp(secondaryColor, (i / particleCount) * 0.5 + 0.25);
      const finalColor = baseColor.clone().lerp(accentColor, colorMix * 0.5);

      colorAttribute.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);

      const pulse = 1 + normalizedValue * 0.3;
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      const dist = Math.sqrt(x * x + y * y + z * z) || 1;
      positionAttribute.setXYZ(
        i,
        (x / dist) * dist * pulse,
        (y / dist) * dist * pulse,
        (z / dist) * dist * pulse
      );
    }

    colorAttribute.needsUpdate = true;
    positionAttribute.needsUpdate = true;

    const rotationSpeed = element.rotationSpeed * (0.5 + normalizedMidHigh) * 0.01;
    pointsRef.current.rotation.y += rotationSpeed;
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectElement(element.id);
  };

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
            color={themes[theme].accent}
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
