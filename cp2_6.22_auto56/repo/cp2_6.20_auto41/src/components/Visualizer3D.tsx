import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { ParticleSystem } from '@/ParticleSystem'
import { useControlParams, useAudioAnalysis, useVisualizerStore } from '@/store/useStore'
import { getSpectrumBarData } from '@/utils/audio'

function ParticleScene() {
  const particleSystemRef = useRef<ParticleSystem | null>(null)
  const recentFrameTimesRef = useRef<number[]>([])
  const lowFPSStreakRef = useRef(0)
  const highFPSStreakRef = useRef(0)
  const downgradeStateRef = useRef<'normal' | 'downgraded' | 'recovering'>('normal')
  const downgradeStartTimeRef = useRef(0)
  const recoveryStepRef = useRef(0)
  const lastRecoveryStepTimeRef = useRef(0)
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

    const now = performance.now()
    recentFrameTimesRef.current.push(now)
    if (recentFrameTimesRef.current.length > 60) {
      recentFrameTimesRef.current.shift()
    }

    let fps = 60
    const times = recentFrameTimesRef.current
    if (times.length >= 2) {
      let totalDiff = 0
      for (let i = 1; i < times.length; i++) {
        totalDiff += times[i] - times[i - 1]
      }
      const avgDiff = totalDiff / (times.length - 1)
      fps = Math.round(1000 / avgDiff)
    }

    const isLowFPS = fps < 30
    const store = useVisualizerStore.getState()

    if (downgradeStateRef.current === 'normal' && !fpsState.manualOverride) {
      if (fps < 30) {
        lowFPSStreakRef.current++
      } else {
        lowFPSStreakRef.current = 0
      }

      if (lowFPSStreakRef.current >= 10) {
        particleSystemRef.current?.setParticleCount(2000)
        store.setControlParams({ particleCount: 2000, performanceMode: true })
        downgradeStateRef.current = 'downgraded'
        downgradeStartTimeRef.current = now
        lowFPSStreakRef.current = 0
        highFPSStreakRef.current = 0
        recoveryStepRef.current = 0
      }
    } else if (downgradeStateRef.current === 'downgraded' && !fpsState.manualOverride) {
      const timeSinceDowngrade = now - downgradeStartTimeRef.current

      if (fps >= 50) {
        highFPSStreakRef.current++
      } else {
        highFPSStreakRef.current = 0
      }

      if (timeSinceDowngrade >= 10000 && highFPSStreakRef.current >= 30) {
        downgradeStateRef.current = 'recovering'
        recoveryStepRef.current = 1
        lastRecoveryStepTimeRef.current = now
        particleSystemRef.current?.setParticleCount(3500)
        store.setControlParams({ particleCount: 3500 })
        highFPSStreakRef.current = 0
      }
    } else if (downgradeStateRef.current === 'recovering' && !fpsState.manualOverride) {
      const timeSinceLastStep = now - lastRecoveryStepTimeRef.current

      if (fps >= 50) {
        highFPSStreakRef.current++
      } else {
        highFPSStreakRef.current = 0
      }

      if (timeSinceLastStep >= 5000 && highFPSStreakRef.current >= 30) {
        if (recoveryStepRef.current === 1) {
          recoveryStepRef.current = 2
          lastRecoveryStepTimeRef.current = now
          particleSystemRef.current?.setParticleCount(5000)
          store.setControlParams({ particleCount: 5000 })
          highFPSStreakRef.current = 0
        } else if (recoveryStepRef.current === 2) {
          recoveryStepRef.current = 0
          downgradeStateRef.current = 'normal'
          store.setControlParams({ performanceMode: false })
          highFPSStreakRef.current = 0
        }
      }

      if (fps < 30) {
        lowFPSStreakRef.current++
        if (lowFPSStreakRef.current >= 10) {
          particleSystemRef.current?.setParticleCount(2000)
          store.setControlParams({ particleCount: 2000, performanceMode: true })
          downgradeStateRef.current = 'downgraded'
          downgradeStartTimeRef.current = now
          recoveryStepRef.current = 0
          lowFPSStreakRef.current = 0
          highFPSStreakRef.current = 0
        }
      } else {
        lowFPSStreakRef.current = 0
      }
    }

    if (times.length >= 2 && store.fpsState.fps !== fps) {
      store.setFPSState({ fps, isLowFPS })
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
      gl={{
        antialias: !controlParams.performanceMode,
        ...(controlParams.performanceMode ? { shadows: false } : {}),
      }}
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
