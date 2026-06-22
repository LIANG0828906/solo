import { create } from 'zustand';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import gsap from 'gsap';
import type { OrbitControlsProps } from '@react-three/drei';

export const INITIAL_CAMERA_POSITION: [number, number, number] = [120, 100, 180];
export const INITIAL_CAMERA_TARGET: [number, number, number] = [0, 10, 0];

interface InteractionStore {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  setControlsRef: (ref: React.MutableRefObject<OrbitControlsImpl | null>) => void;
  resetCamera: () => void;
}

export const useInteractionStore = create<InteractionStore>((set, get) => ({
  controlsRef: { current: null },
  setControlsRef: (ref) => set({ controlsRef: ref }),
  resetCamera: () => {
    const { controlsRef } = get();
    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object as THREE.PerspectiveCamera;
    const obj = {
      camX: camera.position.x,
      camY: camera.position.y,
      camZ: camera.position.z,
      tarX: controls.target.x,
      tarY: controls.target.y,
      tarZ: controls.target.z,
    };

    gsap.to(obj, {
      camX: INITIAL_CAMERA_POSITION[0],
      camY: INITIAL_CAMERA_POSITION[1],
      camZ: INITIAL_CAMERA_POSITION[2],
      tarX: INITIAL_CAMERA_TARGET[0],
      tarY: INITIAL_CAMERA_TARGET[1],
      tarZ: INITIAL_CAMERA_TARGET[2],
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(obj.camX, obj.camY, obj.camZ);
        controls.target.set(obj.tarX, obj.tarY, obj.tarZ);
        controls.update();
      },
    });
  },
}));

interface SceneViewStore {
  isSectionView: boolean;
  toggleSectionView: () => void;
}

export const useSceneViewStore = create<SceneViewStore>((set) => ({
  isSectionView: false,
  toggleSectionView: () => set((state) => ({ isSectionView: !state.isSectionView })),
}));

export function useKeyboardShortcuts() {
  const resetCamera = useInteractionStore((s) => s.resetCamera);
  const toggleSectionView = useSceneViewStore((s) => s.toggleSectionView);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r') {
        resetCamera();
      } else if (event.key.toLowerCase() === 's') {
        toggleSectionView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetCamera, toggleSectionView]);
}

export function useInteraction(
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>,
) {
  const setControlsRef = useInteractionStore((s) => s.setControlsRef);
  const { camera } = useThree();

  useEffect(() => {
    setControlsRef(orbitControlsRef);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(
        INITIAL_CAMERA_POSITION[0],
        INITIAL_CAMERA_POSITION[1],
        INITIAL_CAMERA_POSITION[2],
      );
    }
  }, [orbitControlsRef, setControlsRef, camera]);

  useKeyboardShortcuts();
}

export const defaultOrbitControlsProps: Partial<OrbitControlsProps> = {
  makeDefault: true,
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 30,
  maxDistance: 500,
  maxPolarAngle: Math.PI / 2 - 0.05,
  minPolarAngle: 0.1,
};
