import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

import {
  Vector2,
  TowerData,
  MonsterData,
  BeamSegment,
  Particle,
  TowerType,
  LevelData,
  GameState,
} from './types';
import { TowerManager } from './TowerManager';
import { MonsterManager } from './MonsterManager';
import { eventBus } from './EventBus';
import { checkBeamCircleCollision } from './LightPhysics';

interface GameSceneProps {
  levelData: LevelData | null;
  gameState: GameState;
  speedMultiplier: number;
  onEnergyChange: (energy: number) => void;
  onWaveComplete: (wave: number) => void;
  onMonsterKilled: () => void;
  onGameOver: () => void;
  onVictory: () => void;
  selectedTowerSlot: string | null;
  onTowerSlotClick: (slotId: string | null) => void;
  playerEnergy: number;
  currentWave: number;
}

const TOWER_COSTS: Record<TowerType, number> = {
  red: 50,
  blue: 60,
  yellow: 70,
};

interface GameSceneContentProps extends GameSceneProps {
  towerManager: TowerManager;
  monsterManager: MonsterManager;
}

const GameSceneContent: React.FC<GameSceneContentProps> = ({
  levelData,
  gameState,
  speedMultiplier,
  onEnergyChange,
  onWaveComplete,
  onMonsterKilled,
  onGameOver,
  onVictory,
  selectedTowerSlot,
  onTowerSlotClick,
  playerEnergy,
  currentWave,
  towerManager,
  monsterManager,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [towers, setTowers] = useState<TowerData[]>([]);
  const [monsters, setMonsters] = useState<MonsterData[]>([]);
  const [beamSegments, setBeamSegments] = useState<BeamSegment[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [towerSlots, setTowerSlots] = useState<{ id: string; x: number; y: number; type: string }[]>([]);
  const [baseHealth, setBaseHealth] = useState(100);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [showVictoryParticles, setShowVictoryParticles] = useState<Particle[]>([]);
  const waveStartedRef = useRef(false);
  const towerSlotsRef = useRef<{ id: string; x: number; y: number; type: string }[]>([]);
  const playerEnergyRef = useRef(playerEnergy);

  useEffect(() => {
    playerEnergyRef.current = playerEnergy;
  }, [playerEnergy]);

  useEffect(() => {
    if (levelData) {
      const slots = levelData.towerPositions.map((pos) => ({
        id: pos.id,
        x: pos.x,
        y: pos.y,
        type: pos.type,
      }));
      setTowerSlots(slots);
      towerSlotsRef.current = slots;

      monsterManager.setPath(levelData.pathPoints);
      monsterManager.setWaves(levelData.waves);

      const mirrorSlots = slots.filter((s) => s.type === 'mirror');
      mirrorSlots.forEach((slot) => {
        towerManager.addMirror(slot.id, { x: slot.x, y: slot.y }, Math.PI / 4);
      });
    }
  }, [levelData, towerManager, monsterManager]);

  useEffect(() => {
    const unsub0 = eventBus.on('tower:place', ({ positionId, type }) => {
      const slot = towerSlotsRef.current.find((s) => s.id === positionId);
      if (!slot || slot.type !== 'tower') return;

      const cost = TOWER_COSTS[type];
      if (playerEnergyRef.current < cost) return;

      towerManager.addTower(positionId, type, {
        x: slot.x,
        y: slot.y,
      });
      setTowers(towerManager.getTowers());
      playerEnergyRef.current -= cost;
      onEnergyChange(playerEnergyRef.current);
    });

    const unsub1 = eventBus.on('monster:killed', ({ monster }) => {
      onMonsterKilled();
      const reward = monster.type === 'boss' ? 100 : monster.type === 'tank' ? 25 : monster.type === 'shield' ? 20 : monster.type === 'fast' ? 15 : 10;
      playerEnergyRef.current += reward;
      onEnergyChange(playerEnergyRef.current);
    });

    const unsub2 = eventBus.on('monster:reachedEnd', () => {
      setBaseHealth((prev) => {
        const newHealth = prev - 10;
        if (newHealth <= 0) {
          onGameOver();
        }
        return Math.max(0, newHealth);
      });
    });

    const unsub3 = eventBus.on('wave:complete', ({ waveNumber }) => {
      onWaveComplete(waveNumber);
    });

    const unsub4 = eventBus.on('particle:explosion', ({ position, color, count = 20 }) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        newParticles.push({
          id: uuidv4(),
          position: { ...position },
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
          color,
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.5,
          size: 0.1 + Math.random() * 0.1,
        });
      }
      setParticles((prev) => [...prev, ...newParticles]);
    });

    const unsub5 = eventBus.on('boss:appear', () => {
      setShowBossWarning(true);
      setTimeout(() => setShowBossWarning(false), 3000);
    });

    const unsub6 = eventBus.on('boss:killed', () => {
      const victoryParticles: Particle[] = [];
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 5;
        victoryParticles.push({
          id: uuidv4(),
          position: { x: 0, y: 0 },
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
          color: '#ffd700',
          life: 2,
          maxLife: 2,
          size: 0.15 + Math.random() * 0.15,
        });
      }
      setShowVictoryParticles(victoryParticles);
      setTimeout(() => setShowVictoryParticles([]), 2000);
    });

    return () => {
      unsub0();
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [onWaveComplete, onMonsterKilled, onGameOver, onEnergyChange, playerEnergy, towerManager]);

  useEffect(() => {
    if (gameState === 'playing' && currentWave > 0 && !waveStartedRef.current) {
      waveStartedRef.current = true;
      monsterManager.startWave(currentWave);
    }
    if (gameState !== 'playing') {
      waveStartedRef.current = false;
    }
  }, [gameState, currentWave, monsterManager]);

  const handleSlotClick = useCallback(
    (slotId: string) => {
      const slot = towerSlots.find((s) => s.id === slotId);
      if (!slot) return;

      if (slot.type === 'tower') {
        const existingTower = towers.find((t) => t.positionId === slotId);
        if (existingTower) return;

        if (selectedTowerSlot === slotId) {
          onTowerSlotClick(null);
        } else {
          onTowerSlotClick(slotId);
        }
      } else if (slot.type === 'mirror') {
        towerManager.rotateMirror(slotId, Math.PI / 8);
      }
    },
    [towerSlots, towers, selectedTowerSlot, onTowerSlotClick, towerManager]
  );

  const placeTower = useCallback(
    (type: TowerType) => {
      if (!selectedTowerSlot) return;
      if (playerEnergy < TOWER_COSTS[type]) return;

      const slot = towerSlots.find((s) => s.id === selectedTowerSlot);
      if (!slot || slot.type !== 'tower') return;

      towerManager.addTower(selectedTowerSlot, type, {
        x: slot.x,
        y: slot.y,
      });
      setTowers(towerManager.getTowers());
      onEnergyChange(playerEnergy - TOWER_COSTS[type]);
      onTowerSlotClick(null);
    },
    [selectedTowerSlot, playerEnergy, towerSlots, towerManager, onEnergyChange, onTowerSlotClick]
  );

  useEffect(() => {
    if (selectedTowerSlot) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '1') placeTower('red');
        if (e.key === '2') placeTower('blue');
        if (e.key === '3') placeTower('yellow');
        if (e.key === 'Escape') onTowerSlotClick(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedTowerSlot, placeTower, onTowerSlotClick]);

  const checkCollisions = useCallback(
    (segments: BeamSegment[]) => {
      const currentMonsters = monsterManager.getMonsters();

      for (const segment of segments) {
        for (const monster of currentMonsters) {
          const result = checkBeamCircleCollision(
            segment.start,
            segment.end,
            monster.position,
            monster.scale * 0.8
          );

          if (result.hit) {
            const damage = segment.intensity * 20;

            if (segment.type !== 'yellow') {
              monsterManager.damageMonster(
                monster.id,
                damage * 0.016,
                segment.type,
                segment.intensity > 1.2
              );
            }
          }
        }
      }
    },
    [monsterManager]
  );

  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    const dt = Math.min(delta, 0.1);
    const speed = speedMultiplier;

    monsterManager.update(dt, speed);
    const currentMonsters = monsterManager.getMonsters();
    setMonsters(currentMonsters);

    const towerList = towerManager.getTowers();
    for (const tower of towerList) {
      if (tower.type === 'yellow') continue;

      let closestMonster: MonsterData | null = null;
      let closestDist = Infinity;

      for (const monster of currentMonsters) {
        const dx = monster.position.x - tower.position.x;
        const dy = monster.position.y - tower.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist && dist < 15) {
          closestDist = dist;
          closestMonster = monster;
        }
      }

      if (closestMonster) {
        const targetAngle = Math.atan2(
          closestMonster.position.y - tower.position.y,
          closestMonster.position.x - tower.position.x
        );
        towerManager.setTowerRotation(tower.id, targetAngle);
      }
    }

    towerManager.update(dt);
    const segments = towerManager.getBeamSegments();
    setBeamSegments(segments);

    checkCollisions(segments);

    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          position: {
            x: p.position.x + p.velocity.x * dt,
            y: p.position.y + p.velocity.y * dt,
          },
          velocity: {
            x: p.velocity.x * 0.95,
            y: p.velocity.y * 0.95,
          },
          life: p.life - dt,
        }))
        .filter((p) => p.life > 0)
    );

    setShowVictoryParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          position: {
            x: p.position.x + p.velocity.x * dt,
            y: p.position.y + p.velocity.y * dt,
          },
          velocity: {
            x: p.velocity.x * 0.98,
            y: p.velocity.y * 0.98 + 2 * dt,
          },
          life: p.life - dt,
        }))
        .filter((p) => p.life > 0)
    );
  });

  const pathGeometry = useMemo(() => {
    if (!levelData) return null;
    const points = levelData.pathPoints.map(
      (p) => new THREE.Vector3(p.x, 0, p.y)
    );
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [levelData]);

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 15]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {pathGeometry && (
        <line geometry={pathGeometry}>
          <lineBasicMaterial color="#00e676" linewidth={2} transparent opacity={0.6} />
        </line>
      )}

      {levelData && (
        <mesh
          position={[levelData.pathPoints[levelData.pathPoints.length - 1].x, 0.8, 0]}
          rotation={[0, Date.now() / 2000, 0]}
        >
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color="#00e676"
            emissive="#00e676"
            emissiveIntensity={0.5 + Math.sin(Date.now() / 750) * 0.3}
          />
        </mesh>
      )}

      {towerSlots.map((slot) => {
        const hasTower = towers.some((t) => t.positionId === slot.id);
        const isSelected = selectedTowerSlot === slot.id;

        return (
          <mesh
            key={slot.id}
            position={[slot.x, 0, slot.y]}
            onClick={(e) => {
              e.stopPropagation();
              handleSlotClick(slot.id);
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            <cylinderGeometry args={[slot.type === 'tower' ? 0.6 : 0.5, slot.type === 'tower' ? 0.6 : 0.5, 0.2, 16]} />
            <meshStandardMaterial
              color={slot.type === 'tower' ? (hasTower ? '#444' : isSelected ? '#666' : '#333') : '#555'}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}

      {towers.map((tower) => (
        <TowerMesh key={tower.id} tower={tower} />
      ))}

      {towerManager.getMirrors().map((mirror) => (
        <MirrorMesh
          key={mirror.id}
          position={mirror.position}
          rotation={mirror.rotation}
        />
      ))}

      {beamSegments.map((segment, index) => (
        <BeamLine
          key={`beam-${index}`}
          start={segment.start}
          end={segment.end}
          color={segment.color}
          intensity={segment.intensity}
        />
      ))}

      {monsters.map((monster) => (
        <MonsterMesh key={monster.id} monster={monster} />
      ))}

      {particles.map((particle) => (
        <mesh
          key={particle.id}
          position={[particle.position.x, particle.position.y, 0]}
        >
          <sphereGeometry args={[particle.size * (particle.life / particle.maxLife), 8, 8]} />
          <meshBasicMaterial color={particle.color} transparent opacity={particle.life / particle.maxLife} />
        </mesh>
      ))}

      {showVictoryParticles.map((particle) => (
        <mesh
          key={particle.id}
          position={[particle.position.x, particle.position.y + 2, 0]}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshBasicMaterial
            color={particle.color}
            transparent
            opacity={particle.life / particle.maxLife}
          />
        </mesh>
      ))}

      {showBossWarning && (
        <mesh position={[0, 5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[8, 10, 32]} />
          <meshBasicMaterial color="#d32f2f" transparent opacity={0.3 + Math.sin(Date.now() / 200) * 0.2} side={THREE.DoubleSide} />
        </mesh>
      )}

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#42a5f5" />
    </group>
  );
};

const TowerMesh: React.FC<{ tower: TowerData }> = ({ tower }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    setScale(0.8);
    const timer = setTimeout(() => setScale(1), 50);
    return () => clearTimeout(timer);
  }, [tower.id]);

  const color = tower.type === 'red' ? '#ff4444' : tower.type === 'blue' ? '#4488ff' : '#ffdd44';

  return (
    <group ref={meshRef} position={[tower.position.x, 0, tower.position.y]} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 1, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.8, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3 + Math.sin(Date.now() / 500) * 0.2} />
      </mesh>

      <mesh position={[0, 1.6, 0]} rotation={[0, tower.rotation, 0]} castShadow>
        <coneGeometry args={[0.25, 0.4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

const MirrorMesh: React.FC<{ position: Vector2; rotation: number }> = ({ position, rotation }) => {
  return (
    <group position={[position.x, 0.3, position.y]} rotation={[0, -rotation, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.5, 0.6, 0.1]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 0.3, 0.06]}>
        <boxGeometry args={[1.4, 0.5, 0.02]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.2} />
      </mesh>

      <mesh position={[0.7, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  );
};

const BeamLine: React.FC<{ start: Vector2; end: Vector2; color: string; intensity: number }> = ({
  start,
  end,
  color,
  intensity,
}) => {
  const points = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(start.x, 0.5, start.y),
      new THREE.Vector3(end.x, 0.5, end.y),
    ]);
    return geometry;
  }, [start.x, start.y, end.x, end.y]);

  return (
    <line geometry={points}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={Math.min(1, intensity)}
        linewidth={2}
      />
    </line>
  );
};

const MonsterMesh: React.FC<{ monster: MonsterData }> = ({ monster }) => {
  const color = useMemo(() => {
    switch (monster.type) {
      case 'normal':
        return '#ff6b6b';
      case 'fast':
        return '#ffd93d';
      case 'tank':
        return '#6c5ce7';
      case 'shield':
        return '#00cec9';
      case 'boss':
        return '#d32f2f';
      default:
        return '#ff6b6b';
    }
  }, [monster.type]);

  const healthPercent = monster.health / monster.maxHealth;
  const shieldPercent = monster.maxShield > 0 ? monster.shield / monster.maxShield : 0;

  return (
    <group position={[monster.position.x, monster.scale * 0.5, monster.position.y]}>
      <mesh castShadow>
        <sphereGeometry args={[monster.scale * 0.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={monster.isSlowed ? 0.5 : 0.2}
        />
      </mesh>

      {monster.type === 'boss' && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[monster.scale * 0.7, 16, 16]} />
          <meshBasicMaterial color="#d32f2f" transparent opacity={0.2} />
        </mesh>
      )}

      {shieldPercent > 0 && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[monster.scale * 0.65, 16, 16]} />
          <meshBasicMaterial color="#00cec9" transparent opacity={0.3 * shieldPercent} />
        </mesh>
      )}

      <mesh position={[0, monster.scale * 0.8, 0]}>
        <planeGeometry args={[monster.scale, 0.1]} />
        <meshBasicMaterial color="#333" />
      </mesh>

      <mesh position={[-(1 - healthPercent) * monster.scale * 0.5, monster.scale * 0.8, 0.01]} scale={[healthPercent, 1, 1]}>
        <planeGeometry args={[monster.scale, 0.08]} />
        <meshBasicMaterial color={healthPercent > 0.5 ? '#4caf50' : healthPercent > 0.25 ? '#ff9800' : '#f44336'} />
      </mesh>
    </group>
  );
};

export const GameScene: React.FC<GameSceneProps> = (props) => {
  const towerManager = useMemo(() => new TowerManager(), []);
  const monsterManager = useMemo(() => new MonsterManager(), []);

  return (
    <Canvas
      camera={{ position: [0, 18, 16], fov: 45 }}
      shadows
      gl={{ antialias: true }}
      style={{ background: '#1a1a2e' }}
      onClick={() => props.onTowerSlotClick(null)}
    >
      <fog attach="fog" args={['#1a1a2e', 20, 50]} />
      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={30}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
      />
      <GameSceneContent {...props} towerManager={towerManager} monsterManager={monsterManager} />
    </Canvas>
  );
};

export default GameScene;
