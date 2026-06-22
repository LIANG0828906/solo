import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { BlockData } from '../module_api/ThermalApi';
import { HeatmapRenderer } from './HeatmapRenderer';

const GRID_SIZE = 10;
const BLOCK_SIZE = 1;
const GAP = 0.05;

interface SceneEngineProps {
  blocks: BlockData[];
  heatValues: Map<string, number>;
  heatmapEnabled: boolean;
  greenRate: number;
  onBlockClick: (block: BlockData, screenX: number, screenY: number) => void;
  onSelectionChange: (blockIds: string[]) => void;
  heatmapRenderer: React.MutableRefObject<HeatmapRenderer>;
}

function TreeInstances({
  count,
  positions,
  size,
  yOffset,
  color,
}: {
  count: number;
  positions: [number, number, number][];
  size: number;
  yOffset: number;
  color: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      const [tx, ty, tz] = positions[i];
      dummy.position.set(tx, ty + yOffset, tz);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, positions, yOffset, dummy]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} />
    </instancedMesh>
  );
}

function BlockMesh({
  block,
  onClick,
  greenRate,
  heatmapRenderer,
}: {
  block: BlockData;
  onClick: (e: any) => void;
  greenRate: number;
  heatmapRenderer: React.MutableRefObject<HeatmapRenderer>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const treeCount = useMemo(() => Math.floor(greenRate * 8), [greenRate]);

  const treePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      positions.push([
        (Math.random() - 0.5) * (BLOCK_SIZE * 0.7),
        0.1 + Math.random() * 0.3,
        (Math.random() - 0.5) * (BLOCK_SIZE * 0.7),
      ]);
    }
    return positions;
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      heatmapRenderer.current.registerMesh(block.id, meshRef.current);
    }
    return () => {
      heatmapRenderer.current.unregisterMesh(block.id);
    };
  }, [block.id, heatmapRenderer]);

  const xPos = (block.x - GRID_SIZE / 2 + 0.5) * (BLOCK_SIZE + GAP);
  const zPos = (block.z - GRID_SIZE / 2 + 0.5) * (BLOCK_SIZE + GAP);

  return (
    <group position={[xPos, 0, zPos]}>
      <mesh
        ref={meshRef}
        position={[0, block.height / 2, 0]}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BLOCK_SIZE * 0.9, block.height, BLOCK_SIZE * 0.9]} />
        <meshStandardMaterial color="#b0b0b0" roughness={0.7} metalness={0.1} />
      </mesh>
      {treeCount > 0 && (
        <>
          <TreeInstances
            count={treeCount}
            positions={treePositions}
            size={0.08}
            yOffset={0}
            color="#22c55e"
          />
          <TreeInstances
            count={treeCount}
            positions={treePositions}
            size={0.18}
            yOffset={0.2}
            color="#16a34a"
          />
        </>
      )}
    </group>
  );
}

function Scene({
  blocks,
  heatValues,
  heatmapEnabled,
  onBlockClick,
  onSelectionChange,
  greenRate,
  heatmapRenderer,
}: SceneEngineProps) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    heatmapRenderer.current.setEnabled(heatmapEnabled);
    if (heatmapEnabled && heatValues.size > 0) {
      heatmapRenderer.current.updateHeatValues(heatValues);
    }
  }, [heatmapEnabled, heatValues, heatmapRenderer]);

  useFrame(() => {
    heatmapRenderer.current.animate();
  });

  const handleBlockClick = useCallback(
    (block: BlockData) => (event: any) => {
      event.stopPropagation();
      onBlockClick(block, event.clientX, event.clientY);
    },
    [onBlockClick],
  );

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: MouseEvent) => {
      if (e.shiftKey || e.button === 2) {
        setIsSelecting(true);
        setSelectionStart({ x: e.clientX, y: e.clientY });
        setSelectionEnd({ x: e.clientX, y: e.clientY });
      }
    };

    const onPointerMove = (e: MouseEvent) => {
      if (isSelecting) {
        setSelectionEnd({ x: e.clientX, y: e.clientY });
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      if (isSelecting && selectionStart) {
        const start = selectionStart;
        const end = { x: e.clientX, y: e.clientY };
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        if (Math.abs(maxX - minX) > 5 && Math.abs(maxY - minY) > 5) {
          const selected: string[] = [];
          blocks.forEach((block) => {
            const xPos = (block.x - GRID_SIZE / 2 + 0.5) * (BLOCK_SIZE + GAP);
            const zPos = (block.z - GRID_SIZE / 2 + 0.5) * (BLOCK_SIZE + GAP);
            const worldPos = new THREE.Vector3(xPos, block.height / 2, zPos);
            const screenPos = worldPos.clone().project(camera);
            const sx = ((screenPos.x + 1) / 2) * window.innerWidth;
            const sy = ((-screenPos.y + 1) / 2) * window.innerHeight;
            if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
              selected.push(block.id);
            }
          });
          if (selected.length > 0) {
            onSelectionChange(selected);
          }
        }
      }
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
    };
  }, [isSelecting, selectionStart, blocks, camera, gl, onSelectionChange]);

  useEffect(() => {
    let rafId: number;
    const updateSelectionBox = () => {
      if (isSelecting && selectionStart && selectionEnd) {
        let overlay = document.getElementById('selection-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'selection-overlay';
          overlay.style.cssText = `
            position: fixed;
            border: 2px dashed #38bdf8;
            background: rgba(56, 189, 248, 0.15);
            pointer-events: none;
            z-index: 100;
          `;
          document.body.appendChild(overlay);
        }
        const left = Math.min(selectionStart.x, selectionEnd.x);
        const top = Math.min(selectionStart.y, selectionEnd.y);
        const width = Math.abs(selectionEnd.x - selectionStart.x);
        const height = Math.abs(selectionEnd.y - selectionStart.y);
        overlay.style.left = `${left}px`;
        overlay.style.top = `${top}px`;
        overlay.style.width = `${width}px`;
        overlay.style.height = `${height}px`;
      } else {
        const overlay = document.getElementById('selection-overlay');
        if (overlay) overlay.remove();
      }
      rafId = requestAnimationFrame(updateSelectionBox);
    };
    rafId = requestAnimationFrame(updateSelectionBox);
    return () => {
      cancelAnimationFrame(rafId);
      const overlay = document.getElementById('selection-overlay');
      if (overlay) overlay.remove();
    };
  }, [isSelecting, selectionStart, selectionEnd]);

  const groundSize = GRID_SIZE * (BLOCK_SIZE + GAP) + 2;

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.1}
      />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={6} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#d3d3d3" />
      </mesh>
      <gridHelper
        args={[groundSize, GRID_SIZE, '#666666', '#888888']}
        position={[0, 0.001, 0]}
      />
      {blocks.map((block) => (
        <BlockMesh
          key={block.id}
          block={block}
          onClick={handleBlockClick(block)}
          greenRate={greenRate}
          heatmapRenderer={heatmapRenderer}
        />
      ))}
    </>
  );
}

export function SceneEngine(props: SceneEngineProps) {
  return (
    <div className="canvas-container">
      <Canvas
        shadows
        camera={{
          position: [0, 15 * Math.sin(Math.PI / 6), 15 * Math.cos(Math.PI / 6)],
          fov: 50,
        }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%)' }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
