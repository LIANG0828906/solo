import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { createNoise2D } from 'simplex-noise';
import type { ViewMode } from '@/store/useTerrainStore';

interface CameraControllerProps {
  viewMode: ViewMode;
  seed: number;
  heightScale: number;
  frequency: number;
  onCameraUpdate?: (position: [number, number, number], target: [number, number, number]) => void;
}

const FIRST_PERSON_HEIGHT = 1.7;
const THIRD_PERSON_OFFSET_BACK = 5;
const THIRD_PERSON_OFFSET_UP = 3;
const MOVE_SPEED = 8;
const DAMPING = 0.08;
const MOUSE_SENSITIVITY = 0.002;
const PITCH_LIMIT = 80;
const TRANSITION_DURATION = 0.5;
const TERRAIN_SIZE = 100;

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
  const velocityRef = useRef(new THREE.Vector3());
  const characterPosRef = useRef(new THREE.Vector3(0, 5, 15));
  const prevViewModeRef = useRef<ViewMode>(viewMode);
  const transitionProgressRef = useRef(1);
  const transitionStartPosRef = useRef(new THREE.Vector3());
  const transitionStartTargetRef = useRef(new THREE.Vector3());
  const initializedRef = useRef(false);
  const lastStoreUpdateRef = useRef(0);

  const sampleTerrainHeight = useCallback((x: number, z: number): number => {
    let height = 0;
    let amp = 1;
    let freq = frequency;
    for (let octave = 0; octave < 4; octave++) {
      height += noise2D(x * freq, z * freq) * amp;
      amp *= 0.5;
      freq *= 2;
    }
    return height * heightScale;
  }, [noise2D, frequency, heightScale]);

  useEffect(() => {
    if (!initializedRef.current) {
      const rand = seededRandom(seed);
      const halfSize = TERRAIN_SIZE / 2 - 5;
      const x = rand() * halfSize * 2 - halfSize;
      const z = rand() * halfSize * 2 - halfSize;
      const terrainY = sampleTerrainHeight(x, z);
      characterPosRef.current.set(x, terrainY + FIRST_PERSON_HEIGHT, z);
      initializedRef.current = true;
    }
  }, [seed, sampleTerrainHeight]);

  useEffect(() => {
    if (prevViewModeRef.current !== viewMode) {
      transitionStartPosRef.current.copy(camera.position);
      const currentTarget = new THREE.Vector3();
      currentTarget.set(
        characterPosRef.current.x - Math.sin(yawRef.current) * 10,
        characterPosRef.current.y + Math.tan(pitchRef.current) * 10,
        characterPosRef.current.z - Math.cos(yawRef.current) * 10
      );
      transitionStartTargetRef.current.copy(currentTarget);
      transitionProgressRef.current = 0;
      prevViewModeRef.current = viewMode;
    }
  }, [viewMode, camera]);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft'].includes(e.code)) {
        e.preventDefault();
      }
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
      const deltaY = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      yawRef.current -= deltaX * MOUSE_SENSITIVITY;
      pitchRef.current -= deltaY * MOUSE_SENSITIVITY;
      pitchRef.current = Math.max(
        -PITCH_LIMIT * (Math.PI / 180),
        Math.min(PITCH_LIMIT * (Math.PI / 180), pitchRef.current)
      );
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.setAttribute('tabindex', '0');
    canvas.focus();

    return () => {
      canvas.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.05);
    const charPos = characterPosRef.current;
    const velocity = velocityRef.current;

    const forward = new THREE.Vector3(
      -Math.sin(yawRef.current),
      0,
      -Math.cos(yawRef.current)
    );
    const right = new THREE.Vector3(
      Math.cos(yawRef.current),
      0,
      -Math.sin(yawRef.current)
    );

    const moveDir = new THREE.Vector3();
    const keys = keysRef.current;

    if (keys.has('KeyW')) moveDir.add(forward);
    if (keys.has('KeyS')) moveDir.sub(forward);
    if (keys.has('KeyD')) moveDir.add(right);
    if (keys.has('KeyA')) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(MOVE_SPEED);
    }

    velocity.lerp(moveDir, DAMPING * 2);
    charPos.x += velocity.x * clampedDelta;
    charPos.z += velocity.z * clampedDelta;

    const halfBound = TERRAIN_SIZE / 2 - 1;
    charPos.x = Math.max(-halfBound, Math.min(halfBound, charPos.x));
    charPos.z = Math.max(-halfBound, Math.min(halfBound, charPos.z));

    const terrainY = sampleTerrainHeight(charPos.x, charPos.z);
    const targetCharY = viewMode === 'first'
      ? terrainY + FIRST_PERSON_HEIGHT
      : terrainY;
    charPos.y += (targetCharY - charPos.y) * DAMPING * 3;

    const lookTarget = new THREE.Vector3(
      charPos.x - Math.sin(yawRef.current) * 10,
      charPos.y + Math.tan(pitchRef.current) * 10,
      charPos.z - Math.cos(yawRef.current) * 10
    );

    if (transitionProgressRef.current < 1) {
      transitionProgressRef.current = Math.min(
        1,
        transitionProgressRef.current + clampedDelta / TRANSITION_DURATION
      );
      const t = transitionProgressRef.current;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      let goalPos: THREE.Vector3;
      if (viewMode === 'first') {
        goalPos = new THREE.Vector3(charPos.x, terrainY + FIRST_PERSON_HEIGHT, charPos.z);
      } else {
        goalPos = new THREE.Vector3(
          charPos.x + Math.sin(yawRef.current) * THIRD_PERSON_OFFSET_BACK,
          terrainY + THIRD_PERSON_OFFSET_UP,
          charPos.z + Math.cos(yawRef.current) * THIRD_PERSON_OFFSET_BACK
        );
      }
      camera.position.lerpVectors(transitionStartPosRef.current, goalPos, eased);
    } else {
      if (viewMode === 'first') {
        camera.position.set(charPos.x, charPos.y, charPos.z);
      } else {
        camera.position.set(
          charPos.x + Math.sin(yawRef.current) * THIRD_PERSON_OFFSET_BACK,
          charPos.y + THIRD_PERSON_OFFSET_UP - FIRST_PERSON_HEIGHT + terrainY,
          charPos.z + Math.cos(yawRef.current) * THIRD_PERSON_OFFSET_BACK
        );
      }
    }

    camera.lookAt(lookTarget);
    camera.updateMatrixWorld();

    const now = performance.now();
    if (onCameraUpdate && now - lastStoreUpdateRef.current > 100) {
      lastStoreUpdateRef.current = now;
      onCameraUpdate(
        [camera.position.x, camera.position.y, camera.position.z],
        [lookTarget.x, lookTarget.y, lookTarget.z]
      );
    }
  });

  return null;
};

export default CameraController;
