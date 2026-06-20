import { useRef, useState, useEffect } from 'react';
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
  const theme = useStore((state) => state.theme);
  const frequencyData = useStore((state) => state.frequencyData);
  const isSelected = useStore((state) => state.selectedElementId === element.id);
  const selectElement = useStore((state) => state.selectElement);

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

    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    const lowFreq = frequencyData.slice(0, Math.floor(frequencyData.length * 0.15));
    const lowAvg = lowFreq.length > 0
      ? lowFreq.reduce((a, b) => a + b, 0) / lowFreq.length
      : 0;
    const normalizedLow = (lowAvg / 255) * sensitivity;

    const currentTime = state.clock.elapsedTime;
    if (normalizedLow > 0.6 && currentTime - lastBeatRef.current > 0.2) {
      lastBeatRef.current = currentTime;
      beatIntensityRef.current = 1;
    }

    beatIntensityRef.current = Math.max(0, beatIntensityRef.current - delta * 3);

    hueOffsetRef.current += delta * 0.1 * flickerFrequency;
    if (hueOffsetRef.current > 1) hueOffsetRef.current -= 1;

    const themeColors = themes[theme];
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
    material.color = currentColor;
    material.emissive = currentColor;
    material.emissiveIntensity = 0.3 + beatIntensityRef.current * 0.5;
    material.opacity = 0.4 + normalizedLow * 0.4 + beatIntensityRef.current * 0.2;

    const totalVolume = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
    const normalizedVolume = (totalVolume / 255) * sensitivity;

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);

      const row = Math.floor((i % (segmentsW + 1)) / (segmentsW + 1) * 8);
      const col = Math.floor((i / (segmentsW + 1)) / segmentsH * 6);

      const freqIndex = (row * 8 + col) % frequencyData.length;
      const freqValue = frequencyData[freqIndex] || 0;
      const waveZ = Math.sin(x * 3 + currentTime * flickerFrequency) * 0.1 +
        Math.cos(y * 2 + currentTime * flickerFrequency * 1.3) * 0.1 +
        (freqValue / 255) * sensitivity * 0.2;

      positionAttribute.setZ(i, waveZ);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectElement(element.id);
  };

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
          color={themes[theme].primary}
          emissive={themes[theme].primary}
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

export default LightWall;
