import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Calculus3D } from './Calculus3D';
import { Particles } from './Particles';
import { useWorkshopStore } from '@/store/workshopStore';
import { GRID_SIZE, CELL_SIZE } from '@/types';
import { useAudio } from '@/hooks/useAudio';

function Grid() {
  const gridRef = useRef<THREE.Group>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; z: number } | null>(null);
  const { isDragging, dragCalculus, placeCalculus, endDrag, placedCalculi } = useWorkshopStore();
  const { playPlaceSound } = useAudio();

  const handleCellClick = (gridX: number, gridZ: number) => {
    if (isDragging && dragCalculus) {
      const isOccupied = placedCalculi.some(
        c => c.gridPosition?.gridX === gridX && c.gridPosition?.gridZ === gridZ
      );
      
      if (!isOccupied) {
        placeCalculus(dragCalculus, gridX, gridZ);
        playPlaceSound();
        endDrag();
      }
    }
  };

  const handlePointerOver = (x: number, z: number) => {
    if (isDragging) {
      setHoveredCell({ x, z });
    }
  };

  const handlePointerOut = () => {
    setHoveredCell(null);
  };

  useFrame((state) => {
    if (gridRef.current) {
      const time = state.clock.elapsedTime;
      gridRef.current.position.y = Math.sin(time * 0.5) * 0.02;
    }
  });

  const cells = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      const worldX = x * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2;
      const worldZ = z * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2;
      const isHovered = hoveredCell?.x === x && hoveredCell?.z === z;
      const isOccupied = placedCalculi.some(
        c => c.gridPosition?.gridX === x && c.gridPosition?.gridZ === z
      );

      cells.push(
        <mesh
          key={`cell-${x}-${z}`}
          position={[worldX, 0.01, worldZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={() => handleCellClick(x, z)}
          onPointerOver={() => handlePointerOver(x, z)}
          onPointerOut={handlePointerOut}
          receiveShadow
        >
          <planeGeometry args={[CELL_SIZE * 0.9, CELL_SIZE * 0.9]} />
          <meshStandardMaterial
            color={isHovered ? '#c0392b' : isOccupied ? '#d4c19f' : '#e8d5b3'}
            transparent
            opacity={isHovered ? 0.6 : isOccupied ? 0.8 : 0.5}
          />
        </mesh>
      );
    }
  }

  return (
    <group ref={gridRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.8} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[7.5, 7.5]} />
        <meshStandardMaterial color="#e8d5b3" roughness={0.6} />
      </mesh>

      {cells}

      <gridHelper
        args={[GRID_SIZE * CELL_SIZE, GRID_SIZE, '#2b1e0e', '#2b1e0e']}
        position={[0, 0.02, 0]}
      />

      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[8.5, 1, 8.5]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Scene() {
  const { 
    placedCalculi, selectedCalculus, selectCalculus, 
    rotateCalculus, flipCalculus, removeCalculus, 
    setLongPressCalculus, particleEffects 
  } = useWorkshopStore();

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-4, 3, -4]} intensity={0.6} color="#f2e6cf" />
      <pointLight position={[4, 2, 4]} intensity={0.4} color="#e8d5b3" />

      <Grid />

      {placedCalculi.map((calculus) => (
        <Calculus3D
          key={calculus.id}
          calculus={calculus}
          isSelected={selectedCalculus?.id === calculus.id}
          onSelect={() => selectCalculus(calculus)}
          onRotate={() => rotateCalculus(calculus.id)}
          onFlip={() => flipCalculus(calculus.id)}
          onRemove={() => removeCalculus(calculus.id)}
          onLongPress={(active) => setLongPressCalculus(active ? calculus : null)}
        />
      ))}

      <Particles effects={particleEffects} />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />

      <Environment preset="warehouse" />

      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.1} darkness={0.3} />
      </EffectComposer>

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

interface WorkshopProps {
  onDrop?: (e: React.DragEvent) => void;
}

export function Workshop({ onDrop }: WorkshopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDragging, dragCalculus, placeCalculus, endDrag } = useWorkshopStore();
  const { playPlaceSound } = useAudio();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (containerRef.current && dragCalculus) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const z = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      const gridX = Math.round((x * 3 + 2) / CELL_SIZE);
      const gridZ = Math.round((z * 3 + 2) / CELL_SIZE);
      
      const clampedX = Math.max(0, Math.min(GRID_SIZE - 1, gridX));
      const clampedZ = Math.max(0, Math.min(GRID_SIZE - 1, gridZ));

      placeCalculus(dragCalculus, clampedX, clampedZ);
      playPlaceSound();
      endDrag();
    }
    
    if (onDrop) {
      onDrop(e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endDrag();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [endDrag]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Canvas
        shadows
        camera={{ position: [8, 8, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#e8d5b3']} />
        <fog attach="fog" args={['#e8d5b3', 15, 30]} />
        <Scene />
      </Canvas>

      {isDragging && dragCalculus && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#2b1e0e] text-[#e8d5b3] px-4 py-2 rounded text-sm">
          将「{dragCalculus.name}」拖放到格子上，按 ESC 取消
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-[#2b1e0e] text-xs opacity-60">
        <div>左键: 旋转 | Shift+左键: 翻转 | 双击: 移除</div>
      </div>
    </div>
  );
}
