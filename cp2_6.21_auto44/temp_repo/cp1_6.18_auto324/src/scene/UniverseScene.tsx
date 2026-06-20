import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import StarParticles from './StarParticles'
import { useSimulationStore } from '../data/SimulationStore'
import { particlePhysics } from '../physics/ParticlePhysics'
import { interactionManager } from '../interaction/InteractionManager'

function PhysicsLoop() {
  const lastTimeRef = useRef(performance.now())

  useFrame(() => {
    const now = performance.now()
    const delta = (now - lastTimeRef.current) / 1000
    lastTimeRef.current = now

    useSimulationStore.getState().tickPhysics(delta, particlePhysics)
  })

  return null
}

function CameraSetup() {
  const { camera, gl } = useThree()

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const updateRect = () => {
        const canvas = gl.domElement
        const rect = canvas.getBoundingClientRect()
        camera.userData.canvasRect = rect
      }
      updateRect()
      window.addEventListener('resize', updateRect)
      return () => window.removeEventListener('resize', updateRect)
    }
  }, [camera, gl])

  return null
}

function SceneBackground() {
  const { scene } = useThree()

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#0A0A1A')
    gradient.addColorStop(1, '#1A1A3A')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 512)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    scene.background = texture
  }, [scene])

  return null
}

function HUDPanel() {
  const particlesCount = useSimulationStore((s) => s.particles.length)
  const connectionsCount = useSimulationStore((s) => s.connections.length)
  const simulationMode = useSimulationStore((s) => s.simulationMode)
  const gravityConstant = useSimulationStore((s) => s.gravityConstant)
  const setSimulationMode = useSimulationStore((s) => s.setSimulationMode)
  const setGravityConstant = useSimulationStore((s) => s.setGravityConstant)

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 20,
        borderRadius: 10,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#FFFFFF',
        fontFamily: 'inherit',
        fontSize: 14,
        minWidth: 240,
        zIndex: 100,
        userSelect: 'none'
      }}
    >
      <div style={{ marginBottom: 16, fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>
        ✦ 星尘编年史
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ opacity: 0.8 }}>粒子总数</span>
        <span style={{ fontWeight: 600, color: '#6C63FF' }}>{particlesCount}/100</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ opacity: 0.8 }}>连线数量</span>
        <span style={{ fontWeight: 600, color: '#FF6584' }}>{connectionsCount}/20</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 8, opacity: 0.8 }}>模拟模式</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setSimulationMode('attract')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              background: simulationMode === 'attract' ? '#6C63FF' : 'rgba(255,255,255,0.1)',
              color: '#FFFFFF'
            }}
          >
            吸引模式
          </button>
          <button
            onClick={() => setSimulationMode('repel')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              background: simulationMode === 'repel' ? '#FF6584' : 'rgba(255,255,255,0.1)',
              color: '#FFFFFF'
            }}
          >
            排斥模式
          </button>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ opacity: 0.8 }}>引力常数 G</span>
          <span style={{ fontWeight: 600 }}>{gravityConstant.toFixed(1)}</span>
        </div>
        <div style={{ position: 'relative', height: 6 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              borderRadius: 3,
              background: 'linear-gradient(to right, #6C63FF, #FF6584)'
            }}
          />
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={gravityConstant}
            onChange={(e) => setGravityConstant(parseFloat(e.target.value))}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 6,
              opacity: 0,
              cursor: 'pointer',
              margin: 0
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: `${((gravityConstant - 0.1) / 9.9) * 100}%`,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '2px solid #6C63FF',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, opacity: 0.5 }}>
          <span>0.1</span>
          <span>10</span>
        </div>
      </div>
    </div>
  )
}

function HintBar() {
  const [visible, setVisible] = useState(true)
  const hideTimerRef = useRef<number | null>(null)

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
    }
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false)
    }, 3000)
  }, [])

  useEffect(() => {
    const handleMouseMove = () => {
      setVisible(true)
      scheduleHide()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleMouseMove)
    scheduleHide()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleMouseMove)
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
      }
    }
  }, [scheduleHide])

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 20px',
        borderRadius: 10,
        background: 'rgba(0, 0, 0, 0.5)',
        color: '#FFFFFF',
        fontSize: 13,
        whiteSpace: 'nowrap',
        zIndex: 100,
        userSelect: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: visible ? 'auto' : 'none'
      }}
    >
      点击添加粒子 &nbsp;|&nbsp; 点击选中粒子 &nbsp;|&nbsp; Shift+点击连线 &nbsp;|&nbsp; Delete删除
    </div>
  )
}

export function UniverseScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    useSimulationStore.getState().initParticles()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      interactionManager.handleKeyDown(e.key)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target instanceof HTMLCanvasElement) {
      interactionManager.handlePointerDown(e.clientX, e.clientY, e.shiftKey)
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    interactionManager.handlePointerMove(e.clientX, e.clientY)
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    interactionManager.handlePointerUp(e.clientX, e.clientY, e.shiftKey)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
      >
        <SceneBackground />
        <CameraSetup />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={100}
          enablePan
          panSpeed={0.5}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
        <ambientLight intensity={0.1} />
        <StarParticles />
        <PhysicsLoop />
      </Canvas>
      <HUDPanel />
      <HintBar />
    </div>
  )
}

export default UniverseScene
