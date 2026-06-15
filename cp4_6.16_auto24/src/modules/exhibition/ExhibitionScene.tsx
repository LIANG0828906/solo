import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Exhibition, Artwork } from '../../types'
import { useExhibitionStore } from './useExhibitionStore'
import { useAuthStore } from '../auth/useAuthStore'

const WALL_WIDTH = 12
const WALL_HEIGHT = 6
const WALL_DEPTH = 0.2

interface WallData {
  position: [number, number, number]
  rotation: [number, number, number]
}

const WALLS: WallData[] = [
  { position: [0, WALL_HEIGHT / 2, -WALL_WIDTH / 2], rotation: [0, 0, 0] },
  { position: [WALL_WIDTH / 2, WALL_HEIGHT / 2, 0], rotation: [0, -Math.PI / 2, 0] },
  { position: [0, WALL_HEIGHT / 2, WALL_WIDTH / 2], rotation: [0, Math.PI, 0] },
  { position: [-WALL_WIDTH / 2, WALL_HEIGHT / 2, 0], rotation: [0, Math.PI / 2, 0] },
]

interface ArtworkMeshProps {
  artwork: Artwork
  wall: WallData
  wallIndex: number
  onClick: (artwork: Artwork) => void
  isOwner: boolean
  onDragEnd?: (artworkId: string, position: { x: number; y: number; scale: number }) => void
}

function ArtworkMesh({ artwork, wall, wallIndex, onClick, isOwner, onDragEnd }: ArtworkMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const localPosRef = useRef({ x: artwork.position.x, y: artwork.position.y })

  useEffect(() => {
    localPosRef.current = { x: artwork.position.x, y: artwork.position.y }
  }, [artwork.position.x, artwork.position.y])

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(artwork.imageData, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      setTexture(tex)
    })
    return () => {
      if (texture) texture.dispose()
    }
  }, [artwork.imageData])

  const aspectRatio = useMemo(() => {
    if (!texture) return 1
    return texture.image.width / texture.image.height
  }, [texture])

  const baseWidth = 1.2 * artwork.position.scale
  const baseHeight = baseWidth / Math.max(aspectRatio, 0.5)

  const handlePointerDown = (e: any) => {
    if (!isOwner) return
    e.stopPropagation()
    setDragging(true)
    dragStart.current = { x: e.point.x, y: e.point.y }
    ;(e.target as any).setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: any) => {
    if (!dragging || !dragStart.current || !isOwner) return
    e.stopPropagation()
    const dx = (e.point.x - dragStart.current.x) * 0.5
    const dy = (e.point.y - dragStart.current.y) * 0.5
    localPosRef.current.x = Math.max(-WALL_WIDTH / 2 + 1.5, Math.min(WALL_WIDTH / 2 - 1.5, localPosRef.current.x + dx))
    localPosRef.current.y = Math.max(-WALL_HEIGHT / 2 + 1.5, Math.min(WALL_HEIGHT / 2 - 0.5, localPosRef.current.y + dy))
    dragStart.current = { x: e.point.x, y: e.point.y }
    if (meshRef.current) {
      meshRef.current.position.x = localPosRef.current.x
      meshRef.current.position.y = localPosRef.current.y
    }
  }

  const handlePointerUp = (e: any) => {
    if (!dragging || !isOwner) return
    e.stopPropagation()
    setDragging(false)
    dragStart.current = null
    ;(e.target as any).releasePointerCapture?.(e.pointerId)
    if (onDragEnd) {
      onDragEnd(artwork.id, { ...localPosRef.current, scale: artwork.position.scale })
    }
  }

  const scale = hovered && !dragging ? 1.05 : 1

  const worldPosition = useMemo(() => {
    const pos = new THREE.Vector3(artwork.position.x, artwork.position.y, WALL_DEPTH / 2 + 0.01)
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...wall.rotation))
    pos.applyQuaternion(q)
    return [
      pos.x + wall.position[0],
      pos.y + wall.position[1],
      pos.z + wall.position[2],
    ] as [number, number, number]
  }, [artwork.position.x, artwork.position.y, wall])

  return (
    <group position={worldPosition} rotation={wall.rotation}>
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onClick={(e) => {
          if (!dragging) {
            e.stopPropagation()
            onClick(artwork)
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = isOwner && dragging ? 'grabbing' : 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        scale={[scale, scale, scale]}
      >
        <planeGeometry args={[baseWidth, baseHeight]} />
        <meshStandardMaterial
          map={texture}
          color={texture ? '#ffffff' : '#cccccc'}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[baseWidth * 1.08, baseHeight * 1.12]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

interface CameraControllerProps {
  targetArtwork: Artwork | null
  targetWallIndex: number
}

function CameraController({ targetArtwork, targetWallIndex }: CameraControllerProps) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const animating = useRef(false)
  const targetPos = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())
  const startPos = useRef(new THREE.Vector3())
  const startLookAt = useRef(new THREE.Vector3())
  const animTime = useRef(0)
  const ANIM_DURATION = 0.8

  useEffect(() => {
    if (!targetArtwork) return
    animating.current = true
    animTime.current = 0
    startPos.current.copy(camera.position)
    const wall = WALLS[targetWallIndex]
    const artworkWorldPos = new THREE.Vector3(targetArtwork.position.x, targetArtwork.position.y, WALL_DEPTH / 2 + 0.1)
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...wall.rotation))
    artworkWorldPos.applyQuaternion(q)
    artworkWorldPos.add(new THREE.Vector3(...wall.position))
    const dir = new THREE.Vector3()
    dir.subVectors(new THREE.Vector3(...wall.position), artworkWorldPos).normalize()
    targetPos.current.copy(artworkWorldPos).add(dir.multiplyScalar(3.5))
    targetLookAt.current.copy(artworkWorldPos)
    const controlsEl = document.querySelector('.orbit-controls-target') as any
    if (controlsEl && controlsEl.object) {
      startLookAt.current.copy(controlsEl.object.target || new THREE.Vector3(0, 1.6, 0))
    } else {
      startLookAt.current.set(0, 1.6, 0)
    }
  }, [targetArtwork?.id])

  useFrame((_, delta) => {
    if (!animating.current) return
    animTime.current += delta
    const t = Math.min(animTime.current / ANIM_DURATION, 1)
    const easeT = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2
    camera.position.lerpVectors(startPos.current, targetPos.current, easeT)
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(startLookAt.current, targetLookAt.current, easeT)
    }
    if (t >= 1) {
      animating.current = false
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      className="orbit-controls-target"
      enablePan={false}
      enableZoom={true}
      minDistance={2}
      maxDistance={15}
      target={[0, 1.6, 0]}
      maxPolarAngle={Math.PI / 1.8}
      minPolarAngle={Math.PI / 6}
    />
  )
}

interface SceneContentProps {
  exhibition: Exhibition
  artworks: Artwork[]
  currentArtwork: Artwork | null
  targetWallIndex: number
  onArtworkClick: (artwork: Artwork) => void
  onDragEnd: (artworkId: string, position: { x: number; y: number; scale: number }) => void
  isOwner: boolean
}

function SceneContent({ exhibition, artworks, currentArtwork, targetWallIndex, onArtworkClick, onDragEnd, isOwner }: SceneContentProps) {
  const scheme = exhibition.colorScheme

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 4, 0]} intensity={0.4} />

      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WALL_WIDTH, WALL_WIDTH]} />
        <meshStandardMaterial color={scheme.floorColor} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_WIDTH, WALL_WIDTH]} />
        <meshStandardMaterial color={scheme.bgColor} />
      </mesh>

      {WALLS.map((wall, i) => (
        <group key={i}>
          <mesh position={wall.position} rotation={wall.rotation} receiveShadow>
            <boxGeometry args={[WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH]} />
            <meshStandardMaterial color={scheme.wallColor} side={THREE.DoubleSide} />
          </mesh>
          {artworks
            .filter(a => a.wallIndex === i)
            .map(artwork => (
              <ArtworkMesh
                key={artwork.id}
                artwork={artwork}
                wall={wall}
                wallIndex={i}
                onClick={onArtworkClick}
                isOwner={isOwner}
                onDragEnd={onDragEnd}
              />
            ))}
        </group>
      ))}

      <CameraController targetArtwork={currentArtwork} targetWallIndex={targetWallIndex} />
    </>
  )
}

interface ExhibitionSceneProps {
  exhibition: Exhibition
}

export default function ExhibitionScene({ exhibition }: ExhibitionSceneProps) {
  const { artworks, setCurrentArtwork, updateArtworkPosition, fetchComments } = useExhibitionStore()
  const { user } = useAuthStore()
  const exhibitionArtworks = artworks[exhibition.id] || []
  const currentArtwork = useExhibitionStore(s => s.currentArtwork)
  const [targetWallIndex, setTargetWallIndex] = useState(0)

  const isOwner = user?.id === exhibition.ownerId

  const handleArtworkClick = async (artwork: Artwork) => {
    setCurrentArtwork(artwork)
    setTargetWallIndex(artwork.wallIndex)
    await fetchComments(artwork.id)
  }

  const handleDragEnd = async (artworkId: string, position: { x: number; y: number; scale: number }) => {
    await updateArtworkPosition(artworkId, position)
  }

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.6, 5], fov: 60 }}
      style={{
        width: '100%',
        height: '100%',
        background: exhibition.colorScheme.bgColor,
      }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <SceneContent
        exhibition={exhibition}
        artworks={exhibitionArtworks}
        currentArtwork={currentArtwork}
        targetWallIndex={targetWallIndex}
        onArtworkClick={handleArtworkClick}
        onDragEnd={handleDragEnd}
        isOwner={isOwner}
      />
    </Canvas>
  )
}
