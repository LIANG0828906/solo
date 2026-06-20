import { useRef, useMemo, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Html, Float } from '@react-three/drei'
import * as THREE from 'three'
import { usePrintStore, CharacterSlot } from '../store/usePrintStore'

const CELL_SIZE = 0.8
const CELL_GAP = 0.1
const GRID_OFFSET = -(8 * (CELL_SIZE + CELL_GAP)) / 2 + CELL_SIZE / 2

interface Character3DProps {
  slot: CharacterSlot
  materialType: 'wood' | 'clay'
}

function Character3D({ slot, materialType }: Character3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  const position = useMemo(() => {
    if (!slot.position) return [0, 0, 0]
    const x = slot.position.col * (CELL_SIZE + CELL_GAP) + GRID_OFFSET
    const z = slot.position.row * (CELL_SIZE + CELL_GAP) + GRID_OFFSET
    return [x, 0.4, z]
  }, [slot.position])

  const material = useMemo(() => {
    const inkFactor = slot.inkLevel / 100
    if (materialType === 'wood') {
      const baseColor = new THREE.Color('#c8a45a')
      const inkColor = new THREE.Color('#4a3a2a')
      const finalColor = baseColor.clone().lerp(inkColor, inkFactor * 0.7)
      return new THREE.MeshStandardMaterial({
        color: finalColor,
        roughness: 0.6,
        metalness: 0.1,
        bumpScale: 0.02
      })
    } else {
      const baseColor = new THREE.Color('#d4b896')
      const inkColor = new THREE.Color('#4a3a2a')
      const finalColor = baseColor.clone().lerp(inkColor, inkFactor * 0.7)
      return new THREE.MeshStandardMaterial({
        color: finalColor,
        roughness: 0.8,
        metalness: 0.05
      })
    }
  }, [materialType, slot.inkLevel])

  useFrame((_, delta) => {
    if (meshRef.current && groupRef.current) {
      const targetY = 0.4 + (hovered ? 0.15 : 0)
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * delta * 8
      
      if (hovered) {
        meshRef.current.rotation.y += delta * 0.5
      } else {
        meshRef.current.rotation.y += (0 - meshRef.current.rotation.y) * delta * 4
      }
    }
  })

  return (
    <group ref={groupRef} position={position as [number, number, number]}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.05}>
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[CELL_SIZE * 0.9, 0.6, CELL_SIZE * 0.9]} />
          <primitive object={material} attach="material" />
          
          <mesh position={[0, 0.31, 0]}>
            <boxGeometry args={[CELL_SIZE * 0.7, 0.05, CELL_SIZE * 0.7]} />
            <meshStandardMaterial
              color={slot.inkLevel > 30 ? '#4a3a2a' : '#b8945a'}
              roughness={0.3}
            />
          </mesh>
        </mesh>
      </Float>

      <Html
        position={[0, 0.6, 0]}
        center
        style={{
          color: '#3a2a1a',
          fontSize: '28px',
          fontWeight: 700,
          transform: 'scaleX(-1)',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          opacity: slot.inkLevel > 30 ? 0.8 : 0.3,
          userSelect: 'none'
        }}
      >
        {slot.char}
      </Html>
    </group>
  )
}

function GridSlot({ row, col, isOccupied, isHighlighted }: {
  row: number
  col: number
  isOccupied: boolean
  isHighlighted: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const x = col * (CELL_SIZE + CELL_GAP) + GRID_OFFSET
  const z = row * (CELL_SIZE + CELL_GAP) + GRID_OFFSET

  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetY = isHighlighted ? 0.02 : 0.01
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * delta * 10
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[x, 0.01, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
      <meshStandardMaterial
        color={isHighlighted ? '#c8a45a' : isOccupied ? '#a8843a' : '#d4c4a4'}
        roughness={0.9}
        metalness={0}
        transparent
        opacity={isHighlighted ? 0.8 : 0.6}
      />
    </mesh>
  )
}

function Brush({ position, isActive }: { position: { x: number; y: number } | null; isActive: boolean }) {
  const brushRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useFrame((_, delta) => {
    if (brushRef.current && position) {
      const x = (position.x / window.innerWidth) * 2 - 1
      const y = -(position.y / window.innerHeight) * 2 + 1
      const vec = new THREE.Vector3(x, y, 0.5)
      vec.unproject(camera)
      const dir = vec.sub(camera.position).normalize()
      const distance = (3 - camera.position.y) / dir.y
      const pos = camera.position.clone().add(dir.multiplyScalar(distance))
      
      brushRef.current.position.lerp(new THREE.Vector3(pos.x, 2, pos.z), delta * 15)
      
      if (isActive) {
        brushRef.current.rotation.z = Math.sin(Date.now() * 0.01) * 0.2
      }
    }
  })

  if (!isActive) return null

  return (
    <group ref={brushRef}>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.1, 16]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.5, 16]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
        <meshStandardMaterial color="#8b4513" roughness={0.7} />
      </mesh>
    </group>
  )
}

function PressPad({ isPressing, progress }: { isPressing: boolean; progress: number }) {
  const padRef = useRef<THREE.Mesh>(null)
  const paperRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (padRef.current) {
      const targetY = isPressing ? 0.55 : 2
      padRef.current.position.y += (targetY - padRef.current.position.y) * delta * 5
    }
    if (paperRef.current) {
      const targetScale = isPressing ? 1.02 : 1
      const currentScale = paperRef.current.scale.x
      paperRef.current.scale.x += (targetScale - currentScale) * delta * 3
      paperRef.current.scale.z += (targetScale - currentScale) * delta * 3
    }
  })

  if (progress === 0) return null

  return (
    <group>
      <mesh
        ref={paperRef}
        position={[0, 0.6 + progress * 0.003, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[7.5, 7.5]} />
        <meshStandardMaterial
          color="#f5e6c8"
          roughness={0.95}
          transparent
          opacity={0.3 + progress * 0.007}
        />
      </mesh>

      {isPressing && (
        <mesh ref={padRef} position={[0, 2, 0]}>
          <cylinderGeometry args={[1.2, 1.5, 0.3, 32]} />
          <meshStandardMaterial color="#8b4513" roughness={0.6} />
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[1.4, 1.4, 0.1, 32]} />
            <meshStandardMaterial color="#d4b896" roughness={0.9} />
          </mesh>
        </mesh>
      )}
    </group>
  )
}

export default function 排盘板() {
  const {
    arrangedChars,
    currentMaterial,
    isDragging,
    selectedChar,
    currentStep,
    brushPosition,
    pressProgress,
    findNearestEmptySlot,
    isPositionOccupied
  } = usePrintStore()

  const groupRef = useRef<THREE.Group>(null)
  const [highlightedSlot, setHighlightedSlot] = useState<{ row: number; col: number } | null>(null)
  const { raycaster, pointer, camera } = useThree()
  const planeRef = useRef<THREE.Mesh>(null)

  const gridSlots = useMemo(() => {
    const slots = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        slots.push({
          row,
          col,
          isOccupied: isPositionOccupied(row, col),
          isHighlighted: highlightedSlot?.row === row && highlightedSlot?.col === col
        })
      }
    }
    return slots
  }, [arrangedChars, highlightedSlot, isPositionOccupied])

  useEffect(() => {
    const updateHighlight = () => {
      if (!isDragging || !planeRef.current) return

      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObject(planeRef.current)
      
      if (intersects.length > 0) {
        const point = intersects[0].point
        const col = Math.round((point.x - GRID_OFFSET) / (CELL_SIZE + CELL_GAP))
        const row = Math.round((point.z - GRID_OFFSET) / (CELL_SIZE + CELL_GAP))
        
        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
          if (!isPositionOccupied(row, col)) {
            setHighlightedSlot({ row, col })
            return
          } else {
            const nearest = findNearestEmptySlot(row, col)
            setHighlightedSlot(nearest)
            return
          }
        }
      }
      setHighlightedSlot(null)
    }

    updateHighlight()
  }, [isDragging, pointer.x, pointer.y, findNearestEmptySlot, isPositionOccupied])

  useFrame(() => {
    if (currentStep === 'ink' && brushPosition && planeRef.current) {
      raycaster.setFromCamera(pointer, camera)
      raycaster.intersectObject(planeRef.current)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh
        ref={planeRef}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          color="#a8843a"
          roughness={0.9}
          transparent
          opacity={0}
        />
      </mesh>

      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#8b6914" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#6b5924" roughness={0.8} />
      </mesh>

      {gridSlots.map((slot, i) => (
        <GridSlot key={i} {...slot} />
      ))}

      {arrangedChars.map(slot => (
        <Character3D
          key={slot.id}
          slot={slot}
          materialType={currentMaterial}
        />
      ))}

      <Brush
        position={brushPosition}
        isActive={currentStep === 'ink' && arrangedChars.length > 0}
      />

      <PressPad
        isPressing={currentStep === 'press' && pressProgress > 0 && pressProgress < 100}
        progress={pressProgress}
      />

      {isDragging && highlightedSlot && (
        <Html
          position={[
            highlightedSlot.col * (CELL_SIZE + CELL_GAP) + GRID_OFFSET,
            1.5,
            highlightedSlot.row * (CELL_SIZE + CELL_GAP) + GRID_OFFSET
          ]}
          center
          style={{
            color: '#3a2a1a',
            fontSize: '32px',
            fontWeight: 700,
            transform: 'scaleX(-1)',
            opacity: 0.6,
            pointerEvents: 'none',
            animation: 'bounce 0.5s infinite alternate'
          }}
        >
          {selectedChar}
        </Html>
      )}

      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[10, 10, 0.2]} />
        <meshStandardMaterial color="#5a4020" roughness={0.95} />
      </mesh>

      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(8.2, 0.5, 8.2)]} />
        <lineBasicMaterial attach="material" color="#3a2a1a" linewidth={2} />
      </lineSegments>
    </group>
  )
}