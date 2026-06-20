import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import type { BattleDragon } from '../../shared/types';
import { dataService } from '../editor/DataService';
import './BattleUnit.css';

interface BattleUnitProps {
  dragon: BattleDragon;
  isActing?: boolean;
  isTarget?: boolean;
  showHpBar?: boolean;
  size?: number;
}

function PixelDragonModel({
  color,
  element,
  isActing,
  isTarget,
  isAlive,
}: {
  color: string;
  element: string;
  isActing: boolean;
  isTarget: boolean;
  isAlive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;

    if (isActing) {
      groupRef.current.position.y = Math.sin(time * 8) * 0.2 + 0.3;
      groupRef.current.scale.setScalar(1 + Math.sin(time * 6) * 0.1);
    } else {
      groupRef.current.position.y = Math.sin(time * 2) * 0.03;
      groupRef.current.scale.setScalar(1);
    }

    if (isAlive && headRef.current) {
      headRef.current.rotation.x = Math.sin(time * 1.5) * 0.05;
    }
  });

  const eyeColor = useRef(
    element === 'fire'
      ? '#ffdd00'
      : element === 'water'
      ? '#00ffff'
      : element === 'wind'
      ? '#aaffaa'
      : element === 'earth'
      ? '#ffaa00'
      : '#ffffff'
  );

  const secondaryColor = useRef(
    element === 'fire'
      ? '#ff4400'
      : element === 'water'
      ? '#0088ff'
      : element === 'wind'
      ? '#00aa44'
      : element === 'earth'
      ? '#885500'
      : '#ffee88'
  );

  const opacity = isAlive ? 1 : 0.3;

  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.5}
          transparent
          opacity={opacity}
        />
      </mesh>

      <mesh ref={headRef} position={[0, 0.15, 0.25]}>
        <boxGeometry args={[0.38, 0.32, 0.32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.5}
          transparent
          opacity={opacity}
        />
      </mesh>

      <mesh position={[-0.1, 0.18, 0.4]}>
        <boxGeometry args={[0.07, 0.07, 0.04]} />
        <meshStandardMaterial
          color={eyeColor.current}
          emissive={eyeColor.current}
          emissiveIntensity={isAlive ? 0.5 : 0.1}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.1, 0.18, 0.4]}>
        <boxGeometry args={[0.07, 0.07, 0.04]} />
        <meshStandardMaterial
          color={eyeColor.current}
          emissive={eyeColor.current}
          emissiveIntensity={isAlive ? 0.5 : 0.1}
          transparent
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 0.35, 0.12]}>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshStandardMaterial
          color={secondaryColor.current}
          metalness={0.4}
          roughness={0.4}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[-0.12, 0.3, 0.08]}>
        <boxGeometry args={[0.06, 0.14, 0.06]} />
        <meshStandardMaterial
          color={secondaryColor.current}
          metalness={0.4}
          roughness={0.4}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.12, 0.3, 0.08]}>
        <boxGeometry args={[0.06, 0.14, 0.06]} />
        <meshStandardMaterial
          color={secondaryColor.current}
          metalness={0.4}
          roughness={0.4}
          transparent
          opacity={opacity}
        />
      </mesh>

      <mesh position={[-0.28, 0, 0]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.25, 0.04, 0.2]} />
        <meshStandardMaterial
          color={secondaryColor.current}
          metalness={0.3}
          roughness={0.5}
          side={THREE.DoubleSide}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.28, 0, 0]} rotation={[0, 0, -0.25]}>
        <boxGeometry args={[0.25, 0.04, 0.2]} />
        <meshStandardMaterial
          color={secondaryColor.current}
          metalness={0.3}
          roughness={0.5}
          side={THREE.DoubleSide}
          transparent
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, -0.35, -0.25]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.25]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.5}
          transparent
          opacity={opacity}
        />
      </mesh>

      <mesh position={[-0.16, -0.4, 0]}>
        <boxGeometry args={[0.1, 0.12, 0.1]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.5}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.16, -0.4, 0]}>
        <boxGeometry args={[0.1, 0.12, 0.1]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.5}
          transparent
          opacity={opacity}
        />
      </mesh>

      {isActing && (
        <pointLight color={color} intensity={2} distance={3} />
      )}

      {isTarget && (
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function UnitScene({
  color,
  element,
  isActing,
  isTarget,
  isAlive,
}: {
  color: string;
  element: string;
  isActing: boolean;
  isTarget: boolean;
  isAlive: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 3]} intensity={0.8} />
      <PixelDragonModel
        color={color}
        element={element}
        isActing={isActing}
        isTarget={isTarget}
        isAlive={isAlive}
      />
    </>
  );
}

export default function BattleUnit({
  dragon,
  isActing = false,
  isTarget = false,
  showHpBar = true,
  size = 80,
}: BattleUnitProps) {
  const elementColors = dataService.getElementColors(dragon.element);
  const hpPercent = (dragon.currentHp / dragon.maxHp) * 100;

  return (
    <div
      className={`battle-unit ${dragon.side} ${isActing ? 'acting' : ''} ${isTarget ? 'target' : ''} ${!dragon.isAlive ? 'dead' : ''}`}
      style={{
        width: size,
        height: size + 20,
        '--element-glow': elementColors.glow,
      } as React.CSSProperties}
    >
      <div className="unit-avatar">
        <div
          className="unit-halo"
          style={{
            background: `radial-gradient(circle, ${elementColors.glow} 0%, transparent 70%)`,
          }}
        />
        <Canvas
          camera={{ position: [0, 0.2, 2], fov: 50 }}
          style={{ background: 'transparent' }}
        >
          <UnitScene
            color={dragon.avatarColor}
            element={dragon.element}
            isActing={isActing}
            isTarget={isTarget}
            isAlive={dragon.isAlive}
          />
        </Canvas>
      </div>

      {showHpBar && (
        <div className="unit-hp-bar">
          <div
            className="hp-fill"
            style={{
              width: `${hpPercent}%`,
              background: hpPercent > 50
                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                : hpPercent > 25
                ? 'linear-gradient(90deg, #eab308, #facc15)'
                : 'linear-gradient(90deg, #ef4444, #f87171)',
            }}
          />
          <span className="hp-text">
            {dragon.currentHp}/{dragon.maxHp}
          </span>
        </div>
      )}

      <div className="unit-name">{dragon.name}</div>

      {dragon.statusEffects.length > 0 && (
        <div className="status-effects">
          {dragon.statusEffects.map((effect, i) => (
            <span key={i} className={`status-effect ${effect.type}`} title={effect.type}>
              {effect.duration}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
