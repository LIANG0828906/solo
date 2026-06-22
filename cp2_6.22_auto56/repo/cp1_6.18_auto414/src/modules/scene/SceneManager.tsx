import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { FragmentMesh } from './FragmentMesh';
import { GoldParticles } from './GoldParticles';
import { useGameStore, type Fragment } from '@/stores/gameStore';
import { useInteractionHandler } from '@/modules/interaction/InteractionHandler';
import { checkMatch } from '@/modules/physics/PhysicsEngine';

interface CameraControllerProps {
  resetSignal: number;
}

function CameraController({ resetSignal }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    camera.position.set(8, 6, 10);
    camera.lookAt(0, 0, 0);
  }, []);

  useEffect(() => {
    if (resetSignal > 0 && controlsRef.current) {
      camera.position.set(8, 6, 10);
      camera.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [resetSignal, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={2}
      maxDistance={20}
      mouseButtons={{
        LEFT: undefined as any,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
    />
  );
}

interface CompleteRotationProps {
  active: boolean;
}

function CompleteRotation({ active }: CompleteRotationProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (active && groupRef.current) {
      groupRef.current.rotation.y += (delta * Math.PI * 2) / 10;
    }
  });

  return <group ref={groupRef} />;
}

function SceneContent() {
  const { fragments, isComplete, cameraResetSignal } = useGameStore();
  const { handlePointerDown, handlePointerOver, handlePointerOut } = useInteractionHandler();

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useGameStore.getState();
      const { fragments: frags, matchFragments, addFloatingScore, isComplete: complete } = state;
      if (complete) return;

      for (const f of frags) {
        if (f.isMatched || !f.partnerId) continue;
        const partner = frags.find((p) => p.id === f.partnerId);
        if (!partner || partner.isMatched) continue;

        const result = checkMatch(
          f.position,
          f.rotation,
          partner.position,
          partner.rotation,
          f.targetPosition,
          f.targetRotation,
          partner.targetPosition,
          partner.targetRotation
        );

        if (result.isMatch) {
          matchFragments(f.id, partner.id, result.score);
          addFloatingScore(window.innerWidth / 2, window.innerHeight / 2 - 50, result.score);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <CameraController resetSignal={cameraResetSignal} />

      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <pointLight position={[0, 5, 0]} intensity={0.4} color="#FFE4B5" />
      <hemisphereLight args={['#4a3a6a', '#1a1a2e', 0.3]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0D0F1F" roughness={1} metalness={0} />
      </mesh>

      <gridHelper
        args={[30, 30, '#1E2238', '#141728']}
        position={[0, -2.49, 0]}
      />

      {isComplete ? (
        <CompleteRotation active={isComplete}>
          {fragments.map((f: Fragment) => (
            <FragmentMesh
              key={f.id}
              fragment={f}
              onPointerDown={handlePointerDown}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            />
          ))}
        </CompleteRotation>
      ) : (
        fragments.map((f: Fragment) => (
          <FragmentMesh
            key={f.id}
            fragment={f}
            onPointerDown={handlePointerDown}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          />
        ))
      )}

      <GoldParticles active={isComplete} count={200} />
    </>
  );
}

export function SceneManager() {
  return (
    <Canvas
      shadows
      camera={{ position: [8, 6, 10], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor('#0B0E1A');
        scene.fog = new THREE.Fog('#0B0E1A', 15, 40);
      }}
      style={{
        background: 'linear-gradient(180deg, #0B0E1A 0%, #1A0A2E 100%)',
      }}
    >
      <SceneContent />
    </Canvas>
  );
}
