import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Connection as ConnectionType, EnergyNode } from '@/store/useStore'

interface ConnectionProps {
  connection: ConnectionType
  nodes: EnergyNode[]
  energyFlow: number
}

const PARTICLE_COUNT = 50

export function Connection({ connection, nodes, energyFlow }: ConnectionProps) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const particlesRef = useRef<Array<{ offset: number; speed: number }>>([])
  const lineRef = useRef<THREE.Line>(null)

  const fromNode = nodes.find((n) => n.id === connection.from)
  const toNode = nodes.find((n) => n.id === connection.to)

  useMemo(() => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      offset: Math.random(),
      speed: 0.3 + Math.random() * 0.7
    }))
  }, [connection.id])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  useFrame((state, delta) => {
    if (!fromNode || !toNode || !instancedMeshRef.current) return

    const from = new THREE.Vector3(...fromNode.position)
    const to = new THREE.Vector3(...toNode.position)
    const direction = to.clone().sub(from)
    const length = direction.length()

    const speed = energyFlow / 50

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = particlesRef.current[i]
      particle.offset += delta * speed * particle.speed * 0.5
      if (particle.offset > 1) particle.offset -= 1

      const t = particle.offset
      const pos = from.clone().add(direction.clone().multiplyScalar(t))
      
      const pulse = Math.sin(state.clock.elapsedTime * 3 + i * 0.2) * 0.5 + 0.5
      const scale = 0.08 + pulse * 0.05

      dummy.position.copy(pos)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()

      instancedMeshRef.current.setMatrixAt(i, dummy.matrix)

      const intensity = 0.5 + pulse * 0.5
      tempColor.setHSL(0.05 + (1 - t) * 0.05, 1, 0.5 + intensity * 0.3)
      instancedMeshRef.current.setColorAt(i, tempColor)
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true
    }

    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position.array as Float32Array
      positions[0] = from.x
      positions[1] = from.y
      positions[2] = from.z
      positions[3] = to.x
      positions[4] = to.y
      positions[5] = to.z
      lineRef.current.geometry.attributes.position.needsUpdate = true
      
      const material = lineRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.15 + (energyFlow / 100) * 0.2
    }
  })

  if (!fromNode || !toNode) return null

  const midColor = '#ff6347'

  return (
    <group>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array(6)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={midColor}
          transparent
          opacity={0.2}
          linewidth={1}
        />
      </line>

      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, PARTICLE_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color="#ff4500"
          transparent
          opacity={0.9}
        />
      </instancedMesh>
    </group>
  )
}
