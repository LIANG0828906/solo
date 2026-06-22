import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Planet from './Planet'
import Controls from './Controls'
import { generateStarSystem, type PlanetData, type StarSystemData } from './StarSystem'

function cubicBezierEase(t: number): number {
  const p0 = 0
  const p1 = 0.34
  const p2 = 0.64
  const p3 = 1

  const t2 = t * t
  const t3 = t2 * t
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt

  return p0 * mt3 + 3 * p1 * mt2 * t + 3 * p2 * mt * t2 + p3 * t3
}

interface CameraControllerProps {
  targetPosition: THREE.Vector3
  targetLookAt: THREE.Vector3
  isAnimating: boolean
  animationDuration: number
  onAnimationComplete: () => void
}

function CameraController({
  targetPosition,
  targetLookAt,
  isAnimating,
  animationDuration,
  onAnimationComplete
}: CameraControllerProps) {
  const { camera } = useThree()
  const animationRef = useRef<{
    startPos: THREE.Vector3
    startLook: THREE.Vector3
    startTime: number
    active: boolean
  } | null>(null)

  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    if (isAnimating) {
      animationRef.current = {
        startPos: camera.position.clone(),
        startLook: currentLookAt.current.clone(),
        startTime: performance.now(),
        active: true
      }
    }
  }, [isAnimating, targetPosition, targetLookAt, camera.position])

  useFrame(() => {
    if (animationRef.current?.active) {
      const { startPos, startLook, startTime } = animationRef.current
      const elapsed = (performance.now() - startTime) / 1000
      const progress = Math.min(elapsed / animationDuration, 1)
      const easedProgress = cubicBezierEase(progress)

      camera.position.lerpVectors(startPos, targetPosition, easedProgress)

      currentLookAt.current.lerpVectors(startLook, targetLookAt, easedProgress)
      camera.lookAt(currentLookAt.current)

      if (progress >= 1) {
        animationRef.current.active = false
        onAnimationComplete()
      }
    } else {
      camera.lookAt(currentLookAt.current)
    }
  })

  return null
}

function StarParticles() {
  const particlesRef = useRef<THREE.Points>(null)

  const { positions, sizes } = useMemo(() => {
    const count = 200
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const r = 15 * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i] = 0.02 + Math.random() * 0.06
    }

    return { positions, sizes }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, sizes])

  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0001
    }
  })

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        color="#FFFFFF"
        size={0.05}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

function StarGlow() {
  const spriteRef = useRef<THREE.Sprite>(null)

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    gradient.addColorStop(0, 'rgba(253, 224, 71, 0.6)')
    gradient.addColorStop(0.3, 'rgba(253, 224, 71, 0.3)')
    gradient.addColorStop(0.6, 'rgba(253, 224, 71, 0.1)')
    gradient.addColorStop(1, 'rgba(253, 224, 71, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)

    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <sprite ref={spriteRef} scale={[6, 6, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  )
}

function Scene({
  starSystem,
  selectedPlanetId,
  isOnSurface,
  onPlanetHover,
  onPlanetClick
}: {
  starSystem: StarSystemData
  selectedPlanetId: number | null
  isOnSurface: boolean
  onPlanetHover: (planet: PlanetData | null, event?: MouseEvent) => void
  onPlanetClick: (planet: PlanetData) => void
}) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={2.0} distance={50} color="#FDE047" />

      <StarParticles />

      <mesh>
        <sphereGeometry args={[starSystem.star.radius, 64, 64]} />
        <meshBasicMaterial color={starSystem.star.color} />
      </mesh>
      <StarGlow />

      {starSystem.planets.map((planet) => (
        <Planet
          key={planet.id}
          data={planet}
          isSelected={selectedPlanetId === planet.id}
          showOrbit={!isOnSurface}
          onHover={onPlanetHover}
          onClick={onPlanetClick}
        />
      ))}
    </>
  )
}

function InfoCard({
  planet,
  mousePosition
}: {
  planet: PlanetData
  mousePosition: { x: number; y: number }
}) {
  return (
    <div
      style={{
        position: 'fixed',
        left: `${mousePosition.x + 15}px`,
        top: `${mousePosition.y + 15}px`,
        backgroundColor: '#1E293B',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        pointerEvents: 'none',
        zIndex: 200,
        minWidth: '180px'
      }}
    >
      <div
        style={{
          color: '#F1F5F9',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: planet.color,
            boxShadow: `0 0 10px ${planet.color}`
          }}
        />
        {planet.name}
      </div>
      <div
        style={{
          color: '#94A3B8',
          fontSize: '13px',
          lineHeight: 1.6
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
          <span>半径</span>
          <span style={{ color: '#E2E8F0' }}>{planet.radius.toFixed(2)} 单位</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
          <span>轨道半径</span>
          <span style={{ color: '#E2E8F0' }}>{planet.orbitRadius.toFixed(2)} 单位</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
          <span>公转周期</span>
          <span style={{ color: '#E2E8F0' }}>{planet.orbitPeriod.toLocaleString()} 地球日</span>
        </div>
      </div>
    </div>
  )
}

const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 8, 12)
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 0, 0)

export default function App() {
  const [starSystem] = useState<StarSystemData>(() => generateStarSystem())
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null)
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetData | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isOnSurface, setIsOnSurface] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationDuration, setAnimationDuration] = useState(1.5)

  const [cameraTargetPosition, setCameraTargetPosition] = useState(INITIAL_CAMERA_POSITION.clone())
  const [cameraTargetLookAt, setCameraTargetLookAt] = useState(INITIAL_CAMERA_TARGET.clone())

  const planetPositionsRef = useRef<Map<number, THREE.Vector3>>(new Map())

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = performance.now() / 1000
      starSystem.planets.forEach((planet) => {
        const angle = elapsed * planet.orbitSpeed * 0.3
        const pos = new THREE.Vector3(
          Math.cos(angle) * planet.orbitRadius,
          0,
          Math.sin(angle) * planet.orbitRadius
        )
        planetPositionsRef.current.set(planet.id, pos)
      })
    }, 16)

    return () => clearInterval(interval)
  }, [starSystem.planets])

  const handlePlanetHover = useCallback((planet: PlanetData | null, event?: MouseEvent) => {
    setHoveredPlanet(planet)
    if (event) {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (hoveredPlanet) {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [hoveredPlanet])

  const handlePlanetClick = useCallback((planet: PlanetData) => {
    if (isAnimating) return
    setSelectedPlanetId(planet.id)
    triggerJump(planet.id)
  }, [isAnimating])

  const triggerJump = useCallback((planetId: number) => {
    const planet = starSystem.planets.find(p => p.id === planetId)
    if (!planet || isAnimating) return

    const currentPos = planetPositionsRef.current.get(planetId) || new THREE.Vector3(
      planet.orbitRadius,
      0,
      0
    )

    const direction = currentPos.clone().normalize()
    const surfaceOffset = direction.multiplyScalar(planet.radius + 0.5)
    const targetPos = currentPos.clone().add(surfaceOffset)

    const lookTarget = currentPos.clone()

    setCameraTargetPosition(targetPos)
    setCameraTargetLookAt(lookTarget)
    setAnimationDuration(1.5)
    setIsAnimating(true)
    setIsOnSurface(false)
  }, [starSystem.planets, isAnimating])

  const handleReset = useCallback(() => {
    if (isAnimating) return

    setCameraTargetPosition(INITIAL_CAMERA_POSITION.clone())
    setCameraTargetLookAt(INITIAL_CAMERA_TARGET.clone())
    setAnimationDuration(0.8)
    setIsAnimating(true)
    setIsOnSurface(false)
  }, [isAnimating])

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false)
    const targetIsInitial = cameraTargetPosition.distanceTo(INITIAL_CAMERA_POSITION) < 0.1
    if (!targetIsInitial) {
      setIsOnSurface(true)
    } else {
      setIsOnSurface(false)
    }
  }, [cameraTargetPosition])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOnSurface && !isAnimating) {
        handleReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOnSurface, isAnimating, handleReset])

  const handleJumpFromControls = useCallback(() => {
    if (selectedPlanetId !== null && !isOnSurface) {
      triggerJump(selectedPlanetId)
    }
  }, [selectedPlanetId, isOnSurface, triggerJump])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{
          position: INITIAL_CAMERA_POSITION,
          fov: 60,
          near: 0.01,
          far: 100
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0F172A' }}
      >
        <Scene
          starSystem={starSystem}
          selectedPlanetId={selectedPlanetId}
          isOnSurface={isOnSurface}
          onPlanetHover={handlePlanetHover}
          onPlanetClick={handlePlanetClick}
        />
        <CameraController
          targetPosition={cameraTargetPosition}
          targetLookAt={cameraTargetLookAt}
          isAnimating={isAnimating}
          animationDuration={animationDuration}
          onAnimationComplete={handleAnimationComplete}
        />
      </Canvas>

      <div
        className="vignette-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          background: `
            radial-gradient(
              ellipse at center,
              transparent 0%,
              transparent 50%,
              rgba(0, 0, 0, 0.7) 100%
            )
          `,
          opacity: isOnSurface ? 1 : 0,
          transition: 'opacity 0.5s ease',
          zIndex: 50
        }}
      />

      {hoveredPlanet && !isOnSurface && (
        <InfoCard planet={hoveredPlanet} mousePosition={mousePosition} />
      )}

      <Controls
        planets={starSystem.planets}
        selectedPlanetId={selectedPlanetId}
        isOnSurface={isOnSurface}
        onSelectPlanet={setSelectedPlanetId}
        onJump={handleJumpFromControls}
        onReset={handleReset}
      />
    </div>
  )
}
