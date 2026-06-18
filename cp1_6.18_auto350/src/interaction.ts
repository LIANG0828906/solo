import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { StarData } from './types';
import { useStarStore } from './starStore';

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getInterpolatedPosition(
  star: StarData,
  currentEra: number,
  targetEra: number,
  progress: number
) {
  const pA = star.eraPositions[currentEra];
  const pB = star.eraPositions[targetEra];
  const eased = easeInOut(progress);
  return new THREE.Vector3(
    pA.x + (pB.x - pA.x) * eased,
    pA.y + (pB.y - pA.y) * eased,
    pA.z + (pB.z - pA.z) * eased
  );
}

export function StarInteractionHandler() {
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const stars = useStarStore((s) => s.stars);
  const currentEraIndex = useStarStore((s) => s.currentEraIndex);
  const targetEraIndex = useStarStore((s) => s.targetEraIndex);
  const transitionProgress = useStarStore((s) => s.transitionProgress);
  const selectStar = useStarStore((s) => s.selectStar);
  const { camera, gl, scene } = useThree();

  const starPositions = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    stars.forEach((star, i) => {
      positions[i * 3] = star.eraPositions[0].x;
      positions[i * 3 + 1] = star.eraPositions[0].y;
      positions[i * 3 + 2] = star.eraPositions[0].z;
    });
    return positions;
  }, [stars]);

  const hitGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [starPositions]);

  useFrame(() => {
    const positions = hitGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      const pos = getInterpolatedPosition(star, currentEraIndex, targetEraIndex, transitionProgress);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
    }
    hitGeometry.attributes.position.needsUpdate = true;
    hitGeometry.computeBoundingSphere();
  });

  useEffect(() => {
    const hitMaterial = new THREE.PointsMaterial({
      size: 0.3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    const hitPoints = new THREE.Points(hitGeometry, hitMaterial);
    hitPoints.name = '__starHitPoints__';
    scene.add(hitPoints);

    const handlePointerDown = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      raycasterRef.current.params.Points = { threshold: 0.25 };

      const intersects = raycasterRef.current.intersectObject(hitPoints, false);

      if (intersects.length > 0) {
        const idx = intersects[0].index;
        if (idx !== undefined) {
          const star = stars[idx];
          if (star) {
            selectStar(star.id);
            console.log(`[星图演算] 选中星体: ${star.name}`);
          }
        }
      }
    };

    const handleSceneClick = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-ui-element]')) return;
      if (target.closest('[data-panel]')) return;
      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      raycasterRef.current.params.Points = { threshold: 0.25 };

      const intersects = raycasterRef.current.intersectObject(hitPoints, false);

      if (intersects.length === 0) {
        selectStar(null);
      }
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerdown', handleSceneClick);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerdown', handleSceneClick);
      scene.remove(hitPoints);
      hitGeometry.dispose();
      hitMaterial.dispose();
    };
  }, [gl, camera, scene, hitGeometry, stars, selectStar, currentEraIndex, targetEraIndex, transitionProgress]);

  return null;
}

export function CameraControls() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 18);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      minDistance={3}
      maxDistance={20}
      makeDefault
    />
  );
}
