import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Coral, getCoralColor } from '../store/coralStore'

interface CoralModelProps {
  coral: Coral
}

export function CoralModel({ coral }: CoralModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const color = getCoralColor(coral)
  const scale = 0.3 + coral.growth * 0.7

  return (
    <group ref={groupRef} position={coral.position} scale={scale}>
      {coral.type === 'staghorn' && <StaghornCoral color={color} growth={coral.growth} />}
      {coral.type === 'brain' && <BrainCoral color={color} growth={coral.growth} />}
      {coral.type === 'soft' && <SoftCoral color={color} growth={coral.growth} />}
    </group>
  )
}

function StaghornCoral({ color }: { color: string; growth: number }) {
  const branchMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.8,
    metalness: 0.1
  }), [color])

  return (
    <group>
      <mesh position={[0, 0.15, 0]} material={branchMaterial}>
        <cylinderGeometry args={[0.08, 0.12, 0.3, 8]} />
      </mesh>
      <mesh position={[0, 0.35, 0]} material={branchMaterial}>
        <cylinderGeometry args={[0.05, 0.08, 0.25, 8]} />
      </mesh>
      <mesh position={[0.18, 0.4, 0]} rotation={[0, 0, -0.5]} material={branchMaterial}>
        <cylinderGeometry args={[0.03, 0.06, 0.3, 6]} />
      </mesh>
      <mesh position={[-0.18, 0.4, 0]} rotation={[0, 0, 0.5]} material={branchMaterial}>
        <cylinderGeometry args={[0.03, 0.06, 0.3, 6]} />
      </mesh>
      <mesh position={[0, 0.45, 0.18]} rotation={[0.5, 0, 0]} material={branchMaterial}>
        <cylinderGeometry args={[0.03, 0.06, 0.3, 6]} />
      </mesh>
      <mesh position={[0.25, 0.5, 0.08]} rotation={[0.2, 0.3, -0.4]} material={branchMaterial}>
        <cylinderGeometry args={[0.02, 0.04, 0.2, 6]} />
      </mesh>
      <mesh position={[-0.25, 0.5, 0.08]} rotation={[0.2, -0.3, 0.4]} material={branchMaterial}>
        <cylinderGeometry args={[0.02, 0.04, 0.2, 6]} />
      </mesh>
      <mesh position={[0, 0.55, -0.2]} rotation={[-0.4, 0, 0]} material={branchMaterial}>
        <cylinderGeometry args={[0.02, 0.04, 0.2, 6]} />
      </mesh>
    </group>
  )
}

function BrainCoral({ color }: { color: string; growth: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.4, 32, 32)
    const positions = geo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)
      if (y > 0) {
        const noise = Math.sin(x * 10) * Math.cos(z * 10) * 0.05 * (y / 0.4)
        const noise2 = Math.sin(x * 15 + z * 8) * Math.cos(z * 12 - x * 6) * 0.03 * (y / 0.4)
        positions.setY(i, y + noise + noise2)
      }
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.9,
    metalness: 0.05
  }), [color])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0.1, 0]} geometry={geometry} material={material}>
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.42, 0.45, 0.04, 32]} />
        <meshStandardMaterial color="#7F8C8D" roughness={0.9} />
      </mesh>
    </group>
  )
}

function SoftCoral({ color }: { color: string; growth: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  const tentacleCount = 24
  const tentacles = useMemo(() => {
    return Array.from({ length: tentacleCount }, (_, i) => {
      const angle = (i / tentacleCount) * Math.PI * 2
      const radius = 0.08 + Math.random() * 0.04
      const height = 0.3 + Math.random() * 0.2
      const phase = Math.random() * Math.PI * 2
      return { angle, radius, height, phase, index: i }
    })
  }, [])

  const stalkMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9
  }), [color])

  useFrame((_, delta) => {
    timeRef.current += delta
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (i === 0) return
        const tentacle = tentacles[i - 1]
        if (tentacle) {
          const wave = Math.sin(timeRef.current * 2 + tentacle.phase) * 0.15
          child.rotation.x = wave * 0.5
          child.rotation.z = wave * 0.3
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.05, 0]} material={stalkMaterial}>
        <cylinderGeometry args={[0.12, 0.15, 0.1, 16]} />
      </mesh>
      {tentacles.map((t) => (
        <group
          key={t.index}
          position={[
            Math.cos(t.angle) * t.radius,
            0.1,
            Math.sin(t.angle) * t.radius
          ]}
          rotation={[0, t.angle, 0]}
        >
          <mesh position={[0, t.height / 2, 0]} material={stalkMaterial}>
            <cylinderGeometry args={[0.02, 0.035, t.height, 6]} />
          </mesh>
          <mesh position={[0, t.height, 0]} material={stalkMaterial}>
            <sphereGeometry args={[0.03, 8, 8]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.12, 0]} material={stalkMaterial}>
        <sphereGeometry args={[0.08, 12, 12]} />
      </mesh>
    </group>
  )
}
