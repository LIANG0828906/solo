import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { ParticleSystem } from '@/ParticleSystem'
import { useControlParams, useAudioAnalysis, useVisualizerStore } from '@/store/useStore'
import { getSpectrumBarData } from '@/utils/audio'

function ParticleScene() {
  const particleSystemRef = useRef<ParticleSystem | null>(null)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(0)
  const fpsUpdateTimeRef = useRef(0)
  const [points, setPoints] = useState<THREE.Points | null>(null)
  const controlParams = useControlParams()
  const audioAnalysis = useAudioAnalysis()

  useEffect(() => {
    const system = new ParticleSystem()
    system.init(controlParams.particleCount)
    particleSystemRef.current = system
    setPoints(system.getPoints())

    const state = useVisualizerStore.getState()
    system.setPreset(state.controlParams.currentPreset)
    system.setVisualizationMode(state.controlParams.visualizationMode)

    return () => {
      system.destroy()
    }
  }, [])

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setPreset(controlParams.currentPreset)
      particleSystemRef.current.setVisualizationMode(controlParams.visualizationMode)
    }
  }, [controlParams.currentPreset, controlParams.visualizationMode])

  useFrame((_, delta) => {
    if (!particleSystemRef.current || !audioAnalysis) return

    const state = useVisualizerStore.getState()
    const { frequencyData, waveformData } = audioAnalysis
    const { controlParams: params, fpsState } = state

    particleSystemRef.current.update(
      frequencyData,
      waveformData,
      audioAnalysis,
      delta,
      params
    )

    frameCountRef.current++
    const now = performance.now()
    if (now - fpsUpdateTimeRef.current >= 1000) {
      const fps = Math.round(frameCountRef.current * 1000 / (now - lastTimeRef.current))
      const isLowFPS = fps < 30

      if (!fpsState.manualOverride && isLowFPS && params.particleCount > 2000) {
        particleSystemRef.current?.setParticleCount(2000)
        useVisualizerStore.getState().setControlParams({ particleCount: 2000 })
      }

      useVisualizerStore.getState().setFPSState({ fps, isLowFPS })
      frameCountRef.current = 0
      fpsUpdateTimeRef.current = now
      lastTimeRef.current = now
    }
  })

  return points ? <primitive object={points} /> : null
}

function SpectrumBars() {
  const barsRef = useRef<THREE.Mesh[]>([])
  const audioAnalysis = useAudioAnalysis()

  useFrame(() => {
    if (!audioAnalysis) return
    const bars = getSpectrumBarData(audioAnalysis.frequencyData, 64)
    bars.forEach((value, i) => {
      if (barsRef.current[i]) {
        barsRef.current[i].scale.y = Math.max(0.01, value * 5)
        barsRef.current[i].position.y = value * 2.5 - 5
      }
    })
  })

  return (
    <group position={[0, -5, 0]}>
      {Array.from({ length: 64 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) barsRef.current[i] = el
          }}
          position={[(i - 32) * 0.25, 0, 0]}
        >
          <boxGeometry args={[0.2, 0.1, 0.2]} />
          <meshBasicMaterial color="#4fc3f7" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

export function Visualizer3D() {
  const controlParams = useControlParams()

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 75 }}
      gl={{ antialias: !controlParams.performanceMode }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #0a0a1a, #0d0d2a)',
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={30}
      />
      <ParticleScene />
      {controlParams.visualizationMode === 'spectrum' && <SpectrumBars />}
    </Canvas>
  )
}

export default Visualizer3D
