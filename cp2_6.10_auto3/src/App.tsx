import { useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SceneElements } from '@/components/SceneElements'
import { SmokeParticles } from '@/components/SmokeParticles'
import { ControlPanel } from '@/components/ControlPanel'
import { useFPS } from '@/hooks/useFPS'
import { useIncenseStore } from '@/store/useIncenseStore'
import { COLORS } from '@/utils/constants'

function App() {
  const setFPS = useIncenseStore((state) => state.setFPS)

  const handleFPS = useCallback(
    (fps: number) => {
      setFPS(fps)
    },
    [setFPS]
  )

  useFPS(handleFPS)

  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ backgroundColor: COLORS.BACKGROUND }}>
      <div className="absolute inset-0 md:pr-[220px] md:pb-0 pb-[80px]">
        <div className="w-full h-[90vh] flex items-center justify-center">
          <Canvas
            shadows
            camera={{ position: [0, 3, 8], fov: 45 }}
            gl={{ antialias: true, alpha: false }}
            onCreated={({ gl, scene }) => {
              gl.setClearColor(new THREE.Color(COLORS.BACKGROUND))
              scene.background = new THREE.Color(COLORS.BACKGROUND)
              gl.toneMapping = THREE.ACESFilmicToneMapping
              gl.toneMappingExposure = 1.2
            }}
          >
            <fog attach="fog" args={[COLORS.BACKGROUND, 8, 20]} />
            <SceneElements />
            <SmokeParticles />
            <OrbitControls
              enablePan={false}
              minDistance={4}
              maxDistance={15}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.2}
              enableDamping
              dampingFactor={0.05}
            />
          </Canvas>
        </div>
      </div>
      <ControlPanel />
    </div>
  )
}

export default App
