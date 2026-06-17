import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer'
import { useGameStore, PRESET_BEATMAP } from '../stores/gameStore'

const TRACK_WIDTH = 6
const SEGMENT_LENGTH = 5
const TOTAL_SEGMENTS = 160
const PLAYER_Z = -8
const SCROLL_SPEED = 10
const PERFECT_WINDOW = 150
const NORMAL_WINDOW = 300

function Track() {
  const groupRef = useRef<THREE.InstancedMesh>(null)
  const gameTime = useGameStore(s => s.gameTime)
  const status = useGameStore(s => s.status)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const segmentColors = useMemo(() => {
    const colors: THREE.Color[] = []
    const start = new THREE.Color('#0A1628')
    const end = new THREE.Color('#3A1A5C')
    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const t = i / TOTAL_SEGMENTS
      const c = start.clone().lerp(end, t)
      colors.push(c)
    }
    return colors
  }, [])

  useFrame(() => {
    if (!groupRef.current) return
    if (status !== 'playing' && status !== 'paused') return

    const offset = ((gameTime / 1000) * SCROLL_SPEED) % SEGMENT_LENGTH

    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const zPos = -i * SEGMENT_LENGTH + offset
      dummy.position.set(0, 0, zPos)
      dummy.scale.set(1, 0.2 + Math.sin(i * 0.3) * 0.05, 1)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      groupRef.current.setMatrixAt(i, dummy.matrix)
    }
    groupRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh
        ref={groupRef}
        args={[undefined, undefined, TOTAL_SEGMENTS]}
        receiveShadow
      >
        <boxGeometry args={[TRACK_WIDTH, 0.3, SEGMENT_LENGTH - 0.1]} />
        <meshStandardMaterial
          vertexColors={false}
          color="#1A2A4A"
          metalness={0.4}
          roughness={0.6}
        />
      </instancedMesh>

      {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => {
        const color = segmentColors[i]
        const scrollOffset = status === 'playing' || status === 'paused'
          ? ((gameTime / 1000) * SCROLL_SPEED) % SEGMENT_LENGTH
          : 0
        return (
          <mesh
            key={`seg-${i}`}
            position={[0, 0.01, -i * SEGMENT_LENGTH + scrollOffset]}
            receiveShadow
          >
            <boxGeometry args={[TRACK_WIDTH * 0.98, 0.05, SEGMENT_LENGTH - 0.2]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.95}
              metalness={0.3}
              roughness={0.5}
              emissive={color}
              emissiveIntensity={0.05}
            />
          </mesh>
        )
      })}

      <gridHelper
        args={[TOTAL_SEGMENTS * SEGMENT_LENGTH * 1.2, 200, '#2A4A7A', '#1A3A5A']}
        position={[0, -0.15, -TOTAL_SEGMENTS * SEGMENT_LENGTH / 2]}
      />
    </group>
  )
}

function Player() {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.MeshStandardMaterial>(null)

  const gameTime = useGameStore(s => s.gameTime)
  const playerAction = useGameStore(s => s.playerAction)
  const playerActionStart = useGameStore(s => s.playerActionStart)
  const perfectFlash = useGameStore(s => s.perfectFlash)
  const perfectFlashTime = useGameStore(s => s.perfectFlashTime)
  const dominantFreq = useGameStore(s => s.dominantFreq)

  useFrame(({ camera }) => {
    if (!groupRef.current) return

    let baseY = 0.5
    let scaleY = 1

    if (playerAction === 'jumping') {
      const elapsed = gameTime - playerActionStart
      const progress = Math.min(1, elapsed / 400)
      baseY = 0.5 + Math.sin(progress * Math.PI) * 2.5
    } else if (playerAction === 'sliding') {
      const elapsed = gameTime - playerActionStart
      const progress = Math.min(1, elapsed / 300)
      scaleY = progress < 0.5
        ? 1 - (2 * progress * progress * 0.7)
        : 0.3 + 2 * Math.pow(progress - 1, 2) * 0.7
      baseY = 0.5 * scaleY
    }

    groupRef.current.position.y = baseY
    groupRef.current.scale.set(1, scaleY, 1)

    if (meshRef.current) {
      if (perfectFlash) {
        const elapsed = gameTime - (perfectFlashTime || 0)
        const alpha = Math.max(0, 1 - elapsed / 500)
        const hue = 0.5 + dominantFreq * 0.5
        const color = new THREE.Color().setHSL(hue, 1, 0.6)
        meshRef.current.emissive.copy(color)
        meshRef.current.emissiveIntensity = 1.2 * alpha
      } else {
        meshRef.current.emissiveIntensity = 0.15
        meshRef.current.emissive.set('#112244')
      }
    }

    const shakePhase = gameTime * 0.004 * Math.PI
    const shakeAmp = perfectFlash ? 0.08 : 0.02
    camera.position.x = Math.sin(shakePhase) * shakeAmp
    camera.position.y = 5 + Math.cos(shakePhase * 1.3) * shakeAmp
  })

  return (
    <group ref={groupRef} position={[0, 0.5, PLAYER_Z]}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 1.8, 0.9]} />
        <meshStandardMaterial
          ref={meshRef}
          color="#5B9BD5"
          emissive="#112244"
          emissiveIntensity={0.15}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

interface ObstacleMeshProps {
  obstacle: {
    id: string
    type: 'block' | 'arch'
    beatTime: number
    z: number
    judged: boolean
    passed: boolean
  }
  scrollOffset: number
}

function ObstacleMesh({ obstacle, scrollOffset }: ObstacleMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const currentZ = obstacle.z + scrollOffset

  const gameTime = useGameStore(s => s.gameTime)
  const judgeObstacle = useGameStore(s => s.judgeObstacle)
  const missObstacle = useGameStore(s => s.missObstacle)
  const playerAction = useGameStore(s => s.playerAction)

  const processedRef = useRef(false)

  useFrame(() => {
    if (!groupRef.current) return
    const distToPlayer = currentZ - PLAYER_Z

    if (obstacle.judged) {
      groupRef.current.children.forEach(child => {
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          const mat = Array.isArray(mesh.material)
            ? (mesh.material[0] as THREE.MeshStandardMaterial)
            : (mesh.material as THREE.MeshStandardMaterial)
          if (mat.opacity !== undefined) {
            mat.opacity = Math.max(0, mat.opacity - 0.06)
          }
        }
      })
    }

    if (processedRef.current) return

    if (distToPlayer <= 0.5 && !obstacle.judged) {
      processedRef.current = true
      const timeDiff = Math.abs(gameTime - obstacle.beatTime)

      const correctAction = obstacle.type === 'block'
        ? playerAction === 'jumping'
        : playerAction === 'sliding'

      if (timeDiff <= PERFECT_WINDOW && correctAction) {
        judgeObstacle(obstacle.id, 'perfect')
      } else if (timeDiff <= NORMAL_WINDOW && correctAction) {
        judgeObstacle(obstacle.id, 'normal')
      } else {
        missObstacle(obstacle.id)
      }
    }
  })

  if (currentZ > 40 || currentZ < -60) return null

  return (
    <group ref={groupRef} position={[0, 0, currentZ]}>
      {obstacle.type === 'block' ? (
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[2, 2, 1.5]} />
          <meshStandardMaterial
            color="#E02020"
            emissive="#800000"
            emissiveIntensity={0.5}
            metalness={0.4}
            roughness={0.4}
            transparent
            opacity={0.95}
          />
        </mesh>
      ) : (
        <group>
          <mesh position={[0, 1.8, 0]} castShadow>
            <torusGeometry args={[2.6, 0.25, 16, 48, Math.PI]} />
            <meshStandardMaterial
              color="#8A2BE2"
              emissive="#4B0082"
              emissiveIntensity={0.6}
              metalness={0.5}
              roughness={0.3}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[-2.4, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3.6, 16]} />
            <meshStandardMaterial
              color="#9932CC"
              emissive="#4B0082"
              emissiveIntensity={0.4}
              metalness={0.5}
              roughness={0.35}
              transparent
              opacity={0.5}
            />
          </mesh>
          <mesh position={[2.4, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3.6, 16]} />
            <meshStandardMaterial
              color="#9932CC"
              emissive="#4B0082"
              emissiveIntensity={0.4}
              metalness={0.5}
              roughness={0.35}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Obstacles() {
  const gameTime = useGameStore(s => s.gameTime)
  const obstacles = useGameStore(s => s.obstacles)
  const status = useGameStore(s => s.status)
  const beatIndexRef = useRef(0)

  const scrollOffset = -(gameTime / 1000) * SCROLL_SPEED

  const visibleObstacles = useMemo(() => {
    return obstacles.filter(obs => {
      const worldZ = obs.z + scrollOffset
      return worldZ < 40 && worldZ > -60
    })
  }, [obstacles, scrollOffset])

  if (status !== 'playing' && status !== 'paused') return null

  return (
    <group>
      {visibleObstacles.map(obs => (
        <ObstacleMesh key={obs.id} obstacle={obs} scrollOffset={scrollOffset} />
      ))}
    </group>
  )
}

function CameraController() {
  const { camera } = useThree()

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.position.set(0, 5, PLAYER_Z + 12)
    cam.lookAt(0, 1.5, PLAYER_Z - 10)
    cam.fov = 68
    cam.updateProjectionMatrix()
  }, [camera])

  useFrame(() => {
    camera.lookAt(0, 1, PLAYER_Z - 10)
  })

  return null
}

function Scene() {
  useAudioAnalyzer()

  const jump = useGameStore(s => s.jump)
  const slide = useGameStore(s => s.slide)
  const pauseGame = useGameStore(s => s.pauseGame)
  const status = useGameStore(s => s.status)
  const startGame = useGameStore(s => s.startGame)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (status === 'idle') {
          startGame()
        } else if (status === 'playing') {
          jump()
        }
      } else if (e.code === 'ArrowDown' || e.key === 'ArrowDown') {
        e.preventDefault()
        if (status === 'playing') {
          slide()
        }
      } else if (e.code === 'Escape') {
        if (status === 'playing') pauseGame()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [jump, slide, pauseGame, status, startGame])

  return (
    <>
      <color attach="background" args={['#080818']} />
      <fog attach="fog" args={['#080818', 25, 140]} />
      <ambientLight intensity={0.35} color="#6677AA" />
      <directionalLight
        position={[8, 18, 8]}
        intensity={0.9}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 6, PLAYER_Z]} intensity={1.4} color="#FF6B9D" distance={35} />
      <pointLight position={[0, 4, PLAYER_Z - 25]} intensity={0.8} color="#7B68EE" distance={45} />

      <CameraController />
      <Track />
      <Player />
      <Obstacles />
    </>
  )
}

export default function GameScene() {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 5, 20], fov: 68, near: 0.1, far: 600 }}
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0, background: '#080818' }}
    >
      <Scene />
    </Canvas>
  )
}
