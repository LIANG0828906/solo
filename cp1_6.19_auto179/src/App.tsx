import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ControlPanel from './ControlPanel';
import ParticleCloud from './ParticleCloud';
import { EmotionKey, ParticleConfig } from './types';
import { getEmotionConfig } from './emotionMapper';

export default function App() {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionKey>('calm');
  const [particleConfig, setParticleConfig] = useState<ParticleConfig>(() => getEmotionConfig('calm'));

  const handleEmotionChange = (config: ParticleConfig, emotionKey: EmotionKey) => {
    setParticleConfig(config);
    setCurrentEmotion(emotionKey);
  };

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    background: '#0B0B1A',
  };

  return (
    <>
      <div style={canvasStyle}>
        <Canvas
          camera={{ position: [0, 0, 25], fov: 60, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
          style={{ background: '#0B0B1A' }}
        >
          <color attach="background" args={['#0B0B1A']} />
          <fog attach="fog" args={['#0B0B1A', 20, 45]} />
          
          <ParticleCloud config={particleConfig} />
          
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={10}
            maxDistance={50}
            enablePan={false}
          />
        </Canvas>
      </div>
      
      <ControlPanel
        onEmotionChange={handleEmotionChange}
        currentEmotion={currentEmotion}
      />
    </>
  );
}
