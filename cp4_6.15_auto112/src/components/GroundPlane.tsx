import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface GroundPlaneProps {
  size?: number
  gridDivisions?: number
}

export default function GroundPlane({ size = 50, gridDivisions = 20 }: GroundPlaneProps) {
  const gridGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    const step = size / gridDivisions
    const halfSize = size / 2

    for (let i = 0; i <= gridDivisions; i++) {
      const pos = -halfSize + i * step
      vertices.push(-halfSize, 0, pos, halfSize, 0, pos)
      vertices.push(pos, 0, -halfSize, pos, 0, halfSize)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return geometry
  }, [size, gridDivisions])

  const halfSize = size / 2
  const textOffset = 3
  const textY = 0.01

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.6} />
      </mesh>

      <lineSegments geometry={gridGeometry}>
        <lineBasicMaterial color="#00d4ff" transparent opacity={0.3} />
      </lineSegments>

      <Text
        position={[0, textY, -halfSize - textOffset]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        N
      </Text>

      <Text
        position={[0, textY, halfSize + textOffset]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        S
      </Text>

      <Text
        position={[halfSize + textOffset, textY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        E
      </Text>

      <Text
        position={[-halfSize - textOffset, textY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        W
      </Text>

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.8, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
