import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useGameStore, type Vec3, type Euler3 } from '@/stores/gameStore';

const SPRING_STIFFNESS = 8;
const SPRING_DAMPING = 0.5;

interface DragState {
  active: boolean;
  fragmentId: string | null;
  mode: 'translate' | 'rotate';
  offset: THREE.Vector3;
  plane: THREE.Plane;
  lastPosition: Vec3;
  velocity: Vec3;
  lastRotation: Euler3;
  lastScreenPoint: { x: number; y: number };
}

export function useInteractionHandler() {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const dragState = useRef<DragState>({
    active: false,
    fragmentId: null,
    mode: 'translate',
    offset: new THREE.Vector3(),
    plane: new THREE.Plane(),
    lastPosition: [0, 0, 0],
    velocity: [0, 0, 0],
    lastRotation: [0, 0, 0],
    lastScreenPoint: { x: 0, y: 0 },
  });

  const rafId = useRef<number | null>(null);

  const {
    fragments,
    selectFragment,
    setHoveredFragment,
    updateFragment,
    selectedId,
  } = useGameStore();

  const getIntersectPoint = useCallback(
    (clientX: number, clientY: number, plane: THREE.Plane): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(pointer.current, camera);

      const intersection = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(plane, intersection);
      return intersection;
    },
    [camera, gl]
  );

  const handlePointerDown = useCallback(
    (e: any, fragmentId: string) => {
      e.stopPropagation();
      const fragment = fragments.find((f) => f.id === fragmentId);
      if (!fragment || fragment.isMatched) return;

      const mode: 'translate' | 'rotate' = e.shiftKey ? 'rotate' : 'translate';

      const planeNormal = new THREE.Vector3(0, 1, 0);
      const planePoint = new THREE.Vector3(
        fragment.position[0],
        fragment.position[1],
        fragment.position[2]
      );
      dragState.current.plane.setFromNormalAndCoplanarPoint(planeNormal, planePoint);

      const intersectPoint = getIntersectPoint(e.clientX, e.clientY, dragState.current.plane);
      if (!intersectPoint) return;

      dragState.current.offset
        .copy(intersectPoint)
        .sub(new THREE.Vector3(...fragment.position));

      dragState.current.active = true;
      dragState.current.fragmentId = fragmentId;
      dragState.current.mode = mode;
      dragState.current.lastPosition = [...fragment.position] as Vec3;
      dragState.current.lastRotation = [...fragment.rotation] as Euler3;
      dragState.current.lastScreenPoint = { x: e.clientX, y: e.clientY };
      dragState.current.velocity = [0, 0, 0];

      selectFragment(fragmentId);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      document.body.style.cursor = mode === 'rotate' ? 'grabbing' : 'grabbing';
    },
    [fragments, selectFragment, getIntersectPoint]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current.active || !dragState.current.fragmentId) return;

      const fragment = fragments.find((f) => f.id === dragState.current.fragmentId);
      if (!fragment) return;

      if (dragState.current.mode === 'translate') {
        const intersectPoint = getIntersectPoint(
          e.clientX,
          e.clientY,
          dragState.current.plane
        );
        if (!intersectPoint) return;

        const target = intersectPoint.sub(dragState.current.offset);
        const prev = dragState.current.lastPosition;
        const springedX = prev[0] + (target.x - prev[0]) * 0.25;
        const springedY = prev[1] + (target.y - prev[1]) * 0.25;
        const springedZ = prev[2] + (target.z - prev[2]) * 0.25;

        const newPos: Vec3 = [springedX, springedY, springedZ];

        dragState.current.velocity = [
          springedX - prev[0],
          springedY - prev[1],
          springedZ - prev[2],
        ];
        dragState.current.lastPosition = newPos;

        updateFragment(dragState.current.fragmentId, { position: newPos });
      } else {
        const dx = e.clientX - dragState.current.lastScreenPoint.x;
        const dy = e.clientY - dragState.current.lastScreenPoint.y;

        const sensitivity = 0.01;
        const newRot: Euler3 = [
          fragment.rotation[0] + dy * sensitivity,
          fragment.rotation[1] + dx * sensitivity,
          fragment.rotation[2],
        ];

        dragState.current.lastScreenPoint = { x: e.clientX, y: e.clientY };
        dragState.current.lastRotation = newRot;

        updateFragment(dragState.current.fragmentId, { rotation: newRot });
      }
    },
    [fragments, getIntersectPoint, updateFragment]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current.active) return;

      if (dragState.current.active && dragState.current.fragmentId) {
        const frag = fragments.find((f) => f.id === dragState.current.fragmentId);
        if (frag && !frag.isMatched) {
          if (Math.abs(dragState.current.velocity[0]) > 0.001 ||
              Math.abs(dragState.current.velocity[1]) > 0.001 ||
              Math.abs(dragState.current.velocity[2]) > 0.001) {
            let vel = [...dragState.current.velocity] as Vec3;
            let pos = [...dragState.current.lastPosition] as Vec3;
            let damping = 0.92;
            const animate = () => {
              pos = [
                pos[0] + vel[0],
                pos[1] + vel[1],
                pos[2] + vel[2],
              ];
              vel = [vel[0] * damping, vel[1] * damping, vel[2] * damping];
              const speed = Math.sqrt(vel[0] ** 2 + vel[1] ** 2 + vel[2] ** 2);
              const f = fragments.find((fr) => fr.id === dragState.current.fragmentId);
              if (f && !f.isMatched && speed > 0.0005) {
                updateFragment(dragState.current.fragmentId!, { position: pos });
                rafId.current = requestAnimationFrame(animate);
              } else {
                rafId.current = null;
              }
            };
            rafId.current = requestAnimationFrame(animate);
          }
        }
      }

      dragState.current.active = false;
      dragState.current.fragmentId = null;
      document.body.style.cursor = 'default';
    },
    [fragments, updateFragment]
  );

  const handlePointerOver = useCallback(
    (_e: any, id: string) => {
      setHoveredFragment(id);
    },
    [setHoveredFragment]
  );

  const handlePointerOut = useCallback(() => {
    setHoveredFragment(null);
  }, [setHoveredFragment]);

  const handleCanvasClick = useCallback(
    (e: any) => {
      if (!e.target || e.target === gl.domElement || e.target.tagName === 'CANVAS') {
        selectFragment(null);
      }
    },
    [selectFragment, gl]
  );

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('click', handleCanvasClick);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [gl, handlePointerMove, handlePointerUp, handleCanvasClick]);

  return {
    handlePointerDown,
    handlePointerOver,
    handlePointerOut,
  };
}
