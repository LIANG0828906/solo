import { useRef, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface WaterwheelProps {
  waterSpeed: number
  gateOpening: number
  bladeAngle: number
  position?: [number, number, number]
}

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
}

export default function Waterwheel({
  waterSpeed,
  gateOpening,
  bladeAngle,
  position = [0, 0, 0]
}: WaterwheelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<Particle[]>([])
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { camera } = useThree()
  const [lodLevel, setLodLevel] = useState(1)

  const wheelDiameter = 3
  const wheelRadius = wheelDiameter / 2
  const bladeCount = 8
  const maxParticles = 200

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_state, delta) => {
    if (!groupRef.current) return

    const distance = camera.position.distanceTo(groupRef.current.position)
    setLodLevel(distance > 10 ? 0.5 : 1)

    const rotationSpeed = waterSpeed * (gateOpening / 100) * 0.5
    groupRef.current.rotation.z += rotationSpeed * delta

    const wheelBottomY = position[1] - wheelRadius

    const particlesToEmit = Math.floor(Math.min(20 * lodLevel, rotationSpeed * 5))
    for (let i = 0; i < particlesToEmit; i++) {
      const bladeIndex = Math.floor(Math.random() * bladeCount)
      const bladeAnglePos = (bladeIndex / bladeCount) * Math.PI * 2 + groupRef.current.rotation.z
      const bladeX = Math.cos(bladeAnglePos) * wheelRadius
      const bladeY = Math.sin(bladeAnglePos) * wheelRadius

      if (bladeY < wheelBottomY + 0.3 && bladeY > wheelBottomY - 0.5) {
        const particle: Particle = {
          position: new THREE.Vector3(
            position[0] + bladeX + (Math.random() - 0.5) * 0.2,
            position[1] + bladeY,
            position[2] + (Math.random() - 0.5) * 0.2
          ),
          velocity: new THREE.Vector3(
            Math.cos(bladeAnglePos + Math.PI / 2) * 0.5 + (Math.random() - 0.5) * 0.3,
            Math.abs(Math.sin(bladeAnglePos + Math.PI / 2)) * 0.3 + Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
          ),
          life: 0.8,
          maxLife: 0.8,
          size: 0.05
        }
        particlesRef.current.push(particle)
      }
    }

    particlesRef.current = particlesRef.current.filter((particle) => {
      particle.life -= delta
      if (particle.life <= 0) return false

      particle.velocity.y -= 9.8 * delta
      particle.position.add(particle.velocity.clone().multiplyScalar(delta))
      particle.velocity.multiplyScalar(0.98)

      return true
    })

    if (particlesRef.current.length > maxParticles) {
      particlesRef.current = particlesRef.current.slice(-maxParticles)
    }

    if (meshRef.current) {
      particlesRef.current.forEach((particle, i) => {
        const scale = (particle.life / particle.maxLife) * particle.size
        dummy.position.copy(particle.position)
        dummy.scale.setScalar(scale)
        dummy.updateMatrix()
        meshRef.current!.setMatrixAt(i, dummy.matrix)
      })
      meshRef.current.count = particlesRef.current.length
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  })

  const blades = useMemo(() => {
    return Array.from({ length: bladeCount }).map((_, i) => {
      const angle = (i / bladeCount) * Math.PI * 2
      const x = Math.cos(angle) * wheelRadius
      const y = Math.sin(angle) * wheelRadius
      const bladeLength = 0.8
      const bladeWidth = 0.15
      const bladeThickness = 0.08

      return (
        <group key={i} position={[x, y, 0]} rotation={[0, 0, angle]}>
          <mesh
            position={[bladeLength / 2, 0, 0]}
            rotation={[0, (bladeAngle * Math.PI) / 180, 0]}
            castShadow
          >
            <boxGeometry args={[bladeLength, bladeWidth, bladeThickness]} />
            <meshStandardMaterial color="#8b4513" roughness={0.8} />
          </mesh>
        </group>
      )
    })
  }, [bladeAngle, bladeCount, wheelRadius])

  return (
    <group position={position}>
      <group ref={groupRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.2, 16]} />
          <meshStandardMaterial color="#8b7355" metalness={0.6} roughness={0.4} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.5]} castShadow>
          <torusGeometry args={[wheelRadius, 0.08, 8, 32]} />
          <meshStandardMaterial color="#654321" roughness={0.8} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.5]} castShadow>
          <torusGeometry args={[wheelRadius, 0.08, 8, 32]} />
          <meshStandardMaterial color="#654321" roughness={0.8} />
        </mesh>

        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <mesh
              key={`spoke-${i}`}
              position={[Math.cos(angle) * wheelRadius * 0.5, Math.sin(angle) * wheelRadius * 0.5, 0]}
              rotation={[0, 0, angle + Math.PI / 2]}
              castShadow
            >
              <boxGeometry args={[wheelRadius * 0.9, 0.06, 0.06]} />
              <meshStandardMaterial color="#654321" roughness={0.8} />
            </mesh>
          )
        })}

        <group position={[0, 0, 0.5]}>{blades}</group>
      </group>

      <instancedMesh ref={meshRef} args={[undefined, undefined, maxParticles]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#aaddff" transparent opacity={0.6} />
      </instancedMesh>
    </group>
  )
}
