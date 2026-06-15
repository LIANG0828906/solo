import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'

const CEILING_Y = 3
const MASS_RADIUS = 0.3
const SPRING_COILS = 10
const SPRING_RADIUS = 0.4
const REST_LENGTH = 2.5
const AUTO_ROTATE_SPEED = 0.002
const IDLE_RECOVERY_MS = 5000

interface SpringProps {
  massPosition: number
}

function Spring({ massPosition }: SpringProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const totalLength = REST_LENGTH + massPosition
    const points: THREE.Vector3[] = []
    const segments = 200

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const y = CEILING_Y - t * totalLength
      const angle = t * SPRING_COILS * 2 * Math.PI
      const x = Math.cos(angle) * SPRING_RADIUS
      const z = Math.sin(angle) * SPRING_RADIUS
      points.push(new THREE.Vector3(x, y, z))
    }

    const curve = new THREE.CatmullRomCurve3(points)
    const tubeGeo = new THREE.TubeGeometry(curve, 200, 0.05, 8, false)
    return tubeGeo
  }, [massPosition])

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry.dispose()
      meshRef.current.geometry = geometry
    }
  }, [geometry])

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]}>
      <meshStandardMaterial
        color="#c0c0c0"
        metalness={0.8}
        roughness={0.25}
      />
    </mesh>
  )
}

function Mass({ position }: { position: number }) {
  const y = CEILING_Y - REST_LENGTH - position
  return (
    <group position={[0, y, 0]}>
      <mesh>
        <sphereGeometry args={[MASS_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#ff6347"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      <group position={[0, -MASS_RADIUS - 0.3, 0]}>
        <mesh>
          <coneGeometry args={[0.08, 0.5, 8]} />
          <meshStandardMaterial color="#44ff44" emissive="#22aa22" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
          <meshStandardMaterial color="#44ff44" emissive="#22aa22" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  )
}

function Ceiling() {
  return (
    <mesh position={[0, CEILING_Y + 0.15, 0]}>
      <boxGeometry args={[0.5, 0.3, 0.5]} />
      <meshStandardMaterial color="#666666" metalness={0.4} roughness={0.7} />
    </mesh>
  )
}

function GradientBackground() {
  const { scene } = useThree()
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 256)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    scene.background = texture
    return () => {
      texture.dispose()
    }
  }, [scene])
  return null
}

interface CameraControllerProps {
  controlsRef: React.RefObject<any>
  massPosition: number
}

function CameraController({ controlsRef, massPosition }: CameraControllerProps) {
  const lastInteractionRef = useRef<number>(Date.now())
  const isUserInteractingRef = useRef(false)
  const azimuthRef = useRef(0)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const onStart = () => {
      isUserInteractingRef.current = true
      lastInteractionRef.current = Date.now()
    }
    const onEnd = () => {
      isUserInteractingRef.current = false
      lastInteractionRef.current = Date.now()
    }

    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controlsRef])

  useFrame(({ camera }) => {
    const controls = controlsRef.current
    const now = Date.now()
    const massY = CEILING_Y - REST_LENGTH - massPosition

    if (controls) {
      controls.target.set(0, massY, 0)
      controls.update()
    }

    const idleTime = now - lastInteractionRef.current
    if (!isUserInteractingRef.current && idleTime > IDLE_RECOVERY_MS) {
      azimuthRef.current += AUTO_ROTATE_SPEED
      const radius = camera.position.length()
      const targetY = massY
      const elevationAngle = Math.asin((camera.position.y - targetY) / radius)
      camera.position.x = Math.cos(azimuthRef.current) * radius * Math.cos(elevationAngle)
      camera.position.z = Math.sin(azimuthRef.current) * radius * Math.cos(elevationAngle)
      camera.position.y = targetY + radius * Math.sin(elevationAngle)
      camera.lookAt(0, targetY, 0)
    } else if (controls) {
      const vector = new THREE.Vector3()
      camera.getWorldDirection(vector)
      azimuthRef.current = Math.atan2(camera.position.x, camera.position.z)
    }
  })

  return null
}

interface SceneContentProps {
  massPosition: number
  controlsRef: React.RefObject<any>
}

function SceneContent({ massPosition, controlsRef }: SceneContentProps) {
  return (
    <>
      <GradientBackground />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 3, -5]} intensity={0.5} color="#8899ff" />
      <Ceiling />
      <Spring massPosition={massPosition} />
      <Mass position={massPosition} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={true}
        enableZoom={true}
        minDistance={2}
        maxDistance={15}
        target={[0, CEILING_Y - REST_LENGTH, 0]}
      />
      <CameraController controlsRef={controlsRef} massPosition={massPosition} />
    </>
  )
}

export interface SpringSceneProps {
  position: number
}

export default function SpringScene({ position }: SpringSceneProps) {
  const controlsRef = useRef<any>(null)

  return (
    <Canvas
      camera={{ position: [5, CEILING_Y - REST_LENGTH, 5], fov: 50 }}
      shadows
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <SceneContent massPosition={position} controlsRef={controlsRef} />
    </Canvas>
  )
}
