import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Crystal, LightBeam as LightBeamType, Particle, MazeConfig } from '@/types/game';
import { PlayerBall } from './PlayerBall';
import { EnergyCrystal, CollectPulse } from './EnergyCrystal';
import { LightBeam } from './LightBeam';
import { Particles, createExplosionParticles, createCollectParticles } from './Particles';
import { getMazeConfig, generateCrystals, generateLightBeams, generatePlatform } from '@/utils/mazeGenerator';
import { COLORS } from '@/utils/colors';
import { useAudio } from '@/hooks/useAudio';
import { useGameStore } from '@/store/useGameStore';

interface MazeContentProps {
  level: number;
  isPaused: boolean;
  isStunned: boolean;
  speedMultiplier: number;
  beamsDisabled: boolean;
  stunTimer: number;
  onCollectCrystal: () => void;
  onHitBeam: () => void;
  onStunEnd: () => void;
  onDisableBeams: () => void;
  onNextLevel: () => void;
}

const MazeContent = ({
  level,
  isPaused,
  isStunned,
  speedMultiplier,
  beamsDisabled,
  stunTimer,
  onCollectCrystal,
  onHitBeam,
  onStunEnd,
  onDisableBeams,
  onNextLevel,
}: MazeContentProps) => {
  const mazeGroupRef = useRef<THREE.Group>(null);
  const [mazeTime, setMazeTime] = useState(0);
  const [config, setConfig] = useState<MazeConfig>(() => getMazeConfig(level));
  const [crystals, setCrystals] = useState<Crystal[]>(() => generateCrystals(config));
  const [beams, setBeams] = useState<LightBeamType[]>(() => generateLightBeams(config));
  const [platforms, setPlatforms] = useState<[number, number, number][]>(() => generatePlatform(config));
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 2, 0]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [pulsePosition, setPulsePosition] = useState<[number, number, number]>([0, 0, 0]);
  const [showPulse, setShowPulse] = useState(false);

  const { playCollect, playHit, playLevelUp } = useAudio();

  const exitPosition: [number, number, number] = [
    config.size / 2 - 1,
    config.size / 2 - 1,
    config.size / 2 - 1,
  ];

  const totalCrystals = config.crystalCount;
  const collectedCount = crystals.filter((c) => c.collected).length;
  const allCollected = collectedCount >= totalCrystals;

  useEffect(() => {
    const newConfig = getMazeConfig(level);
    setConfig(newConfig);
    setCrystals(generateCrystals(newConfig));
    setBeams(generateLightBeams(newConfig));
    setPlatforms(generatePlatform(newConfig));
    setMazeTime(0);
    setParticles([]);
    setPlayerPosition([0, 2, 0]);
  }, [level]);

  useEffect(() => {
    if (allCollected && !beamsDisabled) {
      onDisableBeams();
    }
  }, [allCollected, beamsDisabled, onDisableBeams]);

  useEffect(() => {
    if (isStunned && stunTimer <= 0) {
      onStunEnd();
    }
  }, [isStunned, stunTimer, onStunEnd]);

  useFrame((_, delta) => {
    if (isPaused) return;

    const clampedDelta = Math.min(delta, 0.05);
    setMazeTime((prev) => prev + clampedDelta);

    if (mazeGroupRef.current) {
      mazeGroupRef.current.rotation.y += config.rotationSpeed * clampedDelta;
    }

    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          position: [
            p.position[0] + p.velocity[0] * clampedDelta,
            p.position[1] + p.velocity[1] * clampedDelta - 5 * clampedDelta,
            p.position[2] + p.velocity[2] * clampedDelta,
          ],
          velocity: [
            p.velocity[0] * 0.98,
            p.velocity[1] * 0.98,
            p.velocity[2] * 0.98,
          ],
          life: p.life - clampedDelta,
        }))
        .filter((p) => p.life > 0)
    );

    if (showPulse) {
      setTimeout(() => setShowPulse(false), 300);
    }
  });

  const handlePositionUpdate = useCallback((pos: [number, number, number]) => {
    setPlayerPosition(pos);
  }, []);

  const handleCollectCrystal = useCallback(
    (id: string, position: [number, number, number]) => {
      setCrystals((prev) => prev.map((c) => (c.id === id ? { ...c, collected: true } : c)));
      setParticles((prev) => [...prev, ...createCollectParticles(position)]);
      setPulsePosition(position);
      setShowPulse(true);
      playCollect();
      onCollectCrystal();
    },
    [playCollect, onCollectCrystal]
  );

  const handleHitBeam = useCallback(
    (position: [number, number, number]) => {
      setParticles((prev) => [...prev, ...createExplosionParticles(position, COLORS.beamFlashing, 25)]);
      playHit();
      onHitBeam();
    },
    [playHit, onHitBeam]
  );

  const handleReachExit = useCallback(() => {
    playLevelUp();
    onNextLevel();
  }, [playLevelUp, onNextLevel]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} color={COLORS.neonPurple} intensity={1} />
      <pointLight position={[-10, 5, -10]} color={COLORS.neonCyan} intensity={0.8} />
      <directionalLight position={[0, 15, 0]} intensity={0.3} />

      <Stars radius={100} depth={50} count={5000} factor={4} fade speed={0.5} />

      <Grid
        position={[0, -0.01, 0]}
        args={[config.size, config.size]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={COLORS.neonCyan}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={COLORS.neonPurple}
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid={false}
      />

      <group ref={mazeGroupRef}>
        <mesh position={[0, config.size / 4, 0]}>
          <boxGeometry args={[config.size + 0.2, 0.2, config.size + 0.2]} />
          <meshStandardMaterial
            color={COLORS.darkBg}
            emissive={COLORS.neonPurple}
            emissiveIntensity={0.1}
            transparent
            opacity={0.9}
          />
        </mesh>

        {platforms.map((pos, i) => (
          <mesh key={`platform-${i}`} position={pos}>
            <boxGeometry args={[2.5, 0.5, 2.5]} />
            <meshStandardMaterial
              color={COLORS.darkBg}
              emissive={COLORS.neonCyan}
              emissiveIntensity={0.15}
              metalness={0.5}
              roughness={0.5}
            />
          </mesh>
        ))}

        {crystals.map((crystal) => (
          <EnergyCrystal
            key={crystal.id}
            crystal={crystal}
            onCollect={handleCollectCrystal}
            playerPosition={playerPosition}
          />
        ))}

        {beams.map((beam) => (
          <LightBeam
            key={beam.id}
            beam={beam}
            playerPosition={playerPosition}
            onHit={handleHitBeam}
            disabled={beamsDisabled}
            mazeTime={mazeTime}
          />
        ))}

        {allCollected && (
          <group position={exitPosition}>
            <mesh rotation={[mazeTime, mazeTime * 0.7, 0]}>
              <torusGeometry args={[0.8, 0.15, 16, 32]} />
              <meshStandardMaterial
                color={COLORS.neonGreen}
                emissive={COLORS.neonGreen}
                emissiveIntensity={2}
              />
            </mesh>
            <pointLight color={COLORS.neonGreen} intensity={2} distance={8} />
          </group>
        )}

        <PlayerBall
          mazeSize={config.size}
          platforms={platforms}
          onPositionUpdate={handlePositionUpdate}
          speedMultiplier={speedMultiplier}
          isPaused={isPaused}
          isStunned={isStunned}
          exitPosition={exitPosition}
          allCollected={allCollected}
          onReachExit={handleReachExit}
        />

        <CollectPulse position={pulsePosition} active={showPulse} />
        <Particles particles={particles} />
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={config.size * 2}
        target={[0, config.size / 4, 0]}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        <Vignette offset={0.5} darkness={0.5} />
        <ChromaticAberration offset={isStunned ? [0.01, 0.01] : [0.002, 0.002]} />
      </EffectComposer>
    </>
  );
};

interface MazeSceneProps {
  onCollectCrystal: () => void;
  onHitBeam: () => void;
  onStunEnd: () => void;
  onDisableBeams: () => void;
  onNextLevel: () => void;
}

export const MazeScene = ({
  onCollectCrystal,
  onHitBeam,
  onStunEnd,
  onDisableBeams,
  onNextLevel,
}: MazeSceneProps) => {
  const { level, isPaused, isStunned, speedMultiplier, beamsDisabled, stunTimer } = useGameStore();

  return (
    <Canvas
      camera={{ position: [12, 10, 12], fov: 60 }}
      style={{ background: COLORS.darkBg }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <fog attach="fog" args={[COLORS.darkBg, 15, 50]} />
      <MazeContent
        level={level}
        isPaused={isPaused}
        isStunned={isStunned}
        speedMultiplier={speedMultiplier}
        beamsDisabled={beamsDisabled}
        stunTimer={stunTimer}
        onCollectCrystal={onCollectCrystal}
        onHitBeam={onHitBeam}
        onStunEnd={onStunEnd}
        onDisableBeams={onDisableBeams}
        onNextLevel={onNextLevel}
      />
    </Canvas>
  );
};
