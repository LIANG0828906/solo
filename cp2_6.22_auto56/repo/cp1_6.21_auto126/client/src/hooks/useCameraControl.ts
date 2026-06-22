import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControlOptions {
  target?: THREE.Vector3;
  minDistance?: number;
  maxDistance?: number;
  rotateSpeed?: number;
  zoomSpeed?: number;
  panSpeed?: number;
}

export function useCameraControl(options: CameraControlOptions = {}) {
  const {
    target = new THREE.Vector3(0, 1, 0),
    minDistance = 3,
    maxDistance = 20,
    rotateSpeed = 0.003,
    panSpeed = 0.01
  } = options;

  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const isPanning = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const spherical = useRef(new THREE.Spherical());
  const cameraTarget = useRef(target.clone());

  useEffect(() => {
    const offset = new THREE.Vector3(10, 8, 10);
    camera.position.copy(cameraTarget.current).add(offset);
    camera.lookAt(cameraTarget.current);

    const direction = new THREE.Vector3().subVectors(camera.position, cameraTarget.current);
    spherical.current.setFromVector3(direction);
  }, [camera]);

  const updateCameraPosition = useCallback(() => {
    const offset = new THREE.Vector3().setFromSpherical(spherical.current);
    camera.position.copy(cameraTarget.current).add(offset);
    camera.lookAt(cameraTarget.current);
  }, [camera]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) {
      isDragging.current = true;
    } else if (e.button === 1) {
      isPanning.current = true;
      e.preventDefault();
    }
    previousMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current && !isPanning.current) return;

    const deltaX = e.clientX - previousMouse.current.x;
    const deltaY = e.clientY - previousMouse.current.y;

    if (isDragging.current) {
      spherical.current.theta -= deltaX * rotateSpeed;
      spherical.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, spherical.current.phi - deltaY * rotateSpeed)
      );
      updateCameraPosition();
    }

    if (isPanning.current) {
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      camera.getWorldDirection(right);
      right.cross(up).normalize();

      const panX = right.multiplyScalar(-deltaX * panSpeed);
      const panY = up.multiplyScalar(deltaY * panSpeed);

      cameraTarget.current.add(panX).add(panY);
      updateCameraPosition();
    }

    previousMouse.current = { x: e.clientX, y: e.clientY };
  }, [camera, rotateSpeed, panSpeed, updateCameraPosition]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 0) isDragging.current = false;
    if (e.button === 1) isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.01;
    spherical.current.radius = Math.max(
      minDistance,
      Math.min(maxDistance, spherical.current.radius + zoomDelta)
    );
    updateCameraPosition();
  }, [minDistance, maxDistance, updateCameraPosition]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    const domElement = gl.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    domElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      domElement.removeEventListener('mousedown', handleMouseDown);
      domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl.domElement, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleContextMenu]);

  return {
    cameraTarget: cameraTarget.current,
    setTarget: (newTarget: THREE.Vector3) => {
      cameraTarget.current.copy(newTarget);
      updateCameraPosition();
    }
  };
}
