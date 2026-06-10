import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Player as PlayerType } from '../store/useGameStore';
import { COLORS, PLAYER_RADIUS, createDustParticle, DustParticle, updateDustParticles } from '../gameLogic';
import { Text } from '@react-three/drei';

interface PlayerProps {
  player: PlayerType;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onDragStart: (id: number, position: { x: number; z: number }) => void;
  onDragMove: (id: number, position: { x: number; z: number }) => void;
  onDragEnd: () => void;
  onClickEmpty: (position: { x: number; z: number }) => void;
}

export default function Player({
  player,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClickEmpty,
}: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; z: number } | null>(null);
  const [dustParticles, setDustParticles] = useState<DustParticle[]>([]);
  const lastVelocity = useRef({ x: 0, z: 0 });

  const vestColor =
    player.team === 'player'
      ? COLORS.playerVest
      : player.team === 'ai'
      ? COLORS.aiVest
      : COLORS.goalkeeper;

  const isMoving = Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.z) > 0.1;

  useEffect(() => {
    if (isMoving && player.position.y < 0.1) {
      const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2);
      if (speed > 1 && Math.random() < 0.3) {
        const direction = {
          x: -player.velocity.x / speed,
          z: -player.velocity.z / speed,
        };
        setDustParticles((prev) => [
          ...prev.slice(-20),
          createDustParticle(player.position, direction),
        ]);
      }
    }
    lastVelocity.current = player.velocity;
  }, [player.position.x, player.position.z, player.velocity.x, player.velocity.z, isMoving]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x = player.position.x;
      groupRef.current.position.z = player.position.z;
    }

    if (leftLegRef.current && rightLegRef.current) {
      const time = performance.now() * 0.01;
      if (isMoving) {
        const legSwing = Math.sin(time) * 0.4;
        if (player.isSliding) {
          leftLegRef.current.rotation.x = -0.8;
          rightLegRef.current.rotation.x = -0.8;
          leftLegRef.current.position.z = 0.3;
          rightLegRef.current.position.z = 0.3;
        } else {
          leftLegRef.current.rotation.x = legSwing;
          rightLegRef.current.rotation.x = -legSwing;
          leftLegRef.current.position.z = 0;
          rightLegRef.current.position.z = 0;
        }
      } else {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
        leftLegRef.current.position.z = 0;
        rightLegRef.current.position.z = 0;
      }
    }

    if (dustParticles.length > 0) {
      setDustParticles((prev) => updateDustParticles(prev, delta));
    }
  });

  const handlePointerDown = (e: { stopPropagation: () => void; point: { x: number; z: number } }) => {
    e.stopPropagation();
    if (player.team !== 'player') return;
    onSelect(player.id);
    const offset = {
      x: e.point.x - player.position.x,
      z: e.point.z - player.position.z,
    };
    setDragOffset(offset);
    onDragStart(player.id, player.position);
  };

  const handlePointerMove = (e: { point: { x: number; z: number } }) => {
    if (!dragOffset) return;
    const newPos = {
      x: e.point.x - dragOffset.x,
      z: e.point.z - dragOffset.z,
    };
    onDragMove(player.id, newPos);
  };

  const handlePointerUp = (e: { stopPropagation: () => void; point: { x: number; z: number } }) => {
    e.stopPropagation();
    setDragOffset(null);
    onDragEnd();
  };

  const handleGroupClick = (e: { stopPropagation: () => void; point: { x: number; z: number } }) => {
    e.stopPropagation();
    if (player.team !== 'player') return;
    onSelect(player.id);
  };

  return (
    <group ref={groupRef} position={[player.position.x, 0, player.position.z]}>
      {dustParticles.map((particle) => (
        <mesh
          key={particle.id}
          position={[particle.position.x, particle.position.y, particle.position.z]}
        >
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshBasicMaterial
            color="#8b7355"
            transparent
            opacity={particle.life * 0.5}
          />
        </mesh>
      ))}

      <group
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleGroupClick}
      >
        {isSelected && (
          <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[PLAYER_RADIUS, PLAYER_RADIUS + 0.2, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        )}

        <mesh ref={bodyRef} position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.8, 8]} />
          <meshStandardMaterial color={vestColor} />
        </mesh>

        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.05, 16]} />
          <meshStandardMaterial color={vestColor} />
        </mesh>

        <Text
          position={[0, 0.9, 0]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {player.number}
        </Text>

        <mesh position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#e8c4a0" />
        </mesh>

        <mesh ref={leftLegRef} position={[-0.12, 0.2, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>

        <mesh ref={rightLegRef} position={[0.12, 0.2, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>

        <mesh position={[-0.35, 0.7, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#e8c4a0" />
        </mesh>

        <mesh position={[0.35, 0.7, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#e8c4a0" />
        </mesh>

        <mesh position={[0, 1.6, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.05, 0.08]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        <mesh position={[0, 1.58, 0]}>
          <boxGeometry args={[0.6 * (player.energy / 100), 0.04, 0.05]} />
          <meshBasicMaterial color={player.energy > 10 ? COLORS.energyBar : COLORS.energyLow} />
        </mesh>
      </group>
    </group>
  );
}
