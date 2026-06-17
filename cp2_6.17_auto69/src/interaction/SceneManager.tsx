import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore, type Particle, type CollisionEvent } from '../store/store'
import { generateParticles, updateParticles, detectCollisions, adjustParticleCount } from '../simulation/particleSystem'
import { getTemperatureColor } from '../simulation/physicsEngine'

const TORUS_MAJOR_RADIUS = 1.5
const TORUS_MINOR_RADIUS = 0.4
const TORUS_TUBULAR_SEGMENTS = 64
const TORUS_RADIAL_SEGMENTS = 32

const CAMERA_ROTATE_H_SPEED = 0.005
const CAMERA_ROTATE_V_SPEED = 0.003
const CAMERA_PAN_SPEED = 0.05
const CAMERA_DISTANCE_MIN = 5
const CAMERA_DISTANCE_MAX = 30
const CAMERA_PHI_LIMIT = Math.PI / 4

const SCAN_LINE_PERIOD = 4000
const FLASH_DURATION = 300
const MARKER_DURATION = 1500

const FUSION_RATE_WINDOW = 1000

export default function SceneManager() {
  const { camera, gl } = useThree()
  const particlesRef = useRef<Particle[]>([])
  const pointsRef = useRef<THREE.Points>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const scanLineMaterialRef = useRef<THREE.LineBasicMaterial>(null)
  const isDraggingRef = useRef(false)
  const isPanningRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const collisionTimestampsRef = useRef<number[]>([])

  const {
    params,
    camera: cameraState,
    collisions,
    setCamera,
    setParticles,
    addCollision,
    addCollisionLog,
    incrementFusion,
    updateFusionRate,
    addTemperatureSample,
  } = useSimulationStore()

  const torusGeometry = useMemo(
    () => new THREE.TorusGeometry(TORUS_MAJOR_RADIUS, TORUS_MINOR_RADIUS, TORUS_TUBULAR_SEGMENTS, TORUS_RADIAL_SEGMENTS),
    []
  )

  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(torusGeometry), [torusGeometry])

  const positions = useMemo(() => new Float32Array(params.particleCount * 3), [params.particleCount])
  const colors = useMemo(() => new Float32Array(params.particleCount * 3), [params.particleCount])
  const sizes = useMemo(() => new Float32Array(params.particleCount), [params.particleCount])

  useEffect(() => {
    particlesRef.current = generateParticles(params.particleCount, params.temperature)
    setParticles(particlesRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    particlesRef.current = adjustParticleCount(particlesRef.current, params.particleCount, params.temperature)
    setParticles(particlesRef.current)
  }, [params.particleCount, params.temperature, setParticles])

  useEffect(() => {
    const canvas = gl.domElement

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true
        lastMousePosRef.current = { x: e.clientX, y: e.clientY }
      } else if (e.button === 2) {
        isPanningRef.current = true
        lastMousePosRef.current = { x: e.clientX, y: e.clientY }
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = false
      } else if (e.button === 2) {
        isPanningRef.current = false
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - lastMousePosRef.current.x
        const deltaY = e.clientY - lastMousePosRef.current.y
        lastMousePosRef.current = { x: e.clientX, y: e.clientY }

        setCamera({
          theta: cameraState.theta + deltaX * CAMERA_ROTATE_H_SPEED,
          phi: Math.max(
            -CAMERA_PHI_LIMIT,
            Math.min(CAMERA_PHI_LIMIT, cameraState.phi + deltaY * CAMERA_ROTATE_V_SPEED)
          ),
        })
      }

      if (isPanningRef.current) {
        const deltaX = e.clientX - lastMousePosRef.current.x
        const deltaY = e.clientY - lastMousePosRef.current.y
        lastMousePosRef.current = { x: e.clientX, y: e.clientY }

        setCamera({
          panX: cameraState.panX - deltaX * CAMERA_PAN_SPEED,
          panY: cameraState.panY + deltaY * CAMERA_PAN_SPEED,
        })
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1 : -1
      setCamera({
        distance: Math.max(
          CAMERA_DISTANCE_MIN,
          Math.min(CAMERA_DISTANCE_MAX, cameraState.distance + delta)
        ),
      })
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }, [cameraState, setCamera, gl.domElement])

  useFrame((_, delta) => {
    const { distance, theta, phi, panX, panY } = useSimulationStore.getState().camera
    const isRunningNow = useSimulationStore.getState().isRunning

    camera.position.x = distance * Math.cos(phi) * Math.sin(theta) + panX
    camera.position.y = distance * Math.sin(phi) + panY
    camera.position.z = distance * Math.cos(phi) * Math.cos(theta)
    camera.lookAt(panX, panY, 0)

    if (scanLineMaterialRef.current) {
      const time = Date.now()
      const scanProgress = (time % SCAN_LINE_PERIOD) / SCAN_LINE_PERIOD
      const opacity = Math.sin(scanProgress * Math.PI) * 0.8 + 0.2
      scanLineMaterialRef.current.opacity = opacity
    }

    if (!isRunningNow) return

    particlesRef.current = updateParticles(particlesRef.current, params, delta)
    setParticles(particlesRef.current)

    const particles = particlesRef.current
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      positions[i * 3] = p.position.x
      positions[i * 3 + 1] = p.position.y
      positions[i * 3 + 2] = p.position.z

      const color = getTemperatureColor(p.temperature)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = p.size
    }

    if (geometryRef.current) {
      geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometryRef.current.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
      geometryRef.current.attributes.position.needsUpdate = true
      geometryRef.current.attributes.color.needsUpdate = true
      geometryRef.current.attributes.size.needsUpdate = true
    }

    const collisionsDetected = detectCollisions(particles)
    const now = Date.now()

    for (const collision of collisionsDetected) {
      if (Math.random() * 100 < params.fusionProbability) {
        addCollision({ position: collision.position, type: 'flash' })
        addCollision({ position: collision.position, type: 'marker' })
        incrementFusion()
        addCollisionLog(collision.position)
        collisionTimestampsRef.current.push(now)
      }
    }

    collisionTimestampsRef.current = collisionTimestampsRef.current.filter(
      (t) => now - t < FUSION_RATE_WINDOW
    )
    const fusionRate = collisionTimestampsRef.current.length
    updateFusionRate(fusionRate)

    if (particles.length > 0) {
      const avgTemp = particles.reduce((sum, p) => sum + p.temperature, 0) / particles.length
      addTemperatureSample(avgTemp)
    }
  })

  const renderCollisions = () => {
    const now = Date.now()
    return collisions.map((collision: CollisionEvent) => {
      const age = now - collision.timestamp

      if (collision.type === 'flash') {
        if (age > FLASH_DURATION) return null
        const opacity = 1 - age / FLASH_DURATION
        return (
          <mesh key={collision.id} position={[collision.position.x, collision.position.y, collision.position.z]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
          </mesh>
        )
      }

      if (collision.type === 'marker') {
        if (age > MARKER_DURATION) return null
        const opacity = 1 - age / MARKER_DURATION
        return (
          <mesh key={collision.id} position={[collision.position.x, collision.position.y, collision.position.z]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#FFD700" transparent opacity={opacity} />
          </mesh>
        )
      }

      return null
    })
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <mesh geometry={torusGeometry} frustumCulled>
        <meshStandardMaterial
          color="#2A4A7F"
          transparent
          opacity={0.3}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <lineSegments geometry={edgesGeometry} frustumCulled>
        <lineBasicMaterial ref={scanLineMaterialRef} color="#4FC3F7" transparent opacity={0.6} />
      </lineSegments>

      <points ref={pointsRef} frustumCulled>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute attach="attributes-position" count={params.particleCount} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={params.particleCount} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={params.particleCount} array={sizes} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {renderCollisions()}
    </>
  )
}
