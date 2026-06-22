import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../hooks/useGameState';
import { useControls } from '../hooks/useControls';
import {
  CELL_SIZE,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  DASH_SPEED,
  TRAIL_LENGTH,
  LEVEL_CONFIGS,
} from '../utils/constants';
import type { WallData } from '../utils/mazeGenerator';

interface TrailPoint {
  position: THREE.Vector3;
  life: number;
}

function checkWallCollision(
  pos: THREE.Vector3,
  walls: WallData[],
  radius: number
): { collision: boolean; normal: THREE.Vector3 } {
  let collision = false;
  const normal = new THREE.Vector3(0, 0, 0);

  for (const wall of walls) {
    const halfWidth = (wall.scale[0] - 0.1) / 2;
    const halfDepth = (wall.scale[2] - 0.1) / 2;
    const halfHeight = wall.scale[1] / 2;

    const wallMin = new THREE.Vector3(
      wall.position[0] - halfWidth,
      wall.position[1] - halfHeight,
      wall.position[2] - halfDepth
    );
    const wallMax = new THREE.Vector3(
      wall.position[0] + halfWidth,
      wall.position[1] + halfHeight,
      wall.position[2] + halfDepth
    );

    const closestPoint = new THREE.Vector3(
      Math.max(wallMin.x, Math.min(pos.x, wallMax.x)),
      Math.max(wallMin.y, Math.min(pos.y, wallMax.y)),
      Math.max(wallMin.z, Math.min(pos.z, wallMax.z))
    );

    const distance = pos.distanceTo(closestPoint);

    if (distance < radius) {
      collision = true;
      const pushDir = new THREE.Vector3().subVectors(pos, closestPoint).normalize();
      normal.add(pushDir);
    }
  }

  if (normal.length() > 0) {
    normal.normalize();
  }

  return { collision, normal };
}

export function Player() {
  const {
    level,
    walls,
    playerPosition,
    updatePlayerPosition,
    checkBeamCollision,
    checkPortalCollision,
    resetPlayerToStart,
    isPaused,
    levelTransition,
  } = useGameState();

  const { moveDirection, isDashing } = useControls();
  const { camera } = useThree();

  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const position = useRef(new THREE.Vector3(...playerPosition));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const trail = useRef<TrailPoint[]>([]);
  const trailMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lastFrameTime = useRef(performance.now());

  const config = LEVEL_CONFIGS[level];
  const mazeSize = config.size * CELL_SIZE;
  const halfMaze = mazeSize / 2;

  useEffect(() => {
    position.current.set(...playerPosition);
    trail.current = [];
  }, [level, playerPosition]);

  useFrame((_, delta) => {
    if (isPaused || levelTransition.active) return;

    const now = performance.now();
    const dt = Math.min(delta, 0.1);
    lastFrameTime.current = now;

    const speed = isDashing ? DASH_SPEED : PLAYER_SPEED;

    const moveX = moveDirection[0];
    const moveZ = moveDirection[1];

    if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
      const magnitude = Math.sqrt(moveX * moveX + moveZ * moveZ);
      const normalizedX = moveX / magnitude;
      const normalizedZ = moveZ / magnitude;

      velocity.current.x = normalizedX * speed * magnitude;
      velocity.current.z = normalizedZ * speed * magnitude;
    } else {
      velocity.current.x *= 0.85;
      velocity.current.z *= 0.85;
    }

    const newPos = position.current.clone();
    newPos.x += velocity.current.x * dt;
    newPos.z += velocity.current.z * dt;

    newPos.x = Math.max(-halfMaze + PLAYER_RADIUS, Math.min(halfMaze - PLAYER_RADIUS, newPos.x));
    newPos.z = Math.max(-halfMaze + PLAYER_RADIUS, Math.min(halfMaze - PLAYER_RADIUS, newPos.z));

    const { collision, normal } = checkWallCollision(newPos, walls, PLAYER_RADIUS);

    if (collision) {
      const dot = velocity.current.dot(normal);
      velocity.current.sub(normal.clone().multiplyScalar(dot * 1.5));
      newPos.add(normal.clone().multiplyScalar(PLAYER_RADIUS * 0.1));
    }

    position.current.copy(newPos);

    if (checkBeamCollision([newPos.x, newPos.y, newPos.z])) {
      setTimeout(() => resetPlayerToStart(), 100);
      return;
    }

    checkPortalCollision([newPos.x, newPos.y, newPos.z]);

    updatePlayerPosition([newPos.x, newPos.y, newPos.z]);

    if (meshRef.current) {
      meshRef.current.position.copy(newPos);
      meshRef.current.rotation.y += velocity.current.length() * dt * 2;
    }

    if (lightRef.current) {
      lightRef.current.position.copy(newPos);
    }

    const speedMagnitude = Math.sqrt(
      velocity.current.x ** 2 + velocity.current.z ** 2
    );
    if (speedMagnitude > 0.5) {
      trail.current.unshift({
        position: newPos.clone(),
        life: 1,
      });

      if (trail.current.length > TRAIL_LENGTH) {
        trail.current.pop();
      }
    }

    trail.current.forEach((point, i) => {
      point.life -= dt * 3;
      if (trailMeshRef.current && point.life > 0) {
        const scale = point.life * 0.3;
        dummy.position.copy(point.position);
        dummy.position.y = 0.3;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        trailMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
    });

    trail.current = trail.current.filter((p) => p.life > 0);

    if (trailMeshRef.current) {
      trailMeshRef.current.count = trail.current.length;
      trailMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    const targetCamPos = new THREE.Vector3(
      newPos.x,
      12 + (isDashing ? 2 : 0),
      newPos.z + 10
    );
    camera.position.lerp(targetCamPos, dt * 3);
    camera.lookAt(newPos.x, 0, newPos.z);
  });

  return (
    <group>
      <mesh ref={meshRef} position={position.current.toArray() as [number, number, number]}>
        <sphereGeometry args={[PLAYER_RADIUS, 32, 32]} />
        <meshPhysicalMaterial
          color="#00e5ff"
          emissive={isDashing ? '#ffffff' : '#00e5ff'}
          emissiveIntensity={isDashing ? 4 : 2}
          metalness={1}
          roughness={0}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={position.current.toArray() as [number, number, number]}
        color={config.colors.accent}
        intensity={2}
        distance={8}
        castShadow
      />
      <instancedMesh ref={trailMeshRef} args={[undefined, undefined, TRAIL_LENGTH]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={config.colors.accent}
          transparent
          opacity={0.6}
        />
      </instancedMesh>
    </group>
  );
}
