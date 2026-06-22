import React, { useRef } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';

const ClickHandler: React.FC = () => {
  const setTargetPoint = useSceneStore((s) => s.setTargetPoint);
  const swarmMode = useSceneStore((s) => s.swarmMode);
  const terrainSize = useSceneStore((s) => s.terrainSize);
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const mouse = useRef(new THREE.Vector2());

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (swarmMode !== 'gather') return;
    event.stopPropagation();

    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);
    const intersection = new THREE.Vector3();
    const hit = raycaster.current.ray.intersectPlane(groundPlane.current, intersection);

    if (hit) {
      const half = terrainSize / 2;
      intersection.x = THREE.MathUtils.clamp(intersection.x, -half, half);
      intersection.z = THREE.MathUtils.clamp(intersection.z, -half, half);

      setTargetPoint({
        position: intersection.clone(),
        createdAt: performance.now() / 1000,
      });
    }
  };

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0.005, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[terrainSize, terrainSize]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
};

export default ClickHandler;
