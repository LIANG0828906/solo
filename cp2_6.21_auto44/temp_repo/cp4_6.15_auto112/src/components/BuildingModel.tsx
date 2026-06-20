import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import type { BuildingModel } from '../types'

interface BuildingModelProps {
  model: BuildingModel
  isSelected: boolean
  onSelect: (id: string) => void
  onTransform: (id: string, position: [number, number, number], rotation: [number, number, number]) => void
  showControls?: boolean
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

export default function BuildingModelComponent({
  model,
  isSelected,
  onSelect,
  onTransform,
  showControls = true,
}: BuildingModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [animY, setAnimY] = useState(20)
  const [animStarted, setAnimStarted] = useState(false)

  const targetY = model.position[1]

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimStarted(true)
    }, Math.random() * 300)
    return () => clearTimeout(timer)
  }, [])

  useFrame((_, delta) => {
    if (animStarted && animY > targetY) {
      const duration = 1.5
      const current = (20 - animY + targetY) / (20 - targetY)
      const progress = Math.min(current + delta / duration, 1)
      const eased = easeOutCubic(progress)
      setAnimY(targetY + 20 * (1 - eased))
    }
  })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onSelect(model.id)
  }

  const handleTransformChange = useCallback(() => {
    if (groupRef.current) {
      const pos = groupRef.current.position
      const rot = groupRef.current.rotation
      onTransform(model.id, [pos.x, pos.y, pos.z], [rot.x, rot.y, rot.z])
    }
  }, [model.id, onTransform])

  const building = useMemo(() => {
    switch (model.modelType) {
      case 'skyscraper':
        return <SkyscraperBuilding isSelected={isSelected} />
      case 'villa':
        return <VillaBuilding isSelected={isSelected} />
      case 'complex':
        return <ComplexBuilding isSelected={isSelected} />
      default:
        return <SkyscraperBuilding isSelected={isSelected} />
    }
  }, [model.modelType, isSelected])

  return (
    <group
      ref={groupRef}
      position={[model.position[0], animY, model.position[2]]}
      rotation={model.rotation}
      scale={isSelected ? [model.scale[0] * 1.02, model.scale[1] * 1.02, model.scale[2] * 1.02] : model.scale}
      onPointerDown={handlePointerDown}
    >
      {building}
      {isSelected && showControls && (
        <TransformControls
          object={groupRef}
          mode="translate"
          onMouseUp={handleTransformChange}
          onPointerUp={handleTransformChange}
          onChange={handleTransformChange}
          onDraggingChange={(dragging) => {
            if (!dragging) handleTransformChange()
          }}
        />
      )}
    </group>
  )
}

function SkyscraperBuilding({ isSelected }: { isSelected: boolean }) {
  const floors = 8
  const baseWidth = 8
  const baseDepth = 8
  const emissiveColor = isSelected ? '#ffaa00' : '#000000'
  const emissiveIntensity = isSelected ? 0.3 : 0

  const floorMeshes = useMemo(() => {
    const meshes = []
    const localFloorHeight = 30 / floors
    for (let i = 0; i < floors; i++) {
      const shrinkFactor = 1 - (i / floors) * 0.2
      const width = baseWidth * shrinkFactor
      const depth = baseDepth * shrinkFactor
      const y = i * localFloorHeight + localFloorHeight / 2

      meshes.push(
        <mesh key={i} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, localFloorHeight * 0.95, depth]} />
          <meshStandardMaterial
            color="#334455"
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )

      if (i < floors - 1) {
        const windowRows = 2
        const windowCols = 4
        const windowWidth = width * 0.15
        const windowHeight = localFloorHeight * 0.3
        const windowDepth = 0.1

        for (let row = 0; row < windowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            const wx = (col - (windowCols - 1) / 2) * (width * 0.2)
            const wy = y + (row - 0.5) * (localFloorHeight * 0.35)

            meshes.push(
              <mesh key={`win-front-${i}-${row}-${col}`} position={[wx, wy, depth / 2 + 0.01]} castShadow>
                <boxGeometry args={[windowWidth, windowHeight, windowDepth]} />
                <meshStandardMaterial
                  color="#88ccff"
                  emissive="#88ccff"
                  emissiveIntensity={0.5}
                />
              </mesh>
            )
            meshes.push(
              <mesh key={`win-back-${i}-${row}-${col}`} position={[wx, wy, -depth / 2 - 0.01]} castShadow>
                <boxGeometry args={[windowWidth, windowHeight, windowDepth]} />
                <meshStandardMaterial
                  color="#88ccff"
                  emissive="#88ccff"
                  emissiveIntensity={0.5}
                />
              </mesh>
            )
          }
        }
      }
    }
    return meshes
  }, [emissiveColor, emissiveIntensity])

  return (
    <group position={[0, 0, 0]}>
      {floorMeshes}
      {isSelected && (
        <mesh position={[0, 15, 0]} scale={1.05}>
          <boxGeometry args={[baseWidth, 30, baseDepth]} />
          <meshBasicMaterial color="#ffaa00" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

function VillaBuilding({ isSelected }: { isSelected: boolean }) {
  const bodyWidth = 12
  const bodyHeight = 6
  const bodyDepth = 10
  const roofHeight = 4
  const emissiveColor = isSelected ? '#ffaa00' : '#000000'
  const emissiveIntensity = isSelected ? 0.3 : 0

  return (
    <group>
      <mesh position={[0, bodyHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[bodyWidth, bodyHeight, bodyDepth]} />
        <meshStandardMaterial
          color="#d4b896"
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      <mesh position={[0, bodyHeight + roofHeight / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[bodyWidth * 0.7, roofHeight, 4]} />
        <meshStandardMaterial
          color="#8b4513"
          emissive={isSelected ? '#ff6600' : '#000000'}
          emissiveIntensity={isSelected ? 0.2 : 0}
        />
      </mesh>

      <mesh position={[0, bodyHeight * 0.5, bodyDepth / 2 + 0.01]} castShadow>
        <boxGeometry args={[2, 2.5, 0.1]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>

      <mesh position={[-3, bodyHeight * 0.6, bodyDepth / 2 + 0.01]} castShadow>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
        <meshStandardMaterial color="#88ccff" emissive="#88ccff" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[3, bodyHeight * 0.6, bodyDepth / 2 + 0.01]} castShadow>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
        <meshStandardMaterial color="#88ccff" emissive="#88ccff" emissiveIntensity={0.3} />
      </mesh>

      {isSelected && (
        <mesh position={[0, bodyHeight / 2, 0]} scale={1.05}>
          <boxGeometry args={[bodyWidth, bodyHeight + roofHeight, bodyDepth]} />
          <meshBasicMaterial color="#ffaa00" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

function ComplexBuilding({ isSelected }: { isSelected: boolean }) {
  const blocks = useMemo(() => [
    { width: 10, height: 20, depth: 10, x: 0, z: 0, color: '#556677' },
    { width: 8, height: 15, depth: 8, x: 7, z: 5, color: '#667788' },
    { width: 6, height: 25, depth: 6, x: -6, z: 4, color: '#445566' },
    { width: 12, height: 10, depth: 8, x: 2, z: -6, color: '#5a6a7a' },
  ], [])

  const emissiveColor = isSelected ? '#ffaa00' : '#000000'
  const emissiveIntensity = isSelected ? 0.3 : 0

  let maxHeight = 0
  blocks.forEach(b => {
    if (b.height > maxHeight) maxHeight = b.height
  })

  return (
    <group>
      {blocks.map((block, i) => (
        <mesh
          key={i}
          position={[block.x, block.height / 2, block.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[block.width, block.height, block.depth]} />
          <meshStandardMaterial
            color={block.color}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}

      {isSelected && (
        <mesh position={[0, maxHeight / 2, 0]} scale={1.1}>
          <boxGeometry args={[20, maxHeight, 18]} />
          <meshBasicMaterial color="#ffaa00" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}
