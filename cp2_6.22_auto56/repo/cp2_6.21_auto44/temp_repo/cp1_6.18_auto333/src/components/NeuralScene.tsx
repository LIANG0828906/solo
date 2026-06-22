import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { NeuronNode, SynapseConnection, SignalParticle, Vec3, DendriteSegment, AxonSegment } from '../types/neuralTypes'
import { useNeuralStore } from '../store/neuralStore'

const vec3ToThree = (v: Vec3): THREE.Vector3 => new THREE.Vector3(v.x, v.y, v.z)

const lerpColor = (color1: string, color2: string, t: number): string => {
  const c1 = new THREE.Color(color1)
  const c2 = new THREE.Color(color2)
  return `#${c1.lerp(c2, t).getHexString()}`
}

const Soma = ({ neuron }: { neuron: NeuronNode }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    const pulse = 0.5 + 0.5 * Math.sin(timeRef.current * Math.PI)
    const color = lerpColor('#FF6B6B', '#FF9F43', pulse)
    const scale = 1 + pulse * 0.05

    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale)
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.color.set(color)
      mat.emissive.set(color)
      mat.emissiveIntensity = 0.3 + pulse * 0.4
    }

    if (glowRef.current) {
      glowRef.current.scale.setScalar(scale * 1.15)
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial
      glowMat.color.set(color)
      glowMat.opacity = 0.15 + pulse * 0.1
    }

    if (meshRef.current) {
      meshRef.current.lookAt(0, 0, 0)
    }
  })

  return (
    <group position={vec3ToThree(neuron.position)}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[neuron.somaRadius, 16, 16]} />
        <meshStandardMaterial
          color="#FF6B6B"
          transparent
          opacity={0.85}
          emissive="#FF6B6B"
          emissiveIntensity={0.3}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[neuron.somaRadius, 16, 16]} />
        <meshBasicMaterial color="#FF6B6B" transparent opacity={0.2} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

const DendriteSegmentMesh = ({ segment }: { segment: DendriteSegment }) => {
  const { start, end, radius } = segment
  const startVec = vec3ToThree(start)
  const endVec = vec3ToThree(end)
  const direction = new THREE.Vector3().subVectors(endVec, startVec)
  const length = direction.length()
  const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  )

  return (
    <mesh position={midPoint} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius * 0.7, length, 6, 1]} />
      <meshStandardMaterial color="#FF6B6B" transparent opacity={0.8} />
    </mesh>
  )
}

const Dendrites = ({ neuron }: { neuron: NeuronNode }) => {
  const allSegments = useMemo(() => {
    return neuron.dendrites.flat()
  }, [neuron.dendrites])

  return (
    <group>
      {allSegments.map((seg, i) => (
        <DendriteSegmentMesh key={`${neuron.id}-d-${i}`} segment={seg} />
      ))}
    </group>
  )
}

const Axon = ({ neuron }: { neuron: NeuronNode }) => {
  const points = useMemo(() => {
    if (neuron.axon.length === 0) return []
    return [vec3ToThree(neuron.axon[0].start), ...neuron.axon.map((s) => vec3ToThree(s.end))]
  }, [neuron.axon])

  if (points.length < 2) return null

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
  }, [points])

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.025, 6, false)
  }, [curve])

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial color="#4ECDC4" transparent opacity={0.9} emissive="#4ECDC4" emissiveIntensity={0.2} />
    </mesh>
  )
}

const SynapseTube = ({
  connection,
  onClick,
}: {
  connection: SynapseConnection
  onClick: () => void
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const tubeRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)
  const particles = useNeuralStore((state) => state.particles)
  const selectConnection = useNeuralStore((state) => state.selectConnection)

  const connectionParticles = useMemo(
    () => particles.filter((p) => p.connectionId === connection.id && p.active),
    [particles, connection.id],
  )

  const hasActiveParticles = connectionParticles.length > 0

  const points = useMemo(
    () => connection.pathPoints.map((p) => vec3ToThree(p)),
    [connection.pathPoints],
  )

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5),
    [points],
  )

  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 64, 0.02, 6, false),
    [curve],
  )

  useFrame((_, delta) => {
    timeRef.current += delta
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial
      if (hasActiveParticles) {
        mat.color.set('#F1C40F')
        mat.emissive.set('#F1C40F')
        mat.emissiveIntensity = 0.6 + 0.2 * Math.sin(timeRef.current * 5)
      } else {
        const baseColor = connection.selected ? '#C39BD3' : '#9B59B6'
        mat.color.set(baseColor)
        mat.emissive.set('#9B59B6')
        mat.emissiveIntensity = connection.selected ? 0.4 : 0.2
      }
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <group ref={groupRef}>
      <mesh
        ref={tubeRef}
        geometry={tubeGeometry}
        onClick={handleClick}
      >
        <meshStandardMaterial
          color="#9B59B6"
          transparent
          opacity={0.7}
          emissive="#9B59B6"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  )
}

const SignalParticles = ({ particles }: { particles: SignalParticle[] }) => {
  const { camera } = useThree()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const maxParticles = 250

  useFrame(() => {
    if (!meshRef.current) return
    const cameraDistance = camera.position.length()
    const sizeMultiplier = Math.max(1, cameraDistance / 10)

    particles.forEach((particle, i) => {
      if (i >= maxParticles) return
      dummy.position.set(particle.position.x, particle.position.y, particle.position.z)
      const scale = particle.size * sizeMultiplier * 3
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    for (let i = particles.length; i < maxParticles; i++) {
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxParticles]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#F1C40F"
        emissive="#F39C12"
        emissiveIntensity={1.0}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  )
}

const Starfield = () => {
  const pointsRef = useRef<THREE.Points>(null)
  const starCount = 500

  const [positions] = useState(() => {
    const pos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 5 + Math.random() * 10
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  })

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02
      pointsRef.current.rotation.x += delta * 0.01
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#FFFFFF" transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

const NeuronGroup = ({ neuron }: { neuron: NeuronNode }) => {
  return (
    <group>
      <Soma neuron={neuron} />
      <Dendrites neuron={neuron} />
      <Axon neuron={neuron} />
    </group>
  )
}

const SceneContent = () => {
  const neurons = useNeuralStore((state) => state.neurons)
  const connections = useNeuralStore((state) => state.connections)
  const particles = useNeuralStore((state) => state.particles)
  const selectConnection = useNeuralStore((state) => state.selectConnection)
  const selectedConnectionId = useNeuralStore((state) => state.selectedConnectionId)
  const tick = useNeuralStore((state) => state.tick)
  const initializeNeurons = useNeuralStore((state) => state.initializeNeurons)
  const addRandomConnections = useNeuralStore((state) => state.addRandomConnections)

  useEffect(() => {
    initializeNeurons()
  }, [initializeNeurons])

  useEffect(() => {
    if (neurons.length >= 2) {
      addRandomConnections()
    }
  }, [neurons.length, addRandomConnections])

  useFrame((_, delta) => {
    tick(delta)
  })

  const handleBackgroundClick = () => {
    if (selectedConnectionId) {
      selectConnection(null)
    }
  }

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#4ECDC4" />
      <Starfield />
      {neurons.map((neuron) => (
        <NeuronGroup key={neuron.id} neuron={neuron} />
      ))}
      {connections.map((connection) => (
        <SynapseTube
          key={connection.id}
          connection={connection}
          onClick={() => selectConnection(connection.id)}
        />
      ))}
      <SignalParticles particles={particles} />
      <mesh onClick={handleBackgroundClick} visible={false}>
        <sphereGeometry args={[100, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
    </>
  )
}

export const NeuralScene = () => {
  return (
    <Canvas
      camera={{ position: [0, 2, 12], fov: 60, near: 0.1, far: 100 }}
      gl={{ antialias: true }}
      style={{ background: 'linear-gradient(180deg, #0A0E27 0%, #000000 100%)' }}
    >
      <SceneContent />
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={20}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  )
}
