import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { Cabinet } from './Cabinet';
import { Ground } from './Ground';
import { COLORS, ANIMATION } from '../utils/constants';

function CameraController() {
  const { camera } = useThree();
  const selectedId = useStore((state) => state.selectedId);
  const items = useStore((state) => state.items);
  const controlsRef = useRef<any>(null);

  const animRef = useRef({
    active: false,
    startTime: 0,
    startPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  useEffect(() => {
    if (selectedId) {
      const cabinet = items.find((item) => item.id === selectedId);
      if (cabinet && controlsRef.current) {
        const anim = animRef.current;
        anim.startPos.copy(camera.position);
        anim.startTarget.copy(controlsRef.current.target);

        const targetPos = new THREE.Vector3(
          cabinet.x + 3,
          2,
          cabinet.z + 3
        );
        const lookTarget = new THREE.Vector3(cabinet.x, 1.5, cabinet.z);

        anim.endPos.copy(targetPos);
        anim.endTarget.copy(lookTarget);
        anim.startTime = performance.now();
        anim.active = true;
      }
    }
  }, [selectedId, items, camera]);

  useFrame(() => {
    const anim = animRef.current;
    if (anim.active && controlsRef.current) {
      const elapsed = (performance.now() - anim.startTime) / 1000;
      const t = Math.min(1, elapsed / ANIMATION.focusCamera);

      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      camera.position.lerpVectors(anim.startPos, anim.endPos, easeT);
      controlsRef.current.target.lerpVectors(
        anim.startTarget,
        anim.endTarget,
        easeT
      );
      controlsRef.current.update();

      if (t >= 1) {
        anim.active = false;
      }
    }
  });

  return <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.05} />;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} color="#8888aa" />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-8, 6, -8]} intensity={0.3} color="#6688ff" />
      <pointLight position={[8, 6, 8]} intensity={0.2} color="#ff6688" />
    </>
  );
}

function CabinetsGroup() {
  const items = useStore((state) => state.items);

  return (
    <group>
      {items.map((cabinet) => (
        <Cabinet key={cabinet.id} data={cabinet} />
      ))}
    </group>
  );
}

interface Scene3DProps {
  onBackgroundClick?: () => void;
}

export function Scene3D({ onBackgroundClick }: Scene3DProps) {
  const handleCanvasClick = (e: any) => {
    if (e.target === e.currentTarget || e.object?.type === 'Mesh') {
    }
  };

  return (
    <Canvas
      shadows
      camera={{ position: [12, 10, 12], fov: 45 }}
      style={{ background: COLORS.bg }}
      onClick={(e) => {
        if (e.deltaX === 0 && e.deltaY === 0) {
          onBackgroundClick?.();
        }
      }}
      gl={{ antialias: true }}
    >
      <fog attach="fog" args={[COLORS.bg, 20, 40]} />
      <Lights />
      <Ground />
      <CabinetsGroup />
      <CameraController />
    </Canvas>
  );
}
