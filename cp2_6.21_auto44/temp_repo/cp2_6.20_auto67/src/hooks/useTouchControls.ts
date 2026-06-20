import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import type { OrbitControls } from 'three-stdlib';
import * as THREE from 'three';
import { clamp } from '@/utils/easing';

interface UseTouchControlsOptions {
  enabled?: boolean;
  rotateSpeed?: number;
  zoomSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
}

export function useTouchControls(
  controlsRef: React.RefObject<OrbitControls>,
  options: UseTouchControlsOptions = {}
) {
  const {
    enabled = true,
    rotateSpeed = 1,
    zoomSpeed = 1,
    minDistance = 5,
    maxDistance = 200,
  } = options;

  const { camera } = useThree();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistance = useRef<number>(0);
  const initialCameraDistance = useRef<number>(0);
  const isPinching = useRef<boolean>(false);
  const lastTouchTime = useRef<number>(0);

  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        isPinching.current = false;
      } else if (e.touches.length === 2) {
        e.preventDefault();
        isPinching.current = true;
        initialPinchDistance.current = getTouchDistance(
          e.touches[0],
          e.touches[1]
        );
        if (controlsRef.current) {
          const direction = new THREE.Vector3()
            .subVectors(camera.position, controlsRef.current.target)
            .normalize();
          initialCameraDistance.current = direction.length();
        }
      }

      lastTouchTime.current = Date.now();
    },
    [enabled, camera, controlsRef]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !controlsRef.current) return;

      if (e.touches.length === 1 && !isPinching.current) {
        const touch = e.touches[0];
        if (!touchStartPos.current) return;

        const deltaX = touch.clientX - touchStartPos.current.x;
        const deltaY = touch.clientY - touchStartPos.current.y;

        const rotateDelta = rotateSpeed * 0.005;

        const spherical = new THREE.Spherical();
        const offset = new THREE.Vector3().subVectors(
          camera.position,
          controlsRef.current.target
        );
        spherical.setFromVector3(offset);

        spherical.theta -= deltaX * rotateDelta;
        spherical.phi += deltaY * rotateDelta;
        spherical.phi = clamp(spherical.phi, 0.1, Math.PI - 0.1);

        offset.setFromSpherical(spherical);
        camera.position.copy(controlsRef.current.target).add(offset);
        camera.lookAt(controlsRef.current.target);

        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = initialPinchDistance.current / currentDistance;

        let newDistance = initialCameraDistance.current * scale;
        newDistance = clamp(newDistance, minDistance, maxDistance);

        const direction = new THREE.Vector3()
          .subVectors(camera.position, controlsRef.current.target)
          .normalize();

        const newPosition = new THREE.Vector3()
          .copy(controlsRef.current.target)
          .add(direction.multiplyScalar(newDistance));

        camera.position.copy(newPosition);
        controlsRef.current.update();
      }
    },
    [enabled, rotateSpeed, minDistance, maxDistance, camera, controlsRef]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      if (e.touches.length === 0) {
        touchStartPos.current = null;
        isPinching.current = false;
      } else if (e.touches.length === 1 && isPinching.current) {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        isPinching.current = false;
      }
    },
    [enabled]
  );

  const setContainer = useCallback((element: HTMLDivElement | null) => {
    if (containerRef.current) {
      containerRef.current.removeEventListener(
        'touchstart',
        handleTouchStart as EventListener
      );
      containerRef.current.removeEventListener(
        'touchmove',
        handleTouchMove as EventListener
      );
      containerRef.current.removeEventListener(
        'touchend',
        handleTouchEnd as EventListener
      );
    }

    containerRef.current = element;

    if (element) {
      element.addEventListener(
        'touchstart',
        handleTouchStart as EventListener,
        { passive: false }
      );
      element.addEventListener(
        'touchmove',
        handleTouchMove as EventListener,
        { passive: false }
      );
      element.addEventListener(
        'touchend',
        handleTouchEnd as EventListener
      );
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener(
          'touchstart',
          handleTouchStart as EventListener
        );
        containerRef.current.removeEventListener(
          'touchmove',
          handleTouchMove as EventListener
        );
        containerRef.current.removeEventListener(
          'touchend',
          handleTouchEnd as EventListener
        );
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { setContainer };
}
