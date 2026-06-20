import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useForgeStore, RuneType, runeMultipliers } from '../store'
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

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3
    }
  })

  return (
    <group ref={groupRef} scale={1 + level * 0.05}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.08, 2, 0.08]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.12]} />
        <meshStandardMaterial color="#e6b800" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.7, 16]} />
        <meshStandardMaterial color="#4a2c2a" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh ref={glowRef} position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#e6b800'}
          emissive={runes[0] ? runeColors[runes[0]] : '#e6b800'}
          emissiveIntensity={0.8}
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
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3
    }
  })

  const curve = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      const y = (t - 0.5) * 3
      const x = Math.sin(t * Math.PI) * 0.5
      points.push(new THREE.Vector3(x, y, 0))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  return (
    <group ref={groupRef} scale={1 + level * 0.05}>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.04, 8, false]} />
        <meshStandardMaterial color="#8b4513" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 3, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      <mesh ref={glowRef} position={[0.5, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#27ae60'}
          emissive={runes[0] ? runeColors[runes[0]] : '#27ae60'}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  )
}

function Staff({ level, runes }: { level: number; runes: (RuneType | null)[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const orbRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05
    }
    if (orbRef.current) {
      orbRef.current.rotation.y = state.clock.elapsedTime * 2
      orbRef.current.rotation.x = state.clock.elapsedTime * 1.5
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.4
    }
  })

  return (
    <group ref={groupRef} scale={1 + level * 0.05}>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 2.5, 12]} />
        <meshStandardMaterial color="#4a2c2a" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <torusGeometry args={[0.2, 0.04, 12, 32]} />
        <meshStandardMaterial color="#e6b800" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={orbRef} position={[0, 1.1, 0]}>
        <icosahedronGeometry args={[0.15, 1]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissive={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissiveIntensity={0.7}
          wireframe
        />
      </mesh>
      <mesh ref={glowRef} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissive={runes[0] ? runeColors[runes[0]] : '#4a90d9'}
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
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
          <mesh key={i} position={[(i - 1) * 0.4, -1.5, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color={runeColors[slot.rune.type]}
              emissive={runeColors[slot.rune.type]}
              emissiveIntensity={0.5 + slot.rune.level * 0.15}
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
