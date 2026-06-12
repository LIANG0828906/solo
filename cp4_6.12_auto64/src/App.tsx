import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import { Suspense } from 'react'
import PlantScene from './scene/PlantScene'
import Environment from './scene/Environment'
import ControlPanel from './ui/ControlPanel'
import PlantStats from './ui/PlantStats'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <div className="canvas-wrapper">
        <Canvas
          shadows
          camera={{ position: [20, 15, 20], fov: 50 }}
          gl={{ antialias: true }}
        >
          <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} />
          <Suspense fallback={null}>
            <Environment />
            <PlantScene />
          </Suspense>
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
        </Canvas>
      </div>
      <ControlPanel />
      <PlantStats />
    </div>
  )
}

export default App
