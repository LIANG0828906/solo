import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { uiConfig } from '@/data/uiConfig';

interface CameraControllerProps {
  onFpsUpdate?: (fps: number) => void;
  onVisibleBuildingsChange?: (count: number) => void;
  buildingCount?: number;
}

export function CameraController({ onFpsUpdate, onVisibleBuildingsChange, buildingCount = 0 }: CameraControllerProps) {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now(), fps: 60 });
  const frustumRef = useRef(new THREE.Frustum());
  const projScreenMatrixRef = useRef(new THREE.Matrix4());

  const { initialPosition, rotateSpeed, minDistance, maxDistance, panSpeed } = uiConfig.camera;

  useEffect(() => {
    camera.position.set(...initialPosition);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, initialPosition]);

  useEffect(() => {
    if (onVisibleBuildingsChange && buildingCount > 0) {
      onVisibleBuildingsChange(buildingCount);
    }
  }, [buildingCount, onVisibleBuildingsChange]);

  useFrame(() => {
    const now = performance.now();
    fpsRef.current.frames++;

    const elapsed = now - fpsRef.current.lastTime;
    if (elapsed >= 1000) {
      const fps = Math.round((fpsRef.current.frames * 1000) / elapsed);
      fpsRef.current.fps = fps;
      fpsRef.current.frames = 0;
      fpsRef.current.lastTime = now;
      if (onFpsUpdate) onFpsUpdate(fps);

      try {
        projScreenMatrixRef.current.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse,
        );
        frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current);

        const mesh = scene.children.find(c => c.type === 'Group' || c.type === 'InstancedMesh');
        if (mesh) {
          const bbox = new THREE.Box3().setFromObject(mesh);
          const center = new THREE.Vector3();
          bbox.getCenter(center);
          if (frustumRef.current.containsPoint(center) && onVisibleBuildingsChange) {
            onVisibleBuildingsChange(buildingCount);
          }
        }
      } catch {
        if (onVisibleBuildingsChange) onVisibleBuildingsChange(buildingCount);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={rotateSpeed * 1000}
      minDistance={minDistance}
      maxDistance={maxDistance}
      panSpeed={panSpeed}
      enablePan={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      target={[0, 0, 0]}
      gl={gl}
    />
  );
}

export default CameraController;
