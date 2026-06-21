import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { getJointTransforms, LEG_CONFIG } from '../robot/RobotController';
import type { RobotPose } from '../types';

interface HexapodProps {
  pose: RobotPose;
  selectedLeg: number | null;
}

function Segment({
  from,
  to,
  radius,
  color,
  emissive,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  color: string;
  emissive?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    meshRef.current.position.copy(mid);
    meshRef.current.scale.set(1, length, 1);
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
    meshRef.current.quaternion.copy(quaternion);
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[radius, radius, 1, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive || '#000000'}
        emissiveIntensity={emissive ? 0.5 : 0}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  );
}

function JointSphere({
  position,
  color,
  radius = 0.12,
}: {
  position: [number, number, number];
  color: string;
  radius?: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
    </mesh>
  );
}

function Leg({
  legIndex,
  pose,
  isSelected,
}: {
  legIndex: number;
  pose: RobotPose;
  isSelected: boolean;
}) {
  const transforms = useMemo(
    () => getJointTransforms(pose)[legIndex],
    [pose, legIndex]
  );

  const legColor = isSelected ? '#F59E0B' : '#6366F1';
  const emissive = isSelected ? '#F59E0B' : undefined;

  const basePos = transforms.basePosition;
  const coxaPos = transforms.coxaJoint.position;
  const femurPos = transforms.femurJoint.position;
  const tibiaPos = transforms.tibiaJoint.position;
  const tipPos = transforms.tip.position;

  return (
    <group>
      <Segment
        from={basePos}
        to={coxaPos}
        radius={0.08}
        color={legColor}
        emissive={emissive}
      />
      <Segment
        from={coxaPos}
        to={femurPos}
        radius={0.07}
        color={legColor}
        emissive={emissive}
      />
      <Segment
        from={femurPos}
        to={tibiaPos}
        radius={0.06}
        color={legColor}
        emissive={emissive}
      />
      <Segment
        from={tibiaPos}
        to={tipPos}
        radius={0.05}
        color={legColor}
        emissive={emissive}
      />
      <JointSphere position={basePos} color="#1E293B" radius={0.14} />
      <JointSphere position={coxaPos} color="#1E293B" />
      <JointSphere position={femurPos} color="#1E293B" />
      <JointSphere position={tibiaPos} color="#1E293B" />
    </group>
  );
}

function Hexapod({ pose, selectedLeg }: HexapodProps) {
  return (
    <group position={[0, 1.5, 0]}>
      <mesh>
        <cylinderGeometry args={[LEG_CONFIG.bodyRadius, LEG_CONFIG.bodyRadius * 0.85, 0.3, 6]} />
        <meshStandardMaterial color="#4F46E5" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[LEG_CONFIG.bodyRadius * 0.7, LEG_CONFIG.bodyRadius, 0.15, 6]} />
        <meshStandardMaterial color="#6366F1" metalness={0.5} roughness={0.4} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <Leg
          key={i}
          legIndex={i}
          pose={pose}
          isSelected={selectedLeg === i}
        />
      ))}
    </group>
  );
}

function CameraController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!controlsRef.current) return;
      const step = 0.1;
      switch (e.key) {
        case 'ArrowLeft':
          controlsRef.current.azimuthAngle -= step;
          break;
        case 'ArrowRight':
          controlsRef.current.azimuthAngle += step;
          break;
        case 'ArrowUp':
          controlsRef.current.polarAngle = Math.max(0.1, controlsRef.current.polarAngle - step);
          break;
        case 'ArrowDown':
          controlsRef.current.polarAngle = Math.min(Math.PI - 0.1, controlsRef.current.polarAngle + step);
          break;
      }
      controlsRef.current.update();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controlsRef]);

  return null;
}

export default function Scene3D({
  pose,
  selectedLeg,
}: {
  pose: RobotPose;
  selectedLeg: number | null;
}) {
  const controlsRef = useRef<any>(null);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0F172A' }}>
      <Canvas
        camera={{ position: [5, 4, 6], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0F172A']} />
        <fog attach="fog" args={['#0F172A', 15, 35]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        <Grid
          args={[30, 30]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#374151"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#475569"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />

        <Hexapod pose={pose} selectedLeg={selectedLeg} />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.3}
          rotateSpeed={0.8}
          minDistance={1}
          maxDistance={8}
          makeDefault
        />
        <CameraController controlsRef={controlsRef} />
      </Canvas>
    </div>
  );
}
