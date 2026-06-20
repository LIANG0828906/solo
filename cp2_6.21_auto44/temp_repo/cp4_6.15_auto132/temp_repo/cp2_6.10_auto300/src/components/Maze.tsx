import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../hooks/useGameState';
import { LEVEL_CONFIGS, CELL_SIZE, WALL_HEIGHT, SHARD_COLLECT_DISTANCE } from '../utils/constants';
import type { WallData } from '../utils/mazeGenerator';

function Walls({ walls, color }: { walls: WallData[]; color: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    if (!meshRef.current) return;
    walls.forEach((wall, i) => {
      dummy.position.set(wall.position[0], wall.position[1], wall.position[2]);
      dummy.rotation.set(wall.rotation[0], wall.rotation[1], wall.rotation[2]);
      dummy.scale.set(wall.scale[0], wall.scale[1], wall.scale[2]);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [walls, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, walls.length]}>
      <boxGeometry />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.6}
        transmission={0.3}
        roughness={0.2}
        metalness={0.8}
        emissive={color}
        emissiveIntensity={0.3}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </instancedMesh>
  );
}

function Floor({ size, color }: { size: number; color: string }) {
  const gridSize = size * CELL_SIZE;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[gridSize + 2, gridSize + 2]} />
      <meshStandardMaterial
        color="#0a0a0f"
        transparent
        opacity={0.9}
      />
      <gridHelper
        args={[gridSize, size, color, color]}
        position={[0, 0.01, 0]}
        rotation={[0, 0, 0]}
      />
    </mesh>
  );
}

function Shards() {
  const { shards, level, playerPosition, collectShard } = useGameState();
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRefs.current.forEach((mesh, i) => {
      if (mesh && shards[i] && !shards[i].collected) {
        mesh.rotation.y = time * 2 + i;
        mesh.position.y = 0.5 + Math.sin(time * 3 + i) * 0.15;

        const dx = playerPosition[0] - shards[i].position[0];
        const dz = playerPosition[2] - shards[i].position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < SHARD_COLLECT_DISTANCE) {
          collectShard(shards[i].id);
        }
      }
    });
  });

  const config = LEVEL_CONFIGS[level];

  return (
    <>
      {shards.map((shard, i) => (
        !shard.collected && (
          <mesh
            key={shard.id}
            ref={(el) => { meshRefs.current[i] = el; }}
            position={shard.position as [number, number, number]}
          >
            <octahedronGeometry args={[0.2, 0]} />
            <meshPhysicalMaterial
              color={config.colors.shard}
              emissive={config.colors.shard}
              emissiveIntensity={2}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.9}
              clearcoat={1}
            />
            <pointLight
              color={config.colors.shard}
              intensity={1}
              distance={2}
            />
          </mesh>
        )
      ))}
    </>
  );
}

function LightBeams() {
  const { lightBeams, level } = useGameState();
  const config = LEVEL_CONFIGS[level];
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRefs.current.forEach((mesh, i) => {
      if (mesh && lightBeams[i]) {
        const pulse = 0.7 + Math.sin(time * 4 + i) * 0.3;
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = pulse * 3;
        material.opacity = 0.4 + pulse * 0.3;
      }
    });
  });

  return (
    <>
      {lightBeams.map((beam) => (
        <group key={beam.id} position={beam.position as [number, number, number]}>
          <mesh
            ref={(el) => { meshRefs.current[beam.id] = el; }}
            rotation={[0, beam.angle, 0]}
            position={[Math.cos(beam.angle) * beam.length / 2, 0, Math.sin(beam.angle) * beam.length / 2]}
          >
            <boxGeometry args={[beam.length, 2, 0.2]} />
            <meshStandardMaterial
              color={config.colors.beam}
              emissive={config.colors.beam}
              emissiveIntensity={3}
              transparent
              opacity={0.6}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 2.2, 16]} />
            <meshStandardMaterial
              color={config.colors.beam}
              emissive={config.colors.beam}
              emissiveIntensity={2}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Portal() {
  const { portalActive, portalPosition, level } = useGameState();
  const meshRef = useRef<THREE.Mesh>(null);
  const config = LEVEL_CONFIGS[level];

  useFrame((state) => {
    if (meshRef.current && portalActive) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = time * 2;
      meshRef.current.rotation.z = time * 1.5;
      meshRef.current.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
    }
  });

  if (!portalActive) return null;

  return (
    <group position={portalPosition as [number, number, number]}>
      <mesh ref={meshRef}>
        <torusGeometry args={[0.8, 0.15, 16, 32]} />
        <meshPhysicalMaterial
          color="#ffffff"
          emissive={config.colors.accent}
          emissiveIntensity={3}
          metalness={1}
          roughness={0}
          transparent
          opacity={0.9}
          clearcoat={1}
        />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.6, 0.1, 16, 32]} />
        <meshPhysicalMaterial
          color="#ffffff"
          emissive={config.colors.primary}
          emissiveIntensity={2}
          metalness={1}
          roughness={0}
          transparent
          opacity={0.7}
        />
      </mesh>
      <pointLight
        color={config.colors.accent}
        intensity={3}
        distance={8}
      />
    </group>
  );
}

export function Maze() {
  const { level, walls, maze } = useGameState();

  if (!maze) return null;

  const config = LEVEL_CONFIGS[level];

  return (
    <group>
      <Floor size={config.size} color={config.colors.primary} />
      <Walls walls={walls} color={config.colors.primary} />
      <Shards />
      <LightBeams />
      <Portal />
    </group>
  );
}
