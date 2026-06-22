import { useRef, useMemo } from 'react';
import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudioStore } from '@/store/audioStore';
import {
  getFrequencyData,
  getTimeDomainData,
  computeBeat,
  computeVolumeLevel,
} from '@/audio/audioProcessor';
import vertShader from './shaders/particle.vert?raw';
import fragShader from './shaders/particle.frag?raw';

export const PARTICLE_COUNT = 600;

const selectUpdate = (s: any) => s.update;

export const useParticleAnimation = (): {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
} => {
  const storeUpdate = useAudioStore(selectUpdate);
  const uniformsRef = useRef<any>(null);

  const { geometry, material, uniforms } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const baseSizes = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 2 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      baseSizes[i] = 3 + Math.random() * 9;
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }

    const positionAttr = new THREE.BufferAttribute(positions, 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    positionAttr.needsUpdate = false;
    colorAttr.needsUpdate = false;
    geo.setAttribute('position', positionAttr);
    geo.setAttribute('aBaseSize', new THREE.BufferAttribute(baseSizes, 1));
    geo.setAttribute('color', colorAttr);

    const u = {
      uTime: { value: 0 },
      uBeat: { value: 0 },
      uLowBand: { value: 0 },
      uMidBand: { value: 0 },
      uHighBand: { value: 0 },
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: vertShader,
      fragmentShader: fragShader,
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat, uniforms: u };
  }, []);

  uniformsRef.current = uniforms;

  useFrame((state) => {
    const u = uniformsRef.current;
    if (!u) return;

    u.uTime.value = state.clock.elapsedTime;

    const freq = getFrequencyData();
    const time = getTimeDomainData();
    const beat = computeBeat(freq);
    const vol = computeVolumeLevel(freq);

    const lowEnd = Math.floor(freq.length * 0.15);
    const midStart = lowEnd;
    const midEnd = Math.floor(freq.length * 0.6);

    let lowSum = 0;
    for (let i = 0; i < lowEnd; i++) lowSum += freq[i];
    let midSum = 0;
    for (let i = midStart; i < midEnd; i++) midSum += freq[i];
    let highSum = 0;
    for (let i = midEnd; i < freq.length; i++) highSum += freq[i];

    u.uLowBand.value = Math.min(1, lowSum / (lowEnd * 200));
    u.uMidBand.value = Math.min(1, midSum / ((midEnd - midStart) * 180));
    u.uHighBand.value = Math.min(1, highSum / ((freq.length - midEnd) * 160));
    u.uBeat.value = beat;

    storeUpdate(freq, time, beat, vol);
  });

  return { geometry, material };
};

export const ParticleSystem = () => {
  const { geometry, material } = useParticleAnimation();
  return <points geometry={geometry} material={material} frustumCulled={false} />;
};
