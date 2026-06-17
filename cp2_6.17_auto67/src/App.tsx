import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ParticleSystem } from '@/visualizer/particleSystem'
import { SculptureSystem } from '@/visualizer/sculptureSystem'
import { ControlPanel } from '@/components/ControlPanel'
import { FpsCounter } from '@/components/FpsCounter'

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: 'linear-gradient(180deg, #0B0014 0%, #1A0A2E 100%)',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, 7],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <ambientLight intensity={0.4} color="#9d7bff" />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#7C4DFF" distance={20} />
        <pointLight position={[-5, -3, -5]} intensity={0.8} color="#FF3366" distance={20} />
        <pointLight position={[0, 5, -5]} intensity={0.6} color="#00E5FF" distance={20} />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.3}
          enableDamping
          dampingFactor={0.05}
        />

        <ParticleSystem />
        <SculptureSystem />
      </Canvas>

      <FpsCounter />
      <ControlPanel />

      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 100,
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          fontFamily: 'monospace',
          pointerEvents: 'none',
          textAlign: 'right',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
          AuraCanvas
        </div>
        <div>3D 音乐可视化空间</div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 12px rgba(124, 77, 255, 0.5);
          border: none;
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: none;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          background: transparent;
          border: none;
        }
        input[type="range"]::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  )
}

export default App
