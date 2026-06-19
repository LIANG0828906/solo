import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEmotionStore } from '../store/emotionStore';
import { offsetHue, hexToRgb } from '../utils/colors';

interface ParticlesProps {
  sculptureColor: string;
}

function createCircleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const selectJoy = (state: { joy: number }) => state.joy;
const selectSadness = (state: { sadness: number }) => state.sadness;
const selectAnger = (state: { anger: number }) => state.anger;
const selectCalm = (state: { calm: number }) => state.calm;

const Particles: React.FC<ParticlesProps> = ({ sculptureColor }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const joy = useEmotionStore(selectJoy);
  const sadness = useEmotionStore(selectSadness);
  const anger = useEmotionStore(selectAnger);
  const calm = useEmotionStore(selectCalm);

  const MAX_PARTICLES = 6000;
  const BASE_PARTICLES = 2000;
  const HIGH_PARTICLES = 4000;

  const { positions, colors, sizes, periods, phases, basePositions } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const periods = new Float32Array(MAX_PARTICLES);
    const phases = new Float32Array(MAX_PARTICLES);
    const basePositions = new Float32Array(MAX_PARTICLES * 3);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 3.5 + Math.random() * 2.5;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      const hueOffset = (Math.random() - 0.5) * 60;
      const particleColor = offsetHue(sculptureColor, hueOffset);
      const rgb = hexToRgb(particleColor);
      colors[i * 3] = rgb.r / 255;
      colors[i * 3 + 1] = rgb.g / 255;
      colors[i * 3 + 2] = rgb.b / 255;

      sizes[i] = 0.05 + Math.random() * 0.25;
      periods[i] = 4 + Math.random() * 4;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, colors, sizes, periods, phases, basePositions };
  }, [sculptureColor]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    const time = clock.getElapsedTime();
    const geometry = pointsRef.current.geometry;
    const posArray = geometry.attributes.position.array as Float32Array;

    const hasHighEmotion = joy > 80 || sadness > 80 || anger > 80 || calm > 80;
    const activeCount = hasHighEmotion ? HIGH_PARTICLES : BASE_PARTICLES;
    pointsRef.current.geometry.setDrawRange(0, activeCount);

    const calmFactor = 1 - calm / 100;
    const spreadSpeed = hasHighEmotion ? 1.5 : 1;

    for (let i = 0; i < activeCount; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];

      const breath = Math.sin(time / periods[i] + phases[i]) * 0.5;
      const len = Math.sqrt(bx * bx + by * by + bz * bz);
      const nx = bx / len;
      const ny = by / len;
      const nz = bz / len;

      const wobble = Math.sin(time * 0.5 + i * 0.01) * calmFactor * 0.3;

      posArray[i * 3] = bx + nx * breath * spreadSpeed + wobble;
      posArray[i * 3 + 1] = by + ny * breath * spreadSpeed;
      posArray[i * 3 + 2] = bz + nz * breath * spreadSpeed;
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_PARTICLES}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={MAX_PARTICLES}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={MAX_PARTICLES}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default Particles;
