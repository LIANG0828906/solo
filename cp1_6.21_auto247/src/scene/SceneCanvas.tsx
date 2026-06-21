import { useRef, useEffect, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import FloorGrid, { GRID_UNIT, GRID_SIZE } from './FloorGrid';
import BrickMesh from './BrickMesh';
import { useAppStore, Brick, BrickType } from '../store/useAppStore';

interface SceneContentProps {
  brickTypes: BrickType[];
  onDropBrick: (type: string, color: string, position: { x: number; y: number; z: number }) => void;
}

function SceneContent({ brickTypes, onDropBrick }: SceneContentProps) {
  const { bricks, selectedIds, selectBrick, clearSelection } = useAppStore();
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredBrick, setHoveredBrick] = useState<string | null>(null);
  const [draggedData, setDraggedData] = useState<{ type: string; color: string } | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number; z: number } | null>(null);
  const { camera, raycaster, mouse } = useThree();

  const groundPlane = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer?.getData('application/json');
    if (data) {
      const parsed = JSON.parse(data);
      setDraggedData(parsed);

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.set(x, y);
      raycaster.setFromCamera(mouse, camera);

      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane.current, intersectPoint);

      if (intersectPoint) {
        const gridX = Math.round(intersectPoint.x / GRID_UNIT);
        const gridZ = Math.round(intersectPoint.z / GRID_UNIT);
        const halfGrid = GRID_SIZE / 2;
        const clampedX = Math.max(-halfGrid, Math.min(halfGrid - 1, gridX));
        const clampedZ = Math.max(-halfGrid, Math.min(halfGrid - 1, gridZ));
        setGhostPosition({ x: clampedX, y: 0, z: clampedZ });
      }
    }
  }, [camera, raycaster, mouse]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer?.getData('application/json');
    if (data && ghostPosition) {
      const parsed = JSON.parse(data);
      onDropBrick(parsed.type, parsed.color, ghostPosition);
    }
    setDraggedData(null);
    setGhostPosition(null);
  }, [ghostPosition, onDropBrick]);

  const handleDragLeave = useCallback(() => {
    setDraggedData(null);
    setGhostPosition(null);
  }, []);

  useEffect(() => {
    const canvas = document.querySelector('.scene-canvas canvas');
    if (canvas) {
      canvas.addEventListener('dragover', handleDragOver as any);
      canvas.addEventListener('drop', handleDrop as any);
      canvas.addEventListener('dragleave', handleDragLeave as any);
      return () => {
        canvas.removeEventListener('dragover', handleDragOver as any);
        canvas.removeEventListener('drop', handleDrop as any);
        canvas.removeEventListener('dragleave', handleDragLeave as any);
      };
    }
  }, [handleDragOver, handleDrop, handleDragLeave]);

  const handleBackgroundClick = useCallback((e: any) => {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  }, [clearSelection]);

  const getBrickType = useCallback((type: string) => {
    return brickTypes.find(t => t.id === type);
  }, [brickTypes]);

  const ghostBrickType = draggedData ? getBrickType(draggedData.type) : null;

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[100, 200, 100]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-100, 100, -100]} intensity={0.3} />

      <FloorGrid />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow onClick={handleBackgroundClick}>
        <planeGeometry args={[GRID_SIZE * GRID_UNIT, GRID_SIZE * GRID_UNIT]} />
        <meshStandardMaterial color="#0F172A" transparent opacity={0} />
      </mesh>

      {bricks.map((brick: Brick) => (
        <BrickMesh
          key={brick.id}
          brick={brick}
          brickType={getBrickType(brick.type)}
          isSelected={selectedIds.includes(brick.id)}
          onClick={(e) => {
            e.stopPropagation();
            selectBrick(brick.id, e.shiftKey);
          }}
          onPointerOver={() => setHoveredBrick(brick.id)}
          onPointerOut={() => setHoveredBrick(null)}
        />
      ))}

      {ghostPosition && ghostBrickType && (
        <group position={[
          ghostPosition.x * GRID_UNIT,
          ghostBrickType.height * GRID_UNIT / 2,
          ghostPosition.z * GRID_UNIT,
        ]}>
          <mesh>
            <boxGeometry
              args={[
                ghostBrickType.width * GRID_UNIT,
                ghostBrickType.height * GRID_UNIT,
                ghostBrickType.depth * GRID_UNIT,
              ]}
            />
            <meshStandardMaterial
              color={draggedData?.color || '#3B82F6'}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      )}

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.3}
        minDistance={50}
        maxDistance={500}
        mouseButtons={{
          LEFT: undefined as any,
          MIDDLE: undefined as any,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
    </group>
  );
}

interface SceneCanvasProps {
  brickTypes: BrickType[];
  onDropBrick: (type: string, color: string, position: { x: number; y: number; z: number }) => void;
}

export default function SceneCanvas({ brickTypes, onDropBrick }: SceneCanvasProps) {
  return (
    <div className="scene-canvas" style={{ width: '100%', height: '100%' }}>
      <Canvas shadows camera={{ position: [200, 200, 200], fov: 50 }}>
        <color attach="background" args={['#0F172A']} />
        <fog attach="fog" args={['#0F172A', 300, 600]} />
        <PerspectiveCamera makeDefault position={[200, 200, 200]} fov={50} />
        <SceneContent brickTypes={brickTypes} onDropBrick={onDropBrick} />
      </Canvas>
    </div>
  );
}
