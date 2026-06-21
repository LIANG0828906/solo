import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleSystem, WARM_SCHEME, COOL_SCHEME, type ColorScheme } from './ParticleSystem'
import { SimulationEngine } from './SimulationEngine'
import { InteractionHandler } from './InteractionHandler'

interface RippleEffect {
  id: number
  position: THREE.Vector3
  mesh: THREE.Mesh | null
  startTime: number
}

interface SceneContentProps {
  particleCount: number
  forceStrength: number
  colorScheme: ColorScheme
  resetTrigger: number
  onReady: (callbacks: {
    handleClick: (pos: THREE.Vector3) => void
  }) => void
}

function ContainerBox() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[20, 20, 20]} />
        <meshBasicMaterial color={0x4B5563} wireframe={true} transparent opacity={0.3} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(20, 20, 20)]} />
        <lineBasicMaterial color={0x4B5563} linewidth={1} />
      </lineSegments>
    </group>
  )
}

function Ripple({ effect, onComplete }: { effect: RippleEffect; onComplete: (id: number) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const startTime = useRef(performance.now())

  useFrame(() => {
    if (!meshRef.current) return
    const elapsed = (performance.now() - startTime.current) / 1000
    const duration = 2
    const progress = Math.min(1, elapsed / duration)

    const maxRadius = 10
    const currentRadius = progress * maxRadius

    meshRef.current.scale.setScalar(currentRadius * 0.2 + 0.01)
    const material = meshRef.current.material as THREE.MeshBasicMaterial
    material.opacity = (1 - progress) * 0.8

    if (progress >= 1) {
      onComplete(effect.id)
    }
  })

  return (
    <mesh ref={meshRef} position={effect.position.toArray() as [number, number, number]}>
      <torusGeometry args={[1, 0.05, 16, 64]} />
      <meshBasicMaterial
        color={0xF59E0B}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function SceneContent({
  particleCount,
  forceStrength,
  colorScheme,
  resetTrigger,
  onReady
}: SceneContentProps) {
  const { camera, gl, scene } = useThree()
  const particleSystemRef = useRef<ParticleSystem | null>(null)
  const simulationEngineRef = useRef<SimulationEngine | null>(null)
  const interactionHandlerRef = useRef<InteractionHandler | null>(null)
  const threeObjectRef = useRef<THREE.Object3D | null>(null)
  const [ripples, setRipples] = useState<RippleEffect[]>([])
  const rippleIdRef = useRef(0)

  useEffect(() => {
    const particleSystem = new ParticleSystem(particleCount, 20, colorScheme)
    particleSystemRef.current = particleSystem

    const threeObj = particleSystem.points
    threeObjectRef.current = threeObj
    scene.add(threeObj)

    const simulationEngine = new SimulationEngine(particleSystem, {
      gridSize: 16,
      containerSize: 20,
      relaxation: 0.7,
      gravity: 0
    })
    simulationEngineRef.current = simulationEngine

    const interactionHandler = new InteractionHandler({
      forceRadius: 5,
      forceStrength: forceStrength
    })
    interactionHandler.setCamera(camera)
    interactionHandler.setRenderer(gl)
    interactionHandler.setCanvas(gl.domElement)
    interactionHandler.setSimulationEngine(simulationEngine)
    interactionHandler.setScene(scene)
    interactionHandlerRef.current = interactionHandler

    interactionHandler.setOnClick((pos) => {
      handleRipple(pos)
    })

    onReady({
      handleClick: () => {}
    })

    return () => {
      interactionHandler.dispose()
      if (threeObj) scene.remove(threeObj)
      particleSystem.geometry.dispose()
      ;(particleSystem.points.material as THREE.Material).dispose()
    }
  }, [])

  useEffect(() => {
    if (particleSystemRef.current) {
      if (particleSystemRef.current.count !== particleCount) {
        particleSystemRef.current.resize(particleCount)
      }
    }
  }, [particleCount])

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setColorScheme(colorScheme)
    }
  }, [colorScheme])

  useEffect(() => {
    if (particleSystemRef.current && resetTrigger > 0) {
      particleSystemRef.current.reset()
    }
  }, [resetTrigger])

  useEffect(() => {
    if (interactionHandlerRef.current) {
      interactionHandlerRef.current.setForceStrength(forceStrength)
    }
  }, [forceStrength])

  const handleRipple = useCallback((position: THREE.Vector3) => {
    const id = rippleIdRef.current++
    setRipples(prev => [...prev, {
      id,
      position: position.clone(),
      mesh: null,
      startTime: performance.now()
    }])
  }, [])

  const removeRipple = useCallback((id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id))
  }, [])

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.05)

    if (simulationEngineRef.current) {
      const start = performance.now()
      simulationEngineRef.current.update(clampedDelta)
      const elapsed = performance.now() - start
      if (elapsed > 8) {
        // console.warn(`Simulation took ${elapsed.toFixed(1)}ms (target: <8ms)`)
      }
    }

    if (particleSystemRef.current) {
      particleSystemRef.current.update(clampedDelta)
    }

    if (interactionHandlerRef.current) {
      interactionHandlerRef.current.update(clampedDelta, performance.now())
    }
  })

  return (
    <>
      <ContainerBox />
      {ripples.map(ripple => (
        <Ripple key={ripple.id} effect={ripple} onComplete={removeRipple} />
      ))}
    </>
  )
}

function ControlPanel({
  particleCount,
  setParticleCount,
  forceStrength,
  setForceStrength,
  colorScheme,
  setColorScheme,
  onReset
}: {
  particleCount: number
  setParticleCount: (n: number) => void
  forceStrength: number
  setForceStrength: (n: number) => void
  colorScheme: ColorScheme
  setColorScheme: (s: ColorScheme) => void
  onReset: () => void
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 24,
    left: 24,
    zIndex: 100,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 16,
    padding: isCollapsed || !isMobile ? 16 : 16,
    minWidth: isCollapsed ? 'auto' : 280,
    maxWidth: isMobile ? 'calc(100% - 48px)' : 320,
    color: '#E2E8F0',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 32px rgba(0, 0, 0, 0.4)'
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: 16
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
    color: '#CBD5E1',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  }

  const valueStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: '#818CF8'
  }

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  } as React.CSSProperties

  const buttonBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 8,
    backgroundColor: '#334155',
    color: '#E2E8F0',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  }

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    color: '#fff'
  }

  if (isMobile && isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 100,
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(12px)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="18" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="6" cy="18" r="2" />
        </svg>
      </button>
    )
  }

  return (
    <div style={panelStyle}>
      {isMobile && (
        <div
          onClick={() => setIsCollapsed(true)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: '#334155',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #6366F1, #EC4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          marginBottom: 4
        }}>
          流体粒子沙盒
        </h3>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
          拖拽产生力场 · 点击产生爆发
        </p>
      </div>

      <div style={sectionStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>粒子数量</span>
          <span style={valueStyle}>{particleCount.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={10000}
          step={500}
          value={particleCount}
          onChange={(e) => setParticleCount(Number(e.target.value))}
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#475569')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
        />
      </div>

      <div style={sectionStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>力场强度</span>
          <span style={valueStyle}>{forceStrength}</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={1}
          value={forceStrength}
          onChange={(e) => setForceStrength(Number(e.target.value))}
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#475569')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
        />
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>颜色方案</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={() => setColorScheme(WARM_SCHEME)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: colorScheme === WARM_SCHEME ? '#475569' : '#334155',
              border: colorScheme === WARM_SCHEME ? '2px solid #F59E0B' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (colorScheme !== WARM_SCHEME) e.currentTarget.style.backgroundColor = '#475569'
            }}
            onMouseLeave={(e) => {
              if (colorScheme !== WARM_SCHEME) e.currentTarget.style.backgroundColor = '#334155'
            }}
          >
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF6B35' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} />
            </div>
            <span style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 500 }}>暖色</span>
          </button>

          <button
            onClick={() => setColorScheme(COOL_SCHEME)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: colorScheme === COOL_SCHEME ? '#475569' : '#334155',
              border: colorScheme === COOL_SCHEME ? '2px solid #8B5CF6' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (colorScheme !== COOL_SCHEME) e.currentTarget.style.backgroundColor = '#475569'
            }}
            onMouseLeave={(e) => {
              if (colorScheme !== COOL_SCHEME) e.currentTarget.style.backgroundColor = '#334155'
            }}
          >
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3B82F6' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EC4899' }} />
            </div>
            <span style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 500 }}>冷色</span>
          </button>
        </div>
      </div>

      <button
        onClick={onReset}
        style={primaryButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        重置粒子
      </button>

      <div style={{
        marginTop: 20,
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(51, 65, 85, 0.5)',
        fontSize: 11,
        color: '#94A3B8',
        lineHeight: 1.6
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            backgroundColor: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            flexShrink: 0
          }}>🖱️</div>
          <div>
            <div style={{ color: '#CBD5E1', fontWeight: 500 }}>拖拽</div>
            <div>产生斥力场，按住 Shift 为吸引力</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            backgroundColor: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            flexShrink: 0
          }}>👆</div>
          <div>
            <div style={{ color: '#CBD5E1', fontWeight: 500 }}>点击</div>
            <div>产生爆炸脉冲</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [particleCount, setParticleCount] = useState(3000)
  const [forceStrength, setForceStrength] = useState(50)
  const [colorScheme, setColorScheme] = useState<ColorScheme>(WARM_SCHEME)
  const [resetTrigger, setResetTrigger] = useState(0)
  const readyCallbacksRef = useRef<{ handleClick: (pos: THREE.Vector3) => void } | null>(null)

  const handleReset = useCallback(() => {
    setResetTrigger(prev => prev + 1)
  }, [])

  const handleReady = useCallback((callbacks: { handleClick: (pos: THREE.Vector3) => void }) => {
    readyCallbacksRef.current = callbacks
  }, [])

  const sliderStyles = `
    input[type=range] {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
    }
    input[type=range]::-webkit-slider-runnable-track {
      height: 6px;
      border-radius: 8px;
      background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 var(--value, 50%), #334155 var(--value, 50%));
    }
    input[type=range]::-moz-range-track {
      height: 6px;
      border-radius: 8px;
      background: #334155;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #6366F1;
      margin-top: -6px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
      transition: transform 0.2s ease;
    }
    input[type=range]::-webkit-slider-thumb:hover {
      transform: scale(1.15);
    }
    input[type=range]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #6366F1;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
    }
  `

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <style>{sliderStyles}</style>
      <ControlPanel
        particleCount={particleCount}
        setParticleCount={setParticleCount}
        forceStrength={forceStrength}
        setForceStrength={setForceStrength}
        colorScheme={colorScheme}
        setColorScheme={setColorScheme}
        onReset={handleReset}
      />
      <Canvas
        camera={{
          position: [0, 0, 30],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{
          background: 'linear-gradient(135deg, #0A0A1A 0%, #1A1A3A 100%)'
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <SceneContent
          particleCount={particleCount}
          forceStrength={forceStrength}
          colorScheme={colorScheme}
          resetTrigger={resetTrigger}
          onReady={handleReady}
        />
      </Canvas>
    </div>
  )
}
