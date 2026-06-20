import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '@/types'
import { lightenColor, darkenColor } from '@/utils/pathUtils'

interface EndoplasmicReticulumProps {
  position?: Vec3
  scale?: Vec3 | number
  color?: string
}

function createTwistedTorus(): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 64 }, (_, i) => {
      const t = (i / 64) * Math.PI * 2
      const twist = t * 3
      const radius = 1.3 + Math.sin(t * 2) * 0.15
      const x = Math.cos(t) * radius + Math.sin(twist) * 0.08
      const y = Math.sin(twist) * 0.35 + Math.cos(t * 3) * 0.1
      const z = Math.sin(t) * radius + Math.cos(twist) * 0.08
      return new THREE.Vector3(x, y, z)
    }),
    true,
    'catmullrom',
    0.5
  )
  return new THREE.TubeGeometry(curve, 200, 0.12, 8, true)
}

function createSheetStructure(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(2.2, 1.2, 12, 6)
  const positions = geo.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z =
      Math.sin(x * 2.5) * 0.12 +
      Math.cos(y * 3) * 0.08 +
      (Math.random() - 0.5) * 0.05
    positions.setZ(i, z)
  }
  geo.computeVertexNormals()
  return geo
}

export default function EndoplasmicReticulum({
  position = [0, 0, 0],
  scale = 1,
  color = '#98fb98',
}: EndoplasmicReticulumProps) {
  const torusGeo = useMemo(() => createTwistedTorus(), [])
  const sheetGeo = useMemo(() => createSheetStructure(), [])
  const groupRef = useRef<THREE.Group>(null)

  const scaleArr: Vec3 =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.08
      groupRef.current.rotation.z = Math.sin(t * 0.12) * 0.08
    }
  })

  return (
    <group position={position} scale={scaleArr}>
      <group ref={groupRef}>
        <mesh geometry={torusGeo}>
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.6}
            roughness={0.7}
            metalness={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh geometry={torusGeo} scale={[0.7, 0.5, 0.7]} position={[0, 0.25, 0]}>
          <meshStandardMaterial
            color={lightenColor(color, 0.05)}
            transparent
            opacity={0.5}
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh geometry={sheetGeo} position={[0.2, -0.3, 0.15]} rotation={[0.3, 0.5, 0.2]}>
          <meshStandardMaterial
            color={lightenColor(color, 0.1)}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            roughness={0.9}
          />
        </mesh>
        <mesh geometry={torusGeo} scale={1.02}>
          <meshBasicMaterial
            color={darkenColor(color, 0.05)}
            transparent
            opacity={0.15}
            wireframe
          />
        </mesh>
        <mesh position={[0, -0.5, 0.6]} scale={0.1}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color={darkenColor(color, 0.1)} transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.4, 0.3, -0.5]} scale={0.08}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color={darkenColor(color, 0.1)} transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  )
}
