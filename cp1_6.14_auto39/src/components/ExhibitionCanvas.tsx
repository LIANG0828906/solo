import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
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
  dragArtwork: Artwork | null
  onDragEnd: () => void
  cameraView: string
}

const ROOM_SIZE = 10
const WALL_HEIGHT = 6
const WALL_THICKNESS = 0.2

function GalleryRoom() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.3} metalness={0.1} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, -ROOM_SIZE / 2]} receiveShadow>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#ffffff" side={THREE.FrontSide} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, ROOM_SIZE / 2]} receiveShadow>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh position={[-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#fafafa" />
      </mesh>

      <mesh position={[ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
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

      <mesh position={[0, WALL_HEIGHT - 0.05, 0]}>
        <ringGeometry args={[ROOM_SIZE * 0.25, ROOM_SIZE * 0.3, 32]} />
        <meshBasicMaterial color="#d4a574" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function ArtworkMesh({
  placed,
  artwork,
  isSelected,
  onSelect,
  onDoubleClick
}: {
  placed: PlacedArtwork
  artwork: Artwork
  isSelected: boolean
  onSelect: () => void
  onDoubleClick: () => void
}) {
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [appeared, setAppeared] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAppeared(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const aspect = artwork.width / artwork.height
  const baseHeight = 2
  const baseWidth = baseHeight * aspect

  const wallOffset = WALL_THICKNESS / 2 + 0.02

  const position = useMemo(() => {
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

  const rotation = useMemo(() => {
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

  useFrame((state) => {
    if (meshRef.current) {
      const targetScale = appeared ? placed.scale : 0.01
      const current = meshRef.current.scale.x
      const newScale = THREE.MathUtils.lerp(current, targetScale, 0.1)
      meshRef.current.scale.set(newScale, newScale, newScale)

      if (isSelected) {
        meshRef.current.position.z = position.z + Math.sin(state.clock.elapsedTime * 2) * 0.005
      }
    }
  })

  const displayWidth = baseWidth * placed.scale
  const displayHeight = baseHeight * placed.scale
  const frameThickness = 0.08
  const frameDepth = 0.08

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
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
    >
      {isSelected && (
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[displayWidth + 0.3, displayHeight + 0.3]} />
          <meshBasicMaterial color="#d4a574" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[displayWidth + frameThickness * 2, displayHeight + frameThickness * 2, frameDepth]} />
        <meshStandardMaterial color={isSelected ? '#e8d5b8' : '#c9a96e'} roughness={0.4} metalness={0.3} />
      </mesh>

      <mesh>
        <planeGeometry args={[displayWidth, displayHeight]} />
        <meshBasicMaterial map={null} color="#f0f0f0" />
      </mesh>

      <Html
        position={[0, 0, 0.001]}
        transform
        occlude
        distanceFactor={8}
        style={{
          width: displayWidth * 100,
          height: displayHeight * 100,
          pointerEvents: 'none'
        }}
      >
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
          draggable={false}
        />
      </Html>

      {(hovered || isSelected) && (
        <mesh position={[0, -displayHeight / 2 - 0.15, -0.1]}>
          <planeGeometry args={[displayWidth * 0.8, 0.06]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.15} />
        </mesh>
      )}

      {hovered && !isSelected && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[displayWidth + 0.1, displayHeight + 0.1]} />
          <meshBasicMaterial color="#d4a574" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

function DragSnapIndicator({
  dragArtwork,
  mousePosition
}: {
  dragArtwork: Artwork | null
  mousePosition: { x: number; y: number } | null
}) {
  const [hoveredWall, setHoveredWall] = useState<WallType | null>(null)
  const [snapPos, setSnapPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!dragArtwork || !mousePosition) {
      setHoveredWall(null)
      return
    }

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(mousePosition.x, mousePosition.y)

    raycaster.setFromCamera(mouse, new THREE.PerspectiveCamera())

    const walls = [
      { name: 'front' as WallType, position: [0, WALL_HEIGHT / 2, -ROOM_SIZE / 2], normal: [0, 0, 1] },
      { name: 'back' as WallType, position: [0, WALL_HEIGHT / 2, ROOM_SIZE / 2], normal: [0, 0, -1] },
      { name: 'left' as WallType, position: [-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0], normal: [1, 0, 0] },
      { name: 'right' as WallType, position: [ROOM_SIZE / 2, WALL_HEIGHT / 2, 0], normal: [-1, 0, 0] }
    ]

    let closestWall: WallType | null = null
    let closestPoint: THREE.Vector3 | null = null
    let closestDist = Infinity

    walls.forEach((wall) => {
      const wallPlane = new THREE.Plane(
        new THREE.Vector3(wall.normal[0], wall.normal[1], wall.normal[2]),
        -wall.position[0] * wall.normal[0] - wall.position[1] * wall.normal[1] - wall.position[2] * wall.normal[2]
      )
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(wallPlane, intersectPoint)
    })

    setHoveredWall(null)
  }, [dragArtwork, mousePosition])

  if (!dragArtwork || !hoveredWall) return null

  const aspect = dragArtwork.width / dragArtwork.height
  const baseHeight = 2
  const baseWidth = baseHeight * aspect

  const wallOffset = WALL_THICKNESS / 2 + 0.01
  let position: [number, number, number] = [0, 0, 0]
  let rotation: [number, number, number] = [0, 0, 0]

  switch (hoveredWall) {
    case 'front':
      position = [snapPos.x * ROOM_SIZE * 0.4, snapPos.y + WALL_HEIGHT / 2, -ROOM_SIZE / 2 + wallOffset]
      rotation = [0, 0, 0]
      break
    case 'back':
      position = [-snapPos.x * ROOM_SIZE * 0.4, snapPos.y + WALL_HEIGHT / 2, ROOM_SIZE / 2 - wallOffset]
      rotation = [0, Math.PI, 0]
      break
    case 'left':
      position = [-ROOM_SIZE / 2 + wallOffset, snapPos.y + WALL_HEIGHT / 2, -snapPos.x * ROOM_SIZE * 0.4]
      rotation = [0, Math.PI / 2, 0]
      break
    case 'right':
      position = [ROOM_SIZE / 2 - wallOffset, snapPos.y + WALL_HEIGHT / 2, snapPos.x * ROOM_SIZE * 0.4]
      rotation = [0, -Math.PI / 2, 0]
      break
  }

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[baseWidth + 0.2, baseHeight + 0.2]} />
        <meshBasicMaterial color="#d4a574" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[baseWidth, baseHeight]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

function CameraController({ view }: { view: string }) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const targetPos = useRef(new THREE.Vector3(0, 2, 12))
  const targetLookAt = useRef(new THREE.Vector3(0, 2, 0))

  useEffect(() => {
    switch (view) {
      case 'front':
        targetPos.current.set(0, 2, 12)
        targetLookAt.current.set(0, 2, 0)
        break
      case 'left':
        targetPos.current.set(10, 2, 2)
        targetLookAt.current.set(0, 2, 0)
        break
      case 'right':
        targetPos.current.set(-10, 2, 2)
        targetLookAt.current.set(0, 2, 0)
        break
      default:
        break
    }
  }, [view])

  useFrame(() => {
    if (view === 'free') return
    camera.position.lerp(targetPos.current, 0.05)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.05)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={4}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2 + 0.3}
      minPolarAngle={0.2}
      enablePan={false}
    />
  )
}

function Scene({
  placedArtworks,
  artworks,
  selectedId,
  onSelect,
  dragArtwork,
  cameraView,
  onPlaceArtwork,
  onUpdateArtwork
}: {
  placedArtworks: PlacedArtwork[]
  artworks: Artwork[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  dragArtwork: Artwork | null
  cameraView: string
  onPlaceArtwork: (artworkId: string, wall: WallType, posX: number, posY: number) => void
  onUpdateArtwork: (id: string, updates: Partial<PlacedArtwork>) => void
}) {
  const { raycaster, camera, gl } = useThree()
  const [mouseNDC, setMouseNDC] = useState<{ x: number; y: number } | null>(null)
  const [hoveredWall, setHoveredWall] = useState<WallType | null>(null)
  const [snapPos, setSnapPos] = useState({ x: 0, y: 0 })

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!dragArtwork) return
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      setMouseNDC({ x, y })

      const mouseVec = new THREE.Vector2(x, y)
      raycaster.setFromCamera(mouseVec, camera)

      const walls = [
        {
          name: 'front' as WallType,
          plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), ROOM_SIZE / 2),
          size: { w: ROOM_SIZE * 0.8, h: WALL_HEIGHT * 0.7 }
        },
        {
          name: 'back' as WallType,
          plane: new THREE.Plane(new THREE.Vector3(0, 0, -1), -ROOM_SIZE / 2),
          size: { w: ROOM_SIZE * 0.8, h: WALL_HEIGHT * 0.7 }
        },
        {
          name: 'left' as WallType,
          plane: new THREE.Plane(new THREE.Vector3(1, 0, 0), ROOM_SIZE / 2),
          size: { w: ROOM_SIZE * 0.8, h: WALL_HEIGHT * 0.7 }
        },
        {
          name: 'right' as WallType,
          plane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), -ROOM_SIZE / 2),
          size: { w: ROOM_SIZE * 0.8, h: WALL_HEIGHT * 0.7 }
        }
      ]

      let closestWall: WallType | null = null
      let closestDist = Infinity
      let closestPoint = new THREE.Vector3()

      walls.forEach((wall) => {
        const intersectPoint = new THREE.Vector3()
        raycaster.ray.intersectPlane(wall.plane, intersectPoint)
        if (intersectPoint) {
          const dist = camera.position.distanceTo(intersectPoint)
          if (dist > 0 && dist < closestDist) {
            const localX =
              wall.name === 'front' || wall.name === 'back'
                ? intersectPoint.x
                : -intersectPoint.z
            const localY = intersectPoint.y - WALL_HEIGHT / 2

            if (
              Math.abs(localX) < wall.size.w / 2 &&
              Math.abs(localY) < wall.size.h / 2
            ) {
              closestDist = dist
              closestWall = wall.name
              closestPoint = intersectPoint
            }
          }
        }
      })

      if (closestWall) {
        setHoveredWall(closestWall)
        let posX = 0
        let posY = 0
        const size = walls.find((w) => w.name === closestWall)!.size

        switch (closestWall) {
          case 'front':
            posX = closestPoint.x / (size.w / 2)
            posY = (closestPoint.y - WALL_HEIGHT / 2) / (size.h / 2)
            break
          case 'back':
            posX = -closestPoint.x / (size.w / 2)
            posY = (closestPoint.y - WALL_HEIGHT / 2) / (size.h / 2)
            break
          case 'left':
            posX = -closestPoint.z / (size.w / 2)
            posY = (closestPoint.y - WALL_HEIGHT / 2) / (size.h / 2)
            break
          case 'right':
            posX = closestPoint.z / (size.w / 2)
            posY = (closestPoint.y - WALL_HEIGHT / 2) / (size.h / 2)
            break
        }

        setSnapPos({ x: posX * 0.4, y: posY * 0.35 })
      } else {
        setHoveredWall(null)
      }
    },
    [dragArtwork, raycaster, camera, gl.domElement]
  )

  const handleDrop = useCallback(() => {
    if (dragArtwork && hoveredWall) {
      onPlaceArtwork(dragArtwork.id, hoveredWall, snapPos.x, snapPos.y)
    }
    setHoveredWall(null)
    setMouseNDC(null)
  }, [dragArtwork, hoveredWall, snapPos, onPlaceArtwork])

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handleDrop)
    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handleDrop)
    }
  }, [handlePointerMove, handleDrop, gl.domElement])

  const aspect = dragArtwork ? dragArtwork.width / dragArtwork.height : 1
  const baseHeight = 2
  const baseWidth = baseHeight * aspect

  const renderSnapIndicator = () => {
    if (!dragArtwork || !hoveredWall) return null
    const wallOffset = WALL_THICKNESS / 2 + 0.01

    let position: [number, number, number] = [0, 0, 0]
    let rotation: [number, number, number] = [0, 0, 0]

    switch (hoveredWall) {
      case 'front':
        position = [snapPos.x * ROOM_SIZE * 0.4, snapPos.y + WALL_HEIGHT / 2, -ROOM_SIZE / 2 + wallOffset]
        rotation = [0, 0, 0]
        break
      case 'back':
        position = [-snapPos.x * ROOM_SIZE * 0.4, snapPos.y + WALL_HEIGHT / 2, ROOM_SIZE / 2 - wallOffset]
        rotation = [0, Math.PI, 0]
        break
      case 'left':
        position = [-ROOM_SIZE / 2 + wallOffset, snapPos.y + WALL_HEIGHT / 2, -snapPos.x * ROOM_SIZE * 0.4]
        rotation = [0, Math.PI / 2, 0]
        break
      case 'right':
        position = [ROOM_SIZE / 2 - wallOffset, snapPos.y + WALL_HEIGHT / 2, snapPos.x * ROOM_SIZE * 0.4]
        rotation = [0, -Math.PI / 2, 0]
        break
    }

    return (
      <group position={position} rotation={rotation}>
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[baseWidth + 0.4, baseHeight + 0.4]} />
          <meshBasicMaterial color="#d4a574" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[baseWidth, baseHeight]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      </group>
    )
  }

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, WALL_HEIGHT - 0.5, 0]} intensity={0.8} color="#fff8e7" distance={15} />
      <pointLight position={[0, WALL_HEIGHT * 0.7, -ROOM_SIZE * 0.3]} intensity={0.3} color="#ffeedd" distance={10} />
      <pointLight position={[0, WALL_HEIGHT * 0.7, ROOM_SIZE * 0.3]} intensity={0.3} color="#ffeedd" distance={10} />
      <directionalLight position={[0, 5, 5]} intensity={0.4} color="#fff8e7" castShadow shadow-mapSize={[1024, 1024]} />

      <GalleryRoom />

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
            onDoubleClick={() => onSelect(placed.id)}
          />
        )
      })}

      {renderSnapIndicator()}

      <CameraController view={cameraView} />
    </>
  )
}

function ExhibitionCanvas(props: ExhibitionCanvasProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 12], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
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
        dragArtwork={props.dragArtwork}
        cameraView={props.cameraView}
        onPlaceArtwork={props.onPlaceArtwork}
        onUpdateArtwork={props.onUpdateArtwork}
      />
    </Canvas>
  )
}

export default ExhibitionCanvas
