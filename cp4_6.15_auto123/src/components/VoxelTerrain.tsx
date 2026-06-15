import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { VoxelData } from '../utils/terrainGenerator';
import WaterSurface from './WaterSurface';

interface VoxelTerrainProps {
  voxelData: VoxelData | null;
  prevVoxelData: VoxelData | null;
  generationKey: number;
}

type BlockType = 'grass' | 'dirt' | 'stone' | 'sand' | 'snow';

interface BlockInstance {
  x: number;
  y: number;
  z: number;
  type: BlockType;
  delay: number;
  targetY: number;
  prevTargetY: number | null;
}

const BLOCK_COLORS: Record<BlockType, number> = {
  grass: 0x4aa84f,
  dirt: 0x7a4e2b,
  stone: 0x7d8590,
  sand: 0xe0c97a,
  snow: 0xe8eef5,
};

export default function VoxelTerrain({ voxelData, prevVoxelData, generationKey }: VoxelTerrainProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [instances, setInstances] = useState<BlockInstance[]>([]);
  const [treeInstances, setTreeInstances] = useState<Array<{ x: number; z: number; y: number; phase: number }>>([]);
  const transitionStartRef = useRef<number>(0);
  const { camera } = useThree();

  useEffect(() => {
    if (!voxelData) {
      setInstances([]);
      setTreeInstances([]);
      return;
    }

    const { heights, waterLevel, size, treePositions, caveMap } = voxelData;
    const halfSize = size / 2;
    const prevHeights = prevVoxelData?.heights;
    const newInstances: BlockInstance[] = [];

    const amp = (params: VoxelData['heights']) => {
      let max = 0;
      for (let x = 0; x < size; x++) for (let z = 0; z < size; z++) if (params[x][z] > max) max = params[x][z];
      return max;
    };
    const maxH = amp(heights);

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const h = heights[x][z];
        const prevH = prevHeights ? prevHeights[x][z] : null;

        const centerDx = x - halfSize;
        const centerDz = z - halfSize;
        const distFromCenter = Math.sqrt(centerDx * centerDx + centerDz * centerDz);
        const rippleDelay = distFromCenter * 0.018;

        for (let y = 0; y <= h; y++) {
          if (caveMap && caveMap[x] && caveMap[x][z] && caveMap[x][z][y]) continue;
          if (y > 0 && y < h) {
            const above = y + 1 <= h ? !(caveMap?.[x]?.[z]?.[y + 1] ?? false) : true;
            const below = y - 1 >= 0 ? !(caveMap?.[x]?.[z]?.[y - 1] ?? false) : true;
            const hasNeighbor =
              (x > 0 && heights[x - 1][z] >= y) ||
              (x < size - 1 && heights[x + 1][z] >= y) ||
              (z > 0 && heights[x][z - 1] >= y) ||
              (z < size - 1 && heights[x][z + 1] >= y);
            if (above && below && hasNeighbor && !(x === 0 || z === 0 || x === size - 1 || z === size - 1)) continue;
          }

          let type: BlockType;
          const normalizedH = maxH > 0 ? h / maxH : 0;
          if (normalizedH > 0.78) type = 'snow';
          else if (normalizedH > 0.55) type = 'stone';
          else if (y === h && h > waterLevel + 1) type = 'grass';
          else if (y === h && h <= waterLevel + 1) type = 'sand';
          else if (y >= h - 2) type = 'dirt';
          else type = 'stone';

          newInstances.push({
            x: x,
            y: y,
            z: z,
            type,
            delay: rippleDelay + Math.random() * 0.08,
            targetY: y,
            prevTargetY: prevH !== null && y <= prevH ? y : null,
          });
        }
      }
    }

    setInstances(newInstances);
    setTreeInstances(treePositions.map((t) => ({ ...t, phase: Math.random() * Math.PI * 2 })));
    transitionStartRef.current = performance.now();
  }, [voxelData, generationKey, prevVoxelData]);

  const groupByType = useMemo(() => {
    const groups: Record<BlockType, BlockInstance[]> = {
      grass: [],
      dirt: [],
      stone: [],
      sand: [],
      snow: [],
    };
    instances.forEach((inst) => groups[inst.type].push(inst));
    return groups;
  }, [instances]);

  const AnimatedMeshGroup = ({ type, blocks }: { type: BlockType; blocks: BlockInstance[] }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const initialPositions = useRef<Map<number, number>>(new Map());
    const wasAnimated = useRef(false);

    useEffect(() => {
      initialPositions.current.clear();
      wasAnimated.current = false;
    }, [blocks]);

    useFrame(() => {
      if (!meshRef.current || blocks.length === 0) return;
      const elapsed = (performance.now() - transitionStartRef.current) / 1000;
      const isTransition = generationKey > 0;

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const localElapsed = Math.max(0, elapsed - block.delay);

        let displayY: number;
        const duration = 0.55;

        if (isTransition && block.prevTargetY !== null && block.prevTargetY < block.targetY) {
          if (localElapsed < duration) {
            const t = localElapsed / duration;
            const ease = 1 - Math.pow(1 - t, 3);
            displayY = block.prevTargetY + (block.targetY - block.prevTargetY) * ease;
          } else {
            displayY = block.targetY;
          }
        } else if (localElapsed < duration) {
          const t = localElapsed / duration;
          const easeOutBack = 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.18;
          const pop = Math.sin(t * Math.PI * 2.2) * 0.22 * (1 - t);
          const startY = -6 + block.targetY * 0.3;
          displayY = startY + (block.targetY - startY) * Math.min(1, easeOutBack + pop);
        } else {
          displayY = block.targetY;
          if (!initialPositions.current.has(i)) {
            initialPositions.current.set(i, block.targetY);
          }
        }

        dummy.position.set(block.x, displayY + 0.5, block.z);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (blocks.length > 0) wasAnimated.current = true;
    });

    if (blocks.length === 0) return null;

    return (
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, blocks.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.98, 0.98, 0.98]} />
        <meshStandardMaterial
          color={BLOCK_COLORS[type]}
          roughness={type === 'snow' ? 0.85 : type === 'sand' ? 0.9 : 0.78}
          metalness={type === 'stone' ? 0.08 : 0.02}
        />
      </instancedMesh>
    );
  };

  const Trees = () => {
    const trunkRef = useRef<THREE.InstancedMesh>(null);
    const leavesRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(({ clock }) => {
      const t = clock.getElapsedTime();
      const windPhase = t * 1.4;

      if (trunkRef.current) {
        for (let i = 0; i < treeInstances.length; i++) {
          const tree = treeInstances[i];
          dummy.position.set(tree.x + 0.5, tree.y + 2, tree.z + 0.5);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          trunkRef.current.setMatrixAt(i, dummy.matrix);
        }
        trunkRef.current.instanceMatrix.needsUpdate = true;
      }

      if (leavesRef.current) {
        for (let i = 0; i < treeInstances.length; i++) {
          const tree = treeInstances[i];
          const sway = Math.sin(windPhase + tree.phase) * 0.06;
          const sway2 = Math.cos(windPhase * 0.7 + tree.phase) * 0.04;
          dummy.position.set(tree.x + 0.5 + sway, tree.y + 3.6 + sway2, tree.z + 0.5 + sway2);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          leavesRef.current.setMatrixAt(i, dummy.matrix);
        }
        leavesRef.current.instanceMatrix.needsUpdate = true;
      }
    });

    if (treeInstances.length === 0) return null;

    return (
      <>
        <instancedMesh ref={trunkRef} args={[undefined, undefined, treeInstances.length]} castShadow>
          <cylinderGeometry args={[0.12, 0.18, 3, 6]} />
          <meshStandardMaterial color="#5a3a1e" roughness={0.95} />
        </instancedMesh>
        <instancedMesh ref={leavesRef} args={[undefined, undefined, treeInstances.length]} castShadow>
          <cylinderGeometry args={[0.85, 0.25, 2.6, 7]} />
          <meshStandardMaterial color="#2d8a36" roughness={0.88} />
        </instancedMesh>
      </>
    );
  };

  useEffect(() => {
    if (!voxelData) return;
    const maxH = (params: VoxelData['heights']) => {
      let m = 0;
      for (let x = 0; x < params.length; x++)
        for (let z = 0; z < params[0].length; z++) if (params[x][z] > m) m = params[x][z];
      return m;
    };
    const mh = maxH(voxelData.heights);
    const dist = Math.max(38, voxelData.size * 0.85 + mh * 1.5);
    const targetPos = new THREE.Vector3(dist * 0.58, mh * 0.75 + 20, dist);
    camera.position.lerp(targetPos, 0.55);
  }, [voxelData, camera]);

  return (
    <>
      <group ref={groupRef} position={[-voxelData?.size! / 2 + 0.5, 0, -voxelData?.size! / 2 + 0.5]}>
        {(Object.keys(groupByType) as BlockType[]).map((type) => (
          <AnimatedMeshGroup key={type} type={type} blocks={groupByType[type]} />
        ))}
        <Trees />
      </group>

      {voxelData && <WaterSurface size={voxelData.size} waterLevel={voxelData.waterLevel} />}

      <ambientLight intensity={0.48} color="#b8c6db" />
      <directionalLight
        position={[28, 52, 22]}
        intensity={1.35}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={160}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <hemisphereLight args={['#8ab4ff', '#1a3a2e', 0.45]} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minPolarAngle={0.15}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        target={[0, voxelData ? voxelData.waterLevel + 6 : 0, 0]}
        enablePan={true}
        screenSpacePanning={false}
      />
    </>
  );
}
