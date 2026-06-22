import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three-stdlib';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';

export function CameraController() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  const cameraDistance = useStore((state) => state.cameraDistance);
  const minDistance = useStore((state) => state.minDistance);
  const maxDistance = useStore((state) => state.maxDistance);
  const setUserInteracting = useStore((state) => state.setUserInteracting);
  const setCameraDistance = useStore((state) => state.setCameraDistance);
  const isCutaway = useStore((state) => state.isCutaway);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controlsRef.current = controls;

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.target.set(0, 0, 0);

    controls.addEventListener('start', () => {
      setUserInteracting(true);
    });

    controls.addEventListener('end', () => {
      setUserInteracting(false);
    });

    const handleZoom = () => {
      const distance = camera.position.length();
      setCameraDistance(distance);
    };

    controls.addEventListener('change', handleZoom);

    camera.position.set(0, 5, cameraDistance);
    camera.lookAt(0, 0, 0);

    return () => {
      controls.removeEventListener('start', () => setUserInteracting(true));
      controls.removeEventListener('end', () => setUserInteracting(false));
      controls.removeEventListener('change', handleZoom);
      controls.dispose();
    };
  }, [camera, gl, minDistance, maxDistance, setUserInteracting, setCameraDistance, cameraDistance]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.minDistance = minDistance;
      controlsRef.current.maxDistance = maxDistance;
    }
  }, [minDistance, maxDistance]);

  useEffect(() => {
    if (isCutaway && controlsRef.current) {
      const targetAzimuth = Math.PI / 2;
      const currentAzimuth = controlsRef.current.getAzimuthalAngle();
      
      let animationId: number;
      const startAngle = currentAzimuth;
      const endAngle = targetAzimuth;
      const duration = 1000;
      const startTime = performance.now();

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        const angle = startAngle + (endAngle - startAngle) * eased;
        if (controlsRef.current) {
          controlsRef.current.setAzimuthalAngle(angle);
        }

        if (t < 1) {
          animationId = requestAnimationFrame(animate);
        }
      };

      animationId = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationId);
      };
    }
  }, [isCutaway]);

  return null;
}
