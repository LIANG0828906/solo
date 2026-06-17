import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PetInstance, RARITY_COLORS, SHELF_ROWS, SHELF_COLS } from '@/data/petData';
import { getSlotPosition, RARITY_THREE_COLORS } from '@/renderer/shelfRenderer';
import { useUserStore } from '@/stores/userStore';

function PetModel({ pet, position }: { pet: PetInstance; position: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = RARITY_THREE_COLORS[pet.rarity] ?? 0xb0bec5;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 }), [color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const t = performance.now() / 1000;
    const scale = 0.95 + 0.1 * (0.5 + 0.5 * Math.sin(t * Math.PI));
    groupRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.55, 0]} material={mat} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
      </mesh>
      <mesh position={[0, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.6, 12]} />
      </mesh>
      <mesh position={[0, -0.1, -0.45]} rotation={[-0.5, 0, 0]} material={mat} castShadow>
        <coneGeometry args={[0.15, 0.5, 8]} />
      </mesh>
      <mesh position={[-0.12, 0.6, 0.28]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={0xffffff} emissive={0x444444} />
      </mesh>
      <mesh position={[0.12, 0.6, 0.28]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={0xffffff} emissive={0x444444} />
      </mesh>
      <mesh position={[-0.12, 0.6, 0.34]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={0x111111} />
      </mesh>
      <mesh position={[0.12, 0.6, 0.34]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={0x111111} />
      </mesh>
    </group>
  );
}

function EmptySlot({ position, onClick }: { position: THREE.Vector3; onClick: () => void }) {
  return (
    <mesh position={position} onClick={onClick}>
      <boxGeometry args={[1.8, 2.0, 0.05]} />
      <meshStandardMaterial color={0x1a1a2e} transparent opacity={0.3} />
    </mesh>
  );
}

function SlotClickArea({ position, pet, onClick }: { position: THREE.Vector3; pet: PetInstance | null; onClick: (pet: PetInstance | null) => void }) {
  const handleClick = useCallback(() => {
    onClick(pet);
  }, [pet, onClick]);

  return (
    <mesh position={position} onClick={handleClick}>
      <boxGeometry args={[1.8, 2.0, 0.1]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

export default function ShelfScene({ onSlotClick }: { onSlotClick: (pet: PetInstance | null) => void }) {
  const pets = useUserStore((s) => s.pets);
  const petMap = useMemo(() => {
    const map = new Map<number, PetInstance>();
    for (const p of pets) map.set(p.slotIndex, p);
    return map;
  }, [pets]);

  return (
    <group>
      <ambientLight intensity={0.4} color={0xffe0b2} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        color={0xffe0b2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 5, 3]} intensity={0.3} color={0x667eea} />
      <pointLight position={[3, 5, 3]} intensity={0.3} color={0xf093fb} />

      <ShelfMesh />

      {Array.from({ length: SHELF_ROWS * SHELF_COLS }, (_, i) => {
        const row = Math.floor(i / SHELF_COLS);
        const col = i % SHELF_COLS;
        const pos = getSlotPosition(row, col);
        const pet = petMap.get(i) ?? null;

        return (
          <group key={i}>
            {pet && <PetModel pet={pet} position={pos} />}
            <SlotClickArea position={pos} pet={pet} onClick={onSlotClick} />
          </group>
        );
      })}
    </group>
  );
}

function ShelfMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const { rows, cols, cellWidth, cellHeight, cellDepth, gap, shelfThickness } = useMemo(() => ({
    rows: 4, cols: 5, cellWidth: 2.2, cellHeight: 2.5, cellDepth: 2.0, gap: 0.15, shelfThickness: 0.12,
  }), []);

  const totalWidth = cols * cellWidth + (cols + 1) * gap;
  const totalHeight = rows * cellHeight + (rows + 1) * gap;

  return (
    <group ref={groupRef}>
      {Array.from({ length: rows + 1 }, (_, r) => {
        const y = r * (cellHeight + gap) - totalHeight / 2;
        return (
          <mesh key={`shelf_${r}`} position={[0, y, 0]} receiveShadow>
            <boxGeometry args={[totalWidth + gap, shelfThickness, cellDepth + gap]} />
            <meshStandardMaterial color={0x2a2a3e} roughness={0.7} metalness={0.3} />
          </mesh>
        );
      })}
      <mesh position={[-totalWidth / 2 - gap / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[gap, totalHeight + shelfThickness, cellDepth + gap]} />
        <meshStandardMaterial color={0x22223a} roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[totalWidth / 2 + gap / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[gap, totalHeight + shelfThickness, cellDepth + gap]} />
        <meshStandardMaterial color={0x22223a} roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, -(cellDepth + gap) / 2]} receiveShadow>
        <boxGeometry args={[totalWidth + gap * 2, totalHeight + shelfThickness, gap * 0.5]} />
        <meshStandardMaterial color={0x1a1a2e} roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}
