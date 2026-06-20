import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import { useIncubationStore } from '../store/incubationStore';
import { useEvolution } from '../hooks/useEvolution';
import Starfield from './ThreeScene/Starfield';
import EggModel from './ThreeScene/EggModel';
import CreatureModel from './ThreeScene/CreatureModel';
import ParticleSystem from './ThreeScene/ParticleSystem';
import LightBeam from './ThreeScene/LightBeam';
import { EGG_CONFIGS } from '../utils/constants';

const CreatureEvolution: React.FC = () => {
  const selectedEgg = useIncubationStore((state) => state.selectedEgg);
  const evolutionStage = useIncubationStore((state) => state.evolutionStage);
  const incubationProgress = useIncubationStore((state) => state.incubationProgress);
  const isIncubating = useIncubationStore((state) => state.isIncubating);
  const isEvolving = useIncubationStore((state) => state.isEvolving);

  const evolutionAnimation = useEvolution();

  const element = useMemo(() => {
    if (!selectedEgg) return 'fire';
    return EGG_CONFIGS[selectedEgg]?.element || 'fire';
  }, [selectedEgg]);

  const lightColor = useMemo(() => {
    if (!selectedEgg) return '#8b5cf6';
    return EGG_CONFIGS[selectedEgg]?.glowColor || '#8b5cf6';
  }, [selectedEgg]);

  const showEgg = evolutionStage === 'egg' && selectedEgg;
  const showCreature = evolutionStage !== 'egg' && selectedEgg;
  const showBurstParticles = incubationProgress >= 100 && evolutionStage === 'baby';

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0d0d1a']} />

        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-3, 2, 3]} intensity={0.5} color={lightColor} />
        <pointLight position={[3, -2, -3]} intensity={0.3} color={lightColor} />

        <Starfield />

        <ParticleSystem
          active={true}
          intensity={1}
          element={element}
          type="ambient"
        />

        {showEgg && (
          <>
            <EggModel
              eggType={selectedEgg}
              progress={incubationProgress}
              isIncubating={isIncubating}
            />
            {showBurstParticles && (
              <ParticleSystem
                active={true}
                intensity={1.5}
                element={element}
                type="burst"
              />
            )}
          </>
        )}

        {showCreature && (
          <>
            <CreatureModel
              creatureType={selectedEgg}
              stage={evolutionStage}
              evolutionAnimation={evolutionAnimation}
            />

            {isEvolving && (
              <>
                <ParticleSystem
                  active={evolutionAnimation.particleIntensity > 0}
                  intensity={evolutionAnimation.particleIntensity}
                  element={element}
                  type="vortex"
                />
                <ParticleSystem
                  active={evolutionAnimation.particleIntensity > 0}
                  intensity={evolutionAnimation.particleIntensity * 0.5}
                  element={element}
                  type="burst"
                />
              </>
            )}

            <LightBeam active={evolutionAnimation.showLightBeam} />
          </>
        )}

        {!selectedEgg && (
          <mesh position={[0, 0, 0]}>
            <torusKnotGeometry args={[0.5, 0.15, 100, 16]} />
            <meshStandardMaterial
              color="#6c63ff"
              metalness={0.5}
              roughness={0.3}
              emissive="#6c63ff"
              emissiveIntensity={0.2}
            />
          </mesh>
        )}

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={6}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 3 / 4}
          autoRotate={!isEvolving}
          autoRotateSpeed={0.5}
        />

        <Environment preset="night" />

        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <SSAO
            intensity={0.5}
            radius={0.5}
            luminanceInfluence={0.5}
            worldDistanceThreshold={100}
            worldDistanceFalloff={0}
            worldProximityThreshold={0}
            worldProximityFalloff={0}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default CreatureEvolution;
