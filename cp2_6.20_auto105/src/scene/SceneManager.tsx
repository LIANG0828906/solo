import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { EarthBlock } from '@/components/EarthBlock';
import { Hypocenter } from '@/components/Hypocenter';
import { WaveFront } from '@/components/WaveFront';
import { SurfaceWave } from '@/components/SurfaceWave';
import { useSceneStore } from '@/store/useSceneStore';
import { WaveSimulator, createWaveSimulator } from '@/simulation/WaveSimulator';
import type { WaveData, Hypocenter as HypocenterType } from '@/types';
import { ANIMATION_DURATION } from '@/types';

interface SceneContentProps {
  waveSimulator: WaveSimulator | null;
}

const SceneContent: React.FC<SceneContentProps> = ({ waveSimulator }) => {
  const hypocenter = useSceneStore((state) => state.hypocenter);
  const magnitude = useSceneStore((state) => state.magnitude);
  const density = useSceneStore((state) => state.density);
  const elasticity = useSceneStore((state) => state.elasticity);
  const isPlaying = useSceneStore((state) => state.isPlaying);
  const currentTime = useSceneStore((state) => state.currentTime);
  const setCurrentTime = useSceneStore((state) => state.setCurrentTime);
  const setPlaying = useSceneStore((state) => state.setPlaying);

  const [waveData, setWaveData] = useState<WaveData>({
    pWaveRadius: 0,
    sWaveRadius: 0,
    surfaceWaveRadius: 0,
    pWaveSpeed: 0,
    sWaveSpeed: 0,
    surfaceWaveSpeed: 0,
    reflections: [],
    refractions: [],
  });

  const prevParamsRef = useRef<{
    hypocenter: HypocenterType;
    elasticity: number;
    density: number;
  }>({
    hypocenter: { ...hypocenter },
    elasticity,
    density,
  });

  useEffect(() => {
    const prev = prevParamsRef.current;
    if (
      prev.hypocenter.x !== hypocenter.x ||
      prev.hypocenter.y !== hypocenter.y ||
      prev.hypocenter.z !== hypocenter.z ||
      prev.elasticity !== elasticity ||
      prev.density !== density
    ) {
      if (waveSimulator) {
        waveSimulator.updateParams(hypocenter, elasticity, density);
      }
      prevParamsRef.current = {
        hypocenter: { ...hypocenter },
        elasticity,
        density,
      };
    }
  }, [hypocenter, elasticity, density, waveSimulator]);

  useFrame((_, delta) => {
    if (isPlaying && waveSimulator) {
      const newTime = currentTime + delta;
      if (newTime >= ANIMATION_DURATION) {
        setCurrentTime(ANIMATION_DURATION);
        setPlaying(false);
      } else {
        setCurrentTime(newTime);
      }
      const data = waveSimulator.getWaveData(newTime);
      setWaveData(data);
    } else if (!isPlaying && currentTime === 0 && waveSimulator) {
      waveSimulator.reset();
      setWaveData({
        pWaveRadius: 0,
        sWaveRadius: 0,
        surfaceWaveRadius: 0,
        pWaveSpeed: 0,
        sWaveSpeed: 0,
        surfaceWaveSpeed: 0,
        reflections: [],
        refractions: [],
      });
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#4fc3f7" />

      <EarthBlock density={density} />
      <Hypocenter position={hypocenter} magnitude={magnitude} />
      <WaveFront waveData={waveData} hypocenter={hypocenter} magnitude={magnitude} />
      <SurfaceWave
        waveData={waveData}
        hypocenter={hypocenter}
        waveSimulator={waveSimulator}
        currentTime={currentTime}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
      />

      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
};

const CameraSetup: React.FC = () => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
};

export const SceneManager: React.FC = () => {
  const hypocenter = useSceneStore((state) => state.hypocenter);
  const elasticity = useSceneStore((state) => state.elasticity);
  const density = useSceneStore((state) => state.density);
  const isPlaying = useSceneStore((state) => state.isPlaying);

  const waveSimulatorRef = useRef<WaveSimulator | null>(null);

  useEffect(() => {
    waveSimulatorRef.current = createWaveSimulator(hypocenter, elasticity, density);
  }, []);

  useEffect(() => {
    if (!isPlaying && waveSimulatorRef.current) {
      const time = useSceneStore.getState().currentTime;
      if (time === 0) {
        waveSimulatorRef.current.reset();
      }
    }
  }, [isPlaying]);

  const memoizedContent = useMemo(
    () => <SceneContent waveSimulator={waveSimulatorRef.current} />,
    []
  );

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <CameraSetup />
        <color attach="background" args={['#0a0a1a']} />
        <fog attach="fog" args={['#0a0a1a', 30, 60]} />
        {memoizedContent}
      </Canvas>
    </div>
  );
};
