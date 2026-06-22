import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEmotionStore } from '../store/emotionStore';
import { mixEmotionColors, adjustColor } from '../utils/colors';
import { noise3D, seededRandom, lerp } from '../utils/emotionMath';

interface SculptureProps {
  onColorUpdate: (color: string) => void;
}

const selectJoy = (state: { joy: number }) => state.joy;
const selectSadness = (state: { sadness: number }) => state.sadness;
const selectAnger = (state: { anger: number }) => state.anger;
const selectCalm = (state: { calm: number }) => state.calm;

const Sculpture: React.FC<SculptureProps> = ({ onColorUpdate }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorUpdateRef = useRef(onColorUpdate);

  useEffect(() => {
    colorUpdateRef.current = onColorUpdate;
  }, [onColorUpdate]);

  const joy = useEmotionStore(selectJoy);
  const sadness = useEmotionStore(selectSadness);
  const anger = useEmotionStore(selectAnger);
  const calm = useEmotionStore(selectCalm);

  const BASE_RADIUS = 3.0;

  const targetEmotionsRef = useRef({ joy: 50, sadness: 30, anger: 20, calm: 60 });

  const { baseGeometry, basePositions, spikeIndices, spikeHeights, verticesCount } = useMemo(() => {
    const tempGeom = new THREE.IcosahedronGeometry(BASE_RADIUS, 6);
    const positions = tempGeom.attributes.position.array as Float32Array;
    const verticesCount = positions.length / 3;
    
    const basePositions = new Float32Array(positions);
    
    const spikeIndices = new Uint32Array(200);
    const spikeHeights = new Float32Array(200);

    for (let i = 0; i < 200; i++) {
      spikeIndices[i] = Math.floor(seededRandom(i * 12345) * verticesCount);
      spikeHeights[i] = 5 + seededRandom(i * 67890) * 20;
    }

    tempGeom.dispose();

    return { baseGeometry: null, basePositions, spikeIndices, spikeHeights, verticesCount };
  }, []);

  const currentEmotions = useRef({ joy: 50, sadness: 30, anger: 20, calm: 60 });

  useEffect(() => {
    targetEmotionsRef.current.joy = joy;
    targetEmotionsRef.current.sadness = sadness;
    targetEmotionsRef.current.anger = anger;
    targetEmotionsRef.current.calm = calm;
  }, [joy, sadness, anger, calm]);

  const colorRef = useRef('#888888');

  useFrame(({ clock }, delta) => {
    if (!meshRef.current || !groupRef.current || !materialRef.current) return;

    const time = clock.getElapsedTime();
    const geometry = meshRef.current.geometry;
    const posArray = geometry.attributes.position.array as Float32Array;

    const lerpFactor = Math.min(1, delta * 10);
    const targets = targetEmotionsRef.current;
    currentEmotions.current.joy = lerp(currentEmotions.current.joy, targets.joy, lerpFactor);
    currentEmotions.current.sadness = lerp(currentEmotions.current.sadness, targets.sadness, lerpFactor);
    currentEmotions.current.anger = lerp(currentEmotions.current.anger, targets.anger, lerpFactor);
    currentEmotions.current.calm = lerp(currentEmotions.current.calm, targets.calm, lerpFactor);

    const {
      joy: curJoy,
      sadness: curSadness,
      anger: curAnger,
      calm: curCalm,
    } = currentEmotions.current;

    const expansionFactor = 1 + (curJoy / 100) * 0.5;
    const waveFrequency = 0.5 + (curJoy / 100) * 1.5;
    const sagAmount = (curSadness / 100) * 1.5;
    const spikeCount = Math.floor((curAnger / 100) * 200);
    const oscAmp = 0.1 + (1 - curCalm / 100) * 0.4;
    const rotationSpeed = 0.1 + (1 - curCalm / 100) * 0.5;

    groupRef.current.rotation.y += rotationSpeed * delta;

    const spikeSet = new Set<number>();
    for (let s = 0; s < spikeCount; s++) {
      spikeSet.add(spikeIndices[s]);
    }

    for (let i = 0; i < verticesCount; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];

      let x = bx * expansionFactor;
      let y = by * expansionFactor;
      let z = bz * expansionFactor;

      const noiseVal = noise3D(x * 0.5, y * 0.5, z * 0.5);
      const wave = Math.sin(time * waveFrequency + noiseVal * 10) * (curJoy / 100) * 0.3;
      const waveNorm = Math.sqrt(x * x + y * y + z * z);
      if (waveNorm > 0) {
        x += (x / waveNorm) * wave;
        y += (y / waveNorm) * wave;
        z += (z / waveNorm) * wave;
      }

      if (spikeSet.has(i)) {
        const s = spikeIndices.findIndex(idx => idx === i);
        if (s >= 0) {
          const spikeHeight = spikeHeights[s] * (curAnger / 100);
          const norm = Math.sqrt(x * x + y * y + z * z);
          if (norm > 0) {
            x += (x / norm) * spikeHeight;
            y += (y / norm) * spikeHeight;
            z += (z / norm) * spikeHeight;
          }
        }
      }

      const osc = Math.sin(time * 2 + i * 0.01) * oscAmp;
      x += osc * 0.3;
      y += osc * 0.3;
      z += osc * 0.3;

      y -= sagAmount;

      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const baseColor = mixEmotionColors(curJoy, curSadness, curAnger, curCalm);
    const saturationMult = 1 - curSadness / 200;
    const redShift = (curAnger / 100) * 0.3;
    const finalColor = adjustColor(baseColor, saturationMult, redShift);

    if (colorRef.current !== finalColor) {
      colorRef.current = finalColor;
      materialRef.current.color.set(finalColor);
      colorUpdateRef.current(finalColor);
    }

    materialRef.current.emissive.set(finalColor);
    materialRef.current.emissiveIntensity = 0.15;
  });

  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  useMemo(() => {
    const icoGeom = new THREE.IcosahedronGeometry(BASE_RADIUS, 6);
    geometryRef.current = icoGeom;
  }, []);

  if (!geometryRef.current) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} castShadow receiveShadow geometry={geometryRef.current}>
        <meshStandardMaterial
          ref={materialRef}
          color="#888888"
          metalness={0.3}
          roughness={0.4}
          flatShading
        />
      </mesh>
    </group>
  );
};

export default Sculpture;
