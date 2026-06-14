import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, Creature } from '@/store/useStore'
import { createNoise2D } from '@/utils/noise'
import axios from 'axios'

interface FishInstance {
  id: string
  creatureId: string
  position: THREE.Vector3
  target: THREE.Vector3
  speed: number
  size: number
  color: string
  phase: number
  type: 'fish' | 'turtle'
  tailAngle: number
  mesh: THREE.Group
}

function Fish({ instance, onClick, isSelected }: {
  instance: FishInstance
  onClick: (id: string) => void
  isSelected: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Mesh>(null)
  const noise2D = useMemo(() => createNoise2D(parseInt(instance.id.slice(-4), 16) || 1), [instance.id])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    instance.tailAngle = Math.sin(state.clock.elapsedTime * 8 + instance.phase) * 0.6
    if (tailRef.current) {
      tailRef.current.rotation.y = instance.tailAngle
    }

    const pos = instance.position
    groupRef.current.position.lerp(pos, 0.1)

    const dir = instance.target.clone().sub(pos).normalize()
    if (dir.length() > 0.01) {
      const targetRot = Math.atan2(dir.x, dir.z)
      const euler = groupRef.current.rotation
      euler.y += (targetRot - euler.y) * 0.1
    }

    if (isSelected && groupRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 3) + 1) / 2
      groupRef.current.scale.setScalar(instance.size * (1 + pulse * 0.05))
    }
  })

  const { size, color, type } = instance

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation()
        onClick(instance.creatureId)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {isSelected && (
        <mesh>
          <sphereGeometry args={[size * 2.2, 32, 32]} />
          <meshBasicMaterial
            color="#4dd0e1"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {type === 'turtle' ? (
        <>
          <mesh>
            <sphereGeometry args={[size * 0.8, 16, 12]} />
            <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, size * 0.6]}>
            <sphereGeometry args={[size * 0.4, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
          <mesh position={[size * 0.5, 0, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[size * 0.6, size * 0.05, size * 0.5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[-size * 0.5, 0, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[size * 0.6, size * 0.05, size * 0.5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[size * 0.3, 0, -size * 0.6]}>
            <boxGeometry args={[size * 0.25, size * 0.05, size * 0.4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[-size * 0.3, 0, -size * 0.6]}>
            <boxGeometry args={[size * 0.25, size * 0.05, size * 0.4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh ref={tailRef} position={[0, 0, -size * 0.9]} rotation={[0, 0, 0]}>
            <boxGeometry args={[size * 0.15, size * 0.05, size * 0.5]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      ) : (
        <>
          <mesh>
            <sphereGeometry args={[size, 16, 12]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.3} />
          </mesh>
          <mesh position={[0, size * 0.25, 0]}>
            <coneGeometry args={[size * 0.4, size * 0.8, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh ref={tailRef} position={[0, 0, -size * 0.8]}>
            <coneGeometry args={[size * 0.6, size * 0.8, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, size * 0.1, size * 0.85]}>
            <sphereGeometry args={[size * 0.15, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[size * 0.2, size * 0.15, size * 0.7]}>
            <sphereGeometry args={[size * 0.08, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[-size * 0.2, size * 0.15, size * 0.7]}>
            <sphereGeometry args={[size * 0.08, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </>
      )}
    </group>
  )
}

export default function SeaCreatureManager() {
  const [fishes, setFishes] = useState<FishInstance[]>([])
  const creatures = useStore((s) => s.creatures)
  const setCreatures = useStore((s) => s.actions.setCreatures)
  const setLoading = useStore((s) => s.actions.setLoading)
  const selectedCreatureId = useStore((s) => s.selectedCreatureId)
  const setSelectedCreatureId = useStore((s) => s.actions.setSelectedCreatureId)
  const chamberPosition = useStore((s) => s.chamberPosition)
  const noise2D = useMemo(() => createNoise2D(42), [])
  const noise2D2 = useMemo(() => createNoise2D(84), [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/creatures')
        const data: Creature[] = res.data
        setCreatures(data)

        const instances: FishInstance[] = []
        const worldSize = 150

        data.forEach((creature) => {
          const count = creature.id === 'seaturtle' ? 1 : 10
          for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * worldSize
            const z = (Math.random() - 0.5) * worldSize
            const y = -15 - Math.random() * 60
            const phase = Math.random() * Math.PI * 2

            const group = new THREE.Group()

            instances.push({
              id: `${creature.id}-${i}`,
              creatureId: creature.id,
              position: new THREE.Vector3(x, y, z),
              target: new THREE.Vector3(
                (Math.random() - 0.5) * worldSize,
                -15 - Math.random() * 60,
                (Math.random() - 0.5) * worldSize
              ),
              speed: (creature.speed || 1) * 2,
              size: creature.size || 0.3,
              color: creature.color,
              phase,
              type: creature.id === 'seaturtle' ? 'turtle' : 'fish',
              tailAngle: 0,
              mesh: group
            })
          }
        })

        setFishes(instances)
      } catch (e) {
        console.error('Failed to fetch creatures:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setCreatures, setLoading])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const camPos = new THREE.Vector3(...chamberPosition)

    setFishes(prev => prev.map(fish => {
      const pos = fish.position.clone()
      let target = fish.target.clone()

      const distToCam = pos.distanceTo(camPos)
      if (distToCam < 15) {
        const away = pos.clone().sub(camPos).normalize()
        target = pos.clone().add(away.multiplyScalar(30))
      }

      const distToTarget = pos.distanceTo(target)
      if (distToTarget < 5) {
        const n1 = noise2D(time * 0.1 + fish.phase, fish.position.x * 0.01) * 80
        const n2 = noise2D2(time * 0.1 + fish.phase, fish.position.z * 0.01) * 80
        target.set(
          n1,
          -20 - Math.abs(noise2D(fish.phase, time * 0.05)) * 70,
          n2
        )
      }

      const dir = target.clone().sub(pos).normalize()
      const wander = new THREE.Vector3(
        Math.sin(time * 0.5 + fish.phase) * 0.3,
        Math.cos(time * 0.3 + fish.phase * 2) * 0.2,
        Math.cos(time * 0.4 + fish.phase * 1.5) * 0.3
      )
      dir.add(wander).normalize()

      pos.addScaledVector(dir, fish.speed * delta)
      pos.x = Math.max(-120, Math.min(120, pos.x))
      pos.y = Math.max(-110, Math.min(-8, pos.y))
      pos.z = Math.max(-120, Math.min(120, pos.z))

      return {
        ...fish,
        position: pos,
        target
      }
    }))
  })

  const handleClick = (id: string) => {
    setSelectedCreatureId(id === selectedCreatureId ? null : id)
  }

  return (
    <group>
      {fishes.map(fish => (
        <Fish
          key={fish.id}
          instance={fish}
          onClick={handleClick}
          isSelected={selectedCreatureId === fish.creatureId}
        />
      ))}
    </group>
  )
}
