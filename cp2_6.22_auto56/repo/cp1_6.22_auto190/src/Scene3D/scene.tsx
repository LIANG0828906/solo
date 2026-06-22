import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectConfig } from '../AudioEngine/effectsManager';
import { ChannelTimeDomainData } from '../AudioEngine/audioProcessor';
import {
  createParticleState,
  createParticleGeometry,
  updateParticles,
  PARTICLE_COUNT,
} from './particleSystem';

const WAVEFORM_VERTICES = 256;
const WAVEFORM_RADIUS = 8;
const WAVEFORM_COLORS = {
  left: new THREE.Color('#FF6B35'),
  right: new THREE.Color('#3A86FF'),
  mixed: new THREE.Color('#80FFDB'),
};

const particleVertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.3, 0.5, d);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

interface SceneProps {
  effectConfig: EffectConfig;
  channelData: ChannelTimeDomainData | null;
  displayMode: 'particles' | 'waveform' | 'mixed';
}

export default function Scene({ effectConfig, channelData, displayMode }: SceneProps) {
  const particleRef = useRef<THREE.Points>(null);
  const waveLeftRef = useRef<THREE.Line>(null);
  const waveRightRef = useRef<THREE.Line>(null);
  const waveMixedRef = useRef<THREE.Line>(null);

  const particleState = useMemo(() => createParticleState(), []);
  const particleGeometry = useMemo(() => createParticleGeometry(particleState), [particleState]);

  const particleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const { waveLeftGeom, waveRightGeom, waveMixedGeom } = useMemo(() => {
    const createWaveGeom = () => {
      const positions = new Float32Array(WAVEFORM_VERTICES * 3);
      const geometry = new THREE.BufferGeometry();
      for (let i = 0; i < WAVEFORM_VERTICES; i++) {
        const angle = (i / WAVEFORM_VERTICES) * Math.PI * 2;
        positions[i * 3] = Math.cos(angle) * WAVEFORM_RADIUS;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.sin(angle) * WAVEFORM_RADIUS;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return geometry;
    };
    return {
      waveLeftGeom: createWaveGeom(),
      waveRightGeom: createWaveGeom(),
      waveMixedGeom: createWaveGeom(),
    };
  }, []);

  const targetVisibility = useMemo(() => {
    switch (displayMode) {
      case 'particles':
        return { particles: 1, waveform: 0 };
      case 'waveform':
        return { particles: 0, waveform: 1 };
      case 'mixed':
        return { particles: 1, waveform: 1 };
    }
  }, [displayMode]);

  const currentVisibility = useRef({ particles: 1, waveform: 1 });
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;

    const lerpFactor = 1 - Math.pow(0.9, delta * 60);
    currentVisibility.current.particles +=
      (targetVisibility.particles - currentVisibility.current.particles) * lerpFactor;
    currentVisibility.current.waveform +=
      (targetVisibility.waveform - currentVisibility.waveform) * lerpFactor;

    if (particleRef.current) {
      particleRef.current.visible = currentVisibility.current.particles > 0.01;
      updateParticles(
        particleRef.current.geometry as THREE.BufferGeometry,
        particleState,
        effectConfig,
        time,
        currentVisibility.current.particles
      );
    }

    const waveVis = currentVisibility.current.waveform;
    if (channelData) {
      updateWaveformLine(waveLeftRef, channelData.left, waveVis);
      updateWaveformLine(waveRightRef, channelData.right, waveVis);
      updateWaveformLine(waveMixedRef, channelData.mixed, waveVis);
    }

    if (waveLeftRef.current) waveLeftRef.current.visible = waveVis > 0.01;
    if (waveRightRef.current) waveRightRef.current.visible = waveVis > 0.01;
    if (waveMixedRef.current) waveMixedRef.current.visible = waveVis > 0.01;
  });

  return (
    <>
      <pointLight position={[0, 10, 0]} intensity={0.5} />
      <ambientLight intensity={0.2} />

      <points ref={particleRef} geometry={particleGeometry} material={particleMaterial} />

      <line ref={waveLeftRef} geometry={waveLeftGeom}>
        <lineBasicMaterial color={WAVEFORM_COLORS.left} transparent opacity={0.9} />
      </line>
      <line ref={waveRightRef} geometry={waveRightGeom}>
        <lineBasicMaterial color={WAVEFORM_COLORS.right} transparent opacity={0.9} />
      </line>
      <line ref={waveMixedRef} geometry={waveMixedGeom}>
        <lineBasicMaterial color={WAVEFORM_COLORS.mixed} transparent opacity={0.9} />
      </line>
    </>
  );
}

function updateWaveformLine(
  ref: React.RefObject<THREE.Line | null>,
  timeDomainData: Float32Array,
  visibility: number
) {
  const line = ref.current;
  if (!line) return;

  const positions = line.geometry.attributes.position.array as Float32Array;
  const dataLen = timeDomainData.length;
  const step = Math.floor(dataLen / WAVEFORM_VERTICES);

  for (let i = 0; i < WAVEFORM_VERTICES; i++) {
    const angle = (i / WAVEFORM_VERTICES) * Math.PI * 2;
    const dataIndex = Math.min(i * step, dataLen - 1);
    const value = timeDomainData[dataIndex] || 0;
    const yOffset = value * 3.0 * visibility;

    positions[i * 3] = Math.cos(angle) * (WAVEFORM_RADIUS + yOffset * 0.3);
    positions[i * 3 + 1] = yOffset;
    positions[i * 3 + 2] = Math.sin(angle) * (WAVEFORM_RADIUS + yOffset * 0.3);
  }

  line.geometry.attributes.position.needsUpdate = true;
}
