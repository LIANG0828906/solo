import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { pipeNetwork, pipeNodes, controlPoints, PipeSegment, PipeNode, ControlPoint } from './PipeNetworkData'
import { FlowEngine } from './FlowEngine'
import { useAppStore } from './store'

interface PipeMeshProps {
  pipe: PipeSegment
  onClick: () => void
}

function PipeMesh({ pipe }: PipeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  const { position, rotation, scale } = useMemo(() => {
    const start = new THREE.Vector3(...pipe.start)
    const end = new THREE.Vector3(...pipe.end)
    const direction = end.clone().sub(start)
    const length = direction.length()
    const midPoint = start.clone().add(end).multiplyScalar(0.5)

    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    )
    const euler = new THREE.Euler().setFromQuaternion(quaternion)

    return {
      position: midPoint,
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      scale: [1, length, 1] as [number, number, number]
    }
  }, [pipe])

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[pipe.diameter / 2, pipe.diameter / 2, 1, 16]} />
        <meshStandardMaterial
          color={pipe.color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={glowRef} scale={1.3}>
        <cylinderGeometry args={[pipe.diameter / 2, pipe.diameter / 2, 1, 16]} />
        <meshBasicMaterial
          color="#4A90D9"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

interface NodeMeshProps {
  node: PipeNode
  pressure: number
}

function NodeMesh({ node, pressure }: NodeMeshProps) {
  return (
    <group position={node.position}>
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#F5A623"
          transparent
          opacity={0.7}
        />
      </mesh>
      <Html
        position={[0, 0.3, 0]}
        center
        style={{
          color: 'white',
          fontSize: '0.08rem',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
          userSelect: 'none'
        }}
        distanceFactor={10}
      >
        {pressure.toFixed(1)}
      </Html>
    </group>
  )
}

interface ControlMeshProps {
  control: ControlPoint
  isSelected: boolean
  onClick: () => void
}

function ControlMesh({ control, isSelected, onClick }: ControlMeshProps) {
  const scale = isSelected ? 1.3 : 1.0

  return (
    <group position={control.position} scale={scale}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick() }}>
        {control.type === 'valve' ? (
          <boxGeometry args={[0.4, 0.4, 0.4]} />
        ) : (
          <octahedronGeometry args={[0.35, 0]} />
        )}
        <meshStandardMaterial
          color={control.type === 'valve' ? '#E74C3C' : '#9B59B6'}
          emissive={control.type === 'valve' ? '#E74C3C' : '#9B59B6'}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <Html
        position={[0, 0.5, 0]}
        center
        style={{
          color: control.type === 'valve' ? '#E74C3C' : '#9B59B6',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
          userSelect: 'none'
        }}
        distanceFactor={15}
      >
        {control.name}
      </Html>
    </group>
  )
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[250, 250]} />
      <meshStandardMaterial
        color="#2C3E50"
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

function GridHelperCustom() {
  const gridRef = useRef<THREE.GridHelper>(null)

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.material.transparent = true
      gridRef.current.material.opacity = 0.3
    }
  }, [])

  return (
    <gridHelper
      ref={gridRef}
      args={[250, 25, '#3D5A73', '#34495E']}
      position={[0, -2, 0]}
    />
  )
}

interface ParticlesProps {
  flowEngine: FlowEngine
}

function Particles({ flowEngine }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const particles = useMemo(() => flowEngine.getParticles(), [flowEngine])

  const positions = useMemo(() => {
    const pos = new Float32Array(particles.length * 3)
    particles.forEach((particle, i) => {
      const [x, y, z] = flowEngine.getParticlePosition(particle)
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
    })
    return pos
  }, [particles, flowEngine])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    flowEngine.update(delta)

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    particles.forEach((particle, i) => {
      const [x, y, z] = flowEngine.getParticlePosition(particle)
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    })
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#3498DB"
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  )
}

export default function SceneManager() {
  const [flowEngine] = useState(() => new FlowEngine())
  const setFlowEngine = useAppStore(state => state.setFlowEngine)
  const selectedControlId = useAppStore(state => state.selectedControlId)
  const selectedPipeId = useAppStore(state => state.selectedPipeId)
  const setSelectedControl = useAppStore(state => state.setSelectedControl)
  const updateRealtimeData = useAppStore(state => state.updateRealtimeData)
  const [pressures, setPressures] = useState<Map<string, number>>(new Map())
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    setFlowEngine(flowEngine)
  }, [flowEngine, setFlowEngine])

  useFrame((_, delta) => {
    const newPressures = flowEngine.getNodePressures()
    let changed = false
    if (newPressures.size !== pressures.size) {
      changed = true
    } else {
      for (const [key, value] of newPressures) {
        if (Math.abs((pressures.get(key) ?? 0) - value) > 0.01) {
          changed = true
          break
        }
      }
    }
    if (changed) {
      setPressures(new Map(newPressures))
    }

    lastUpdateRef.current += delta
    if (lastUpdateRef.current > 0.05) {
      lastUpdateRef.current = 0
      if (selectedPipeId) {
        updateRealtimeData()
      }
    }
  })

  const handleControlClick = (control: ControlPoint) => {
    if (selectedControlId === control.id) {
      setSelectedControl(null, null, '', null)
    } else {
      setSelectedControl(control.id, control.type, control.name, control.pipeId)
    }
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 50, 25]} intensity={0.8} castShadow />
      <pointLight position={[0, 20, 0]} intensity={0.3} color="#4A90D9" />

      <fog attach="fog" args={['#0D1117', 100, 300]} />

      <GroundPlane />
      <GridHelperCustom />

      {pipeNetwork.map(pipe => (
        <PipeMesh
          key={pipe.id}
          pipe={pipe}
          onClick={() => {}}
        />
      ))}

      {pipeNodes.map(node => (
        <NodeMesh
          key={node.id}
          node={node}
          pressure={pressures.get(node.id) ?? 3.0}
        />
      ))}

      {controlPoints.map(control => (
        <ControlMesh
          key={control.id}
          control={control}
          isSelected={selectedControlId === control.id}
          onClick={() => handleControlClick(control)}
        />
      ))}

      <Particles flowEngine={flowEngine} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2.2}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
      />
    </>
  )
}
