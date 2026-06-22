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
  turnSpeed: number
  size: number
  color: string
  phase: number
  type: 'fish' | 'turtle'
  currentDirection: THREE.Vector3
  targetDirection: THREE.Vector3
  tailAngle: number
  finAngle: number
}

function FishMesh({ instance, onClick, isSelected }: {
  instance: FishInstance
  onClick: (id: string) => void
  isSelected: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Mesh>(null)
  const leftFinRef = useRef<THREE.Mesh>(null)
  const rightFinRef = useRef<THREE.Mesh>(null)
  const frontLeftRef = useRef<THREE.Mesh>(null)
  const frontRightRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const t = state.clock.elapsedTime

    if (tailRef.current) {
      if (instance.type === 'turtle') {
        tailRef.current.rotation.y = Math.sin(t * 2 + instance.phase) * 0.2
      } else {
        tailRef.current.rotation.y = Math.sin(t * 10 + instance.phase) * 0.7
      }
    }

    if (instance.type === 'turtle') {
      const flap = Math.sin(t * 3 + instance.phase) * 0.6
      if (frontLeftRef.current) frontLeftRef.current.rotation.z = -0.3 + flap
      if (frontRightRef.current) frontRightRef.current.rotation.z = 0.3 - flap
      if (leftFinRef.current) leftFinRef.current.rotation.z = 0.3 + flap * 0.5
      if (rightFinRef.current) rightFinRef.current.rotation.z = -0.3 - flap * 0.5
    } else {
      const flap = Math.sin(t * 6 + instance.phase) * 0.3
      if (leftFinRef.current) leftFinRef.current.rotation.z = -0.4 + flap
      if (rightFinRef.current) rightFinRef.current.rotation.z = 0.4 - flap
    }

    groupRef.current.position.lerp(instance.position, Math.min(1, delta * 8))

    const targetQuat = new THREE.Quaternion()
    if (instance.targetDirection.lengthSq() > 0.001) {
      const m = new THREE.Matrix4()
      m.lookAt(new THREE.Vector3(0, 0, 0), instance.targetDirection, new THREE.Vector3(0, 1, 0))
      targetQuat.setFromRotationMatrix(m)
    }
    groupRef.current.quaternion.slerp(targetQuat, Math.min(1, delta * 2.5))

    if (isSelected) {
      const pulse = (Math.sin(t * 3) + 1) / 2
      groupRef.current.scale.setScalar(instance.size * (1 + pulse * 0.08))
    } else {
      groupRef.current.scale.setScalar(instance.size)
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
          <sphereGeometry args={[2.5, 32, 32]} />
          <meshBasicMaterial
            color="#4dd0e1"
            transparent
            opacity={0.25}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      {isSelected && (
        <mesh>
          <ringGeometry args={[1.8, 2.2, 48]} />
          <meshBasicMaterial
            color="#4dd0e1"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {type === 'turtle' ? (
        <>
          <mesh>
            <sphereGeometry args={[0.8, 24, 18]} />
            <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <sphereGeometry args={[0.75, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI]} />
            <meshStandardMaterial color={'#3d5a3d'} roughness={0.85} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.15, 0.65]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0.12, 0.22, 0.9]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[-0.12, 0.22, 0.9]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh ref={frontLeftRef} position={[0.7, 0.05, 0.2]} rotation={[0, 0.4, -0.3]}>
            <boxGeometry args={[0.7, 0.06, 0.5]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh ref={frontRightRef} position={[-0.7, 0.05, 0.2]} rotation={[0, -0.4, 0.3]}>
            <boxGeometry args={[0.7, 0.06, 0.5]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh ref={leftFinRef} position={[0.45, 0, -0.5]} rotation={[0, 0.2, 0.3]}>
            <boxGeometry args={[0.35, 0.05, 0.5]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh ref={rightFinRef} position={[-0.45, 0, -0.5]} rotation={[0, -0.2, -0.3]}>
            <boxGeometry args={[0.35, 0.05, 0.5]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh ref={tailRef} position={[0, 0, -0.85]}>
            <boxGeometry args={[0.2, 0.05, 0.5]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </>
      ) : (
        <>
          <mesh>
            <sphereGeometry args={[1, 20, 14]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.35, 0.7, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh ref={tailRef} position={[0, 0, -0.9]}>
            <coneGeometry args={[0.6, 0.9, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh ref={leftFinRef} position={[0.5, 0.05, -0.1]} rotation={[0.3, -0.2, 0.5]}>
            <coneGeometry args={[0.25, 0.5, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh ref={rightFinRef} position={[-0.5, 0.05, -0.1]} rotation={[-0.3, 0.2, -0.5]}>
            <coneGeometry args={[0.25, 0.5, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.15, 0.85]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[0.22, 0.22, 0.78]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[-0.22, 0.22, 0.78]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        </>
      )}
    </group>
  )
}

export default function SeaCreatureManager() {
  const fishesRef = useRef<FishInstance[]>([])
  const [, forceRender] = useState(0)
  const creatures = useStore((s) => s.creatures)
  const setCreatures = useStore((s) => s.actions.setCreatures)
  const setLoading = useStore((s) => s.actions.setLoading)
  const selectedCreatureId = useStore((s) => s.selectedCreatureId)
  const setSelectedCreatureId = useStore((s) => s.actions.setSelectedCreatureId)
  const chamberPosition = useStore((s) => s.chamberPosition)
  const noise2D = useMemo(() => createNoise2D(42), [])
  const noise2D2 = useMemo(() => createNoise2D(84), [])
  const initialized = useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/creatures')
        const data: Creature[] = res.data
        setCreatures(data)

        const instances: FishInstance[] = []
        const worldSize = 140

        data.forEach((creature) => {
          const count = creature.id === 'seaturtle' ? 2 : 8
          for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * worldSize
            const z = (Math.random() - 0.5) * worldSize
            const y = -15 - Math.random() * 60
            const phase = Math.random() * Math.PI * 2
            const isTurtle = creature.id === 'seaturtle'

            instances.push({
              id: `${creature.id}-${i}`,
              creatureId: creature.id,
              position: new THREE.Vector3(x, y, z),
              target: new THREE.Vector3(
                (Math.random() - 0.5) * worldSize,
                -15 - Math.random() * 60,
                (Math.random() - 0.5) * worldSize
              ),
              speed: isTurtle ? 1.5 : (creature.speed || 1) * 3,
              turnSpeed: isTurtle ? 0.8 : 1.8,
              size: isTurtle ? 1.6 : (creature.size || 0.3),
              color: creature.color,
              phase,
              type: isTurtle ? 'turtle' : 'fish',
              currentDirection: new THREE.Vector3(
                (Math.random() - 0.5),
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5)
              ).normalize(),
              targetDirection: new THREE.Vector3(0, 0, -1),
              tailAngle: 0,
              finAngle: 0
            })
          }
        })

        fishesRef.current = instances
        initialized.current = true
        forceRender(n => n + 1)
      } catch (e) {
        console.error('Failed to fetch creatures:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setCreatures, setLoading])

  useFrame((state, delta) => {
    if (!initialized.current) return
    const time = state.clock.elapsedTime
    const camPos = new THREE.Vector3(...chamberPosition)

    fishesRef.current = fishesRef.current.map(fish => {
      const pos = fish.position.clone()
      let target = fish.target.clone()

      const distToCam = pos.distanceTo(camPos)
      if (distToCam < 18) {
        const away = pos.clone().sub(camPos).normalize()
        target = pos.clone().add(away.multiplyScalar(40))
      }

      const distToTarget = pos.distanceTo(target)
      if (distToTarget < 8) {
        const n1 = noise2D(time * 0.08 + fish.phase, pos.x * 0.008) * 70
        const n2 = noise2D2(time * 0.08 + fish.phase, pos.z * 0.008) * 70
        const n3 = -20 - Math.abs(noise2D(fish.phase, time * 0.04)) * 60
        target.set(n1, n3, n2)
      }

      const toTarget = target.clone().sub(pos).normalize()
      const wander = new THREE.Vector3(
        Math.sin(time * 0.7 + fish.phase) * 0.25,
        Math.sin(time * 0.5 + fish.phase * 1.3) * 0.15,
        Math.cos(time * 0.6 + fish.phase * 0.9) * 0.25
      )

      const desiredDir = toTarget.clone().add(wander).normalize()
      const newTargetDir = fish.targetDirection.clone().lerp(desiredDir, Math.min(1, delta * fish.turnSpeed)).normalize()

      const moveSpeed = fish.speed * (0.7 + 0.3 * Math.sin(time * 0.5 + fish.phase))
      pos.addScaledVector(newTargetDir, moveSpeed * delta)

      pos.x = Math.max(-130, Math.min(130, pos.x))
      pos.y = Math.max(-105, Math.min(-10, pos.y))
      pos.z = Math.max(-130, Math.min(130, pos.z))

      const newCurrentDir = fish.currentDirection.clone().lerp(newTargetDir, Math.min(1, delta * 3)).normalize()

      return {
        ...fish,
        position: pos,
        target,
        currentDirection: newCurrentDir,
        targetDirection: newTargetDir
      }
    })

    forceRender(n => (n + 1) % 100000)
  })

  const handleClick = (id: string) => {
    setSelectedCreatureId(id === selectedCreatureId ? null : id)
  }

  if (!initialized.current) return null

  return (
    <group>
      {fishesRef.current.map(fish => (
        <FishMesh
          key={fish.id}
          instance={fish}
          onClick={handleClick}
          isSelected={selectedCreatureId === fish.creatureId}
        />
      ))}
    </group>
  )
}
