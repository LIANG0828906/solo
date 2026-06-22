import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVoxelStore, GRID_SIZE } from './voxelStore';

const VOXEL_SIZE = 0.95;
const GRID_COLOR = '#374151';
const GRID_OPACITY = 0.3;
const PREVIEW_OPACITY = 0.4;
const ANIMATION_DURATION = 0.15;

interface CameraControllerProps {
  cameraAngle: { x: number; y: number };
}

function CameraController({ cameraAngle }: CameraControllerProps) {
  const { camera } = useThree();
  const targetAngle = useRef({ x: cameraAngle.x, y: cameraAngle.y });
  const currentAngle = useRef({ x: cameraAngle.x, y: cameraAngle.y });
  const animating = useRef(false);
  const animStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    targetAngle.current = { x: cameraAngle.x, y: cameraAngle.y };
    animStart.current = { ...currentAngle.current };
    animating.current = true;
  }, [cameraAngle]);

  useFrame((_, delta) => {
    if (animating.current) {
      const dx = targetAngle.current.x - currentAngle.current.x;
      const dy = targetAngle.current.y - currentAngle.current.y;
      const speed = delta * 3;

      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        currentAngle.current = { ...targetAngle.current };
        animating.current = false;
      } else {
        currentAngle.current.x += dx * Math.min(speed, 1);
        currentAngle.current.y += dy * Math.min(speed, 1);
      }
    }

    const radius = Math.sqrt(25 * 25 + 20 * 20 + 25 * 25);
    const x = radius * Math.sin(currentAngle.current.y) * Math.cos(currentAngle.current.x);
    const y = radius * Math.sin(currentAngle.current.x) + 10;
    const z = radius * Math.cos(currentAngle.current.y) * Math.cos(currentAngle.current.x);

    camera.position.set(x, y, z);
    camera.lookAt(GRID_SIZE / 2, GRID_SIZE / 2, GRID_SIZE / 2);
  });

  return null;
}

function GridHelper3D() {
  const lines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const size = GRID_SIZE;

    for (let i = 0; i <= size; i++) {
      points.push(new THREE.Vector3(i, 0, 0));
      points.push(new THREE.Vector3(i, size, 0));
      points.push(new THREE.Vector3(i, 0, size));
      points.push(new THREE.Vector3(i, size, size));

      points.push(new THREE.Vector3(0, i, 0));
      points.push(new THREE.Vector3(size, i, 0));
      points.push(new THREE.Vector3(0, i, size));
      points.push(new THREE.Vector3(size, i, size));

      points.push(new THREE.Vector3(0, 0, i));
      points.push(new THREE.Vector3(size, 0, i));
      points.push(new THREE.Vector3(0, size, i));
      points.push(new THREE.Vector3(size, size, i));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, []);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color={GRID_COLOR} transparent opacity={GRID_OPACITY} />
    </lineSegments>
  );
}

interface VoxelsProps {
  onVoxelClick: (x: number, y: number, z: number, event: any) => void;
  onVoxelContextMenu: (x: number, y: number, z: number) => void;
}

function Voxels({ onVoxelClick, onVoxelContextMenu }: VoxelsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { voxels } = useVoxelStore();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const [animatingVoxels, setAnimatingVoxels] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const newAnimating = new Map<string, number>();
    voxels.forEach((v, i) => {
      const key = `${v.x},${v.y},${v.z}`;
      newAnimating.set(key, Date.now());
    });
    setAnimatingVoxels(newAnimating);
  }, [voxels.length]);

  useFrame(() => {
    if (!meshRef.current) return;

    const now = Date.now();
    let needsUpdate = false;

    voxels.forEach((voxel, i) => {
      const key = `${voxel.x},${voxel.y},${voxel.z}`;
      const startTime = animatingVoxels.get(key);
      let scale = 1;

      if (startTime) {
        const elapsed = (now - startTime) / 1000;
        if (elapsed < ANIMATION_DURATION) {
          const t = elapsed / ANIMATION_DURATION;
          const bounce = 1 + 0.3 * Math.sin(t * Math.PI);
          scale = 0.7 + 0.3 * t * bounce;
          needsUpdate = true;
        }
      }

      dummy.position.set(
        voxel.x + 0.5 - GRID_SIZE / 2,
        voxel.y + 0.5 - GRID_SIZE / 2,
        voxel.z + 0.5 - GRID_SIZE / 2
      );
      dummy.scale.setScalar(scale * VOXEL_SIZE);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      const color = new THREE.Color(voxel.color);
      meshRef.current!.setColorAt(i, color);
    });

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = needsUpdate;
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && instanceId < voxels.length) {
      const voxel = voxels[instanceId];
      onVoxelClick(voxel.x, voxel.y, voxel.z, e);
    }
  };

  const handleContextMenu = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && instanceId < voxels.length) {
      const voxel = voxels[instanceId];
      onVoxelContextMenu(voxel.x, voxel.y, voxel.z);
    }
  };

  if (voxels.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, voxels.length]}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

interface PreviewBoxProps {
  position: { x: number; y: number; z: number } | null;
}

function PreviewBox({ position }: PreviewBoxProps) {
  const { currentColor, currentTool } = useVoxelStore();

  if (!position) return null;

  const displayColor = currentTool === 'eraser' ? '#EF4444' : currentColor;

  return (
    <mesh
      position={[
        position.x + 0.5 - GRID_SIZE / 2,
        position.y + 0.5 - GRID_SIZE / 2,
        position.z + 0.5 - GRID_SIZE / 2,
      ]}
    >
      <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
      <meshStandardMaterial
        color={displayColor}
        transparent
        opacity={PREVIEW_OPACITY}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -GRID_SIZE / 2, 0]} receiveShadow>
      <planeGeometry args={[GRID_SIZE * 3, GRID_SIZE * 3]} />
      <shadowMaterial transparent opacity={0.3} />
    </mesh>
  );
}

interface SceneContentProps {
  hoverPosition: { x: number; y: number; z: number } | null;
  setHoverPosition: (pos: { x: number; y: number; z: number } | null) => void;
}

function SceneContent({ hoverPosition, setHoverPosition }: SceneContentProps) {
  const { addVoxel, removeVoxel, currentTool, fillVoxels, getVoxelAt, setColor, setTool } =
    useVoxelStore();
  const planeRef = useRef<THREE.Mesh>(null);

  const handlePlaneClick = (e: any) => {
    e.stopPropagation();
    if (currentTool !== 'brush' && currentTool !== 'fill') return;

    const point = e.point;
    const x = Math.floor(point.x + GRID_SIZE / 2);
    const y = Math.floor(point.y + GRID_SIZE / 2);
    const z = Math.floor(point.z + GRID_SIZE / 2);

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || z < 0 || z >= GRID_SIZE) {
      return;
    }

    if (currentTool === 'fill') {
      fillVoxels(x, y, z);
    } else {
      addVoxel(x, y, z);
    }
  };

  const handleVoxelClick = (x: number, y: number, z: number, e: any) => {
    if (currentTool === 'brush') {
      const faceNormal = e.face?.normal;
      if (faceNormal) {
        const nx = x + Math.round(faceNormal.x);
        const ny = y + Math.round(faceNormal.y);
        const nz = z + Math.round(faceNormal.z);
        if (
          nx >= 0 && nx < GRID_SIZE &&
          ny >= 0 && ny < GRID_SIZE &&
          nz >= 0 && nz < GRID_SIZE
        ) {
          addVoxel(nx, ny, nz);
        }
      }
    } else if (currentTool === 'eraser') {
      removeVoxel(x, y, z);
    } else if (currentTool === 'fill') {
      fillVoxels(x, y, z);
    } else if (currentTool === 'eyedropper') {
      const voxel = getVoxelAt(x, y, z);
      if (voxel) {
        setColor(voxel.color);
        setTool('brush');
      }
    }
  };

  const handleVoxelContextMenu = (x: number, y: number, z: number) => {
    removeVoxel(x, y, z);
  };

  const handlePointerMove = (e: any) => {
    e.stopPropagation();

    if (e.object === planeRef.current) {
      const point = e.point;
      const x = Math.floor(point.x + GRID_SIZE / 2);
      const y = Math.floor(point.y + GRID_SIZE / 2);
      const z = Math.floor(point.z + GRID_SIZE / 2);

      if (
        x >= 0 && x < GRID_SIZE &&
        y >= 0 && y < GRID_SIZE &&
        z >= 0 && z < GRID_SIZE &&
        !getVoxelAt(x, y, z)
      ) {
        setHoverPosition({ x, y, z });
      } else {
        setHoverPosition(null);
      }
    } else if (e.instanceId !== undefined) {
      const { voxels } = useVoxelStore.getState();
      const voxel = voxels[e.instanceId];
      if (voxel) {
        const faceNormal = e.face?.normal;
        if (faceNormal && currentTool === 'brush') {
          const nx = voxel.x + Math.round(faceNormal.x);
          const ny = voxel.y + Math.round(faceNormal.y);
          const nz = voxel.z + Math.round(faceNormal.z);
          if (
            nx >= 0 && nx < GRID_SIZE &&
            ny >= 0 && ny < GRID_SIZE &&
            nz >= 0 && nz < GRID_SIZE &&
            !getVoxelAt(nx, ny, nz)
          ) {
            setHoverPosition({ x: nx, y: ny, z: nz });
          } else {
            setHoverPosition(null);
          }
        } else if (currentTool === 'eraser' || currentTool === 'fill' || currentTool === 'eyedropper') {
          setHoverPosition({ x: voxel.x, y: voxel.y, z: voxel.z });
        } else {
          setHoverPosition(null);
        }
      }
    }
  };

  const handlePointerOut = () => {
    setHoverPosition(null);
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />

      <group position={[0, 0, 0]}>
        <GridHelper3D />

        <mesh
          ref={planeRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -GRID_SIZE / 2 + 0.01, 0]}
          onClick={handlePlaneClick}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        >
          <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <group onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}>
          <Voxels onVoxelClick={handleVoxelClick} onVoxelContextMenu={handleVoxelContextMenu} />
        </group>

        <PreviewBox position={hoverPosition} />
      </group>

      <GroundPlane />
    </>
  );
}

interface SceneProps {
  cameraAngle: { x: number; y: number };
}

export default function Scene({ cameraAngle }: SceneProps) {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; z: number } | null>(null);

  return (
    <Canvas
      shadows
      camera={{ position: [25, 20, 25], fov: 45 }}
      style={{ background: '#0F172A' }}
      onContextMenu={(e) => e.preventDefault()}
      gl={{ antialias: true }}
    >
      <CameraController cameraAngle={cameraAngle} />
      <SceneContent hoverPosition={hoverPosition} setHoverPosition={setHoverPosition} />
    </Canvas>
  );
}
