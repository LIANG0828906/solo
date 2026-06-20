import { useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStarStore } from '@/store/starStore';
import { easeOutCubic } from '@/utils/easing';
import type { OrbitControls } from 'three-stdlib';

interface UseCameraFlightOptions {
  duration?: number;
  offset?: [number, number, number];
}

export function useCameraFlight(
  controlsRef: React.RefObject<OrbitControls>,
  options: UseCameraFlightOptions = {}
) {
  const { duration = 2000, offset = [5, 3, 5] } = options;
  const { camera } = useThree();

  const isFlying = useStarStore((state) => state.isFlying);
  const setIsFlying = useStarStore((state) => state.setIsFlying);
  const selectStar = useStarStore((state) => state.selectStar);

  const animationId = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const startPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const endPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const startTarget = useRef<THREE.Vector3>(new THREE.Vector3());
  const endTarget = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetStarId = useRef<string | null>(null);

  const flyTo = useCallback(
    (targetPosition: [number, number, number], starId?: string) => {
      if (isFlying) return;

      setIsFlying(true);
      targetStarId.current = starId || null;

      startTime.current = performance.now();
      startPosition.current.copy(camera.position);

      const targetVec = new THREE.Vector3(
        targetPosition[0],
        targetPosition[1],
        targetPosition[2]
      );

      const direction = new THREE.Vector3()
        .subVectors(camera.position, targetVec)
        .normalize();
      const offsetVec = new THREE.Vector3(offset[0], offset[1], offset[2]);
      const finalOffset = direction.multiplyScalar(8).add(offsetVec);

      endPosition.current.copy(targetVec).add(finalOffset);

      if (controlsRef.current) {
        startTarget.current.copy(controlsRef.current.target);
      }
      endTarget.current.copy(targetVec);

      const animate = () => {
        const elapsed = performance.now() - startTime.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);

        camera.position.lerpVectors(
          startPosition.current,
          endPosition.current,
          eased
        );

        if (controlsRef.current) {
          controlsRef.current.target.lerpVectors(
            startTarget.current,
            endTarget.current,
            eased
          );
          controlsRef.current.update();
        }

        if (progress < 1) {
          animationId.current = requestAnimationFrame(animate);
        } else {
          setIsFlying(false);
          if (targetStarId.current) {
            selectStar(targetStarId.current);
          }
          animationId.current = null;
        }
      };

      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
      animationId.current = requestAnimationFrame(animate);
    },
    [camera, controlsRef, duration, offset, isFlying, setIsFlying, selectStar]
  );

  const cancelFlight = useCallback(() => {
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
      animationId.current = null;
      setIsFlying(false);
    }
  }, [setIsFlying]);

  useEffect(() => {
    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, []);

  return { flyTo, cancelFlight };
}
