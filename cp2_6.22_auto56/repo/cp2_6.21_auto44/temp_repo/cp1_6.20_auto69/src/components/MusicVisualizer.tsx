import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import useVisualizerStore from '@/store/useVisualizerStore';
import { themes } from '@/config/themes';
import ParticleSystem from './ParticleSystem';
import WaveformSurface from './WaveformSurface';

function Scene() {
  const {
    spectrumData,
    currentFrame,
    isPlaying,
    particleCount,
    particleSize,
    particleColorStart,
    particleColorEnd,
    rotationSpeed,
    clusteringAmount,
    theme,
    loopStart,
    loopEnd,
    setCurrentFrame,
  } = useVisualizerStore();

  const groupRef = useRef<THREE.Group>(null);
  const accumulatorRef = useRef(0);
  const currentFrameRef = useRef(currentFrame);

  currentFrameRef.current = currentFrame;

  const currentSpectrumFrame = useMemo(() => {
    if (!spectrumData || !spectrumData.frames.length) {
      return new Array(128).fill(0);
    }
    const frameIndex = Math.floor(currentFrame) % spectrumData.frameCount;
    return spectrumData.frames[frameIndex] || new Array(128).fill(0);
  }, [spectrumData, currentFrame]);

  const themeConfig = themes[theme];

  useFrame((_, delta) => {
    if (!isPlaying || !spectrumData) return;

    const effectiveFrameRate = spectrumData.frameRate || 60;
    accumulatorRef.current += delta * effectiveFrameRate;

    while (accumulatorRef.current >= 1) {
      accumulatorRef.current -= 1;
      let nextFrame = currentFrameRef.current + 1;

      const start = loopStart ?? 0;
      const end = loopEnd ?? spectrumData.frameCount - 1;

      if (nextFrame > end) {
        nextFrame = start;
      }

      currentFrameRef.current = nextFrame;
      setCurrentFrame(nextFrame);
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} color={themeConfig.ambientColor} />
      <pointLight position={[10, 10, 10]} intensity={1} color={particleColorStart} />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color={particleColorEnd} />

      <ParticleSystem
        count={particleCount}
        spectrumFrame={currentSpectrumFrame}
        colorStart={particleColorStart}
        colorEnd={particleColorEnd}
        size={particleSize}
        rotationSpeed={rotationSpeed}
        clusteringAmount={clusteringAmount}
      />

      <WaveformSurface
        spectrumFrame={currentSpectrumFrame}
        colorStart={themeConfig.surfaceColorStart}
        colorEnd={themeConfig.surfaceColorEnd}
      />
    </group>
  );
}

export default function MusicVisualizer() {
  const { theme } = useVisualizerStore();
  const themeConfig = themes[theme];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[themeConfig.background]} />
        <PerspectiveCamera makeDefault position={[0, 5, 30]} fov={60} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={60}
        />
        <Scene />
      </Canvas>
    </div>
  );
}
