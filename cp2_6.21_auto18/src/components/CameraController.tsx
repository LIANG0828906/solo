import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useSceneStore } from '../store/sceneStore';
import { CameraPathType } from '../types/scene';

export function CameraController() {
  const { camera, scene } = useThree();
  const controlsRef = useRef<any>(null);
  const cameraPath = useSceneStore((state) => state.cameraPath);
  const isAnimating = useSceneStore((state) => state.isAnimating);
  const setCameraPath = useSceneStore((state) => state.setCameraPath);
  const animationTimeline = useRef<gsap.core.Timeline | null>(null);
  const currentPath = useRef<CameraPathType>('none');
  const animationProgress = useRef(0);
  const isPaused = useRef(false);

  useEffect(() => {
    if (cameraPath === 'none') {
      if (animationTimeline.current) {
        animationTimeline.current.kill();
        animationTimeline.current = null;
      }
      currentPath.current = 'none';
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
      return;
    }

    if (cameraPath !== currentPath.current) {
      startCameraAnimation(cameraPath);
      currentPath.current = cameraPath;
    }
  }, [cameraPath]);

  useEffect(() => {
    if (animationTimeline.current) {
      if (isAnimating) {
        animationTimeline.current.play();
        isPaused.current = false;
      } else {
        animationTimeline.current.pause();
        isPaused.current = true;
      }
    }
  }, [isAnimating]);

  const startCameraAnimation = (pathType: CameraPathType) => {
    if (animationTimeline.current) {
      animationTimeline.current.kill();
      animationTimeline.current = null;
    }

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    const tl = gsap.timeline({
      repeat: -1,
      onUpdate: () => {
        animationProgress.current = tl.progress();
      },
    });

    const lookAtTarget = new THREE.Vector3(0, 1, 0);

    switch (pathType) {
      case 'orbit':
        const radius = 8;
        const height = 3;
        const duration = 30;

        const orbitObj = { angle: 0 };
        tl.to(orbitObj, {
          angle: Math.PI * 2,
          duration: duration,
          ease: 'none',
          onUpdate: () => {
            const angle = orbitObj.angle;
            camera.position.x = Math.cos(angle) * radius;
            camera.position.z = Math.sin(angle) * radius;
            camera.position.y = height;
            camera.lookAt(lookAtTarget);
          },
        });
        break;

      case 'linear':
        const startPos = new THREE.Vector3(0, 3, 12);
        const endPos = new THREE.Vector3(0, 3, -4);
        const linearDuration = 15;

        camera.position.copy(startPos);
        camera.lookAt(lookAtTarget);

        tl.to(camera.position, {
          x: endPos.x,
          y: endPos.y,
          z: endPos.z,
          duration: linearDuration,
          ease: 'power2.inOut',
          onUpdate: () => {
            camera.lookAt(lookAtTarget);
          },
        });

        tl.to(camera.position, {
          x: startPos.x,
          y: startPos.y,
          z: startPos.z,
          duration: linearDuration,
          ease: 'power2.inOut',
          onUpdate: () => {
            camera.lookAt(lookAtTarget);
          },
        });
        break;

      case 'snake':
        const snakeDuration = 25;
        const amplitude = 4;
        const forwardStart = 10;
        const forwardEnd = -6;

        const snakeObj = { t: 0 };
        tl.to(snakeObj, {
          t: 1,
          duration: snakeDuration,
          ease: 'none',
          onUpdate: () => {
            const t = snakeObj.t;
            const z = forwardStart + (forwardEnd - forwardStart) * t;
            const x = Math.sin(t * Math.PI * 4) * amplitude;
            const y = 3 + Math.sin(t * Math.PI * 2) * 0.5;

            camera.position.set(x, y, z);

            const lookZ = z - 2;
            const lookX = Math.sin(t * Math.PI * 4 + 0.3) * amplitude * 0.3;
            camera.lookAt(lookX, 1.5, lookZ);
          },
        });

        tl.to(snakeObj, {
          t: 0,
          duration: snakeDuration * 0.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            const t = snakeObj.t;
            const z = forwardStart + (forwardEnd - forwardStart) * t;
            const x = Math.sin(t * Math.PI * 4) * amplitude;
            const y = 3 + Math.sin(t * Math.PI * 2) * 0.5;

            camera.position.set(x, y, z);
            camera.lookAt(0, 1.5, z - 2);
          },
        });
        break;
    }

    animationTimeline.current = tl;
  };

  useEffect(() => {
    return () => {
      if (animationTimeline.current) {
        animationTimeline.current.kill();
      }
    };
  }, []);

  const handlePointerDown = () => {
    if (cameraPath !== 'none' && animationTimeline.current) {
      if (!isPaused.current) {
        animationTimeline.current.pause();
        isPaused.current = true;
      }
    }
  };

  const handlePointerUp = () => {
    if (cameraPath !== 'none' && animationTimeline.current && isPaused.current && isAnimating) {
      animationTimeline.current.play();
      isPaused.current = false;
    }
  };

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointerup', handlePointerUp);
      return () => {
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [cameraPath, isAnimating]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2 - 0.1}
      minPolarAngle={0.2}
      makeDefault
    />
  );
}
