import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'
import { setThreeContext } from '@/utils/threeContext'

function CellMembrane({ clippingPlanes }: { clippingPlanes: THREE.Plane[] }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { viewMode, hoveredOrganelle, selectedOrganelle, hoverOrganelle, selectOrganelle } =
    useAppStore()
  const isHovered = hoveredOrganelle === 'cellMembrane'
  const isSelected = selectedOrganelle === 'cellMembrane'

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002 * delta * 60
      meshRef.current.position.y = Math.sin(Date.now() * 0.0003) * 0.03
    }
  })

  const opacity = viewMode === 'section' ? 0.02 : 0.3
  const scale = isHovered || isSelected ? 1.02 : 1

  return (
    <mesh
      ref={meshRef}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        selectOrganelle('cellMembrane')
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        hoverOrganelle('cellMembrane')
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        hoverOrganelle(null)
        document.body.style.cursor = 'default'
      }}
    >
      <sphereGeometry args={[2.0, 64, 64]} />
      <meshPhysicalMaterial
        color="#4a90d9"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        roughness={0.2}
        metalness={0.1}
        clippingPlanes={clippingPlanes}
        clipShadows
      />
    </mesh>
  )
}

function Nucleus({ clippingPlanes }: { clippingPlanes: THREE.Plane[] }) {
  const groupRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)
  const { hoveredOrganelle, selectedOrganelle, hoverOrganelle, selectOrganelle } = useAppStore()
  const isHovered = hoveredOrganelle === 'nucleus'
  const isSelected = selectedOrganelle === 'nucleus'
  const glowRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005 * delta * 60
      groupRef.current.position.y = Math.sin(Date.now() * 0.0005) * 0.05
    }
    if (glowRef.current && isSelected) {
      const t = Date.now() * 0.005
      glowRef.current.scale.setScalar(1.15 + Math.sin(t) * 0.05)
    }
  })

  const scale = isHovered || isSelected ? 1.08 : 1

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation()
          selectOrganelle('nucleus')
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          hoverOrganelle('nucleus')
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          hoverOrganelle(null)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[0.6, 48, 48]} />
        <meshStandardMaterial
          color="#e74c3c"
          emissive="#e74c3c"
          emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0.2}
          roughness={0.4}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
      {isSelected && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  )
}

function Mitochondria({
  position,
  scale: objScale,
  clippingPlanes,
}: {
  position: [number, number, number]
  scale: [number, number, number]
  clippingPlanes: THREE.Plane[]
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { hoveredOrganelle, selectedOrganelle, hoverOrganelle, selectOrganelle } = useAppStore()
  const id = `mitochondria-${position.join(',')}`
  const isHovered = hoveredOrganelle === id
  const isSelected = selectedOrganelle === id

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.005 * delta * 60
      meshRef.current.position.y =
        position[1] + Math.sin(Date.now() * 0.0004 + position[0]) * 0.05
    }
  })

  const sc = isHovered || isSelected ? 1.1 : 1

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[objScale[0] * sc, objScale[1] * sc, objScale[2] * sc]}
      onClick={(e) => {
        e.stopPropagation()
        selectOrganelle('mitochondria')
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        hoverOrganelle(id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        hoverOrganelle(null)
        document.body.style.cursor = 'default'
      }}
    >
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        color="#27ae60"
        emissive="#27ae60"
        emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0.05}
        roughness={0.5}
        clippingPlanes={clippingPlanes}
      />
    </mesh>
  )
}

function EndoplasmicReticulum({ clippingPlanes }: { clippingPlanes: THREE.Plane[] }) {
  const groupRef = useRef<THREE.Group>(null!)
  const { hoveredOrganelle, selectedOrganelle, hoverOrganelle, selectOrganelle } = useAppStore()
  const isHovered = hoveredOrganelle === 'er'
  const isSelected = selectedOrganelle === 'er'

  const rings = useMemo(() => {
    const result = []
    for (let i = 0; i < 4; i++) {
      const radius = 0.8 + i * 0.15
      const tubeRadius = 0.04 + i * 0.005
      const yOffset = (i - 1.5) * 0.12
      const rotX = i * 0.08
      result.push({ radius, tubeRadius, yOffset, rotX, key: i })
    }
    return result
  }, [])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003 * delta * 60
      groupRef.current.position.y = Math.sin(Date.now() * 0.0003 + 1) * 0.04
    }
  })

  const scale = isHovered || isSelected ? 1.05 : 1

  return (
    <group
      ref={groupRef}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        selectOrganelle('er')
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        hoverOrganelle('er')
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        hoverOrganelle(null)
        document.body.style.cursor = 'default'
      }}
    >
      {rings.map(({ radius, tubeRadius, yOffset, rotX, key }) => (
        <mesh key={key} position={[0, yOffset, 0]} rotation={[rotX, 0, 0]}>
          <torusGeometry args={[radius, tubeRadius, 12, 64]} />
          <meshStandardMaterial
            color="#8e44ad"
            emissive="#8e44ad"
            emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0.05}
            roughness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
      ))}
    </group>
  )
}

function GolgiApparatus({ clippingPlanes }: { clippingPlanes: THREE.Plane[] }) {
  const groupRef = useRef<THREE.Group>(null!)
  const { hoveredOrganelle, selectedOrganelle, hoverOrganelle, selectOrganelle } = useAppStore()
  const isHovered = hoveredOrganelle === 'golgi'
  const isSelected = selectedOrganelle === 'golgi'

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.004 * delta * 60
      groupRef.current.position.y =
        0.4 + Math.sin(Date.now() * 0.00035 + 2) * 0.05
    }
  })

  const scale = isHovered || isSelected ? 1.08 : 1

  const discs = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      y: (i - 2) * 0.12,
      radius: 0.35 - i * 0.02,
      key: i,
    }))
  }, [])

  return (
    <group
      ref={groupRef}
      position={[1.2, 0.4, 0]}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        selectOrganelle('golgi')
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        hoverOrganelle('golgi')
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        hoverOrganelle(null)
        document.body.style.cursor = 'default'
      }}
    >
      {discs.map(({ y, radius, key }) => (
        <mesh key={key} position={[0, y, 0]}>
          <cylinderGeometry args={[radius, radius, 0.04, 32]} />
          <meshStandardMaterial
            color="#f39c12"
            emissive="#f39c12"
            emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0.05}
            roughness={0.4}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
      ))}
    </group>
  )
}

function Lysosome({
  position,
  clippingPlanes,
}: {
  position: [number, number, number]
  clippingPlanes: THREE.Plane[]
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { hoveredOrganelle, selectedOrganelle, hoverOrganelle, selectOrganelle } = useAppStore()
  const id = `lysosome-${position.join(',')}`
  const isHovered = hoveredOrganelle === id
  const isSelected = selectedOrganelle === id

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(Date.now() * 0.0005 + position[0] * 3) * 0.05
      meshRef.current.rotation.x += 0.005
    }
  })

  const scale = isHovered || isSelected ? 1.2 : 1

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        selectOrganelle('lysosome')
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        hoverOrganelle(id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        hoverOrganelle(null)
        document.body.style.cursor = 'default'
      }}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial
        color="#e67e22"
        emissive="#e67e22"
        emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0.05}
        roughness={0.5}
        clippingPlanes={clippingPlanes}
      />
    </mesh>
  )
}

const MITO_POSITIONS: Array<{
  pos: [number, number, number]
  scale: [number, number, number]
}> = [
  { pos: [0.8, 0.3, 0.2], scale: [0.4, 0.2, 0.2] },
  { pos: [-0.8, -0.3, -0.2], scale: [0.35, 0.18, 0.18] },
  { pos: [0.5, -0.5, 0.6], scale: [0.38, 0.22, 0.2] },
  { pos: [-0.6, 0.5, -0.5], scale: [0.32, 0.16, 0.16] },
]

const LYSO_POSITIONS: [number, number, number][] = [
  [0.9, 0.7, 0.5],
  [-0.7, 0.9, -0.6],
  [0.3, -0.9, 0.8],
  [-1.0, -0.4, 0.3],
  [0.6, 0.1, -0.9],
  [-0.3, -0.7, -0.5],
]

function ClippingController({
  clippingPlane,
}: {
  clippingPlane: THREE.Plane
}) {
  const { viewMode } = useAppStore()
  const targetZ = viewMode === 'section' ? 0 : 10

  useFrame(() => {
    const current = clippingPlane.constant
    const diff = -targetZ - current
    if (Math.abs(diff) > 0.01) {
      clippingPlane.constant += diff * 0.08
    } else {
      clippingPlane.constant = -targetZ
    }
  })

  return null
}

function ThreeContextSync() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    setThreeContext(gl, scene, camera)
  }, [gl, scene, camera])
  return null
}

function Scene() {
  const { viewMode, selectOrganelle } = useAppStore()
  const clippingPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, -1), viewMode === 'section' ? 0 : 10),
    []
  )
  const clippingPlanes = useMemo(() => [clippingPlane], [clippingPlane])

  const { gl } = useThree()

  useEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])

  return (
    <>
      <ThreeContextSync />
      <ClippingController clippingPlane={clippingPlane} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, -3, -3]} intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#e74c3c" />

      <CellMembrane clippingPlanes={clippingPlanes} />
      <Nucleus clippingPlanes={clippingPlanes} />

      {MITO_POSITIONS.map(({ pos, scale }) => (
        <Mitochondria key={pos.join(',')} position={pos} scale={scale} clippingPlanes={clippingPlanes} />
      ))}

      <EndoplasmicReticulum clippingPlanes={clippingPlanes} />
      <GolgiApparatus clippingPlanes={clippingPlanes} />

      {LYSO_POSITIONS.map((pos) => (
        <Lysosome key={pos.join(',')} position={pos} clippingPlanes={clippingPlanes} />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={8}
        enablePan={false}
      />
    </>
  )
}

export default function CellScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: false,
      }}
      style={{ width: '100%', height: '100%' }}
      onPointerMissed={() => {
        useAppStore.getState().selectOrganelle(null)
      }}
    >
      <color attach="background" args={['#0c0f1e']} />
      <fog attach="fog" args={['#0c0f1e', 6, 12]} />
      <Scene />
    </Canvas>
  )
}
