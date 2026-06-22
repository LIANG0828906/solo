import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useNodeStore } from '@/hooks/useNodeStore'
import { useAudio } from '@/hooks/useAudio'
import { StarNode } from './StarNode'
import { ConnectionLine } from './ConnectionLine'
import { PulseEffect } from './PulseEffect'
import { createStarfield, getNodeById } from '@/utils/nodeUtils'

interface CameraControllerProps {
  resetTrigger: number
}

const CameraController = ({ resetTrigger }: CameraControllerProps) => {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (resetTrigger > 0) {
      camera.position.set(0, 5, 15)
      camera.lookAt(0, 0, 0)
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0)
        controlsRef.current.update()
      }
    }
  }, [resetTrigger, camera])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={50}
      makeDefault
    />
  )
}

interface StarfieldBackgroundProps {
  count: number
}

const StarfieldBackground = ({ count }: StarfieldBackgroundProps) => {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => createStarfield(count), [count])

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.01
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

interface SceneContentProps {
  onSceneClick: (point: THREE.Vector3) => void
}

const SceneContent = ({ onSceneClick }: SceneContentProps) => {
  const {
    nodes,
    connections,
    pulseEffects,
    signalStrength,
    mode,
    selectedNode,
    connectingFrom,
    cameraResetTrigger,
    setSelectedNode,
    setConnectingFrom,
    addConnection,
    triggerPulse
  } = useNodeStore()

  const { playSynthSound, playConnectSound, playPulseSound, initAudioContext } = useAudio()

  const handleNodeClick = (nodeId: string) => (e: any) => {
    e.stopPropagation()
    initAudioContext()

    if (connectingFrom && connectingFrom !== nodeId) {
      addConnection(connectingFrom, nodeId)
      playConnectSound()
      setConnectingFrom(null)
      setSelectedNode(null)
    } else if (!connectingFrom) {
      triggerPulse(nodeId)
      playPulseSound()
      setSelectedNode(nodeId)
    }
  }

  const handleNodePointerDown = (nodeId: string) => (e: any) => {
    e.stopPropagation()
    if (!connectingFrom) {
      setConnectingFrom(nodeId)
      playSynthSound()
    }
  }

  const handleCanvasClick = (e: any) => {
    if (e.intersections.length === 0) {
      initAudioContext()
      if (connectingFrom) {
        setConnectingFrom(null)
      } else {
        const point = e.point
        onSceneClick(point)
        playSynthSound()
      }
      setSelectedNode(null)
    }
  }

  return (
    <>
      <CameraController resetTrigger={cameraResetTrigger} />

      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00d4ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />

      <StarfieldBackground count={2000} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <group onClick={handleCanvasClick}>
        <mesh scale={[100, 100, 100]} visible={false}>
          <sphereGeometry />
          <meshBasicMaterial />
        </mesh>
      </group>

      {connections.map(connection => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          nodes={nodes}
          signalStrength={signalStrength}
          mode={mode}
        />
      ))}

      {connectingFrom && (
        <TemporaryConnection
          fromNodeId={connectingFrom}
          nodes={nodes}
        />
      )}

      {nodes.map(node => (
        <StarNode
          key={node.id}
          node={node}
          isSelected={selectedNode === node.id}
          isConnecting={connectingFrom === node.id}
          signalStrength={signalStrength}
          mode={mode}
          onClick={handleNodeClick(node.id)}
          onPointerDown={handleNodePointerDown(node.id)}
        />
      ))}

      {pulseEffects.map(pulse => (
        <PulseEffect key={pulse.id} pulse={pulse} />
      ))}

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          height={300}
          intensity={1.5}
        />
      </EffectComposer>
    </>
  )
}

interface TemporaryConnectionProps {
  fromNodeId: string
  nodes: ReturnType<typeof useNodeStore.getState>['nodes']
}

const TemporaryConnection = ({ fromNodeId, nodes }: TemporaryConnectionProps) => {
  const { camera } = useThree()
  const lineRef = useRef<THREE.Line>(null)
  const mouseRef = useRef(new THREE.Vector2())

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame(() => {
    const fromNode = getNodeById(nodes, fromNodeId)
    if (!fromNode || !lineRef.current) return

    const vector = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0.5)
    vector.unproject(camera)
    const dir = vector.sub(camera.position).normalize()
    const distance = -camera.position.z / dir.z
    const mousePoint = camera.position.clone().add(dir.multiplyScalar(distance))

    const positions = lineRef.current.geometry.attributes.position.array as Float32Array
    positions[0] = fromNode.position[0]
    positions[1] = fromNode.position[1]
    positions[2] = fromNode.position[2]
    positions[3] = mousePoint.x
    positions[4] = mousePoint.y
    positions[5] = mousePoint.z
    lineRef.current.geometry.attributes.position.needsUpdate = true
  })

  const fromNode = getNodeById(nodes, fromNodeId)
  if (!fromNode) return null

  const positions = new Float32Array([
    ...fromNode.position,
    ...fromNode.position
  ])

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#00d4ff"
        transparent
        opacity={0.6}
        linewidth={2}
        dashed
        dashSize={0.3}
        gapSize={0.2}
      />
    </line>
  )
}

export const Scene = () => {
  const addNode = useNodeStore(state => state.addNode)

  const handleSceneClick = (point: THREE.Vector3) => {
    addNode([point.x, point.y, point.z])
  }

  return (
    <Canvas
      camera={{ position: [0, 5, 15], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0a0a1a' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.2
      }}
    >
      <SceneContent onSceneClick={handleSceneClick} />
    </Canvas>
  )
}
