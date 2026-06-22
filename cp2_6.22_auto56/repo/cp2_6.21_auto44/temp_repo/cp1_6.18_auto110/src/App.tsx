import { Canvas } from '@react-three/fiber'
import HeatCity from './scene/HeatCity'
import ControlPanel from './components/ControlPanel'

export default function App() {
  return (
    <div className="app-container">
      <Canvas
        camera={{ position: [15, 18, 15], fov: 50 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[0, 0, 0]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={0.8} />
        <HeatCity />
      </Canvas>
      <ControlPanel />
    </div>
  )
}
