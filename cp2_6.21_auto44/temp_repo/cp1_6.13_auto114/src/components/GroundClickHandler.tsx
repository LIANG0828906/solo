import { useRef } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import useSimulationStore from '@/store/useSimulationStore';

export default function GroundClickHandler() {
  const { camera, raycaster, pointer } = useThree();
  const planeRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const addGravitySource = useSimulationStore((s) => s.addGravitySource);
  const mouseDownRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (_e: ThreeEvent<PointerEvent>) => {
    mouseDownRef.current = { x: pointer.x, y: pointer.y };
  };

  const handlePointerUp = (_e: ThreeEvent<PointerEvent>) => {
    if (!mouseDownRef.current) return;
    const dx = Math.abs(pointer.x - mouseDownRef.current.x);
    const dy = Math.abs(pointer.y - mouseDownRef.current.y);
    mouseDownRef.current = null;
    if (dx > 0.02 || dy > 0.02) return;

    const ndc = new THREE.Vector2(pointer.x, pointer.y);
    raycaster.setFromCamera(ndc, camera);
    const intersect = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(planeRef.current, intersect);
    if (!hit) return;

    const x = THREE.MathUtils.clamp(intersect.x, -20, 20);
    const z = THREE.MathUtils.clamp(intersect.z, -20, 20);
    addGravitySource([x, z]);
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
