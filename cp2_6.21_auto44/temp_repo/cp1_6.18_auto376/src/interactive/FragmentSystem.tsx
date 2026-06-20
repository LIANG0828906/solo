import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMazeStore, Fragment } from '@/maze/mazeStore';

const CELL_SIZE = 2;
const TRIGGER_DISTANCE = 1.5;
const PULSE_PERIOD = 1.2;

function FragmentOrb({
  fragment,
  isNear,
  collected,
}: {
  fragment: Fragment;
  isNear: boolean;
  collected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(Math.random() * PULSE_PERIOD);
  const baseY = 1.2;

  const posX = fragment.position.x * CELL_SIZE + CELL_SIZE / 2;
  const posZ = fragment.position.y * CELL_SIZE + CELL_SIZE / 2;

  useFrame((_, dt) => {
    timeRef.current += dt;
    const t = (timeRef.current % PULSE_PERIOD) / PULSE_PERIOD;
    const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);

    if (meshRef.current) {
      const scale = 0.06 + pulse * 0.02;
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.position.y = baseY + Math.sin(t * Math.PI * 2) * 0.15;
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      if (isNear && !collected) {
        const blink = Math.floor(timeRef.current * 8) % 2;
        mat.opacity = collected ? 0.15 : blink ? 1 : 0.4;
      } else {
        mat.opacity = collected ? 0.15 : 0.5 + pulse * 0.4;
      }
    }
    if (glowRef.current) {
      const glowScale = (0.15 + pulse * 0.08) * (collected ? 0.5 : 1);
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
      glowRef.current.position.y = baseY + Math.sin(t * Math.PI * 2) * 0.15;
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = collected ? 0.05 : (isNear ? 0.6 : 0.25) + pulse * 0.2;
    }
  });

  const color = collected ? '#445566' : '#FFD700';

  return (
    <group position={[posX, 0, posZ]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default function FragmentSystem() {
  const fragments = useMazeStore(s => s.fragments);
  const playerPos = useMazeStore(s => s.playerState.position);
  const activeFragment = useMazeStore(s => s.activeFragment);
  const activeEnding = useMazeStore(s => s.activeEnding);
  const setActiveFragment = useMazeStore(s => s.setActiveFragment);
  const collectFragment = useMazeStore(s => s.collectFragment);

  const nearIdRef = useRef<string | null>(null);

  const nearMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const f of fragments) {
      const fx = f.position.x * CELL_SIZE + CELL_SIZE / 2;
      const fz = f.position.y * CELL_SIZE + CELL_SIZE / 2;
      const dx = fx - playerPos.x;
      const dz = fz - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      map[f.id] = dist < TRIGGER_DISTANCE;
    }
    return map;
  }, [fragments, playerPos.x, playerPos.z]);

  useEffect(() => {
    if (activeEnding) return;
    let nearestId: string | null = null;
    let nearestDist = Infinity;
    for (const f of fragments) {
      if (f.collected) continue;
      if (!nearMap[f.id]) continue;
      const fx = f.position.x * CELL_SIZE + CELL_SIZE / 2;
      const fz = f.position.y * CELL_SIZE + CELL_SIZE / 2;
      const dx = fx - playerPos.x;
      const dz = fz - playerPos.z;
      const dist = dx * dx + dz * dz;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = f.id;
      }
    }
    if (nearestId !== nearIdRef.current) {
      nearIdRef.current = nearestId;
      if (nearestId && !activeFragment) {
        const frag = fragments.find(f => f.id === nearestId);
        if (frag && !frag.collected) {
          setActiveFragment(frag);
          collectFragment(nearestId);
        }
      }
    }
    if (!nearestId && activeFragment) {
      setTimeout(() => {
        if (!nearIdRef.current) {
          setActiveFragment(null);
        }
      }, 1500);
    }
  }, [nearMap, fragments, playerPos.x, playerPos.z, activeFragment, activeEnding, setActiveFragment, collectFragment]);

  if (activeEnding) return null;

  return (
    <>
      {fragments.map(f => (
        <FragmentOrb
          key={f.id}
          fragment={f}
          isNear={!!nearMap[f.id]}
          collected={f.collected}
        />
      ))}
    </>
  );
}
