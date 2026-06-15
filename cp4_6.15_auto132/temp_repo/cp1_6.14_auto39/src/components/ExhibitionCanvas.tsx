import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { PlacedArtwork, Artwork, WallType } from '../types'

interface ExhibitionCanvasProps {
  placedArtworks: PlacedArtwork[]
  artworks: Artwork[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onPlaceArtwork: (artworkId: string, wall: WallType, posX: number, posY: number) => void
  onUpdateArtwork: (id: string, updates: Partial<PlacedArtwork>) => void
  onDeleteArtwork: (id: string) => void
  isDragging: boolean
  dragArtwork: Artwork | null
  dragScreenPos: { x: number; y: number } | null
  cameraView: string
  lowQuality?: boolean
}

const ROOM_SIZE = 10
const WALL_HEIGHT = 6
const WALL_THICKNESS = 0.2

function GalleryRoom({ lowQuality }: { lowQuality: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={!lowQuality}>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.3} metalness={0.1} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, -ROOM_SIZE / 2]} receiveShadow={!lowQuality}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, ROOM_SIZE / 2]} receiveShadow={!lowQuality}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh position={[-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow={!lowQuality}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#fafafa" />
      </mesh>

      <mesh position={[ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow={!lowQuality}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#fafafa" />
      </mesh>

      <mesh position={[0, WALL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial color="#f5f5f5" side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_SIZE * 0.6, ROOM_SIZE * 0.6]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fffbe6" emissiveIntensity={0.15} transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

function ArtworkMesh({
  placed,
  artwork,
  isSelected,
  onSelect,
  onDoubleClick,
  lowQuality
}: {
  placed: PlacedArtwork
  artwork: Artwork
  isSelected: boolean
  onSelect: () => void
  onDoubleClick: () => void
  lowQuality: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const targetPos = useRef(new THREE.Vector3())
  const targetRot = useRef(new THREE.Euler())
  const appearedRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      appearedRef.current = true
    }, 30)
    return () => clearTimeout(timer)
  }, [])

  const aspect = artwork.width / artwork.height
  const baseHeight = 2
  const baseWidth = baseHeight * aspect
  const wallOffset = WALL_THICKNESS / 2 + 0.02

  const calcPosition = useMemo(() => {
    const pos = new THREE.Vector3()
    const posX = placed.positionX
    const posY = placed.positionY + WALL_HEIGHT / 2

    switch (placed.wall) {
      case 'front':
        pos.set(posX * ROOM_SIZE * 0.4, posY, -ROOM_SIZE / 2 + wallOffset)
        break
      case 'back':
        pos.set(-posX * ROOM_SIZE * 0.4, posY, ROOM_SIZE / 2 - wallOffset)
        break
      case 'left':
        pos.set(-ROOM_SIZE / 2 + wallOffset, posY, -posX * ROOM_SIZE * 0.4)
        break
      case 'right':
        pos.set(ROOM_SIZE / 2 - wallOffset, posY, posX * ROOM_SIZE * 0.4)
        break
    }
    return pos
  }, [placed.wall, placed.positionX, placed.positionY])

  const calcRotation = useMemo(() => {
    const rot = new THREE.Euler(0, 0, -placed.rotation * (Math.PI / 180))
    switch (placed.wall) {
      case 'front':
        rot.y = 0
        break
      case 'back':
        rot.y = Math.PI
        break
      case 'left':
        rot.y = Math.PI / 2
        break
      case 'right':
        rot.y = -Math.PI / 2
        break
    }
    return rot
  }, [placed.wall, placed.rotation])

  useEffect(() => {
    targetPos.current.copy(calcPosition)
  }, [calcPosition])

  useEffect(() => {
    targetRot.current.copy(calcRotation)
  }, [calcRotation])

  useFrame(() => {
    if (!groupRef.current) return

    groupRef.current.position.lerp(targetPos.current, 0.15)

    const qCurrent = new THREE.Quaternion().setFromEuler(groupRef.current.rotation)
    const qTarget = new THREE.Quaternion().setFromEuler(targetRot.current)
    qCurrent.slerp(qTarget, 0.15)
    groupRef.current.rotation.setFromQuaternion(qCurrent)

    const targetScaleVal = appearedRef.current ? placed.scale : 0.01
    const currentScale = groupRef.current.scale.x
    const newScale = THREE.MathUtils.lerp(currentScale, targetScaleVal, 0.12)
    groupRef.current.scale.set(newScale, newScale, newScale)
  })

  const displayWidth = baseWidth * placed.scale
  const displayHeight = baseHeight * placed.scale
  const frameThickness = 0.08
  const frameDepth = 0.06

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      castShadow={!lowQuality}
    >
      {isSelected && (
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[displayWidth + 0.35, displayHeight + 0.35]} />
          <meshBasicMaterial color="#d4a574" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}

      <mesh position={[0, 0, -0.02]} castShadow={!lowQuality}>
        <boxGeometry args={[displayWidth + frameThickness * 2, displayHeight + frameThickness * 2, frameDepth]} />
        <meshStandardMaterial color={isSelected ? '#e8d5b8' : '#c9a96e'} roughness={0.4} metalness={0.3} />
      </mesh>

      <mesh position={[0, 0, frameDepth / 2]}>
        <planeGeometry args={[displayWidth, displayHeight]} />
        <meshBasicMaterial color="#f0f0f0" />
      </mesh>

      <ArtworkTexture
        imageUrl={artwork.imageUrl}
        width={displayWidth}
        height={displayHeight}
        zOffset={frameDepth / 2 + 0.001}
      />

      {(hovered || isSelected) && !lowQuality && (
        <mesh position={[0, -displayHeight / 2 - 0.2, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[displayWidth * 0.7, displayWidth * 0.3]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.12} />
        </mesh>
      )}

      {hovered && !isSelected && (
        <mesh position={[0, 0, 0.005 + frameDepth / 2]}>
          <planeGeometry args={[displayWidth + 0.12, displayHeight + 0.12]} />
          <meshBasicMaterial color="#d4a574" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

function ArtworkTexture({ imageUrl, width, height, zOffset }: { imageUrl: string; width: number; height: number; zOffset: number }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.load(
      imageUrl,
      (tex) => {
        if (!cancelled) {
          tex.colorSpace = THREE.SRGBColorSpace
          setTexture(tex)
        }
      },
      undefined,
      () => {
        if (!cancelled) {
          const canvas = document.createElement('canvas')
          canvas.width = 256
          canvas.height = 256
          const ctx = canvas.getContext('2d')!
          const gradient = ctx.createLinearGradient(0, 0, 256, 256)
          gradient.addColorStop(0, '#e8e8e8')
          gradient.addColorStop(1, '#d0d0d0')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, 256, 256)
          const fallbackTex = new THREE.CanvasTexture(canvas)
          setTexture(fallbackTex)
        }
      }
    )
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return (
    <mesh position={[0, 0, zOffset]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

function SnapIndicator({
  visible,
  wall,
  posX,
  posY,
  artwork
}: {
  visible: boolean
  wall: WallType | null
  posX: number
  posY: number
  artwork: Artwork | null
}) {
  if (!visible || !wall || !artwork) return null

  const aspect = artwork.width / artwork.height
  const baseHeight = 2
  const baseWidth = baseHeight * aspect
  const wallOffset = WALL_THICKNESS / 2 + 0.005

  let position: [number, number, number] = [0, 0, 0]
  let rotation: [number, number, number] = [0, 0, 0]

  switch (wall) {
    case 'front':
      position = [posX * ROOM_SIZE * 0.4, posY + WALL_HEIGHT / 2, -ROOM_SIZE / 2 + wallOffset]
      rotation = [0, 0, 0]
      break
    case 'back':
      position = [-posX * ROOM_SIZE * 0.4, posY + WALL_HEIGHT / 2, ROOM_SIZE / 2 - wallOffset]
      rotation = [0, Math.PI, 0]
      break
    case 'left':
      position = [-ROOM_SIZE / 2 + wallOffset, posY + WALL_HEIGHT / 2, -posX * ROOM_SIZE * 0.4]
      rotation = [0, Math.PI / 2, 0]
      break
    case 'right':
      position = [ROOM_SIZE / 2 - wallOffset, posY + WALL_HEIGHT / 2, posX * ROOM_SIZE * 0.4]
      rotation = [0, -Math.PI / 2, 0]
      break
  }

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[baseWidth + 0.5, baseHeight + 0.5]} />
        <meshBasicMaterial color="#d4a574" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[baseWidth, baseHeight]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, baseHeight / 2 + 0.15, 0.006]}>
        <planeGeometry args={[baseWidth + 0.5, 0.03]} />
        <meshBasicMaterial color="#d4a574" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, -baseHeight / 2 - 0.15, 0.006]}>
        <planeGeometry args={[baseWidth + 0.5, 0.03]} />
        <meshBasicMaterial color="#d4a574" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

function Scene({
  placedArtworks,
  artworks,
  selectedId,
  onSelect,
  isDragging,
  dragArtwork,
  dragScreenPos,
  cameraView,
  onPlaceArtwork,
  onUpdateArtwork,
  onDeleteArtwork,
  lowQuality
}: {
  placedArtworks: PlacedArtwork[]
  artworks: Artwork[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  isDragging: boolean
  dragArtwork: Artwork | null
  dragScreenPos: { x: number; y: number } | null
  cameraView: string
  onPlaceArtwork: (artworkId: string, wall: WallType, posX: number, posY: number) => void
  onUpdateArtwork: (id: string, updates: Partial<PlacedArtwork>) => void
  onDeleteArtwork: (id: string) => void
  lowQuality: boolean
}) {
  const { camera, gl, raycaster, size } = useThree()
  const targetPosRef = useRef(new THREE.Vector3(0, 2, 12))
  const targetLookAtRef = useRef(new THREE.Vector3(0, 2, 0))
  const [snapWall, setSnapWall] = useState<WallType | null>(null)
  const [snapPos, setSnapPos] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const keysPressed = useRef<Set<string>>(new Set())
  const selectedIdRef = useRef(selectedId)
  const placedArtworksRef = useRef(placedArtworks)
  const lastUpdateTime = useRef(0)
  const isDraggingRef = useRef(false)
  const previousMouse = useRef({ x: 0, y: 0 })
  const spherical = useRef({
    radius: 12,
    theta: 0,
    phi: Math.PI / 3
  })
  const lookAt = useRef(new THREE.Vector3(0, 2, 0))

  useEffect(() => {
    selectedIdRef.current = selectedId
    if (selectedId) {
      setIsEditing(false)
    }
  }, [selectedId])

  useEffect(() => {
    placedArtworksRef.current = placedArtworks
  }, [placedArtworks])

  useEffect(() => {
    switch (cameraView) {
      case 'front':
        targetPosRef.current.set(0, 2.5, 12)
        targetLookAtRef.current.set(0, 2, 0)
        spherical.current = { radius: 12, theta: 0, phi: Math.PI / 3 }
        break
      case 'left':
        targetPosRef.current.set(10, 2.5, 1)
        targetLookAtRef.current.set(0, 2, 0)
        spherical.current = { radius: 10, theta: -Math.PI / 2, phi: Math.PI / 3 }
        break
      case 'right':
        targetPosRef.current.set(-10, 2.5, 1)
        targetLookAtRef.current.set(0, 2, 0)
        spherical.current = { radius: 10, theta: Math.PI / 2, phi: Math.PI / 3 }
        break
      default:
        break
    }
  }, [cameraView])

  const updateFromSpherical = useCallback(() => {
    const x = spherical.current.radius * Math.sin(spherical.current.phi) * Math.sin(spherical.current.theta)
    const y = spherical.current.radius * Math.cos(spherical.current.phi)
    const z = spherical.current.radius * Math.sin(spherical.current.phi) * Math.cos(spherical.current.theta)
    targetPosRef.current.set(x, y + 2, z)
    targetLookAtRef.current.copy(lookAt.current)
  }, [])

  useEffect(() => {
    const canvas = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      if (isDragging || dragArtwork) return
      isDraggingRef.current = true
      previousMouse.current = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || cameraView !== 'free') return
      const deltaX = e.clientX - previousMouse.current.x
      const deltaY = e.clientY - previousMouse.current.y
      previousMouse.current = { x: e.clientX, y: e.clientY }

      spherical.current.theta -= deltaX * 0.01
      spherical.current.phi = Math.max(0.2, Math.min(Math.PI / 2 + 0.3, spherical.current.phi - deltaY * 0.01))
      updateFromSpherical()
    }

    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false
      canvas.releasePointerCapture(e.pointerId)
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      spherical.current.radius = Math.max(4, Math.min(20, spherical.current.radius + e.deltaY * 0.01))
      updateFromSpherical()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl.domElement, cameraView, isDragging, dragArtwork, updateFromSpherical])

  useEffect(() => {
    if (!isDragging || !dragArtwork || !dragScreenPos) {
      setSnapWall(null)
      return
    }

    const ndcX = (dragScreenPos.x / size.width) * 2 - 1
    const ndcY = -(dragScreenPos.y / size.height) * 2 + 1

    const mouseVec = new THREE.Vector2(ndcX, ndcY)
    raycaster.setFromCamera(mouseVec, camera)

    const wallsData = [
      {
        name: 'front' as WallType,
        plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), -ROOM_SIZE / 2),
        normal: new THREE.Vector3(0, 0, 1)
      },
      {
        name: 'back' as WallType,
        plane: new THREE.Plane(new THREE.Vector3(0, 0, -1), ROOM_SIZE / 2),
        normal: new THREE.Vector3(0, 0, -1)
      },
      {
        name: 'left' as WallType,
        plane: new THREE.Plane(new THREE.Vector3(1, 0, 0), -ROOM_SIZE / 2),
        normal: new THREE.Vector3(1, 0, 0)
      },
      {
        name: 'right' as WallType,
        plane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), ROOM_SIZE / 2),
        normal: new THREE.Vector3(-1, 0, 0)
      }
    ]

    let closestWall: WallType | null = null
    let closestDist = Infinity
    let closestPoint = new THREE.Vector3()

    wallsData.forEach((wall) => {
      const intersectPoint = new THREE.Vector3()
      const hit = raycaster.ray.intersectPlane(wall.plane, intersectPoint)
      if (hit) {
        const dist = camera.position.distanceTo(intersectPoint)
        if (dist > 0 && dist < closestDist) {
          const dot = wall.normal.dot(raycaster.ray.direction)
          if (dot < 0) {
            let localX = 0
            let localY = 0

            switch (wall.name) {
              case 'front':
              case 'back':
                localX = intersectPoint.x
                localY = intersectPoint.y - WALL_HEIGHT / 2
                break
              case 'left':
              case 'right':
                localX = wall.name === 'left' ? -intersectPoint.z : intersectPoint.z
                localY = intersectPoint.y - WALL_HEIGHT / 2
                break
            }

            const halfW = ROOM_SIZE * 0.4
            const halfH = WALL_HEIGHT * 0.35

            if (Math.abs(localX) < halfW && Math.abs(localY) < halfH) {
              closestDist = dist
              closestWall = wall.name
              closestPoint = intersectPoint.clone()
            }
          }
        }
      }
    })

    if (closestWall) {
      setSnapWall(closestWall)
      let posX = 0
      let posY = 0

      switch (closestWall) {
        case 'front':
          posX = closestPoint.x / (ROOM_SIZE * 0.4)
          posY = (closestPoint.y - WALL_HEIGHT / 2) / (WALL_HEIGHT * 0.35)
          break
        case 'back':
          posX = -closestPoint.x / (ROOM_SIZE * 0.4)
          posY = (closestPoint.y - WALL_HEIGHT / 2) / (WALL_HEIGHT * 0.35)
          break
        case 'left':
          posX = -closestPoint.z / (ROOM_SIZE * 0.4)
          posY = (closestPoint.y - WALL_HEIGHT / 2) / (WALL_HEIGHT * 0.35)
          break
        case 'right':
          posX = closestPoint.z / (ROOM_SIZE * 0.4)
          posY = (closestPoint.y - WALL_HEIGHT / 2) / (WALL_HEIGHT * 0.35)
          break
      }

      setSnapPos({ x: posX, y: posY })
    } else {
      setSnapWall(null)
    }
  }, [isDragging, dragArtwork, dragScreenPos, raycaster, camera, size])

  const handleDrop = useCallback(() => {
    if (dragArtwork && snapWall) {
      onPlaceArtwork(dragArtwork.id, snapWall, snapPos.x, snapPos.y)
    }
  }, [dragArtwork, snapWall, snapPos, onPlaceArtwork])

  useEffect(() => {
    if (!isDragging) {
      handleDrop()
    }
  }, [isDragging, handleDrop])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedIdRef.current) return

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (!isEditing) {
          setIsEditing(true)
        }
        e.preventDefault()
        keysPressed.current.add(e.key)
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIdRef.current) {
          onDeleteArtwork(selectedIdRef.current)
        }
      }

      if (e.key === 'Escape') {
        setIsEditing(false)
        onSelect(null)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isEditing, onUpdateArtwork, onDeleteArtwork, onSelect])

  useFrame(() => {
    camera.position.lerp(targetPosRef.current, 0.08)

    const lookDir = new THREE.Vector3()
    camera.getWorldDirection(lookDir)
    const currentTarget = camera.position.clone().add(lookDir.multiplyScalar(10))
    const lerpedTarget = currentTarget.lerp(targetLookAtRef.current, 0.08)
    camera.lookAt(lerpedTarget)

    if (isEditing && selectedIdRef.current && keysPressed.current.size > 0) {
      const now = performance.now()
      if (now - lastUpdateTime.current > 30) {
        lastUpdateTime.current = now
        const step = 0.005
        let dx = 0
        let dy = 0

        if (keysPressed.current.has('ArrowLeft')) dx -= step
        if (keysPressed.current.has('ArrowRight')) dx += step
        if (keysPressed.current.has('ArrowUp')) dy += step
        if (keysPressed.current.has('ArrowDown')) dy -= step

        if (dx !== 0 || dy !== 0) {
          const current = placedArtworksRef.current.find(a => a.id === selectedIdRef.current)
          if (current) {
            onUpdateArtwork(selectedIdRef.current, {
              positionX: current.positionX + dx,
              positionY: current.positionY + dy
            })
          }
        }
      }
    }
  })

  const shadowMapSize = lowQuality ? 256 : 1024

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight
        position={[0, WALL_HEIGHT - 0.8, 0]}
        intensity={lowQuality ? 0.6 : 0.9}
        color="#fff8e7"
        distance={15}
        castShadow={!lowQuality}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
      />
      <pointLight position={[0, WALL_HEIGHT * 0.6, -ROOM_SIZE * 0.3]} intensity={0.25} color="#ffeedd" distance={8} />
      <pointLight position={[0, WALL_HEIGHT * 0.6, ROOM_SIZE * 0.3]} intensity={0.25} color="#ffeedd" distance={8} />
      <directionalLight
        position={[0, 6, 6]}
        intensity={0.3}
        color="#fff8e7"
        castShadow={!lowQuality}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
      />

      <GalleryRoom lowQuality={lowQuality} />

      {placedArtworks.map((placed) => {
        const artwork = artworks.find((a) => a.id === placed.artworkId)
        if (!artwork) return null
        return (
          <ArtworkMesh
            key={placed.id}
            placed={placed}
            artwork={artwork}
            isSelected={selectedId === placed.id}
            onSelect={() => onSelect(placed.id)}
            onDoubleClick={() => {
              onSelect(placed.id)
              setIsEditing(true)
            }}
            lowQuality={lowQuality}
          />
        )
      })}

      <SnapIndicator
        visible={isDragging && !!dragArtwork && !!snapWall}
        wall={snapWall}
        posX={snapPos.x}
        posY={snapPos.y}
        artwork={dragArtwork}
      />
    </>
  )
}

function ExhibitionCanvas(props: ExhibitionCanvasProps) {
  const lowQuality = props.lowQuality ?? false

  return (
    <Canvas
      shadows={!lowQuality}
      camera={{ position: [0, 2, 12], fov: 50 }}
      gl={{
        antialias: !lowQuality,
        alpha: false,
        powerPreference: 'high-performance'
      }}
      dpr={lowQuality ? [1, 1] : [1, 2]}
      style={{ width: '100%', height: '100%' }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={['#f0f0f0']} />
      <fog attach="fog" args={['#f0f0f0', 15, 30]} />
      <Scene
        placedArtworks={props.placedArtworks}
        artworks={props.artworks}
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        isDragging={props.isDragging}
        dragArtwork={props.dragArtwork}
        dragScreenPos={props.dragScreenPos}
        cameraView={props.cameraView}
        onPlaceArtwork={props.onPlaceArtwork}
        onUpdateArtwork={props.onUpdateArtwork}
        onDeleteArtwork={props.onDeleteArtwork}
        lowQuality={lowQuality}
      />
    </Canvas>
  )
}

export default ExhibitionCanvas
