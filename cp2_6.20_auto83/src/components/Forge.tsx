import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useForgeStore, RuneType, WeaponType } from '../store'
import * as THREE from 'three'

const runeColors: Record<RuneType, string> = {
  fire: '#ff6b35',
  ice: '#4ecdc4',
  thunder: '#ffd93d',
  shadow: '#9b59b6',
  holy: '#f7f7ff',
}

function Sword({ level, runes }: { level: number; runes: (RuneType | null)[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const gemRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.5 * (1 / 60)
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15
    }
    if (gemRef.current) {
      gemRef.current.rotation.y = state.clock.elapsedTime * 2
    }
  })

  const scale = 1 + level * 0.05

  return (
    <group ref={groupRef} scale={scale}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.12, 1.8, 0.03]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.03, 1.8, 0.08]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.02, 0.15, 4]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.07, 0.12]} />
        <meshStandardMaterial color="#e6b800" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[-0.32, 0, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#e6b800" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.32, 0, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#e6b800" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh ref={gemRef} position={[0, 0.0, 0.07]}>
        <octahedronGeometry args={[0.04, 0]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissive={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissiveIntensity={0.8}
          metalness={0.3}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.05, 0.055, 0.55, 12]} />
        <meshStandardMaterial color="#3d1f1a" metalness={0.2} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.055, 0.012, 8, 16]} />
        <meshStandardMaterial color="#e6b800" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#e6b800" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.6, 0.04]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissive={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh ref={glowRef} position={[0, 0.9, 0]}>
        <boxGeometry args={[0.2, 2.0, 0.1]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#aaddff'}
          emissive={runes[0] ? runeColors[runes[0]] : '#aaddff'}
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function Bow({ level, runes }: { level: number; runes: (RuneType | null)[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.5 * (1 / 60)
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15
    }
  })

  const scale = 1 + level * 0.05

  const upperCurve = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 30; i++) {
      const t = i / 30
      const y = t * 1.6
      const x = Math.sin(t * Math.PI) * 0.55
      points.push(new THREE.Vector3(x, y, 0))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  const lowerCurve = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 30; i++) {
      const t = i / 30
      const y = -t * 1.6
      const x = Math.sin(t * Math.PI) * 0.55
      points.push(new THREE.Vector3(x, y, 0))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  return (
    <group ref={groupRef} scale={scale}>
      <mesh>
        <tubeGeometry args={[upperCurve, 40, 0.04, 8, false]} />
        <meshStandardMaterial color="#8b4513" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh>
        <tubeGeometry args={[lowerCurve, 40, 0.04, 8, false]} />
        <meshStandardMaterial color="#8b4513" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.055, 0.055, 0.2, 10]} />
        <meshStandardMaterial color="#6b3410" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0.22, 1.5, 0]}>
        <coneGeometry args={[0.03, 0.1, 6]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.22, -1.5, 0]}>
        <coneGeometry args={[0.03, 0.1, 6]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.02, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 3.0, 4]} />
        <meshStandardMaterial color="#d4d4d4" metalness={0.1} roughness={0.5} />
      </mesh>
      <mesh position={[0.08, 0, 0.06]}>
        <octahedronGeometry args={[0.05, 0]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#27ae60'}
          emissive={runes[0] ? runeColors[runes[0]] : '#27ae60'}
          emissiveIntensity={0.8}
          metalness={0.3}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.055, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#8b4513" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh ref={glowRef} position={[0.15, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#aaddff'}
          emissive={runes[0] ? runeColors[runes[0]] : '#aaddff'}
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function Staff({ level, runes }: { level: number; runes: (RuneType | null)[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const orbRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.5 * (1 / 60)
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05
    }
    if (orbRef.current) {
      orbRef.current.rotation.y = state.clock.elapsedTime * 2
      orbRef.current.rotation.x = state.clock.elapsedTime * 1.5
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += 0.8 * (1 / 60)
      ringRef.current.rotation.z += 0.5 * (1 / 60)
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2
    }
  })

  const scale = 1 + level * 0.05

  return (
    <group ref={groupRef} scale={scale}>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 2.4, 14]} />
        <meshStandardMaterial color="#4a2c2a" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.025, 8, 24]} />
        <meshStandardMaterial color="#e6b800" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.015, 8, 16]} />
        <meshStandardMaterial color="#e6b800" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.08, 14]} />
        <meshStandardMaterial color="#e6b800" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.15, 0.3, 6, 1, true]} />
        <meshStandardMaterial color="#e6b800" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh ref={orbRef} position={[0, 0.85, 0]}>
        <icosahedronGeometry args={[0.18, 1]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissive={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissiveIntensity={0.7}
          wireframe
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissive={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissiveIntensity={0.5}
          transparent
          opacity={0.85}
          metalness={0.2}
          roughness={0.05}
        />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.85, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.22, 0.015, 8, 32]} />
        <meshStandardMaterial color="#e6b800" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.02, 8, 16]} />
        <meshStandardMaterial color="#e6b800" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissive={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissiveIntensity={0.4}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default function Forge() {
  const weaponType = useForgeStore((s) => s.weaponType)
  const upgradeLevel = useForgeStore((s) => s.upgradeLevel)
  const slots = useForgeStore((s) => s.slots)
  const animation = useForgeStore((s) => s.animation)

  const runeTypes = slots.map((s) => (s.rune ? s.rune.type : null)) as (RuneType | null)[]

  const RuneOrbs = () => (
    <>
      {slots.map((slot, i) =>
        slot.rune ? (
          <mesh key={i} position={[(i - 2) * 0.4, -1.8, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial
              color={runeColors[slot.rune.type]}
              emissive={runeColors[slot.rune.type]}
              emissiveIntensity={0.4 + slot.rune.level * 0.15}
              transparent
              opacity={0.8}
            />
          </mesh>
        ) : null
      )}
    </>
  )

  const WeaponComponent = {
    sword: Sword,
    bow: Bow,
    staff: Staff,
  }[weaponType]

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#4a90d9" />
      <pointLight position={[5, 3, -5]} intensity={0.5} color="#e6b800" />

      <group
        scale={
          animation === 'success'
            ? [1.2, 1.2, 1.2]
            : animation === 'fail'
            ? [0.95, 0.95, 0.95]
            : [1, 1, 1]
        }
      >
        <WeaponComponent level={upgradeLevel} runes={runeTypes} />
        <RuneOrbs />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <circleGeometry args={[3, 64]} />
        <meshStandardMaterial color="#0f3460" metalness={0.3} roughness={0.8} />
      </mesh>

      {animation === 'success' && (
        <>
          <pointLight position={[0, 3, 0]} intensity={5} color="#e6b800" distance={10} />
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.1, 0.3, 6, 32]} />
            <meshBasicMaterial color="#e6b800" transparent opacity={0.6} />
          </mesh>
        </>
      )}
    </>
  )
}
