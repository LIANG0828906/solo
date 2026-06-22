import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Scene from './Scene3D/scene';
import Controls from './UI/controls';
import { loadAudioFile, AudioProcessorResult, ChannelTimeDomainData } from './AudioEngine/audioProcessor';
import { generateEffectConfig, EffectConfig } from './AudioEngine/effectsManager';

type DisplayMode = 'particles' | 'waveform' | 'mixed';

const defaultEffectConfig: EffectConfig = {
  particleEmitRate: 0.5,
  particleColorLow: [1, 0.3, 0],
  particleColorMid: [0, 0.8, 0.4],
  particleColorHigh: [0.6, 0.2, 0.8],
  displacementX: 0,
  displacementY: 0,
  displacementZ: 0,
  intensity: 0,
  bassIntensity: 0,
  midIntensity: 0,
  highIntensity: 0,
};

export default function App() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('mixed');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fileName, setFileName] = useState('');
  const [effectConfig, setEffectConfig] = useState<EffectConfig>(defaultEffectConfig);
  const [channelData, setChannelData] = useState<ChannelTimeDomainData | null>(null);

  const processorRef = useRef<AudioProcessorResult | null>(null);
  const animFrameRef = useRef<number>(0);

  const updateLoop = useCallback(() => {
    const proc = processorRef.current;
    if (proc && isPlaying) {
      const bands = proc.getFrequencyBands();
      const effect = generateEffectConfig(bands);
      setEffectConfig(effect);

      const chData = proc.getChannelTimeDomainData();
      setChannelData({
        left: new Float32Array(chData.left),
        right: new Float32Array(chData.right),
        mixed: new Float32Array(chData.mixed),
      });

      if (proc.audioElement) {
        setCurrentTime(proc.audioElement.currentTime);
      }
    }
    animFrameRef.current = requestAnimationFrame(updateLoop);
  }, [isPlaying]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [updateLoop]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (processorRef.current) {
      processorRef.current.destroy();
      processorRef.current = null;
    }

    try {
      const proc = await loadAudioFile(file);
      processorRef.current = proc;
      setFileName(file.name);

      proc.audioElement.play();
      setIsPlaying(true);

      proc.audioElement.addEventListener('loadedmetadata', () => {
        setDuration(proc.audioElement.duration);
      });

      proc.audioElement.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    } catch (err) {
      console.error('Failed to load audio:', err);
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    const proc = processorRef.current;
    if (!proc) return;

    if (isPlaying) {
      proc.audioElement.pause();
      setIsPlaying(false);
    } else {
      proc.audioContext.resume();
      proc.audioElement.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0A0A0F' }}>
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0A0A0F');
        }}
      >
        <Scene
          effectConfig={effectConfig}
          channelData={channelData}
          displayMode={displayMode}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.9}
          rotateSpeed={1}
          enablePan={false}
          minDistance={5 * 0.5}
          maxDistance={5 * 5}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI - 0.2}
        />
      </Canvas>

      <Controls
        onFileSelect={handleFileSelect}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        displayMode={displayMode}
        onModeChange={setDisplayMode}
        currentTime={currentTime}
        duration={duration}
        fileName={fileName}
      />
    </div>
  );
}
