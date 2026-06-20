import type { Vec3 } from '@/types'
import { lightenColor, darkenColor } from '@/utils/pathUtils'

interface NucleusProps {
  position?: Vec3
  scale?: Vec3 | number
  color?: string
}

export default function Nucleus({
  position = [0, 0, 0],
  scale = 1,
  color = '#87ceeb',
}: NucleusProps) {
  const scaleArr: Vec3 =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  return (
    <group position={position} scale={scaleArr}>
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.7}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh scale={0.92}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color={lightenColor(color, 0.1)}
          transparent
          opacity={0.4}
          side={2}
        />
      </mesh>
      <mesh position={[0.3, 0.2, -0.2]} scale={0.35}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial
          color={darkenColor(color, 0.15)}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  )
}
