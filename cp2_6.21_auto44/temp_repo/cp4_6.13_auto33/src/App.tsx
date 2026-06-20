import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WaveformTerrain } from './waveformTerrain';
import { FreqSpectrum } from './freqSpectrum';
import { Controls } from './controls';
import { Suspense } from 'react';

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#667eea" />
      <pointLight position={[0, -5, 0]} intensity={0.3} color="#764ba2" />
      <fog attach="fog" args={['#0a0a1a', 15, 40]} />
      
      <group position={[-3, 0, 0]}>
        <WaveformTerrain />
      </group>
      
      <group position={[14, 1, -3]} rotation={[0, -0.3, 0]}>
        <FreqSpectrum />
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
        makeDefault
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#667eea" wireframe />
    </mesh>
  );
}

export function App() {
  return (
    <div className="app-container">
      <div className="scene-container">
        <Canvas
          camera={{ position: [0, 8, 15], fov: 50 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
          performance={{ min: 0.5 }}
        >
          <color attach="background" args={['#0a0a1a']} />
          <Suspense fallback={<LoadingFallback />}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="controls-container">
        <Controls />
      </div>

      <style>{`
        .app-container {
          width: 100vw;
          height: 100vh;
          display: flex;
          overflow: hidden;
          background: #0a0a1a;
        }

        .scene-container {
          width: 75%;
          height: 100%;
          position: relative;
        }

        .scene-container canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }

        .controls-container {
          width: 25%;
          height: 100%;
          min-width: 280px;
        }

        @media (max-width: 1440px) {
          .scene-container {
            width: 72%;
          }
          .controls-container {
            width: 28%;
          }
        }

        @media (max-width: 1080px) {
          .app-container {
            flex-direction: column;
          }
          
          .scene-container {
            width: 100%;
            height: 70%;
          }
          
          .controls-container {
            width: 100%;
            height: 30%;
            min-width: unset;
          }
        }
      `}</style>
    </div>
  );
}
