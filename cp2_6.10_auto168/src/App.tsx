import { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Astrolabe from '@/components/Astrolabe'
import StarBackground from '@/components/StarBackground'
import ControlPanel from '@/components/ControlPanel'
import { useAppStore } from '@/store/useAppStore'

function ResponsiveCamera() {
  const { camera, gl } = useThree()
  const { setAutoRotate } = useAppStore()

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const isMobile = width < 768
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = isMobile ? 60 : 50
        camera.position.set(
          isMobile ? 8 : 6,
          isMobile ? 5 : 4,
          isMobile ? 8 : 6
        )
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [camera])

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      minDistance={4}
      maxDistance={20}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI * 5 / 6}
      onStart={() => setAutoRotate(false)}
      makeDefault
    />
  )
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        color="#fff5e0"
        castShadow
      />
      
      <pointLight
        position={[-5, 5, -5]}
        intensity={0.5}
        color="#87ceeb"
      />
      
      <pointLight
        position={[0, -5, 0]}
        intensity={0.3}
        color="#ffd700"
      />

      <hemisphereLight
        args={['#87ceeb', '#2d1b69', 0.4]}
      />
    </>
  )
}

function SceneFog() {
  const { scene } = useThree()
  
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#0a0a1a', 0.02)
    scene.background = new THREE.Color('#0a0a1a')
  }, [scene])

  return null
}

function FPSLimiter() {
  const lastTime = useRef(0)
  const frameInterval = useRef(1000 / 60)

  useFrame((state) => {
    const currentTime = state.clock.elapsedTime * 1000
    const delta = currentTime - lastTime.current
    
    if (delta < frameInterval.current) {
      return
    }
    
    lastTime.current = currentTime - (delta % frameInterval.current)
  })

  return null
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-yellow-600/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-4 border-4 border-yellow-500/50 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          <div className="absolute inset-8 border-4 border-yellow-400/70 rounded-full animate-spin" style={{ animationDuration: '1s' }} />
          <div className="absolute inset-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full animate-gold-pulse" />
        </div>
        <h1 className="chinese-title text-4xl text-yellow-300 mb-4 tracking-widest">
          璇玑玉衡
        </h1>
        <p className="text-gray-500 text-sm">正在载入观星台...</p>
      </div>
    </div>
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const setAutoRotate = useAppStore(state => state.setAutoRotate)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleCanvasClick = () => {
    const store = useAppStore.getState()
    if (store.selectedRing) {
      useAppStore.setState({ selectedRing: null, showInfo: false })
    }
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {loading && <LoadingScreen />}
      
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          maxDeltaTime: 1 / 30,
        }}
        dpr={[1, 2]}
        onClick={handleCanvasClick}
        onPointerMissed={() => setAutoRotate(true)}
      >
        <SceneFog />
        <FPSLimiter />
        <SceneLighting />
        <ResponsiveCamera />
        
        <group position={[0, 0.5, 0]}>
          <Astrolabe />
        </group>
        
        <StarBackground particleLimit={200} />
      </Canvas>

      <ControlPanel />

      <div className="fixed top-6 left-6 z-30 hidden md:block">
        <div className="ancient-panel rounded-xl px-6 py-4 gold-border">
          <h1 className="chinese-title text-3xl text-yellow-300 tracking-widest mb-1">
            璇玑玉衡·观星台
          </h1>
          <p className="text-gray-500 text-xs">
            北宋 元祐年间 · 司天监制
          </p>
        </div>
      </div>

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30 md:hidden">
        <div className="ancient-panel rounded-xl px-4 py-2">
          <h1 className="chinese-title text-xl text-yellow-300 tracking-wider">
            璇玑玉衡
          </h1>
        </div>
      </div>

      <div className="fixed bottom-6 left-6 z-30 hidden md:flex flex-col gap-2">
        <div className="ancient-panel rounded-lg px-4 py-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>60 FPS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
