import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ParticleSystem } from '@/visualizer/particleSystem.tsx';
import { Sculpture } from '@/visualizer/sculptureSystem.tsx';
import ControlPanel from '@/components/ControlPanel';
import FpsCounter from '@/components/FpsCounter';

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{
          background: 'linear-gradient(180deg, #0B0014 0%, #1A0A2E 100%)',
        }}
      >
        <color attach="background" args={['#0B0014']} />
        <fog attach="fog" args={['#1A0A2E', 6, 18]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#B388FF" />
        <pointLight position={[-5, -3, 3]} intensity={0.8} color="#FF3366" />
        <pointLight position={[0, 4, -5]} intensity={0.9} color="#00E5FF" />
        <ParticleSystem />
        <Sculpture />
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={16}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
      <FpsCounter />
      <ControlPanel />
    </div>
  );
}

export default App;
