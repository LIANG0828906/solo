import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Trail } from '@react-three/drei';
import { COLORS } from '@/utils/colors';
import { useAudio } from '@/hooks/useAudio';
import type { PlayerState } from '@/types/game';

interface PlayerBallProps {
  mazeSize: number;
  platforms: [number, number, number][];
  onPositionUpdate: (pos: [number, number, number]) => void;
  speedMultiplier: number;
  isPaused: boolean;
  isStunned: boolean;
  exitPosition: [number, number, number];
  allCollected: boolean;
  onReachExit: () => void;
}

const GRAVITY = -25;
const MOVE_SPEED = 6;
const JUMP_FORCE = 10;
const PLAYER_RADIUS = 0.3;

export const PlayerBall = ({
  mazeSize,
  platforms,
  onPositionUpdate,
  speedMultiplier,
  isPaused,
  isStunned,
  exitPosition,
  allCollected,
  onReachExit,
}: PlayerBallProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { playJump } = useAudio();

  const [playerState, setPlayerState] = useState<PlayerState>({
    position: [0, 2, 0],
    velocity: [0, 0, 0],
    isGrounded: false,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const velocityRef = useRef(playerState.velocity);
  const positionRef = useRef(playerState.position);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === 'Space' && positionRef.current[1] <= PLAYER_RADIUS + 0.1) {
        velocityRef.current[1] = JUMP_FORCE;
        playJump();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playJump]);

  useFrame((_, delta) => {
    if (isPaused || !meshRef.current) return;

    const clampedDelta = Math.min(delta, 0.05);
    const halfSize = mazeSize / 2;
    const speed = isStunned ? MOVE_SPEED * speedMultiplier * 0.3 : MOVE_SPEED * speedMultiplier;

    let vx = velocityRef.current[0];
    let vy = velocityRef.current[1];
    let vz = velocityRef.current[2];
    let px = positionRef.current[0];
    let py = positionRef.current[1];
    let pz = positionRef.current[2];

    vy += GRAVITY * clampedDelta;

    const moveX =
      (keysRef.current.has('KeyD') || keysRef.current.has('ArrowRight') ? 1 : 0) -
      (keysRef.current.has('KeyA') || keysRef.current.has('ArrowLeft') ? 1 : 0);
    const moveZ =
      (keysRef.current.has('KeyS') || keysRef.current.has('ArrowDown') ? 1 : 0) -
      (keysRef.current.has('KeyW') || keysRef.current.has('ArrowUp') ? 1 : 0);

    vx = moveX * speed;
    vz = moveZ * speed;

    px += vx * clampedDelta;
    py += vy * clampedDelta;
    pz += vz * clampedDelta;

    let grounded = false;
    if (py <= PLAYER_RADIUS) {
      py = PLAYER_RADIUS;
      vy = 0;
      grounded = true;
    }

    platforms.forEach(([platX, platY, platZ]) => {
      const platHalfW = 1.25;
      const platHalfD = 1.25;
      const platTop = platY + 0.25;

      if (
        px >= platX - platHalfW &&
        px <= platX + platHalfW &&
        pz >= platZ - platHalfD &&
        pz <= platZ + platHalfD &&
        py - PLAYER_RADIUS <= platTop &&
        py - PLAYER_RADIUS >= platTop - 0.5 &&
        vy <= 0
      ) {
        py = platTop + PLAYER_RADIUS;
        vy = 0;
        grounded = true;
      }
    });

    px = Math.max(-halfSize + PLAYER_RADIUS, Math.min(halfSize - PLAYER_RADIUS, px));
    pz = Math.max(-halfSize + PLAYER_RADIUS, Math.min(halfSize - PLAYER_RADIUS, pz));

    if (py > halfSize * 1.5) {
      py = halfSize * 1.5;
      vy = 0;
    }

    if (py < -5) {
      px = 0;
      py = 2;
      pz = 0;
      vx = 0;
      vy = 0;
      vz = 0;
    }

    if (allCollected) {
      const dx = px - exitPosition[0];
      const dy = py - exitPosition[1];
      const dz = pz - exitPosition[2];
      const distToExit = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distToExit < 1) {
        onReachExit();
      }
    }

    velocityRef.current = [vx, vy, vz];
    positionRef.current = [px, py, pz];

    setPlayerState({
      position: [px, py, pz],
      velocity: [vx, vy, vz],
      isGrounded: grounded,
    });

    meshRef.current.position.set(px, py, pz);
    meshRef.current.rotation.x += vz * clampedDelta * 0.5;
    meshRef.current.rotation.z -= vx * clampedDelta * 0.5;

    onPositionUpdate([px, py, pz]);
  });

  return (
    <Trail
      width={2}
      length={6}
      color={new THREE.Color(COLORS.playerGlow)}
      attenuation={(t) => t * t}
    >
      <mesh ref={meshRef} position={playerState.position}>
        <sphereGeometry args={[PLAYER_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={COLORS.playerGlow}
          emissive={COLORS.playerGlow}
          emissiveIntensity={isStunned ? 0.5 : 2}
          metalness={0.9}
          roughness={0.1}
        />
        <pointLight
          color={COLORS.playerGlow}
          intensity={isStunned ? 0.5 : 1.5}
          distance={5}
        />
      </mesh>
    </Trail>
  );
};
