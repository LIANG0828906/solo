import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import ParticleScene from './components/ParticleScene'
import InfoPanel from './components/InfoPanel'
import ChartPanel from './components/ChartPanel'
import { TrajectoryLabels, ToggleButton } from './components/TrajectoryElements'

function App() {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 5, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <ambientLight />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <Suspense fallback={null}>
          <ParticleScene />
          <TrajectoryLabels hoveredPoint={hoveredPoint} setHoveredPoint={setHoveredPoint} />
        </Suspense>
      </Canvas>

      <InfoPanel />
      <ChartPanel />
      <ToggleButton />
    </div>
  )
}

export default App
