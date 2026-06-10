import { useRef, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, EnergyNode } from '@/store/useStore'
import { playShockwaveSound, playConnectSound } from '@/utils/audio'

interface NodeProps {
  node: EnergyNode
  onLog: (nodeId: string, type: 'click' | 'connect' | 'create') => void
}

export function Node({ node, onLog }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef<THREE.Vector3 | null>(null)
  
  const { 
    connectingFrom, 
    setConnectingFrom, 
    addConnection, 
    updateNodePosition,
    addShockwave,
    selectedNode,
    setSelectedNode
  } = useStore((state) => ({
    connectingFrom: state.connectingFrom,
    setConnectingFrom: state.setConnectingFrom,
    addConnection: state.addConnection,
    updateNodePosition: state.updateNodePosition,
    addShockwave: state.addShockwave,
    selectedNode: state.selectedNode,
    setSelectedNode: state.setSelectedNode
  }))

  const { camera, raycaster, pointer } = useThree()
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.x += delta * 0.2
    }
    
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + node.createdAt * 0.001) * 0.15
      glowRef.current.scale.setScalar(scale)
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1
    }

    if (ringRef.current && hovered) {
      ringRef.current.rotation.z += delta * 2
      const scale = 1.2 + Math.sin(state.clock.elapsedTime * 5) * 0.1
      ringRef.current.scale.setScalar(scale)
    }

    if (isDragging && groupRef.current) {
      raycaster.setFromCamera(pointer, camera)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane.current, intersectPoint)
      if (intersectPoint) {
        groupRef.current.position.copy(intersectPoint)
        updateNodePosition(node.id, [intersectPoint.x, intersectPoint.y, intersectPoint.z])
      }
    }
  })

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    setIsDragging(true)
    dragStartPos.current = groupRef.current?.position.clone() || null
    
    const normal = new THREE.Vector3()
    camera.getWorldDirection(normal)
    plane.current.setFromNormalAndCoplanarPoint(
      normal,
      groupRef.current?.position || new THREE.Vector3()
    )
  }, [camera])

  const handlePointerUp = useCallback((e: any) => {
    e.stopPropagation()
    
    if (isDragging && dragStartPos.current) {
      const currentPos = groupRef.current?.position
      if (currentPos && dragStartPos.current.distanceTo(currentPos) < 0.1) {
        if (connectingFrom === null) {
          setConnectingFrom(node.id)
          setSelectedNode(node.id)
          playConnectSound()
        } else if (connectingFrom !== node.id) {
          addConnection(connectingFrom, node.id)
          setConnectingFrom(null)
          setSelectedNode(null)
          playConnectSound()
          onLog(node.id, 'connect')
        } else {
          setConnectingFrom(null)
          setSelectedNode(null)
        }
      }
    }
    
    setIsDragging(false)
    dragStartPos.current = null
  }, [isDragging, connectingFrom, node.id, setConnectingFrom, addConnection, setSelectedNode, onLog])

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    if (!isDragging) {
      addShockwave(node.position, node.color)
      playShockwaveSound(node.energy / 100)
      onLog(node.id, 'click')
    }
  }, [node, addShockwave, isDragging, onLog])

  const isSelected = selectedNode === node.id || connectingFrom === node.id

  return (
    <group ref={groupRef} position={node.position}>
      <mesh
        ref={glowRef}
        scale={1}
      >
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOut={() => setHovered(false)}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onClick={handleClick}
        castShadow
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 2 : 1}
          transparent
          opacity={0.9}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {hovered && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.9, 0.02, 16, 64]} />
          <meshBasicMaterial
            color="#ff4500"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.1, 0.03, 16, 64]} />
          <meshBasicMaterial
            color="#ffff00"
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  )
}
