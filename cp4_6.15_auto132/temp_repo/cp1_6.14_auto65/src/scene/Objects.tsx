import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox, useSphere, useCylinder } from '@react-three/cannon';
import * as THREE from 'three';
import type { PhysicsBodyConfig, ParticleData } from '@/types';
import { hslToThreeColor } from '@/utils/hsl';
import { usePhysicsStore } from '@/store/usePhysicsStore';
import { createCollisionParticles } from './ParticleSystem';

interface Object3DProps {
  config: PhysicsBodyConfig;
  onCollision: (particles: ParticleData[]) => void;
  explosionTrigger?: number;
  explosionCenter?: [number, number, number];
  explosionForce?: number;
}

export function Object3D({
  config,
  onCollision,
  explosionTrigger,
  explosionCenter,
  explosionForce,
}: Object3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isSelected = usePhysicsStore((s) => s.selectedBodyId === config.id);
  const setSelectedBodyId = usePhysicsStore((s) => s.setSelectedBodyId);
  const updatePhysicsData = usePhysicsStore((s) => s.updatePhysicsData);
  const effectState = usePhysicsStore((s) => s.effectState);
  const isReplaying = usePhysicsStore((s) => s.isReplaying);
  const recordingFrames = usePhysicsStore((s) => s.recordingFrames);
  const replayIndex = usePhysicsStore((s) => s.replayIndex);

  const onCollide = useCallback(
    (e: unknown) => {
      if (!effectState.collision || isReplaying) return;
      const collideEvent = e as { impact?: number; contact?: { impactVelocity?: number[] } };
      const impact = collideEvent.impact ?? 
        (collideEvent.contact?.impactVelocity ? 
          Math.sqrt(collideEvent.contact.impactVelocity.reduce((a, b) => a + b * b, 0)) : 0);
      if (impact > 0.5 && meshRef.current) {
        const pos = meshRef.current.position;
        const particles = createCollisionParticles(
          [pos.x, pos.y, pos.z],
          hslToThreeColor(config.color),
          Math.min(12, Math.floor(impact * 3))
        );
        onCollision(particles);
      }
    },
    [effectState.collision, isReplaying, config.color, onCollision]
  );

  const baseArgs = {
    mass: config.mass,
    position: config.initialPosition,
    restitution: config.restitution,
    friction: 0.3,
    linearDamping: 0.1,
    angularDamping: 0.1,
    onCollide,
  };

  const [boxRef, boxApi] = useBox(() => ({ ...baseArgs, args: [1, 1, 1] }));
  const [sphereRef, sphereApi] = useSphere(() => ({ ...baseArgs, args: [0.6] }));
  const [cylinderRef, cylinderApi] = useCylinder(
    () => ({ ...baseArgs, args: [0.5, 0.5, 1.2, 16] })
  );

  let physicsRef: React.RefObject<THREE.Object3D | null>;
  let api: ReturnType<typeof useBox>[1];

  switch (config.type) {
    case 'sphere':
      physicsRef = sphereRef;
      api = sphereApi;
      break;
    case 'cylinder':
      physicsRef = cylinderRef;
      api = cylinderApi;
      break;
    case 'box':
    default:
      physicsRef = boxRef;
      api = boxApi;
      break;
  }

  useEffect(() => {
    if (explosionTrigger && explosionCenter && explosionForce && api && !isReplaying) {
      const unsubscribe = api.position.subscribe((pos) => {
        const bodyPos = new THREE.Vector3(pos[0], pos[1], pos[2]);
        const centerVec = new THREE.Vector3(...explosionCenter);
        const direction = bodyPos.clone().sub(centerVec);
        const distance = direction.length();
        if (distance < 8) {
          const forceMagnitude = (explosionForce * (1 - distance / 8)) / config.mass;
          direction.normalize().multiplyScalar(forceMagnitude);
          api.velocity.set(
            direction.x + (Math.random() - 0.5) * 2,
            direction.y + Math.random() * 3,
            direction.z + (Math.random() - 0.5) * 2
          );
          api.angularVelocity.set(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
          );
        }
        unsubscribe();
      });
    }
  }, [explosionTrigger, explosionCenter, explosionForce, api, config.id, config.mass, isReplaying]);

  useFrame(() => {
    if (!meshRef.current || isReplaying) return;

    const unsubscribe = api.position.subscribe((pos) => {
      api.velocity.subscribe((vel) => {
        const speed = Math.sqrt(vel[0] ** 2 + vel[1] ** 2 + vel[2] ** 2);
        const momentum = config.mass * speed;

        updatePhysicsData(config.id, {
          id: config.id,
          position: [pos[0], pos[1], pos[2]],
          velocity: [vel[0], vel[1], vel[2]],
          momentum,
          speed,
        });
        unsubscribe();
      });
    });
  });

  useEffect(() => {
    if (isReplaying && recordingFrames.length > 0 && meshRef.current) {
      const frame = recordingFrames[Math.min(replayIndex, recordingFrames.length - 1)];
      const bodyFrame = frame?.bodies.find((b) => b.id === config.id);
      if (bodyFrame) {
        meshRef.current.position.set(...bodyFrame.position);
      }
    }
  }, [isReplaying, replayIndex, recordingFrames, config.id]);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedBodyId(config.id);
  };

  const renderGeometry = () => {
    switch (config.type) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.6, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const colorHex = hslToThreeColor(config.color);
  const isSelectedHighlight = isSelected && !isReplaying;

  if (isReplaying) {
    return (
      <mesh ref={meshRef} castShadow>
        {renderGeometry()}
        <meshStandardMaterial
          color={colorHex}
          wireframe
          transparent
          opacity={0.7}
          emissive={colorHex}
          emissiveIntensity={0.3}
        />
      </mesh>
    );
  }

  return (
    <group>
      <mesh
        ref={(node) => {
          (meshRef as React.MutableRefObject<THREE.Mesh | null>).current = node;
          (physicsRef as React.MutableRefObject<THREE.Object3D | null>).current = node;
        }}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={colorHex}
          metalness={0.4}
          roughness={0.25}
          envMapIntensity={1.0}
          emissive={isSelectedHighlight ? colorHex : '#000000'}
          emissiveIntensity={isSelectedHighlight ? 0.3 : 0}
        />
      </mesh>

      {isSelectedHighlight && meshRef.current && (
        <mesh position={meshRef.current.position.clone()}>
          {config.type === 'sphere' ? (
            <sphereGeometry args={[0.72, 32, 32]} />
          ) : config.type === 'cylinder' ? (
            <cylinderGeometry args={[0.62, 0.62, 1.32, 32]} />
          ) : (
            <boxGeometry args={[1.12, 1.12, 1.12]} />
          )}
          <meshBasicMaterial color="#00f5ff" transparent opacity={0.15} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}
