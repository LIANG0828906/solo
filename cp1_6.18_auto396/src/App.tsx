import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { SolarSystem } from './components/SolarSystem'
import { Navbar } from './components/Navbar'
import { PlanetDetail } from './components/PlanetDetail'
import { FooterHint } from './components/FooterHint'
import { useKeyboard } from './hooks/useKeyboard'
import { useStore } from './store/useStore'
import './App.css'

function App() {
  useKeyboard()
  const cameraTarget = useStore((state) => state.cameraTarget)

  return (
    <div className="app-container">
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60, near: 0.1, far: 1000 }}
        style={{ background: '#000011' }}
      >
        <SolarSystem />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          rotateSpeed={0.5}
          minDistance={2}
          maxDistance={50}
          target={cameraTarget}
        />
      </Canvas>
      <Navbar />
      <PlanetDetail />
      <FooterHint />
    </div>
  )
}

export default App
