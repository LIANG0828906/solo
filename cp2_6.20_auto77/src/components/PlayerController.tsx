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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
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
    }
  }, [mode]);

  useFrame((state, delta) => {
    if (mode !== 'run' || !meshRef.current) return;

    const speed = 5;
    const keys = keysRef.current;
    let dx = 0, dz = 0;
    if (keys.has('KeyW')) dz -= speed * delta;
    if (keys.has('KeyS')) dz += speed * delta;
    if (keys.has('KeyA')) dx -= speed * delta;
    if (keys.has('KeyD')) dx += speed * delta;

    if (Math.abs(dx) > 0 && Math.abs(dz) > 0) {
      dx *= 0.707;
      dz *= 0.707;
    }

    meshRef.current.position.x += dx;
    meshRef.current.position.z += dz;
    meshRef.current.position.x = THREE.MathUtils.clamp(meshRef.current.position.x, -19, 19);
    meshRef.current.position.z = THREE.MathUtils.clamp(meshRef.current.position.z, -19, 19);

    const storeState = useStore.getState();
    const props = storeState.props;
    let groundY = 0.5;

    for (const prop of props) {
      if (prop.type === MechanismType.MovingPlatform) {
        const px = prop.position[0] + (prop.moveAxis === 'x' ? prop.currentOffset : 0);
        const py = prop.position[1] + (prop.moveAxis === 'y' ? prop.currentOffset : 0);
        const pz = prop.position[2] + (prop.moveAxis === 'z' ? prop.currentOffset : 0);
        if (
          Math.abs(meshRef.current.position.x - px) < 1.3 &&
          Math.abs(meshRef.current.position.z - pz) < 1.3 &&
          meshRef.current.position.y >= py &&
          meshRef.current.position.y <= py + 1.2
        ) {
          groundY = py + 0.65;
          if (prop.activated) {
            const prevOffset = prop.currentOffset;
            if (prop.moveAxis === 'x') meshRef.current.position.x += (prop.currentOffset - prevOffset);
          }
        }
      }
    }

    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, groundY, delta * 10);

    if (portalCooldownRef.current > 0) {
      portalCooldownRef.current -= delta;
    }

    for (const prop of props) {
      if (prop.type === MechanismType.Portal && prop.activated && portalCooldownRef.current <= 0) {
        const dist = Math.sqrt(
          (meshRef.current.position.x - prop.position[0]) ** 2 +
          (meshRef.current.position.z - prop.position[2]) ** 2
        );
        if (dist < 1.0) {
          playPortalSound();
          meshRef.current.position.x = prop.portalTarget[0];
          meshRef.current.position.z = prop.portalTarget[2];
          meshRef.current.position.y = prop.portalTarget[1] + 0.5;
          portalCooldownRef.current = 1.0;
          setTeleportAnim({ active: true, phase: 'shrink', t: 0 });
        }
      }
    }

    if (teleportAnim.active && meshRef.current) {
      const newT = teleportAnim.t + delta / 0.2;
      if (teleportAnim.phase === 'shrink') {
        const scale = Math.max(0.01, 1 - newT);
        meshRef.current.scale.set(scale, scale, scale);
        if (newT >= 1) {
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
        } else {
          setTeleportAnim({ ...teleportAnim, t: newT });
        }
      }
    }

    setPlayerPosition([meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z]);

    const camTarget = new THREE.Vector3(meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z);
    const camPos = new THREE.Vector3(meshRef.current.position.x + 6, meshRef.current.position.y + 8, meshRef.current.position.z + 6);
    camera.position.lerp(camPos, delta * 3);
    camera.lookAt(camTarget);
  });

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.8, 0.3]} />
        <meshStandardMaterial color="#88aaff" emissive="#2244aa" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.35]} />
        <meshStandardMaterial color="#99bbff" emissive="#3355bb" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.5, 0.18]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.12, 0.5, 0.18]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}
