import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { Ground } from './Ground';
import { Starfield } from './Starfield';
import { BlockMesh } from './BlockMesh';
import { Fragments } from './Fragments';
import { GRID_STEP } from '@/types';
import type { Block, BlockType, CollapseResult } from '@/types';

interface PreviewState {
  visible: boolean;
  position: [number, number, number];
  type: BlockType | null;
}

function SceneContent() {
  const blocks = useGameStore((state) => state.blocks);
  const selectedType = useGameStore((state) => state.selectedType);
  const isCollapsed = useGameStore((state) => state.isCollapsed);
  const fragments = useGameStore((state) => state.fragments);
  const isTransitioning = useGameStore((state) => state.isTransitioning);
  const addBlock = useGameStore((state) => state.addBlock);
  const triggerCollapse = useGameStore((state) => state.triggerCollapse);
  const updateCenterOfMass = useGameStore((state) => state.updateCenterOfMass);

  const { raycaster, mouse, camera } = useThree();
  const workerRef = useRef<Worker | null>(null);
  const lastComputeTime = useRef(0);
  const computeThrottle = useRef(1000 / 30);

  const isCollapsedRef = useRef(isCollapsed);
  const blocksRef = useRef(blocks);
  const triggerCollapseRef = useRef(triggerCollapse);
  const updateCenterOfMassRef = useRef(updateCenterOfMass);

  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    triggerCollapseRef.current = triggerCollapse;
  }, [triggerCollapse]);

  useEffect(() => {
    updateCenterOfMassRef.current = updateCenterOfMass;
  }, [updateCenterOfMass]);

  const [preview, setPreview] = useState<PreviewState>({
    visible: false,
    position: [0, 0.5, 0],
    type: null,
  });

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  useEffect(() => {
    const worker = new Worker(new URL('./PhysicsWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e: MessageEvent<{ type: string; result: CollapseResult; computeTime: number }>) => {
      if (e.data.type === 'result') {
        const { result } = e.data;
        updateCenterOfMassRef.current(result.centerOfMass);

        if (result.shouldCollapse && !isCollapsedRef.current && blocksRef.current.length > 0) {
          triggerCollapseRef.current(result.fragments, result.blockVelocities);
        }
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const sendToWorker = useCallback((blocksData: Block[]) => {
    const now = performance.now();
    if (now - lastComputeTime.current < computeThrottle.current) return;
    lastComputeTime.current = now;

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'calculate',
        blocks: blocksData,
      });
    }
  }, []);

  useEffect(() => {
    if (!isCollapsed && blocks.length > 0) {
      sendToWorker(blocks);
    }
  }, [blocks, isCollapsed, sendToWorker]);

  const handlePointerMove = useCallback(
    (event: any) => {
      if (!selectedType || isCollapsed) {
        setPreview((p) => ({ ...p, visible: false }));
        return;
      }

      event.stopPropagation();

      raycaster.setFromCamera(mouse, camera);

      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, intersectPoint);

      if (intersectPoint) {
        let yPos = 0.5;

        for (const b of blocks) {
          const dx = Math.abs(intersectPoint.x - b.position[0]);
          const dz = Math.abs(intersectPoint.z - b.position[2]);
          if (dx < 0.6 && dz < 0.6 && intersectPoint.y < b.position[1] + 1.5) {
            yPos = Math.max(yPos, b.position[1] + 1);
          }
        }

        const snappedX = Math.round(intersectPoint.x / GRID_STEP) * GRID_STEP;
        const snappedZ = Math.round(intersectPoint.z / GRID_STEP) * GRID_STEP;

        setPreview({
          visible: true,
          position: [snappedX, yPos, snappedZ],
          type: selectedType,
        });
      }
    },
    [selectedType, blocks, raycaster, mouse, camera, groundPlane, isCollapsed]
  );

  const handleClick = useCallback(
    (event: any) => {
      if (!selectedType || isCollapsed || isTransitioning) return;
      event.stopPropagation();

      if (preview.visible && preview.type) {
        addBlock(preview.type, preview.position);
      }
    },
    [selectedType, preview, addBlock, isCollapsed, isTransitioning]
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#6688ff" />

      <Starfield />

      <group onPointerMove={handlePointerMove} onClick={handleClick}>
        <Ground />
      </group>

      {blocks.map((block) => (
        <BlockMesh
          key={block.id}
          type={block.type}
          position={block.position}
          color={block.color}
          isCollapsed={block.isCollapsed}
          velocity={block.velocity}
          isTransitioning={isTransitioning}
        />
      ))}

      {preview.visible && preview.type && (
        <BlockMesh
          type={preview.type}
          position={preview.position}
          color="#ffffff"
          isPreview
        />
      )}

      <Fragments fragments={fragments} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 2, 0]}
      />
    </>
  );
}

export function BuildScene() {
  return (
    <Canvas
      camera={{ position: [8, 8, 8], fov: 60 }}
      shadows
      gl={{ antialias: true }}
      style={{ background: 'radial-gradient(ellipse at center, #16213E 0%, #0A0B10 100%)' }}
    >
      <SceneContent />
    </Canvas>
  );
}
