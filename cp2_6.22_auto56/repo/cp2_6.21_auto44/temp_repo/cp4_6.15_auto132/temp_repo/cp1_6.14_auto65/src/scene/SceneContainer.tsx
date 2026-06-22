import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import * as THREE from 'three';
import { Ground } from './Ground';
import { Object3D } from './Objects';
import { ParticleSystem, createExplosionParticles, createFluidParticles } from './ParticleSystem';
import { usePhysicsStore } from '@/store/usePhysicsStore';
import type { ParticleData } from '@/types';

function SceneContent({
  onParticlesCreated,
  particles,
  onParticleUpdate,
}: {
  onParticlesCreated: (particles: ParticleData[]) => void;
  particles: ParticleData[];
  onParticleUpdate: (particles: ParticleData[]) => void;
}) {
  const bodies = usePhysicsStore((s) => s.bodies);
  const explosionTrigger = usePhysicsStore((s) => s.explosionTrigger);
  const effectState = usePhysicsStore((s) => s.effectState);
  const { scene } = useThree();
  const lastExplosionTrigger = useRef(0);

  const handleCollision = useCallback(
    (newParticles: ParticleData[]) => {
      onParticlesCreated(newParticles);
    },
    [onParticlesCreated]
  );

  const handleExplosionForce = useCallback(() => {}, []);

  useFrame((_, delta) => {
    if (effectState.fluid && !usePhysicsStore.getState().isReplaying) {
      if (Math.random() < 0.3) {
        const fluidParticles = createFluidParticles([0, 8, 0], 3);
        onParticlesCreated(fluidParticles);
      }
    }

    if (explosionTrigger !== lastExplosionTrigger.current && effectState.explosionCenter && effectState.explosionForce) {
      lastExplosionTrigger.current = explosionTrigger;
      const explosionParticles = createExplosionParticles(effectState.explosionCenter, 50);
      onParticlesCreated(explosionParticles);
    }

    const state = usePhysicsStore.getState();
    if (state.isRecording && !state.isReplaying) {
      const frame = {
        timestamp: Date.now(),
        bodies: state.bodies.map((body) => {
          const data = state.physicsData.get(body.id);
          return {
            id: body.id,
            position: data?.position || body.initialPosition,
          };
        }),
      };
      state.addRecordingFrame(frame);
    }

    if (state.isReplaying) {
      const nextIndex = state.replayIndex + 1;
      if (nextIndex < state.recordingFrames.length) {
        state.setReplayIndex(nextIndex);
      } else {
        state.stopReplay();
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#4a1aff', '#0a0e27', 0.5]} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-8, 6, -8]} intensity={0.4} color="#a855f7" />
      <pointLight position={[8, 4, 8]} intensity={0.3} color="#00f5ff" />

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
      <Environment preset="night" />

      <fog attach="fog" args={['#0a0e27', 20, 60]} />

      <Ground />

      {bodies.map((body) => (
        <Object3D
          key={body.id}
          config={body}
          onCollision={handleCollision}
          explosionTrigger={explosionTrigger}
          explosionCenter={effectState.explosionCenter}
          explosionForce={effectState.explosionForce}
        />
      ))}

      <ParticleSystem particles={particles} onParticleUpdate={onParticleUpdate} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2 + 0.1}
        makeDefault
      />
    </>
  );
}

function ClickCatcher() {
  const setSelectedBodyId = usePhysicsStore((s) => s.setSelectedBodyId);
  const handleClick = () => setSelectedBodyId(null);
  return (
    <mesh onClick={handleClick} position={[0, -100, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export function SceneContainer() {
  const [particles, setParticles] = useState<ParticleData[]>([]);

  const handleParticlesCreated = useCallback((newParticles: ParticleData[]) => {
    setParticles((prev) => {
      const combined = [...prev, ...newParticles];
      return combined.slice(-200);
    });
  }, []);

  const handleParticleUpdate = useCallback((updatedParticles: ParticleData[]) => {
    setParticles(updatedParticles);
  }, []);

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [8, 6, 12], fov: 55 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 0);
        }}
      >
        <Physics
          gravity={[0, -9.8, 0]}
          iterations={10}
          tolerance={0.0001}
          stepSize={1 / 60}
        >
          <SceneContent
            onParticlesCreated={handleParticlesCreated}
            particles={particles}
            onParticleUpdate={handleParticleUpdate}
          />
          <ClickCatcher />
        </Physics>
      </Canvas>
    </div>
  );
}
