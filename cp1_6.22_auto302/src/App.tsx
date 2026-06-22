import { useRef, useEffect } from 'react';
import { WaveType, ParticleConfig } from './types';
import { WaveParticleEngine } from './WaveParticleEngine';
import { SceneRenderer } from './SceneRenderer';
import { ControlPanel } from './ControlPanel';
import './styles.css';

const initialConfig: ParticleConfig = {
  frequency: 60,
  amplitude: 1.0,
  waveType: WaveType.SINE,
};

function App() {
  const engineRef = useRef<WaveParticleEngine>(new WaveParticleEngine(initialConfig));
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animationId: number;

    const animate = () => {
      const now = performance.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      engineRef.current.update(deltaTime);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleConfigChange = (config: ParticleConfig) => {
    engineRef.current.setConfig(config);
  };

  const getPositions = () => engineRef.current.getPositions();

  return (
    <div className="app-container">
      <div className="control-container">
        <ControlPanel onConfigChange={handleConfigChange} initialConfig={initialConfig} />
      </div>
      <div className="scene-container">
        <SceneRenderer getPositions={getPositions} />
      </div>
    </div>
  );
}

export default App;
