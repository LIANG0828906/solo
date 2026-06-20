import { useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '@/types'

interface EndoplasmicReticulumProps {
  position?: Vec3
  scale?: Vec3 | number
}

export default function EndoplasmicReticulum({
  position = [0, 0, 0],
  scale = 1,
}: EndoplasmicReticulumProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.8, 1)
    const positions = geo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)
      const noise = (Math.random() - 0.5) * 0.3
      positions.setX(i, x + x * noise)
      positions.setY(i, y + y * noise)
      positions.setZ(i, z + z * noise)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const scaleArr: Vec3 =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  return (
    <group position={position} scale={scaleArr}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#98fb98"
          transparent
          opacity={0.55}
          roughness={0.8}
          metalness={0.05}
          flatShading
        />
      </mesh>
      <mesh geometry={geometry} scale={0.85}>
        <meshStandardMaterial
          color="#b0ffb0"
          transparent
          opacity={0.3}
          side={2}
          flatShading
        />
      </mesh>
      <mesh geometry={geometry} scale={1.08}>
        <meshBasicMaterial
          color="#7fff7f"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>
    </group>
  )
}
