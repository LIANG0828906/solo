import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { ExhibitionDetail, Exhibit } from '../types'
import DanmakuOverlay from './DanmakuOverlay'
import './ExhibitionViewer.css'

const ROOM_SIZE = 20
const WALL_HEIGHT = 6

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  
  return isMobile
}

function FootstepsSound() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastStepRef = useRef(0)

  const playStep = () => {
    const now = performance.now()
    if (now - lastStepRef.current < 300) return
    lastStepRef.current = now

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(80 + Math.random() * 40, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  }

  return playStep
}

function FirstPersonController({ isMobile }: { isMobile: boolean }) {
  const { camera, gl } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const keys = useRef({ w: false, a: false, s: false, d: false })
  const playStep = FootstepsSound()

  useEffect(() => {
    if (isMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isMobile])

  useFrame((_, delta) => {
    if (isMobile) return

    const speed = 8
    const direction = new THREE.Vector3()
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()

    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    if (keys.current.w) direction.add(forward)
    if (keys.current.s) direction.sub(forward)
    if (keys.current.d) direction.add(right)
    if (keys.current.a) direction.sub(right)

    if (direction.length() > 0) {
      direction.normalize()
      playStep()
    }

    velocity.current.copy(direction).multiplyScalar(speed * delta)

    const newPos = camera.position.clone().add(velocity.current)
    const halfRoom = ROOM_SIZE / 2 - 1
    newPos.x = Math.max(-halfRoom, Math.min(halfRoom, newPos.x))
    newPos.z = Math.max(-halfRoom, Math.min(halfRoom, newPos.z))
    newPos.y = 1.7

    camera.position.copy(newPos)
  })

  return null
}

function ExhibitFrame({ 
  exhibit, 
  position, 
  rotation = [0, 0, 0],
  onNear
}: { 
  exhibit: Exhibit
  position: [number, number, number]
  rotation?: [number, number, number]
  onNear: (exhibit: Exhibit | null) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const texture = useMemo(() => {
    if (!exhibit.image_data) return null
    const loader = new THREE.TextureLoader()
    return loader.load(exhibit.image_data)
  }, [exhibit.image_data])

  useFrame(() => {
    if (meshRef.current) {
      const distance = camera.position.distanceTo(meshRef.current.position)
      if (distance < 4) {
        onNear(exhibit)
      }
    }
  })

  return (
    <group position={position} rotation={rotation as any}>
      <mesh ref={meshRef} position={[0, 1.5, 0.01]}>
        <planeGeometry args={[2.5, 2]} />
        {texture ? (
          <meshBasicMaterial map={texture} />
        ) : (
          <meshStandardMaterial color="#d4af37" />
        )}
      </mesh>
      
      <mesh position={[0, 1.5, -0.05]}>
        <boxGeometry args={[2.8, 2.3, 0.1]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>

      <Text
        position={[0, 0, 0.06]}
        fontSize={0.2}
        color="#d4af37"
        anchorX="center"
        anchorY="middle"
      >
        {exhibit.title}
      </Text>

      <pointLight 
        position={[0, 2.5, 1.5]} 
        intensity={1.5} 
        color="#fff5e1"
        distance={5}
      />
    </group>
  )
}

function Room() {
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f5f0e8'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#e8e0d5'
    for (let i = 0; i < 50; i++) {
      ctx.fillRect(
        Math.random() * 256,
        Math.random() * 256,
        Math.random() * 20 + 5,
        1
      )
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(5, 5)
    return texture
  }, [])

  const wallTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f8f4ef'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#eee9e3'
    for (let i = 0; i < 30; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 3 + 1, 0, Math.PI * 2)
      ctx.fill()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 2)
    return texture
  }, [])

  const halfRoom = ROOM_SIZE / 2

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial map={floorTexture} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, -halfRoom]}>
        <planeGeometry args={[ROOM_SIZE, WALL_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, halfRoom]}>
        <planeGeometry args={[ROOM_SIZE, WALL_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[-halfRoom, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_SIZE, WALL_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[halfRoom, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_SIZE, WALL_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial color="#f0ebe4" side={THREE.DoubleSide} />
      </mesh>

      <pointLight position={[0, WALL_HEIGHT - 0.5, 0]} intensity={0.8} color="#fff5e1" />
    </group>
  )
}

function Scene({ 
  exhibits, 
  isMobile,
  onNearExhibit 
}: { 
  exhibits: Exhibit[]
  isMobile: boolean
  onNearExhibit: (exhibit: Exhibit | null) => void
}) {
  const halfRoom = ROOM_SIZE / 2
  const cellSize = ROOM_SIZE / 8

  const getExhibitPosition = (exhibit: Exhibit): {
    position: [number, number, number]
    rotation: [number, number, number]
  } => {
    const x = (exhibit.grid_x - 3.5) * cellSize
    const z = (exhibit.grid_y - 3.5) * cellSize

    const side = exhibit.wall_side || 'north'
    let position: [number, number, number] = [x, 0, z]
    let rotation: [number, number, number] = [0, 0, 0]

    switch (side) {
      case 'north':
        position = [x, 0, -halfRoom + 0.2]
        rotation = [0, 0, 0]
        break
      case 'south':
        position = [x, 0, halfRoom - 0.2]
        rotation = [0, Math.PI, 0]
        break
      case 'east':
        position = [halfRoom - 0.2, 0, z]
        rotation = [0, -Math.PI / 2, 0]
        break
      case 'west':
        position = [-halfRoom + 0.2, 0, z]
        rotation = [0, Math.PI / 2, 0]
        break
    }

    return { position, rotation }
  }

  const getWallSide = (exhibit: Exhibit): 'north' | 'south' | 'east' | 'west' => {
    if (exhibit.grid_y <= 1) return 'north'
    if (exhibit.grid_y >= 6) return 'south'
    if (exhibit.grid_x >= 6) return 'east'
    if (exhibit.grid_x <= 1) return 'west'
    return 'north'
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <Room />
      {exhibits.map(exhibit => {
        const wallSide = getWallSide(exhibit)
        const { position, rotation } = getExhibitPosition({ ...exhibit, wall_side: wallSide })
        return (
          <ExhibitFrame
            key={exhibit.id}
            exhibit={exhibit}
            position={position}
            rotation={rotation}
            onNear={onNearExhibit}
          />
        )
      })}
      <FirstPersonController isMobile={isMobile} />
      {isMobile ? (
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={15}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.5}
          autoRotate
          autoRotateSpeed={0.5}
        />
      ) : (
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={15}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
      )}
    </>
  )
}

function ExhibitionViewer() {
  const { id } = useParams<{ id: string }>()
  const [exhibition, setExhibition] = useState<ExhibitionDetail | null>(null)
  const [exhibits, setExhibits] = useState<Exhibit[]>([])
  const [nearExhibit, setNearExhibit] = useState<Exhibit | null>(null)
  const [selectedExhibit, setSelectedExhibit] = useState<Exhibit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDanmaku, setShowDanmaku] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!id) return
    fetch(`/api/exhibitions/${id}`)
      .then(res => res.json())
      .then(data => {
        setExhibition(data)
        setExhibits(data.exhibits || [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [id])

  const handleNearExhibit = (exhibit: Exhibit | null) => {
    setNearExhibit(exhibit)
  }

  if (isLoading) {
    return <div className="viewer-loading">加载中...</div>
  }

  if (!exhibition) {
    return <div className="viewer-loading">展览不存在</div>
  }

  return (
    <div className="exhibition-viewer fade-in">
      <div className="viewer-header glass-panel">
        <Link to="/" className="back-link">← 返回</Link>
        <div className="viewer-info">
          <h1 className="viewer-title">{exhibition.name}</h1>
          <p className="viewer-theme">{exhibition.theme}</p>
        </div>
        <div className="viewer-controls">
          <button 
            className="btn-secondary"
            onClick={() => setShowDanmaku(!showDanmaku)}
          >
            {showDanmaku ? '关闭弹幕' : '开启弹幕'}
          </button>
        </div>
      </div>

      <div className="viewer-canvas-container">
        <Canvas
          camera={{ position: [0, 1.7, 8], fov: 75 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#f8f4ef']} />
          <fog attach="fog" args={['#f8f4ef', 10, 30]} />
          <Scene 
            exhibits={exhibits} 
            isMobile={isMobile}
            onNearExhibit={handleNearExhibit}
          />
        </Canvas>

        {nearExhibit && (
          <div className="exhibit-tooltip glass-panel">
            <h3 className="tooltip-title">{nearExhibit.title}</h3>
            <p className="tooltip-desc">{nearExhibit.description}</p>
            <button 
              className="btn-primary tooltip-btn"
              onClick={() => setSelectedExhibit(nearExhibit)}
            >
              查看详情
            </button>
          </div>
        )}

        {showDanmaku && selectedExhibit && (
          <DanmakuOverlay 
            exhibit={selectedExhibit} 
            onClose={() => setSelectedExhibit(null)}
          />
        )}

        {!isMobile && (
          <div className="controls-hint glass-panel">
            <p>🎮 WASD 移动 | 鼠标拖拽旋转视角</p>
          </div>
        )}
      </div>

      <div className="exhibit-list-viewer">
        <h3 className="list-title">展品列表</h3>
        <div className="exhibit-items-row">
          {exhibits.map(exhibit => (
            <div 
              key={exhibit.id}
              className={`exhibit-card ${selectedExhibit?.id === exhibit.id ? 'active' : ''}`}
              onClick={() => setSelectedExhibit(exhibit)}
            >
              {exhibit.image_data ? (
                <img src={exhibit.image_data} alt={exhibit.title} />
              ) : (
                <div className="exhibit-card-placeholder">🖼️</div>
              )}
              <p className="exhibit-card-title">{exhibit.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExhibitionViewer
