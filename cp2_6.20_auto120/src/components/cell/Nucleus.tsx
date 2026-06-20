import type { Vec3 } from '@/types'

interface NucleusProps {
  position?: Vec3
  scale?: Vec3 | number
}

export default function Nucleus({
  position = [0, 0, 0],
  scale = 1,
}: NucleusProps) {
  const scaleArr: Vec3 =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  return (
    <group position={position} scale={scaleArr}>
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#87ceeb"
          transparent
          opacity={0.7}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh scale={0.92}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#a0d8f0"
          transparent
          opacity={0.4}
          side={2}
        />
      </mesh>
      <mesh position={[0.3, 0.2, -0.2]} scale={0.35}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial
          color="#5a9bd5"
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  )
}
