import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useMazeStore, MAZE_SIZE } from './store';
import type { WallState, ParticleData } from './types';

const WALL_TRANSITION_DURATION = 1.5;
const GRID_HALF = (MAZE_SIZE - 1) / 2;

function worldPos(x: number, z: number): [number, number] {
  return [x - GRID_HALF, z - GRID_HALF];
}

function Wall({ wall, ballPos }: { wall: WallState; ballPos: { x: number; z: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);
  const pulseTriggerRef = useRef(false);
  const [pulse, setPulse] = useState(0);
  const [wx, wz] = worldPos(wall.coord.x, wall.coord.z);
  const shouldRender = wall.active || wall.transition !== 'idle';

  useFrame(() => {
    if (!shouldRender) return;
    const dx = ballPos.x - wx;
    const dz = ballPos.z - wz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 1.2 && !pulseTriggerRef.current) {
      pulseTriggerRef.current = true;
      pulseRef.current = 0;
    }
    if (pulseTriggerRef.current) {
      pulseRef.current += 0.016;
      const t = pulseRef.current / 0.2;
      if (t >= 1) {
        pulseTriggerRef.current = false;
        pulseRef.current = 0;
        setPulse(0);
      } else {
        const val = t < 0.5 ? t * 2 : (1 - t) * 2;
        setPulse(val);
      }
    }
    if (meshRef.current) {
      let opacity = 0.3;
      let yOffset = 0;
      if (wall.transition === 'appearing') {
        const p = wall.transitionProgress;
        opacity = 0.3 * p;
        yOffset = -1 * (1 - p);
      } else if (wall.transition === 'disappearing') {
        const p = wall.transitionProgress;
        opacity = 0.3 * (1 - p);
        yOffset = -1 * p;
      }
      if (pulse > 0) {
        opacity = opacity + pulse * 0.5;
      }
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = opacity;
      mat.emissiveIntensity = pulse * 0.8;
      meshRef.current.position.y = 0.5 + yOffset;
    }
  });

  if (!shouldRender) return null;

  return (
    <mesh ref={meshRef} position={[wx, 0.5, wz]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#00E5FF"
        transparent
        opacity={0.3}
        emissive="#00E5FF"
        emissiveIntensity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function PlayerBall() {
  const meshRef = useRef<THREE.Mesh>(null);
  const keys = useRef<{ [key: string]: boolean }>({});
  const velocity = useRef({ x: 0, z: 0 });
  const flashRef = useRef(0);
  const { camera } = useThree();

  const ballPos = useMazeStore(s => s.ballPosition);
  const setBallPosition = useMazeStore(s => s.setBallPosition);
  const walls = useMazeStore(s => s.walls);
  const collectFragment = useMazeStore(s => s.collectFragment);
  const fragments = useMazeStore(s => s.fragments);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const onUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const isWallAt = useCallback((cx: number, cz: number): boolean => {
    const wall = walls.find(w => w.coord.x === cx && w.coord.z === cz);
    if (!wall) return true;
    if (wall.transition === 'disappearing') return false;
    if (wall.transition === 'appearing' && wall.transitionProgress < 0.5) return false;
    return wall.active;
  }, [walls]);

  useFrame((_, dt) => {
    const speed = 4;
    let moveX = 0;
    let moveZ = 0;
    if (keys.current['w']) moveZ -= 1;
    if (keys.current['s']) moveZ += 1;
    if (keys.current['a']) moveX -= 1;
    if (keys.current['d']) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= len;
      moveZ /= len;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const dir = new THREE.Vector3();
      dir.addScaledVector(right, moveX);
      dir.addScaledVector(forward, -moveZ);
      velocity.current.x = dir.x * speed;
      velocity.current.z = dir.z * speed;
    } else {
      velocity.current.x *= 0.8;
      velocity.current.z *= 0.8;
    }

    let newX = ballPos.x + velocity.current.x * dt;
    let newZ = ballPos.z + velocity.current.z * dt;

    const radius = 0.3;
    const cellX = Math.floor(newX + GRID_HALF + 0.5);
    const cellZ = Math.floor(newZ + GRID_HALF + 0.5);

    const curCellX = Math.floor(ballPos.x + GRID_HALF + 0.5);
    const curCellZ = Math.floor(ballPos.z + GRID_HALF + 0.5);

    const checkAndResolve = (axis: 'x' | 'z') => {
      const cx = axis === 'x' ? Math.floor(newX + GRID_HALF + 0.5) : curCellX;
      const cz = axis === 'z' ? Math.floor(newZ + GRID_HALF + 0.5) : curCellZ;
      if (isWallAt(cx, cz)) {
        const [wx, wz] = worldPos(cx, cz);
        const dx = (axis === 'x' ? newX : ballPos.x) - wx;
        const dz = (axis === 'z' ? newZ : ballPos.z) - wz;
        if (axis === 'x' && Math.abs(dx) < 0.5 + radius) {
          newX = ballPos.x;
          velocity.current.x *= -0.5;
          flashRef.current = 0.1;
        }
        if (axis === 'z' && Math.abs(dz) < 0.5 + radius) {
          newZ = ballPos.z;
          velocity.current.z *= -0.5;
          flashRef.current = 0.1;
        }
      }
    };
    if (cellX !== curCellX) checkAndResolve('x');
    if (cellZ !== curCellZ) checkAndResolve('z');

    newX = Math.max(-GRID_HALF + 0.3, Math.min(GRID_HALF - 0.3, newX));
    newZ = Math.max(-GRID_HALF + 0.3, Math.min(GRID_HALF - 0.3, newZ));

    if (flashRef.current > 0) flashRef.current -= dt;

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (flashRef.current > 0) {
        mat.color.set('#FF0000');
        mat.emissive.set('#FF0000');
        mat.emissiveIntensity = 0.8;
      } else {
        mat.color.set('#FF6B6B');
        mat.emissive.set('#FFD700');
        mat.emissiveIntensity = 0.3;
      }
    }

    setBallPosition({ x: newX, y: 0.3, z: newZ });

    for (const frag of fragments) {
      if (frag.collected) continue;
      const [fx, fz] = worldPos(frag.coord.x, frag.coord.z);
      const ddx = newX - fx;
      const ddz = newZ - fz;
      if (Math.sqrt(ddx * ddx + ddz * ddz) < 0.5) {
        collectFragment(frag.id);
        const store = useMazeStore.getState() as unknown as { _addParticles?: (p: ParticleData[]) => void; particles?: ParticleData[] };
        if (store._addParticles) {
          const newParticles: ParticleData[] = [];
          for (let i = 0; i < 20; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed2 = 1.5 + Math.random() * 1.5;
            newParticles.push({
              id: Date.now() + i,
              position: [newX, 0.5, newZ],
              velocity: [
                Math.sin(phi) * Math.cos(theta) * speed2,
                Math.cos(phi) * speed2 * 0.5,
                Math.sin(phi) * Math.sin(theta) * speed2,
              ],
              life: 0.6,
              maxLife: 0.6,
            });
          }
          store._addParticles(newParticles);
        }
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[ballPos.x, ballPos.y, ballPos.z]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial
        color="#FF6B6B"
        emissive="#FFD700"
        emissiveIntensity={0.3}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

function Fragment({ coord, collected }: { coord: { x: number; z: number }; collected: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [wx, wz] = worldPos(coord.x, coord.z);

  useFrame(({ clock }) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y = clock.getElapsedTime() * Math.PI;
      meshRef.current.rotation.x = clock.getElapsedTime() * Math.PI * 0.5;
      meshRef.current.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });

  if (collected) return null;

  return (
    <mesh ref={meshRef} position={[wx, 0.5, wz]}>
      <octahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial
        color="#FFD700"
        emissive="#FFD700"
        emissiveIntensity={0.6}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function ExitRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  const [wx, wz] = worldPos(MAZE_SIZE - 1, MAZE_SIZE - 1);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * Math.PI * 2;
    }
  });

  return (
    <mesh ref={ringRef} position={[wx, 1, wz]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.1, 16, 64]} />
      <meshStandardMaterial
        color="#FFD700"
        emissive="#FFD700"
        emissiveIntensity={0.8}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

function EntranceBeam() {
  const [wx, wz] = worldPos(0, 0);
  return (
    <mesh position={[wx, 1.5, wz]}>
      <cylinderGeometry args={[0.15, 0.15, 3, 16, 1, true]} />
      <meshBasicMaterial color="#4488FF" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[MAZE_SIZE + 1, MAZE_SIZE + 1]} />
        <meshStandardMaterial color="#1E1E1E" roughness={0.9} />
      </mesh>
      <gridHelper
        args={[MAZE_SIZE, MAZE_SIZE, '#2A2A2A', '#2A2A2A']}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}

function Particles() {
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const store = useMazeStore.getState() as unknown as { _addParticles?: (p: ParticleData[]) => void };
  if (!store._addParticles) {
    (store as unknown as { _addParticles: (p: ParticleData[]) => void })._addParticles = (p: ParticleData[]) => {
      setParticles(prev => [...prev, ...p].slice(-2000));
    };
  }

  useFrame((_, dt) => {
    setParticles(prev =>
      prev
        .map(p => ({
          ...p,
          position: [
            p.position[0] + p.velocity[0] * dt,
            p.position[1] + p.velocity[1] * dt,
            p.position[2] + p.velocity[2] * dt,
          ] as [number, number, number],
          velocity: [p.velocity[0] * 0.96, p.velocity[1] * 0.96 - 2 * dt, p.velocity[2] * 0.96] as [number, number, number],
          life: p.life - dt,
        }))
        .filter(p => p.life > 0)
    );
  });

  return (
    <>
      {particles.map(p => (
        <mesh key={p.id} position={p.position}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={Math.max(0, (p.life / p.maxLife) * 0.5)} />
        </mesh>
      ))}
    </>
  );
}

export function Scene() {
  const walls = useMazeStore(s => s.walls);
  const fragments = useMazeStore(s => s.fragments);
  const ballPos = useMazeStore(s => s.ballPosition);
  const tickCountdown = useMazeStore(s => s.tickCountdown);
  const isTransitioning = useMazeStore(s => s.isTransitioning);
  const setTransitioning = useMazeStore(s => s.setTransitioning);
  const setWallProgress = useMazeStore(s => s.setWallTransitionProgress);
  const transitionRef = useRef(0);

  useFrame((_, dt) => {
    tickCountdown(dt);
    if (isTransitioning) {
      transitionRef.current += dt;
      const progress = Math.min(1, transitionRef.current / WALL_TRANSITION_DURATION);
      setWallProgress(progress);
      if (progress >= 1) {
        transitionRef.current = 0;
        setTransitioning(false);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 8, 0]} intensity={1} color="#FFFFFF" />
      <pointLight position={[-GRID_HALF, 3, -GRID_HALF]} intensity={0.5} color="#4488FF" />
      <pointLight position={[GRID_HALF, 3, GRID_HALF]} intensity={0.5} color="#FFD700" />

      <Ground />
      <EntranceBeam />
      <ExitRing />

      {walls.map(wall => (
        <Wall key={`${wall.coord.x}-${wall.coord.z}`} wall={wall} ballPos={ballPos} />
      ))}

      {fragments.map(f => (
        <Fragment key={f.id} coord={f.coord} collected={f.collected} />
      ))}

      <PlayerBall />
      <Particles />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        minPolarAngle={Math.PI / 18}
        maxPolarAngle={Math.PI * 80 / 180}
        target={[0, 0, 0]}
      />
    </>
  );
}
