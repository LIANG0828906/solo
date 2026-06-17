import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer'
import { useGameStore, PRESET_BEATMAP } from '../stores/gameStore'

const TRACK_WIDTH = 6
const TRACK_LENGTH = 800
const PLAYER_Z = -8
const SCROLL_SPEED = 10
const PERFECT_WINDOW = 150
const NORMAL_WINDOW = 300

function Starfield() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = 200
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const positions = useMemo(() => {
    const arr: [number, number, number, number][] = []
    for (let i = 0; i < count; i++) {
      const r = 80 + Math.random() * 120
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 2
      arr.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.5 + 20,
        r * Math.sin(phi) * Math.sin(theta),
        2 + Math.random() * 3,
      ])
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime() * 0.02
    for (let i = 0; i < count; i++) {
      const [x, y, z, size] = positions[i]
      const rotT = t + i * 0.01
      const nx = x * Math.cos(rotT) - z * Math.sin(rotT)
      const nz = x * Math.sin(rotT) + z * Math.cos(rotT)
      dummy.position.set(nx, y, nz)
      dummy.scale.setScalar(size)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </instancedMesh>
  )
}

function Track() {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const gridRef = useRef<THREE.GridHelper>(null)

  const neonPhase = useGameStore(s => s.neonPhase)

  const { leftNeonLine, rightNeonLine, leftMaterial, rightMaterial } = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let z = 0; z <= TRACK_LENGTH; z += 2) {
      points.push(new THREE.Vector3(0, 0.01, -z))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const matL = new THREE.LineBasicMaterial({ color: '#FF69B4', transparent: true, opacity: 0.8 })
    const matR = new THREE.LineBasicMaterial({ color: '#00BFFF', transparent: true, opacity: 0.8 })
    const lineL = new THREE.Line(geo, matL)
    const lineR = new THREE.Line(geo.clone(), matR)
    lineL.position.set(-TRACK_WIDTH / 2 - 0.05, 0.02, 0)
    lineR.position.set(TRACK_WIDTH / 2 + 0.05, 0.02, 0)
    return { leftNeonLine: lineL, rightNeonLine: lineR, leftMaterial: matL, rightMaterial: matR }
  }, [])

  useFrame(() => {
    if (!materialRef.current) return
    const intensity = (Math.sin(neonPhase) + 1) / 2
    const pink = new THREE.Color('#FF69B4')
    const blue = new THREE.Color('#00BFFF')
    const mix = (Math.sin(neonPhase) + 1) / 2
    leftMaterial.color.copy(pink).lerp(blue, mix)
    rightMaterial.color.copy(blue).lerp(pink, mix)
    leftMaterial.opacity = 0.6 + intensity * 0.4
    rightMaterial.opacity = 0.6 + intensity * 0.4
    if (gridRef.current) {
      const g = gridRef.current.material as THREE.Material
      if (g) g.opacity = 0.15
    }
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -TRACK_LENGTH / 2]}>
        <planeGeometry args={[TRACK_WIDTH, TRACK_LENGTH, 1, 200]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#1A2A4A"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>

      <gridHelper
        ref={gridRef}
        args={[TRACK_LENGTH * 1.5, 80, '#2A4A7A', '#1A3A5A']}
        position={[0, -0.05, -TRACK_LENGTH / 2]}
      />

      <primitive object={leftNeonLine} />
      <primitive object={rightNeonLine} />
    </group>
  )
}

function Player() {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.MeshStandardMaterial>(null)
  const bodyRef = useRef<THREE.MeshStandardMaterial>(null)

  const gameTime = useGameStore(s => s.gameTime)
  const playerAction = useGameStore(s => s.playerAction)
  const playerActionStart = useGameStore(s => s.playerActionStart)
  const perfectFlash = useGameStore(s => s.perfectFlash)
  const dominantFreq = useGameStore(s => s.dominantFreq)

  const screenShake = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useFrame(({ camera }) => {
    if (!groupRef.current) return

    let y = 0
    let scaleY = 1
    let scaleX = 1

    if (playerAction === 'jumping') {
      const elapsed = gameTime - playerActionStart
      const progress = Math.min(1, elapsed / 400)
      y = Math.sin(progress * Math.PI) * 2.5
    } else if (playerAction === 'sliding') {
      const elapsed = gameTime - playerActionStart
      const progress = Math.min(1, elapsed / 300)
      const easing = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      scaleY = 1 - easing * 0.7
      scaleX = 1 + easing * 0.3
      y = -0.3 * easing
    }

    groupRef.current.position.y = y
    groupRef.current.scale.set(scaleX, scaleY, scaleX)

    if (glowRef.current) {
      if (perfectFlash) {
        const elapsed = gameTime - (useGameStore.getState().perfectFlashTime || 0)
        const alpha = Math.max(0, 1 - elapsed / 500)
        const hue = 0.5 + dominantFreq * 0.5
        const color = new THREE.Color().setHSL(hue, 1, 0.6)
        glowRef.current.emissive.copy(color)
        glowRef.current.emissiveIntensity = 2 * alpha
        glowRef.current.opacity = 0.4 * alpha
      } else {
        glowRef.current.emissiveIntensity = 0
        glowRef.current.opacity = 0
      }
    }

    if (bodyRef.current && perfectFlash) {
      const elapsed = gameTime - (useGameStore.getState().perfectFlashTime || 0)
      const alpha = Math.max(0, 1 - elapsed / 500)
      const hue = 0.5 + dominantFreq * 0.5
      const color = new THREE.Color().setHSL(hue, 1, 0.6)
      bodyRef.current.emissive.lerp(color, alpha * 0.5)
    } else if (bodyRef.current) {
      bodyRef.current.emissive.set('#001133')
    }

    const shakePhase = gameTime * 0.002 * 2 * Math.PI
    const shakeAmp = perfectFlash ? 0.08 : 0.02
    screenShake.current.x = Math.sin(shakePhase) * shakeAmp
    screenShake.current.y = Math.cos(shakePhase * 1.3) * shakeAmp

    camera.position.x = screenShake.current.x
    camera.position.y = 5 + screenShake.current.y
  })

  return (
    <group ref={groupRef} position={[0, 0, PLAYER_Z]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial
          ref={bodyRef}
          color="#4A90D9"
          emissive="#001133"
          emissiveIntensity={0.3}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1.4, 2.8, 1.4]} />
        <meshStandardMaterial
          ref={glowRef}
          color="#00BFFF"
          emissive="#00BFFF"
          emissiveIntensity={0}
          transparent
          opacity={0}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial
          color="#5AA0E9"
          emissive="#002255"
          emissiveIntensity={0.2}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      <mesh position={[-0.18, 2.55, 0.38]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#00BFFF" />
      </mesh>
      <mesh position={[0.18, 2.55, 0.38]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#00BFFF" />
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
  const playerActionStart = useGameStore(s => s.playerActionStart)

  const [isVisible, setIsVisible] = useState(true)
  const processedRef = useRef(false)

  useFrame(() => {
    if (!groupRef.current) return

    const distToPlayer = currentZ - PLAYER_Z

    if (distToPlayer < -8 || obstacle.judged) {
      if (obstacle.judged) {
        const mat = groupRef.current.children[0] as THREE.Mesh
        if (mat && mat.material) {
          const m = Array.isArray(mat.material) ? mat.material[0] : mat.material as THREE.MeshStandardMaterial
          if (m.opacity !== undefined) {
            m.opacity = Math.max(0, m.opacity - 0.05)
          }
        }
      }
    }

    if (processedRef.current) return

    if (distToPlayer <= 0 && !obstacle.judged) {
      processedRef.current = true
      const timeDiff = Math.abs(gameTime - obstacle.beatTime)

      const playerIsJumping = playerAction === 'jumping'
      const playerIsSliding = playerAction === 'sliding'

      let correctAction = false
      if (obstacle.type === 'block') {
        correctAction = playerIsJumping
      } else {
        correctAction = playerIsSliding
      }

      if (timeDiff <= PERFECT_WINDOW && correctAction) {
        judgeObstacle(obstacle.id, 'perfect')
      } else if (timeDiff <= NORMAL_WINDOW && correctAction) {
        judgeObstacle(obstacle.id, 'normal')
      } else if (!correctAction && Math.abs(distToPlayer) < 2) {
        missObstacle(obstacle.id)
      } else {
        missObstacle(obstacle.id)
      }
    }
  })

  if (!isVisible && currentZ > 30) return null

  const color = obstacle.type === 'block' ? '#FF69B4' : '#00BFFF'

  return (
    <group ref={groupRef} position={[0, 0, currentZ]}>
      {obstacle.type === 'block' ? (
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[2.2, 2, 1.5]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
            metalness={0.5}
            roughness={0.3}
            transparent
            opacity={0.9}
          />
        </mesh>
      ) : (
        <group>
          <mesh position={[-1.8, 1.8, 0]} castShadow>
            <boxGeometry args={[0.4, 3.6, 1.2]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              metalness={0.5}
              roughness={0.3}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[1.8, 1.8, 0]} castShadow>
            <boxGeometry args={[0.4, 3.6, 1.2]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              metalness={0.5}
              roughness={0.3}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[0, 3.4, 0]} castShadow>
            <boxGeometry args={[4, 0.4, 1.2]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.6}
              metalness={0.5}
              roughness={0.3}
              transparent
              opacity={0.9}
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

  const scrollOffset = -(gameTime / 1000) * SCROLL_SPEED

  const visibleObstacles = useMemo(() => {
    return obstacles.filter(obs => {
      const worldZ = obs.z + scrollOffset
      return worldZ < 30 && worldZ > -50
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
    cam.lookAt(0, 1.5, PLAYER_Z - 5)
    cam.fov = 65
    cam.updateProjectionMatrix()
  }, [camera])

  useFrame(() => {
    camera.lookAt(0, 1.5, PLAYER_Z - 5)
  })

  return null
}

function Scene() {
  useAudioAnalyzer()

  const jump = useGameStore(s => s.jump)
  const slide = useGameStore(s => s.slide)
  const pauseGame = useGameStore(s => s.pauseGame)
  const status = useGameStore(s => s.status)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (status === 'playing' || status === 'idle') {
          jump()
        }
      } else if (e.code === 'ArrowDown' || e.key === 'ArrowDown') {
        e.preventDefault()
        slide()
      } else if (e.code === 'Escape') {
        pauseGame()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [jump, slide, pauseGame, status])

  return (
    <>
      <color attach="background" args={['#0B0C1E']} />
      <fog attach="fog" args={['#0B0C1E', 20, 120]} />
      <ambientLight intensity={0.3} color="#4466AA" />
      <directionalLight
        position={[5, 15, 5]}
        intensity={0.8}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 8, PLAYER_Z]} intensity={1.2} color="#00BFFF" distance={40} />
      <pointLight position={[0, 4, PLAYER_Z - 30]} intensity={0.8} color="#FF69B4" distance={50} />

      <CameraController />
      <Starfield />
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
      camera={{ position: [0, 5, 20], fov: 65, near: 0.1, far: 500 }}
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0, background: '#0B0C1E' }}
    >
      <Scene />
    </Canvas>
  )
}
