import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useReactorStore } from '../store'
import * as THREE from 'three'

function PlasmaTorus() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { params, replayParams, isReplayMode } = useReactorStore()

  const activeParams = isReplayMode && replayParams ? replayParams : params

  const color = useMemo(() => {
    const tempRatio = (activeParams.temperature - 1) / (150 - 1)
    const h = 270 + tempRatio * 60
    const s = 80 + tempRatio * 20
    const l = 30 + tempRatio * 40
    return new THREE.Color().setHSL(h / 360, s / 100, l / 100)
  }, [activeParams.temperature])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.2
    }
  })

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[1.5, 0.5, 32, 64]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5 + (activeParams.temperature / 150) * 0.8}
        transparent
        opacity={0.85}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  )
}

function MagneticFieldLines() {
  const { params, replayParams, isReplayMode } = useReactorStore()
  const groupRef = useRef<THREE.Group>(null)

  const activeParams = isReplayMode && replayParams ? replayParams : params

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  const fieldStrength = activeParams.magneticField / 10

  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} rotation={[0, angle, 0]}>
            <torusGeometry args={[1.5, 0.02, 8, 32]} />
            <meshBasicMaterial
              color="#00FFFF"
              transparent
              opacity={0.3 * fieldStrength}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8A2BE2" />
      <PlasmaTorus />
      <MagneticFieldLines />
    </>
  )
}

function CoreParamsPanel() {
  const { params, currentEvent, replayEvent, isReplayMode, replayParams } = useReactorStore()
  const [displayTemp, setDisplayTemp] = useState(params.temperature)
  const [isAnimating, setIsAnimating] = useState(false)

  const activeParams = isReplayMode && replayParams ? replayParams : params
  const activeEvent = isReplayMode ? replayEvent : currentEvent

  const tempPercent = ((displayTemp - 1) / (150 - 1)) * 100
  const showWarning = activeEvent && !activeEvent.isResolved

  useEffect(() => {
    setIsAnimating(true)
    const targetTemp = activeParams.temperature
    const startTemp = displayTemp
    const duration = 500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeProgress = 1 - Math.pow(1 - progress, 3)

      const currentTemp = startTemp + (targetTemp - startTemp) * easeProgress
      setDisplayTemp(currentTemp)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    const animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [activeParams.temperature])

  return (
    <div className="center-panel">
      {showWarning && <div className="event-warning" key={activeEvent?.type + Date.now()} />}

      <div className="core-header">
        <div className="core-param-item">
          <div className="core-param-label">等离子体温度</div>
          <div className="core-param-value temp-color">
            {activeParams.temperature.toFixed(1)} <span style={{ fontSize: '14px' }}>keV</span>
          </div>
        </div>
        <div className="core-param-item">
          <div className="core-param-label">等离子体密度</div>
          <div className="core-param-value dens-color">
            {activeParams.density.toFixed(2)} <span style={{ fontSize: '14px' }}>×10²⁰/m³</span>
          </div>
        </div>
        <div className="core-param-item">
          <div className="core-param-label">约束磁场</div>
          <div className="core-param-value field-color">
            {activeParams.magneticField.toFixed(1)} <span style={{ fontSize: '14px' }}>T</span>
          </div>
        </div>
      </div>

      <div className="core-display">
        <div className="plasma-column-container">
          <div className="plasma-column">
            <div
              className="plasma-fill"
              style={{
                height: `${Math.max(0, Math.min(100, tempPercent))}%`,
                transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
          <div className="column-value">{activeParams.temperature.toFixed(1)} keV</div>
          <div className="column-label">等离子体温度</div>
        </div>

        <div className="torus-container">
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <Scene />
          </Canvas>
        </div>
      </div>
    </div>
  )
}

export default CoreParamsPanel
