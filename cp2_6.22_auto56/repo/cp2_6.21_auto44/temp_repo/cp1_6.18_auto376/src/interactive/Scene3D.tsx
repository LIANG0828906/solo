import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMazeStore } from '@/maze/mazeStore';
import { MazeData, Cell } from '@/maze/mazeGenerator';

const CELL_SIZE = 2;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.15;
const DAMPING = 0.08;
const MOVE_SPEED = 0.08;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

const NEAR_COLOR = hexToRgb('#00FFAA');
const FAR_COLOR = hexToRgb('#0A2A48');
const MAX_DISTANCE = 15;

function lerpColor(
  near: { r: number; g: number; b: number },
  far: { r: number; g: number; b: number },
  t: number
): THREE.Color {
  const clamped = Math.max(0, Math.min(1, t));
  return new THREE.Color(
    near.r + (far.r - near.r) * clamped,
    near.g + (far.g - near.g) * clamped,
    near.b + (far.b - near.b) * clamped
  );
}

interface WallProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  length: number;
  playerPos: THREE.Vector3;
}

function Wall({ position, rotation = [0, 0, 0], length, playerPos }: WallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const wallPos = useMemo(
    () => new THREE.Vector3(position[0], position[1], position[2]),
    [position[0], position[1], position[2]]
  );

  useFrame(() => {
    if (!materialRef.current || !edgeMatRef.current) return;
    const dist = wallPos.distanceTo(playerPos);
    const t = dist / MAX_DISTANCE;
    const color = lerpColor(NEAR_COLOR, FAR_COLOR, t);
    materialRef.current.color.copy(color);
    edgeMatRef.current.color.copy(color);
    const opacity = Math.max(0.3, 1 - t * 0.7);
    materialRef.current.opacity = opacity;
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef}>
        <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial
          ref={materialRef}
          transparent
          opacity={1}
          metalness={0.3}
          roughness={0.5}
          emissive={new THREE.Color('#003344')}
          emissiveIntensity={0.2}
        />
      </mesh>
      <lineSegments ref={edgesRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(length, WALL_HEIGHT, WALL_THICKNESS)]} />
        <lineBasicMaterial ref={edgeMatRef} color="#00FFAA" transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

function Floor({ width, height }: { width: number; height: number }) {
  const sizeW = width * CELL_SIZE;
  const sizeH = height * CELL_SIZE;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[sizeW / 2 - CELL_SIZE / 2, 0, sizeH / 2 - CELL_SIZE / 2]}>
      <planeGeometry args={[sizeW, sizeH]} />
      <meshStandardMaterial color="#0A1128" metalness={0.2} roughness={0.9} />
    </mesh>
  );
}

function MazeWalls({ maze, playerPos }: { maze: MazeData; playerPos: THREE.Vector3 }) {
  const walls = useMemo(() => {
    const result: Array<{ pos: [number, number, number]; rot?: [number, number, number]; length: number; key: string }> = [];
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell: Cell = maze.grid[y][x];
        const baseX = x * CELL_SIZE;
        const baseZ = y * CELL_SIZE;
        if (cell.walls.top) {
          result.push({
            pos: [baseX, WALL_HEIGHT / 2, baseZ - CELL_SIZE / 2],
            length: CELL_SIZE,
            key: `t-${x}-${y}`,
          });
        }
        if (cell.walls.left) {
          result.push({
            pos: [baseX - CELL_SIZE / 2, WALL_HEIGHT / 2, baseZ],
            rot: [0, Math.PI / 2, 0],
            length: CELL_SIZE,
            key: `l-${x}-${y}`,
          });
        }
        if (y === maze.height - 1 && cell.walls.bottom) {
          result.push({
            pos: [baseX, WALL_HEIGHT / 2, baseZ + CELL_SIZE / 2],
            length: CELL_SIZE,
            key: `b-${x}-${y}`,
          });
        }
        if (x === maze.width - 1 && cell.walls.right) {
          result.push({
            pos: [baseX + CELL_SIZE / 2, WALL_HEIGHT / 2, baseZ],
            rot: [0, Math.PI / 2, 0],
            length: CELL_SIZE,
            key: `r-${x}-${y}`,
          });
        }
      }
    }
    return result;
  }, [maze]);

  return (
    <>
      {walls.map(w => (
        <Wall key={w.key} position={w.pos} rotation={w.rot} length={w.length} playerPos={playerPos} />
      ))}
    </>
  );
}

export default function Scene3D() {
  const { camera, gl } = useThree();
  const maze = useMazeStore(s => s.maze);
  const activeEnding = useMazeStore(s => s.activeEnding);
  const generateNewMaze = useMazeStore(s => s.generateNewMaze);
  const setPlayerPosition = useMazeStore(s => s.setPlayerPosition);
  const setPlayerRotation = useMazeStore(s => s.setPlayerRotation);

  const playerPosRef = useRef(new THREE.Vector3(CELL_SIZE / 2, 1, CELL_SIZE / 2));
  const keysRef = useRef<Record<string, boolean>>({});
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const smoothPos = useRef(new THREE.Vector3(CELL_SIZE / 2, 1, CELL_SIZE / 2));
  const isLockedRef = useRef(false);

  useEffect(() => {
    generateNewMaze(42);
  }, [generateNewMaze]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    const onClick = () => {
      canvas.requestPointerLock();
    };
    const onLockChange = () => {
      isLockedRef.current = document.pointerLockElement === canvas;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isLockedRef.current) return;
      yawRef.current -= e.movementX * 0.002;
      pitchRef.current -= e.movementY * 0.002;
      pitchRef.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitchRef.current));
    };
    canvas.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [gl]);

  const checkCollision = useMemo(() => {
    return (nx: number, nz: number): boolean => {
      if (!maze) return true;
      const margin = 0.3;
      const points = [
        { x: nx - margin, z: nz - margin },
        { x: nx + margin, z: nz - margin },
        { x: nx - margin, z: nz + margin },
        { x: nx + margin, z: nz + margin },
      ];
      for (const p of points) {
        const cx = Math.floor(p.x / CELL_SIZE);
        const cy = Math.floor(p.z / CELL_SIZE);
        if (cx < 0 || cx >= maze.width || cy < 0 || cy >= maze.height) return true;
        const localX = p.x - cx * CELL_SIZE;
        const localZ = p.z - cy * CELL_SIZE;
        const cell = maze.grid[cy][cx];
        if (cell.walls.left && localX < margin) return true;
        if (cell.walls.right && localX > CELL_SIZE - margin) return true;
        if (cell.walls.top && localZ < margin) return true;
        if (cell.walls.bottom && localZ > CELL_SIZE - margin) return true;
      }
      return false;
    };
  }, [maze]);

  useFrame(() => {
    if (!maze || activeEnding) return;

    const forward = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
    const right = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));

    const move = new THREE.Vector3();
    if (keysRef.current['w']) move.add(forward);
    if (keysRef.current['s']) move.sub(forward);
    if (keysRef.current['d']) move.add(right);
    if (keysRef.current['a']) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(MOVE_SPEED);
      const nx = playerPosRef.current.x + move.x;
      const nz = playerPosRef.current.z + move.z;
      if (!checkCollision(nx, playerPosRef.current.z)) playerPosRef.current.x = nx;
      if (!checkCollision(playerPosRef.current.x, nz)) playerPosRef.current.z = nz;
    }

    smoothPos.current.lerp(playerPosRef.current, DAMPING);

    const dir = new THREE.Vector3(
      -Math.sin(yawRef.current) * Math.cos(pitchRef.current),
      Math.sin(pitchRef.current),
      -Math.cos(yawRef.current) * Math.cos(pitchRef.current)
    );
    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothPos.current.clone().add(dir));

    setPlayerPosition({
      x: smoothPos.current.x,
      y: smoothPos.current.y,
      z: smoothPos.current.z,
    });
    setPlayerRotation({ yaw: yawRef.current, pitch: pitchRef.current });
  });

  if (!maze) {
    return (
      <color attach="background" args={['#0A1128']} />
    );
  }

  if (activeEnding) {
    return null;
  }

  return (
    <>
      <color attach="background" args={['#0A1128']} />
      <fog attach="fog" args={['#0A1128', 5, 20]} />
      <ambientLight intensity={0.4} color="#4488AA" />
      <directionalLight position={[10, 15, 10]} intensity={0.6} color="#00FFAA" />
      <pointLight
        position={[smoothPos.current.x, 2, smoothPos.current.z]}
        intensity={1.2}
        color="#00FFAA"
        distance={10}
        decay={2}
      />
      <Floor width={maze.width} height={maze.height} />
      <MazeWalls maze={maze} playerPos={smoothPos.current} />
    </>
  );
}
