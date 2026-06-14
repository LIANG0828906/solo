import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useBattleStore } from '../../../store/battleStore';
import type { GridPosition, TerrainType, Unit } from '../../battle/types';
import { TERRAIN_COLORS, UNIT_CLASS_COLORS } from '../../battle/types';

const HEX_SIZE = 1;
const GRID_SIZE = 8;

function createHexagonGeometry(size: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, -0.1);
  return geometry;
}

interface HexTileProps {
  position: GridPosition;
  terrain: TerrainType;
  isMovable: boolean;
  isAttackable: boolean;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (clientX: number, clientY: number) => void;
}

function HexTile({
  position,
  terrain,
  isMovable,
  isAttackable,
  isSelected,
  onClick,
  onContextMenu,
}: HexTileProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const geometry = useMemo(() => createHexagonGeometry(HEX_SIZE * 0.95), []);

  const gridSystem = useBattleStore((state) => state.gridSystem);
  const pixelPos = gridSystem.axialToPixel(position, HEX_SIZE);

  let color = TERRAIN_COLORS[terrain];
  if (isMovable) color = '#4a90d9';
  if (isAttackable) color = '#d94a4a';
  if (isSelected) color = '#f5d782';
  if (hovered) color = '#a0e7a8';

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (isAttackable) {
        material.opacity = 0.5 + 0.3 * Math.sin(state.clock.elapsedTime * 4);
      } else if (isMovable) {
        material.opacity = 0.7;
      } else {
        material.opacity = 1;
      }
    }
  });

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const nativeEvent = event.nativeEvent || (event as unknown as MouseEvent);
    if (nativeEvent.preventDefault) {
      nativeEvent.preventDefault();
    }
    onContextMenu(nativeEvent.clientX, nativeEvent.clientY);
  }, [onContextMenu]);

  return (
    <mesh
      ref={meshRef}
      position={[pixelPos.x, pixelPos.y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onContextMenu={handleContextMenu}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={terrain === 'grass' ? 0.9 : 1}
        roughness={terrain === 'rock' ? 0.8 : 0.5}
      />
    </mesh>
  );
}

interface UnitMeshProps {
  unit: Unit;
  isCurrentTurn: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function UnitMesh({
  unit,
  isCurrentTurn,
  isSelected,
  onClick,
}: UnitMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const gridSystem = useBattleStore((state) => state.gridSystem);
  const pixelPos = gridSystem.axialToPixel(unit.position, HEX_SIZE);

  const color = UNIT_CLASS_COLORS[unit.unitClass];
  const hpPercent = unit.currentHp / unit.maxHp;

  const [animState, setAnimState] = useState({
    progress: 0,
    arcHeight: 0,
    shakeOffset: 0,
    scale: 0,
    startX: pixelPos.x + (Math.random() - 0.5) * 6,
    startY: pixelPos.y + (Math.random() - 0.5) * 6,
    phase: 'projectile' as 'projectile' | 'shake' | 'idle',
    shakeTime: 0,
  });

  useEffect(() => {
    let startTime = performance.now();
    const projectileDuration = 400;
    const shakeDuration = 300;

    const animate = () => {
      const elapsed = performance.now() - startTime;

      if (elapsed < projectileDuration) {
        const t = elapsed / projectileDuration;
        const easeProgress = 1 - Math.pow(1 - t, 3);
        const arcHeight = Math.sin(t * Math.PI) * 2.5;
        setAnimState((prev) => ({
          ...prev,
          progress: easeProgress,
          arcHeight,
          scale: Math.min(1, t * 1.5),
          phase: 'projectile',
        }));
        requestAnimationFrame(animate);
      } else if (elapsed < projectileDuration + shakeDuration) {
        const shakeElapsed = elapsed - projectileDuration;
        const shakeT = shakeElapsed / shakeDuration;
        const shakeDecay = Math.pow(1 - shakeT, 2);
        const shakeOffset = Math.sin(shakeElapsed * 0.08) * 0.2 * shakeDecay;
        setAnimState((prev) => ({
          ...prev,
          progress: 1,
          arcHeight: 0,
          scale: 1,
          shakeOffset,
          phase: 'shake',
          shakeTime: shakeElapsed,
        }));
        requestAnimationFrame(animate);
      } else {
        setAnimState((prev) => ({
          ...prev,
          progress: 1,
          arcHeight: 0,
          scale: 1,
          shakeOffset: 0,
          phase: 'idle',
        }));
      }
    };
    animate();
  }, [unit.id]);

  useFrame((state) => {
    if (meshRef.current && isCurrentTurn && animState.phase === 'idle') {
      meshRef.current.position.y = pixelPos.y + Math.sin(state.clock.elapsedTime * 3) * 0.15;
    }
  });

  if (unit.currentHp <= 0) return null;

  let displayX: number, displayY: number, displayZ: number, displayScale: number;

  if (animState.phase === 'projectile') {
    displayX = animState.startX + (pixelPos.x - animState.startX) * animState.progress;
    displayY = animState.startY + (pixelPos.y - animState.startY) * animState.progress;
    displayZ = 0.3 + animState.arcHeight;
    displayScale = animState.scale;
  } else if (animState.phase === 'shake') {
    displayX = pixelPos.x + animState.shakeOffset;
    displayY = pixelPos.y + animState.shakeOffset * 0.5;
    displayZ = 0.3;
    displayScale = 1 + Math.sin(animState.shakeTime * 0.05) * 0.08 * Math.pow(1 - animState.shakeTime / 300, 2);
  } else {
    displayX = pixelPos.x;
    displayY = pixelPos.y;
    displayZ = 0.3;
    displayScale = 1;
  }

  return (
    <group
      ref={meshRef}
      position={[displayX, displayY, displayZ]}
      scale={[displayScale, displayScale, displayScale]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.15, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected || isCurrentTurn ? color : '#000000'}
          emissiveIntensity={isSelected || isCurrentTurn ? 0.3 : 0}
        />
      </mesh>

      <mesh position={[0, 0, 0.35]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected || isCurrentTurn ? color : '#000000'}
          emissiveIntensity={isSelected || isCurrentTurn ? 0.2 : 0}
        />
      </mesh>

      <mesh position={[0, 0, 0.65]}>
        <boxGeometry args={[0.8, 0.08, 0.05]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      <mesh position={[-0.4 * (1 - hpPercent), 0, 0.65]} scale={[hpPercent, 1, 1]}>
        <boxGeometry args={[0.8, 0.06, 0.06]} />
        <meshBasicMaterial color={hpPercent > 0.5 ? '#6bdb6b' : hpPercent > 0.25 ? '#f5d782' : '#ff6b6b'} />
      </mesh>

      {(isSelected || isCurrentTurn) && (
        <mesh position={[0, 0, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial
            color={isCurrentTurn ? '#f5d782' : '#a0e7a8'}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

function GridLines() {
  const gridSystem = useBattleStore((state) => state.gridSystem);
  const lines = useMemo(() => {
    const points: THREE.Vector3[] = [];

    for (let q = 0; q < GRID_SIZE; q++) {
      for (let r = 0; r < GRID_SIZE; r++) {
        const pos = gridSystem.axialToPixel({ q, r }, HEX_SIZE);
        for (let i = 0; i < 6; i++) {
          const angle1 = (Math.PI / 3) * i - Math.PI / 6;
          const angle2 = (Math.PI / 3) * (i + 1) - Math.PI / 6;
          const x1 = pos.x + HEX_SIZE * 0.95 * Math.cos(angle1);
          const y1 = pos.y + HEX_SIZE * 0.95 * Math.sin(angle1);
          const x2 = pos.x + HEX_SIZE * 0.95 * Math.cos(angle2);
          const y2 = pos.y + HEX_SIZE * 0.95 * Math.sin(angle2);
          points.push(new THREE.Vector3(x1, y1, 0.01));
          points.push(new THREE.Vector3(x2, y2, 0.01));
        }
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [gridSystem]);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
    </lineSegments>
  );
}

function TerrainEffects() {
  const gridSystem = useBattleStore((state) => state.gridSystem);
  const allCells = useMemo(() => gridSystem.getAllCells(), [gridSystem]);

  return (
    <>
      {allCells.map((cell) => {
        const terrain = gridSystem.getTerrain(cell);
        const pos = gridSystem.axialToPixel(cell, HEX_SIZE);

        if (terrain === 'rock') {
          return (
            <group key={`rock-${cell.q}-${cell.r}`} position={[pos.x, pos.y, 0.15]}>
              {[...Array(3)].map((_, i) => (
                <mesh
                  key={i}
                  position={[
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 0.1,
                  ]}
                  rotation={[Math.random() * 0.5, Math.random() * 0.5, Math.random() * Math.PI]}
                >
                  <dodecahedronGeometry args={[0.08 + Math.random() * 0.05, 0]} />
                  <meshStandardMaterial color="#7a7a8a" roughness={0.9} />
                </mesh>
              ))}
            </group>
          );
        }

        if (terrain === 'swamp') {
          return (
            <SwampRipple key={`swamp-${cell.q}-${cell.r}`} position={pos} />
          );
        }

        return null;
      })}
    </>
  );
}

function SwampRipple({ position }: { position: { x: number; y: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 0.3 + 0.1 * Math.sin(state.clock.elapsedTime * 2 + phase);
      meshRef.current.scale.set(scale, scale, 1);
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + 0.2 * Math.sin(state.clock.elapsedTime * 2 + phase);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, 0.12]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.2, 0.3, 32]} />
      <meshBasicMaterial color="#4a9a6a" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Scene() {
  const units = useBattleStore((state) => state.units);
  const gridSystem = useBattleStore((state) => state.gridSystem);
  const selectedUnitId = useBattleStore((state) => state.selectedUnitId);
  const movableCells = useBattleStore((state) => state.movableCells);
  const attackablePositions = useBattleStore((state) => state.attackablePositions);
  const turn = useBattleStore((state) => state.turn);
  const setSelectedUnit = useBattleStore((state) => state.setSelectedUnit);
  const moveUnit = useBattleStore((state) => state.moveUnit);
  const attackUnit = useBattleStore((state) => state.attackUnit);
  const setContextMenu = useBattleStore((state) => state.setContextMenu);
  const placeMode = useBattleStore((state) => state.placeMode);
  const addUnit = useBattleStore((state) => state.addUnit);
  const isAnimating = useBattleStore((state) => state.isAnimating);

  const allCells = useMemo(() => gridSystem.getAllCells(), [gridSystem]);

  const movableSet = useMemo(() => {
    const set = new Set<string>();
    movableCells.forEach((c) => set.add(`${c.q},${c.r}`));
    return set;
  }, [movableCells]);

  const attackableSet = useMemo(() => {
    const set = new Set<string>();
    attackablePositions.forEach((p) => set.add(`${p.q},${p.r}`));
    return set;
  }, [attackablePositions]);

  const handleCellClick = useCallback((position: GridPosition) => {
    if (isAnimating) return;

    const posKey = `${position.q},${position.r}`;

    if (placeMode) {
      const occupied = units.some(
        (u) => u.currentHp > 0 && u.position.q === position.q && u.position.r === position.r
      );
      if (!occupied && units.filter((u) => u.currentHp > 0).length < 10) {
        addUnit(placeMode, position, true);
      }
      return;
    }

    if (selectedUnitId && movableSet.has(posKey)) {
      moveUnit(selectedUnitId, position);
      return;
    }

    if (selectedUnitId && attackableSet.has(posKey)) {
      const target = units.find(
        (u) => u.currentHp > 0 && u.position.q === position.q && u.position.r === position.r
      );
      if (target) {
        attackUnit(selectedUnitId, target.id);
      }
      return;
    }

    setSelectedUnit(null);
  }, [isAnimating, placeMode, units, selectedUnitId, movableSet, attackableSet, addUnit, moveUnit, attackUnit, setSelectedUnit]);

  const handleUnitClick = useCallback((unit: Unit) => {
    if (isAnimating) return;

    if (turn.phase === 'selecting') {
      const currentUnitId = turn.turnOrder[turn.currentUnitIndex];
      if (unit.id === currentUnitId) {
        const selectCurrentUnit = useBattleStore.getState().selectCurrentUnit;
        selectCurrentUnit();
        return;
      }
    }

    if (turn.phase === 'attacking' && attackableSet.has(`${unit.position.q},${unit.position.r}`)) {
      attackUnit(selectedUnitId!, unit.id);
      return;
    }

    setSelectedUnit(unit.id);
  }, [isAnimating, turn, attackableSet, attackUnit, selectedUnitId, setSelectedUnit]);

  const handleContextMenu = useCallback((position: GridPosition, clientX: number, clientY: number) => {
    setContextMenu({
      x: clientX,
      y: clientY,
      position,
    });
  }, [setContextMenu]);

  const currentUnitId = turn.phase !== 'idle' ? turn.turnOrder[turn.currentUnitIndex] : null;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, 5]} intensity={0.3} />

      {allCells.map((cell) => {
        const posKey = `${cell.q},${cell.r}`;
        return (
          <HexTile
            key={posKey}
            position={cell}
            terrain={gridSystem.getTerrain(cell)}
            isMovable={movableSet.has(posKey)}
            isAttackable={attackableSet.has(posKey)}
            isSelected={
              selectedUnitId !== null &&
              units.find((u) => u.id === selectedUnitId)?.position.q === cell.q &&
              units.find((u) => u.id === selectedUnitId)?.position.r === cell.r
            }
            onClick={() => handleCellClick(cell)}
            onContextMenu={(clientX, clientY) => handleContextMenu(cell, clientX, clientY)}
          />
        );
      })}

      <GridLines />
      <TerrainEffects />

      {units.map((unit) => (
        <UnitMesh
          key={unit.id}
          unit={unit}
          isCurrentTurn={unit.id === currentUnitId && unit.currentHp > 0}
          isSelected={unit.id === selectedUnitId}
          onClick={() => handleUnitClick(unit)}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
      />
    </>
  );
}

export default function BattleField() {
  const setContextMenu = useBattleStore((state) => state.setContextMenu);

  return (
    <div
      className="battlefield-container"
      style={{ width: '100%', height: '100%' }}
      onClick={() => setContextMenu(null)}
    >
      <Canvas
        camera={{ position: [0, -10, 12], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true }}
        onPointerMissed={() => setContextMenu(null)}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
