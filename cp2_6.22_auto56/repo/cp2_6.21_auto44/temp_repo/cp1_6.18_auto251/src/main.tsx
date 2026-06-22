import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { Scene } from './scene';
import { UI } from './ui';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 8, 10], fov: 50 }}
        style={{ background: '#0A0A0F', width: '100%', height: '100%', display: 'block' }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
        shadows
      >
        <fog attach="fog" args={['#0A0A0F', 8, 25]} />
        <Scene />
      </Canvas>
      <UI />
    </div>
  </StrictMode>
);
