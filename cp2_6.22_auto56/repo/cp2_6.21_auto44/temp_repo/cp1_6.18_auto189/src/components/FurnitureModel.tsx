import { useRef, useState } from 'react'
import * as THREE from 'three'
import { ThreeEvent } from '@react-three/fiber'

interface FurnitureModelProps {
  modelId: string
  position: [number, number, number]
  scale: number
  isSelected: boolean
  onSelect: () => void
  onDrag: (x: number, y: number) => void
}

function Sofa({ isSelected }: { isSelected: boolean }) {
  const color = '#D4A76A'
  const materialProps = {
    color,
    roughness: 0.7,
    metalness: 0.1,
    emissive: isSelected ? '#D4A76A' : '#000000',
    emissiveIntensity: isSelected ? 0.3 : 0,
  }

  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[2.0, 0.6, 0.9]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[0, 0.65, -0.375]} castShadow>
        <boxGeometry args={[2.0, 0.5, 0.15]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[-0.925, 0.55, 0]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.9]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[0.925, 0.55, 0]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.9]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  )
}

function CoffeeTable({ isSelected }: { isSelected: boolean }) {
  const color = '#D4A76A'
  const materialProps = {
    color,
    roughness: 0.7,
    metalness: 0.1,
    emissive: isSelected ? '#D4A76A' : '#000000',
    emissiveIntensity: isSelected ? 0.3 : 0,
  }

  const legPositions: [number, number, number][] = [
    [-0.5, -0.2, -0.25],
    [0.5, -0.2, -0.25],
    [-0.5, -0.2, 0.25],
    [0.5, -0.2, 0.25],
  ]

  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[1.2, 0.1, 0.7]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
    </group>
  )
}

function FloorLamp({ isSelected }: { isSelected: boolean }) {
  const color = '#D4A76A'
  const materialProps = {
    color,
    roughness: 0.7,
    metalness: 0.1,
    emissive: isSelected ? '#D4A76A' : '#000000',
    emissiveIntensity: isSelected ? 0.3 : 0,
  }

  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.2, 0.3, 8]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  )
}

function TvStand({ isSelected }: { isSelected: boolean }) {
  const color = '#D4A76A'
  const materialProps = {
    color,
    roughness: 0.7,
    metalness: 0.1,
    emissive: isSelected ? '#D4A76A' : '#000000',
    emissiveIntensity: isSelected ? 0.3 : 0,
  }

  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.6, 0.5, 0.45]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[1.8, 0.04, 0.5]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  )
}

function Bookshelf({ isSelected }: { isSelected: boolean }) {
  const color = '#D4A76A'
  const materialProps = {
    color,
    roughness: 0.7,
    metalness: 0.1,
    emissive: isSelected ? '#D4A76A' : '#000000',
    emissiveIntensity: isSelected ? 0.3 : 0,
  }

  const shelfYPositions = [0.0, 0.4, 0.8, 1.2]

  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.0, 1.6, 0.35]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      {shelfYPositions.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.96, 0.03, 0.33]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
      <mesh position={[0, 0.8, -0.17]} castShadow>
        <boxGeometry args={[1.0, 1.6, 0.01]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  )
}

function Armchair({ isSelected }: { isSelected: boolean }) {
  const color = '#D4A76A'
  const materialProps = {
    color,
    roughness: 0.7,
    metalness: 0.1,
    emissive: isSelected ? '#D4A76A' : '#000000',
    emissiveIntensity: isSelected ? 0.3 : 0,
  }

  return (
    <group>
      <mesh position={[0, 0.225, 0]} castShadow>
        <boxGeometry args={[0.7, 0.45, 0.7]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[0, 0.475, -0.29]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.12]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[-0.29, 0.45, 0]} castShadow>
        <boxGeometry args={[0.12, 0.45, 0.7]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[0.29, 0.45, 0]} castShadow>
        <boxGeometry args={[0.12, 0.45, 0.7]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  )
}

function FurnitureModel({ modelId, position, scale, isSelected, onSelect, onDrag }: FurnitureModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))
  const intersectionPoint = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())
  const raycaster = useRef(new THREE.Raycaster())

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onSelect()
    setIsDragging(true)

    const mouse = new THREE.Vector2(event.point.x, event.point.y)
    raycaster.current.setFromCamera(mouse, event.camera)
    raycaster.current.ray.intersectPlane(dragPlane.current, intersectionPoint.current)

    if (groupRef.current && intersectionPoint.current) {
      offset.current.copy(groupRef.current.position).sub(intersectionPoint.current)
    }

    ;(event.target as HTMLElement).setPointerCapture(event.nativeEvent.pointerId)
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return
    event.stopPropagation()

    const mouse = new THREE.Vector2(event.point.x, event.point.y)
    raycaster.current.setFromCamera(mouse, event.camera)
    const target = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(dragPlane.current, target)

    if (target) {
      const newPosition = target.add(offset.current)
      onDrag(newPosition.x, newPosition.y)
    }
  }

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return
    event.stopPropagation()
    setIsDragging(false)
  }

  const renderModel = () => {
    switch (modelId) {
      case 'sofa':
        return <Sofa isSelected={isSelected} />
      case 'coffeeTable':
        return <CoffeeTable isSelected={isSelected} />
      case 'floorLamp':
        return <FloorLamp isSelected={isSelected} />
      case 'tvStand':
        return <TvStand isSelected={isSelected} />
      case 'bookshelf':
        return <Bookshelf isSelected={isSelected} />
      case 'armchair':
        return <Armchair isSelected={isSelected} />
      default:
        return null
    }
  }

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {renderModel()}
      {isDragging && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.0, 0.02, 8, 32]} />
          <meshStandardMaterial color="#D4A76A" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

export { FurnitureModel }
