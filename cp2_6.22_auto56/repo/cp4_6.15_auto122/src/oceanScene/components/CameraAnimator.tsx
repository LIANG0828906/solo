import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../store';

export default function CameraAnimator() {
  const selectedSpecies = useOceanStore((s) => s.selectedSpecies);
  const animRef = useRef<{
    active: boolean;
    startTime: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
  }>({
    active: false,
    startTime: 0,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
  });

  useFrame((state) => {
    if (selectedSpecies && !animRef.current.active) {
      animRef.current.active = true;
      animRef.current.startTime = state.clock.elapsedTime;
      animRef.current.startPos.copy(state.camera.position);
      const target = new THREE.Vector3(...selectedSpecies.position);
      const offset = new THREE.Vector3(5, 3, 5);
      animRef.current.endPos.copy(target).add(offset);
      animRef.current.targetLookAt.copy(target);
    }

    if (animRef.current.active) {
      const elapsed = state.clock.elapsedTime - animRef.current.startTime;
      const duration = 1.0;
      const t = Math.min(1, elapsed / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const current = new THREE.Vector3().lerpVectors(
        animRef.current.startPos,
        animRef.current.endPos,
        eased
      );
      current.y += Math.sin(t * Math.PI) * 5;

      state.camera.position.copy(current);
      state.camera.lookAt(animRef.current.targetLookAt);

      if (t >= 1) {
        animRef.current.active = false;
      }
    }
  });

  return null;
}
