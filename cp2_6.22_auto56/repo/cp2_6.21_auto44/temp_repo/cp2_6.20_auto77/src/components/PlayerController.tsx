import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MechanismType } from '../types';
import { useStore } from '../store';
import { playPortalSound } from '../audio';

export function PlayerController() {
  const meshRef = useRef<THREE.Group>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { camera } = useThree();
  const setPlayerPosition = useStore((s) => s.setPlayerPosition);
  const mode = useStore((s) => s.mode);
  const portalCooldownRef = useRef(0);
  const [teleportAnim, setTeleportAnim] = useState<{ active: boolean; phase: 'shrink' | 'grow'; t: number }>({ active: false, phase: 'shrink', t: 0 });
  const teleportTargetRef = useRef<[number, number, number] | null>(null);
  const camYawRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
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
  }, []);

  useEffect(() => {
    if (mode === 'run' && meshRef.current) {
      meshRef.current.position.set(0, 0.5, 0);
      setPlayerPosition([0, 0.5, 0]);
      camera.position.set(6, 8, 6);
      camera.lookAt(0, 0.5, 0);
    }
  }, [mode, camera, setPlayerPosition]);

  useFrame((state, delta) => {
    if (mode !== 'run' || !meshRef.current) return;

    const dt = Math.min(delta, 0.05);
    const speed = 5;
    const keys = keysRef.current;

    const playerPos = meshRef.current.position;

    const cameraXZ = new THREE.Vector3(camera.position.x, 0, camera.position.z);
    const playerXZ = new THREE.Vector3(playerPos.x, 0, playerPos.z);
    const dirToPlayer = new THREE.Vector3().subVectors(playerXZ, cameraXZ);
    if (dirToPlayer.lengthSq() < 0.0001) {
      dirToPlayer.set(0, 0, -1);
    }
    dirToPlayer.normalize();
    const rightDir = new THREE.Vector3().crossVectors(dirToPlayer, new THREE.Vector3(0, 1, 0)).normalize();

    let moveX = 0;
    let moveZ = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) {
      moveX += dirToPlayer.x;
      moveZ += dirToPlayer.z;
    }
    if (keys.has('KeyS') || keys.has('ArrowDown')) {
      moveX -= dirToPlayer.x;
      moveZ -= dirToPlayer.z;
    }
    if (keys.has('KeyD') || keys.has('ArrowRight')) {
      moveX += rightDir.x;
      moveZ += rightDir.z;
    }
    if (keys.has('KeyA') || keys.has('ArrowLeft')) {
      moveX -= rightDir.x;
      moveZ -= rightDir.z;
    }

    const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (moveLen > 0) {
      moveX = (moveX / moveLen) * speed * dt;
      moveZ = (moveZ / moveLen) * speed * dt;

      const targetAngle = Math.atan2(moveX, moveZ);
      const currentAngle = meshRef.current.rotation.y;
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      meshRef.current.rotation.y = currentAngle + angleDiff * Math.min(1, dt * 10);
    }

    const storeState = useStore.getState();
    const props = storeState.props;

    let platformDeltaX = 0;
    let platformDeltaY = 0;
    let platformDeltaZ = 0;
    let onPlatformId: string | null = null;

    for (const prop of props) {
      if (prop.type === MechanismType.MovingPlatform) {
        if (!prop.position || !isFinite(prop.position[0]) || !isFinite(prop.position[1]) || !isFinite(prop.position[2])) {
          continue;
        }
        const offset = isFinite(prop.currentOffset) ? prop.currentOffset : 0;
        const axis = prop.moveAxis || 'y';
        const range = isFinite(prop.moveRange) ? prop.moveRange : 3;
        const mspeed = isFinite(prop.moveSpeed) ? prop.moveSpeed : 1;

        const pxCur = prop.position[0] + (axis === 'x' ? offset : 0);
        const pyCur = prop.position[1] + (axis === 'y' ? offset : 0);
        const pzCur = prop.position[2] + (axis === 'z' ? offset : 0);

        if (
          Math.abs(playerPos.x - pxCur) < 1.3 &&
          Math.abs(playerPos.z - pzCur) < 1.3 &&
          playerPos.y >= pyCur + 0.1 &&
          playerPos.y <= pyCur + 0.9
        ) {
          onPlatformId = prop.id;
          const nextOffset = prop.activated
            ? Math.min(offset + mspeed * dt, range)
            : Math.max(offset - mspeed * dt, 0);
          const deltaOff = nextOffset - offset;
          if (isFinite(deltaOff)) {
            if (axis === 'x') platformDeltaX = deltaOff;
            if (axis === 'y') platformDeltaY = deltaOff;
            if (axis === 'z') platformDeltaZ = deltaOff;
          }
        }
      }
    }

    playerPos.x += moveX + platformDeltaX;
    playerPos.z += moveZ + platformDeltaZ;
    playerPos.x = THREE.MathUtils.clamp(playerPos.x, -19, 19);
    playerPos.z = THREE.MathUtils.clamp(playerPos.z, -19, 19);

    let groundY = 0.5;
    for (const prop of props) {
      if (prop.type === MechanismType.MovingPlatform) {
        if (!prop.position || !isFinite(prop.position[0]) || !isFinite(prop.position[1]) || !isFinite(prop.position[2])) {
          continue;
        }
        const offset = isFinite(prop.currentOffset) ? prop.currentOffset : 0;
        const axis = prop.moveAxis || 'y';
        const px = prop.position[0] + (axis === 'x' ? offset : 0);
        const py = prop.position[1] + (axis === 'y' ? offset : 0);
        const pz = prop.position[2] + (axis === 'z' ? offset : 0);
        if (
          Math.abs(playerPos.x - px) < 1.3 &&
          Math.abs(playerPos.z - pz) < 1.3
        ) {
          const targetY = py + 0.65;
          if (playerPos.y + 0.01 >= py && playerPos.y <= targetY + 0.5) {
            groundY = Math.max(groundY, targetY);
          }
        }
      }
    }

    playerPos.y += platformDeltaY;
    playerPos.y = THREE.MathUtils.lerp(playerPos.y, groundY, dt * 8);

    if (portalCooldownRef.current > 0) {
      portalCooldownRef.current -= dt;
    }

    for (const prop of props) {
      if (prop.type === MechanismType.Portal && prop.activated && portalCooldownRef.current <= 0 && !teleportAnim.active) {
        const dist = Math.sqrt(
          (playerPos.x - prop.position[0]) ** 2 +
          (playerPos.z - prop.position[2]) ** 2
        );
        if (dist < 1.0) {
          playPortalSound();
          portalCooldownRef.current = 1.0;
          teleportTargetRef.current = [
            prop.portalTarget[0],
            prop.portalTarget[1] + 0.5,
            prop.portalTarget[2],
          ];
          setTeleportAnim({ active: true, phase: 'shrink', t: 0 });
        }
      }
    }

    if (teleportAnim.active && meshRef.current) {
      const phaseLen = 0.2;
      const newT = teleportAnim.t + dt / phaseLen;
      if (teleportAnim.phase === 'shrink') {
        const scale = Math.max(0.01, 1 - newT);
        meshRef.current.scale.set(scale, scale, scale);
        if (newT >= 1) {
          if (teleportTargetRef.current) {
            playerPos.set(
              teleportTargetRef.current[0],
              teleportTargetRef.current[1],
              teleportTargetRef.current[2]
            );
          }
          setTeleportAnim({ active: true, phase: 'grow', t: 0 });
        } else {
          setTeleportAnim({ ...teleportAnim, t: newT });
        }
      } else {
        const scale = Math.min(1, newT);
        meshRef.current.scale.set(scale, scale, scale);
        if (newT >= 1) {
          meshRef.current.scale.set(1, 1, 1);
          setTeleportAnim({ active: false, phase: 'shrink', t: 0 });
          teleportTargetRef.current = null;
        } else {
          setTeleportAnim({ ...teleportAnim, t: newT });
        }
      }
    }

    setPlayerPosition([playerPos.x, playerPos.y, playerPos.z]);

    const camTarget = new THREE.Vector3(playerPos.x, playerPos.y + 0.2, playerPos.z);
    const offsetBack = 7;
    const offsetUp = 6;
    const camOffsetDir = dirToPlayer.clone().negate();
    const desiredCamPos = new THREE.Vector3(
      playerPos.x + camOffsetDir.x * offsetBack,
      playerPos.y + offsetUp,
      playerPos.z + camOffsetDir.z * offsetBack
    );

    camera.position.lerp(desiredCamPos, dt * 3);
    camera.lookAt(camTarget);

    const currentYaw = Math.atan2(
      playerPos.x - camera.position.x,
      playerPos.z - camera.position.z
    );
    camYawRef.current = currentYaw;
  });

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.8, 0.35]} />
        <meshStandardMaterial color="#6a8aff" emissive="#2244aa" emissiveIntensity={0.4} metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.42, 0.4, 0.38]} />
        <meshStandardMaterial color="#88aaff" emissive="#3355bb" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[-0.08, 0.65, 0.2]}>
        <boxGeometry args={[0.07, 0.07, 0.07]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0.08, 0.65, 0.2]}>
        <boxGeometry args={[0.07, 0.07, 0.07]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 0.5, 0.22]}>
        <boxGeometry args={[0.04, 0.02, 0.04]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}
