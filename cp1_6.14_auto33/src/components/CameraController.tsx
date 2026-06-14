import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { createNoise2D } from 'simplex-noise';
import type { ViewMode } from '@/store/useTerrainStore';

interface CameraControllerProps {
  viewMode: ViewMode;
  seed: number;
  heightScale: number;
  frequency: number;
  onCameraUpdate: (position: [number, number, number], target: [number, number, number]) => void;
}

const CAMERA_HEIGHT = 1.7;
const MOVE_SPEED = 8;
const DAMPING = 0.08;
const PITCH_LIMIT_FIRST = 80;
const PITCH_LIMIT_THIRD = 85;
const TRANSITION_DURATION = 0.5;
const TERRAIN_SIZE = 100;
const TERRAIN_SEGMENTS = 128;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const CameraController: React.FC<CameraControllerProps> = ({
  viewMode,
  seed,
  heightScale,
  frequency,
  onCameraUpdate,
}) => {
  const { camera, gl } = useThree();

  const noise2D = useMemo(() => createNoise2D(() => seed / 1000000), [seed]);

  const keysRef = useRef<Set<string>>(new Set());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const thirdPersonDistanceRef = useRef(8);
  const velocityRef = useRef(new THREE.Vector3());
  const characterPosRef = useRef(new THREE.Vector3());
  const prevViewModeRef = useRef<ViewMode>(viewMode);
  const transitionProgressRef = useRef(1);
  const transitionStartPosRef = useRef(new THREE.Vector3());
  const transitionStartTargetRef = useRef(new THREE.Vector3());
  const lastStoreUpdateRef = useRef(0);

  const initPos = useMemo(() => {
    const rand = seededRandom(seed);
    const halfSize = TERRAIN_SIZE / 2 - 5;
    return new THREE.Vector3(
      rand() * halfSize * 2 - halfSize,
      CAMERA_HEIGHT,
      rand() * halfSize * 2 - halfSize
    );
  }, [seed]);

  const sampleTerrainHeight = (x: number, z: number): number => {
    let height = 0;
    let amp = 1;
    let freq = frequency;

    for (let octave = 0; octave < 4; octave++) {
      height += noise2D(x * freq, z * freq) * amp;
      amp *= 0.5;
      freq *= 2;
    }

    return height * heightScale;
  };

  useEffect(() => {
    const canvas = gl.domElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e