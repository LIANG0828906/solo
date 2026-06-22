import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import { useAppStore, Obstacle, ObstacleType, RayPath, ReceiverPoint, generateId } from '@/store'

const SPACE_SIZE = { x: 500, y: 200, z: 500 }
const GRID_DIVISIONS = 50
const OBSTACLE_LIMIT = 20

interface PlacementState {
  active: boolean
  type: ObstacleType | null
}

function Source({ position, rotation }: { position: THREE.Vector3; rotation: THREE.Euler }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const coneRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pulse = 1 + 0.15 * Math.sin((t * Math.PI * 2) / 1.5)

    if (meshRef.current) {
      meshRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulse * 1.3)
    }
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 1.5)
    }
    if (coneRef.current) {
      coneRef.current.rotation.y = (t * 0.5) % (Math.PI * 2)
    }
  })

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[3, 1]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#ffd700"
          emissive="#ffaa00"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <mesh ref={glowRef}>
        <icosahedronGeometry args={[3, 1]} />
        <meshBasicMaterial color="#ffdd44" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>

      <mesh ref={coneRef} position={[0, 8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[3, 10, 16, 1, true]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Ground({ onClick }: { onClick: (point: THREE.Vector3) => void }) {
  const handleClick = useCallback(
    (event: any) => {
      event.stopPropagation()
      onClick(event.point)
    },
    [onClick]
  )

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={handleClick}
        receiveShadow
      >
        <planeGeometry args={[SPACE_SIZE.x, SPACE_SIZE.z]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.9} />
      </mesh>

      <gridHelper
        args={[SPACE_SIZE.x, GRID_DIVISIONS, '#e0e0e0', '#e0e0e0']}
        position={[0, 0.01, 0]}
      >
        <meshBasicMaterial attach="material" transparent opacity={0.3} />
      </gridHelper>
    </group>
  )
}

function DragHandle({
  axis,
  position,
  onDragStart,
}: {
  axis: 'x' | 'y' | 'z'
  position: THREE.Vector3
  onDragStart: (axis: 'x' | 'y' | 'z', e: any) => void
}) {
  const color = axis === 'x' ? '#ff4444' : axis === 'y' ? '#44ff44' : '#4444ff'
  const offset = new THREE.Vector3()
  offset[axis] = 6

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    onDragStart(axis, e)
  }

  return (
    <group position={[position.x + offset.x, position.y + offset.y, position.z + offset.z]}>
      <mesh onPointerDown={handlePointerDown}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh>
        <cylinderGeometry
          args={[0.2, 0.2, 4, 8]}
          position={[-offset.x / 2, -offset.y / 2, -offset.z / 2]}
        />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

function ObstacleMesh({
  obstacle,
  isSelected,
  onSelect,
  onDragStart,
}: {
  obstacle: Obstacle
  isSelected: boolean
  onSelect: (id: string) => void
  onDragStart: (axis: 'x' | 'y' | 'z', e: any, obstacleId: string) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)

  const handleClick = (e: any) => {
    e.stopPropagation()
    onSelect(obstacle.id)
  }

  const handleDragStart = (axis: 'x' | 'y' | 'z', e: any) => {
    onDragStart(axis, e, obstacle.id)
  }

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(obstacle.position)
      groupRef.current.rotation.copy(obstacle.rotation)
    }
  }, [obstacle.position, obstacle.rotation])

  const renderMesh = () => {
    switch (obstacle.type) {
      case 'building':
        return (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]} />
            <meshStandardMaterial color="#808080" metalness={0.3} roughness={0.7} />
          </mesh>
        )
      case 'tower':
        return (
          <mesh castShadow receiveShadow>
            <cylinderGeometry
              args={[obstacle.radius, obstacle.radius, obstacle.size.y, 24]}
            />
            <meshStandardMaterial color="#a0a0a8" metalness={0.6} roughness={0.4} />
          </mesh>
        )
      case 'hill':
        return (
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[obstacle.radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color="#4a7c3f"
              vertexColors={false}
              metalness={0.1}
              roughness={0.9}
            />
          </mesh>
        )
      default:
        return null
    }
  }

  const renderEdges = () => {
    let geometry: THREE.BufferGeometry
    switch (obstacle.type) {
      case 'building':
        geometry = new THREE.BoxGeometry(
          obstacle.size.x,
          obstacle.size.y,
          obstacle.size.z
        )
        break
      case 'tower':
        geometry = new THREE.CylinderGeometry(
          obstacle.radius,
          obstacle.radius,
          obstacle.size.y,
          24
        )
        break
      case 'hill':
        geometry = new THREE.SphereGeometry(
          obstacle.radius,
          32,
          16,
          0,
          Math.PI * 2,
          0,
          Math.PI / 2
        )
        break
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }
    const edges = new THREE.EdgesGeometry(geometry)
    return (
      <lineSegments ref={edgesRef} geometry={edges}>
        <lineBasicMaterial
          color={isSelected ? '#66ccff' : '#ffffff'}
          transparent
          opacity={isSelected ? 0.9 : 0.3}
        />
      </lineSegments>
    )
  }

  return (
    <group
      ref={groupRef}
      position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
      rotation={[obstacle.rotation.x, obstacle.rotation.y, obstacle.rotation.z]}
      onClick={handleClick}
    >
      {renderMesh()}
      {renderEdges()}

      {isSelected && (
        <>
          <DragHandle
            axis="x"
            position={new THREE.Vector3(0, obstacle.size.y / 2, 0)}
            onDragStart={handleDragStart}
          />
          <DragHandle
            axis="y"
            position={new THREE.Vector3(0, obstacle.size.y / 2, 0)}
            onDragStart={handleDragStart}
          />
          <DragHandle
            axis="z"
            position={new THREE.Vector3(0, obstacle.size.y / 2, 0)}
            onDragStart={handleDragStart}
          />
        </>
      )}
    </group>
  )
}

function RayPathLine({ path }: { path: RayPath }) {
  const points = path.points.map((p) => new THREE.Vector3(p.x, p.y, p.z))

  const getLineProps = () => {
    switch (path.type) {
      case 'direct':
        return { color: '#ffff00', lineWidth: 0.5, opacity: 0.8, dashed: false }
      case 'reflection':
        return { color: '#ffffff', lineWidth: 0.3, opacity: 0.9, dashed: false }
      case 'diffraction':
        return { color: '#cc88ff', lineWidth: 0.3, opacity: 0.7, dashed: true }
      default:
        return { color: '#ffffff', lineWidth: 0.3, opacity: 0.5, dashed: false }
    }
  }

  const props = getLineProps()

  if (points.length < 2) return null

  return (
    <Line
      points={points}
      color={props.color}
      lineWidth={props.lineWidth}
      transparent
      opacity={props.opacity}
      dashed={props.dashed}
      dashSize={2}
      gapSize={1}
    />
  )
}

function ReceiverLabel({ point }: { point: ReceiverPoint }) {
  return (
    <Html
      position={[point.position.x, point.position.y + 2, point.position.z]}
      center
      distanceFactor={10}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '4px 8px',
          borderRadius: '4px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {point.fieldStrength.toFixed(2)} dBm
      </div>
    </Html>
  )
}

function computeRayPaths(
  sourcePos: THREE.Vector3,
  obstacles: Obstacle[],
  power: number,
  frequency: number
): { paths: RayPath[]; receivers: ReceiverPoint[] } {
  const paths: RayPath[] = []
  const receivers: ReceiverPoint[] = []

  const receiverPositions = useMemoReceiverPoints()

  receiverPositions.forEach((recvPos, idx) => {
    const directDistance = sourcePos.distanceTo(recvPos)
    const hasDirectLOS = !isLineBlocked(sourcePos, recvPos, obstacles)

    if (hasDirectLOS) {
      const fspl = 20 * Math.log10(directDistance) + 20 * Math.log10(frequency) - 27.55
      const strength = power - fspl

      paths.push({
        id: `direct-${idx}`,
        points: [sourcePos.clone(), recvPos.clone()],
        type: 'direct',
        fieldStrength: strength,
      })

      receivers.push({
        position: recvPos.clone(),
        fieldStrength: strength,
        pathType: 'direct',
      })
    } else {
      const reflectionResult = findReflectionPath(sourcePos, recvPos, obstacles)
      if (reflectionResult) {
        const totalDist = reflectionResult.distance
        const fspl = 20 * Math.log10(totalDist) + 20 * Math.log10(frequency) - 27.55
        const reflLoss = 3
        const strength = power - fspl - reflLoss

        paths.push({
          id: `refl-${idx}`,
          points: reflectionResult.points,
          type: 'reflection',
          fieldStrength: strength,
        })

        receivers.push({
          position: recvPos.clone(),
          fieldStrength: strength,
          pathType: 'reflection',
        })
      } else {
        const diffResult = findDiffractionPath(sourcePos, recvPos, obstacles)
        if (diffResult) {
          const totalDist = diffResult.distance
          const fspl = 20 * Math.log10(totalDist) + 20 * Math.log10(frequency) - 27.55
          const diffLoss = diffResult.additionalLoss
          const strength = power - fspl - diffLoss

          paths.push({
            id: `diff-${idx}`,
            points: diffResult.points,
            type: 'diffraction',
            fieldStrength: strength,
          })

          receivers.push({
            position: recvPos.clone(),
            fieldStrength: strength,
            pathType: 'diffraction',
          })
        }
      }
    }
  })

  return { paths, receivers }
}

function useMemoReceiverPoints(): THREE.Vector3[] {
  return useMemo(() => {
    const points: THREE.Vector3[] = []
    const positions = [
      [40, 1.5, 40],
      [-40, 1.5, 40],
      [40, 1.5, -40],
      [-40, 1.5, -40],
      [60, 1.5, 0],
      [-60, 1.5, 0],
      [0, 1.5, 60],
      [0, 1.5, -60],
      [30, 1.5, -20],
      [-30, 1.5, 30],
    ]
    positions.forEach(([x, y, z]) => {
      points.push(new THREE.Vector3(x, y, z))
    })
    return points
  }, [])
}

function isLineBlocked(
  start: THREE.Vector3,
  end: THREE.Vector3,
  obstacles: Obstacle[]
): boolean {
  const direction = new THREE.Vector3().subVectors(end, start)
  const length = direction.length()
  direction.normalize()

  for (const obstacle of obstacles) {
    const boundingBox = getObstacleBoundingBox(obstacle)
    if (rayIntersectsBox(start, direction, length, boundingBox)) {
      return true
    }
  }
  return false
}

function getObstacleBoundingBox(obstacle: Obstacle): THREE.Box3 {
  const halfSize = new THREE.Vector3()
  switch (obstacle.type) {
    case 'building':
      halfSize.set(obstacle.size.x / 2, obstacle.size.y / 2, obstacle.size.z / 2)
      break
    case 'tower':
      halfSize.set(obstacle.radius, obstacle.size.y / 2, obstacle.radius)
      break
    case 'hill':
      halfSize.set(obstacle.radius, obstacle.radius, obstacle.radius)
      break
    default:
      halfSize.set(1, 1, 1)
  }

  const min = new THREE.Vector3().subVectors(obstacle.position, halfSize)
  const max = new THREE.Vector3().addVectors(obstacle.position, halfSize)
  min.y = Math.max(0, min.y)
  return new THREE.Box3(min, max)
}

function rayIntersectsBox(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  maxDistance: number,
  box: THREE.Box3