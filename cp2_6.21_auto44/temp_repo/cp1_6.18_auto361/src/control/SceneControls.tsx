import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useMineralStore } from '../store/mineralStore';
import { getRandomMineralType } from '../data/oreData';

interface SceneControlsProps {
  children: React.ReactNode;
}

const SceneInteractionHandler: React.FC = () => {
  const { camera, gl, raycaster, pointer } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const intersectPoint = useRef(new THREE.Vector3());
  const isDragging = useRef(false);
  const dragStart = useRef(new THREE.Vector2());
  const addSeedPoint = useMineralStore((state) => state.addSeedPoint);
  const selectCrystal = useMineralStore((state) => state.selectCrystal);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return;
    isDragging.current = true;
    dragStart.current.set(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const dx = Math.abs(event.clientX - dragStart.current.x);
    const dy = Math.abs(event.clientY - dragStart.current.y);

    if (dx < 5 && dy < 5) {
      raycaster.setFromCamera(pointer, camera);
      const intersection = new THREE.Vector3();
      const normal = new THREE.Vector3(0, 0, 1);
      const plane = new THREE.Plane();

      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      plane.setFromNormalAndCoplanarPoint(
        cameraDirection.clone().negate(),
        new THREE.Vector3(0, 0, 0)
      );

      if (raycaster.ray.intersectPlane(plane, intersection)) {
        const distance = intersection.length();
        if (distance <= 3) {
          const mineralType = getRandomMineralType();
          addSeedPoint(intersection, mineralType);
        }
      }
    }
  };

  const handleMissClick = () => {
    selectCrystal(null);
  };

  return (
    <group
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleMissClick}
    />
  );
};

const SceneControls: React.FC<SceneControlsProps> = ({ children }) => {
  const controlsRef = useRef<any>(null);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={10}
        enablePan={true}
        makeDefault
      />
      <SceneInteractionHandler />
      {children}
    </>
  );
};

export default SceneControls;
