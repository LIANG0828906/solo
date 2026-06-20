import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'
import { setThreeContext } from '@/utils/threeContext'
import { RotateCw, RotateCcw } from 'lucide-react'

function breathingOffset(
  t: number,
  seed: number,
  base: number = 0.04,
  variation: number = 0.025
): number {
  const a = Math.sin(t * 0.6 + seed) * base
  const b = Math.sin(t * 1.3 + seed * 2.1) * variation * 0.6
  const c = Math.cos(t * 0.35 + seed * 0.7) * variation * 0.3
  return a + b + c
}

function CellMembrane({ clippingPlanes }: { clippingPlanes: THREE.Plane[] }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const haloRef = useRef<THREE.Mesh>(null!)
  const { viewMode, hoveredOrganelle, selectedOrganelle, hoverOrganelle, selectOrganelle } =
    useAppStore()
  const isHovered = hoveredOrganelle === 'cellMembrane'
  const isSelected = selectedOrganelle === 'cellMembrane'

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002 * delta * 60
      meshRef.current.position.y = breathingOffset(Date.now() * 0.001, 0.5, 0.02, 0.015)
    }
    if (haloRef.current) {
      const t = Date.now() * 0.001
      const pulse = 1 + Math.sin(t * 0.9) * 0.015
      haloRef.current.scale.setScalar(pulse)
    }
  })

  const opacity = viewMode === 'section' ? 0.02 : 0.3
  const scale = isHovered || isSelected ? 1.02 : 1

  return (
    <group>
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
      <mesh ref={haloRef}>
        <sphereGeometry args={[2.08, 32, 32]} />
        <meshBasicMaterial
          color="#4a90d9"
          transparent
          opacity={viewMode === 'section' ? 0.03 : 0.08}
          side={THREE.BackSide}
          depthWrite={false}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
    </group>
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
      groupRef.current.position.y = breathingOffset(Date.now() * 0.001, 1.2, 0.04, 0.02)
    }
    if (glowRef.current) {
      if (isSelected) {
        const t = Date.now() * 0.005
        glowRef.current.scale.setScalar(1.15 + Math.sin(t) * 0.05)
        ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.22 + Math.sin(t) * 0.08
      } else {
        const t = Date.now() * 0.001
        glowRef.current.scale.setScalar(1.18 + Math.sin(t * 1.1) * 0.02)
        ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.14
      }
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
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial
          color="#e74c3c"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          depthWrite={false}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
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
  const haloRef = useRef<THREE.Mesh>(null!)
  const { hoveredOrganelle, selectedOrganelle, hoverOrganelle, selectOrganelle } = useAppStore()
  const id = `mitochondria-${position.join(',')}`
  const isHovered = hoveredOrganelle === id
  const isSelected = selectedOrganelle === id
  const seed = useMemo(() => position[0] * 3 + position[1] * 5 + position[2] * 7, [position])

  useFrame((_, delta) => {
    if (meshRef.current && haloRef.current) {
      meshRef.current.rotation.z += 0.005 * delta * 60
      haloRef.current.rotation.z += 0.005 * delta * 60
      const yOffset = breathingOffset(Date.now() * 0.001, seed, 0.04, 0.025)
      const xOffset = breathingOffset(Date.now() * 0.001, seed + 3.3, 0.02, 0.015)
      meshRef.current.position.set(
        position[0] + xOffset,
        position[1] + yOffset,
        position[2]
      )
      haloRef.current.position.copy(meshRef.current.position)
    }
  })

  const sc = isHovered || isSelected ? 1.1 : 1

  return (
    <group>
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
      <mesh
        ref={haloRef}
        position={position}
        scale={[objScale[0] * 1.22, objScale[1] * 1.22, objScale[2] * 1.22]}
      >
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial
          color="#27ae60"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          depthWrite={false}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
    </group>
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
      groupRef.current.position.y = breathingOffset(Date.now() * 0.001, 2.1, 0.035, 0.02)
      groupRef.current.rotation.x =
        Math.sin(Date.now() * 0.0004 + 1.5) * 0.05
    }
  })

  const scale = isHovered || isSelected ? 1.05 : 1
  const emitIntensity = isSelected ? 0.5 : isHovered ? 0.3 : 0.05

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
        <group key={key}>
          <mesh position={[0, yOffset, 0]} rotation={[rotX, 0, 0]}>
            <torusGeometry args={[radius, tubeRadius, 12, 64]} />
            <meshStandardMaterial
              color="#8e44ad"
              emissive="#8e44ad"
              emissiveIntensity={emitIntensity}
              roughness={0.5}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
          <mesh position={[0, yOffset, 0]} rotation={[rotX, 0, 0]}>
            <torusGeometry args={[radius + tubeRadius * 1.8, tubeRadius * 0.9, 10, 48]} />
            <meshBasicMaterial
              color="#8e44ad"
              transparent
              opacity={0.13}
              side={THREE.BackSide}
              depthWrite={false}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
        </group>
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
      const t = Date.now() * 0.001
      groupRef.current.position.y =
        0.4 + breathingOffset(t, 3.7, 0.04, 0.025)
      groupRef.current.rotation.z = Math.sin(t * 0.45 + 2) * 0.04
    }
  })

  const scale = isHovered || isSelected ? 1.08 : 1
  const emitIntensity = isSelected ? 0.5 : isHovered ? 0.3 : 0.05

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
        <group key={key} position={[0, y, 0]}>
          <mesh>
            <cylinderGeometry args={[radius, radius, 0.04, 32]} />
            <meshStandardMaterial
              color="#f39c12"
              emissive="#f39c12"
              emissiveIntensity={emitIntensity}
              roughness={0.4}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[radius * 1.18, radius * 1.18, 0.06, 32]} />
            <meshBasicMaterial
              color="#f39c12"
              transparent
              opacity={0.14}
              side={THREE.BackSide}
              depthWrite={false}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
        </group>
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
  const haloRef = useRef<THREE.Mesh>(null!)
  const { hoveredOrganelle, selectedOrganelle, hoverOrganelle, selectOrganelle } = useAppStore()
  const id = `lysosome-${position.join(',')}`
  const isHovered = hoveredOrganelle === id
  const isSelected = selectedOrganelle === id
  const seed = useMemo(() => position[0] * 11 + position[1] * 13 + position[2] * 17, [position])

  useFrame(() => {
    if (meshRef.current && haloRef.current) {
      const t = Date.now() * 0.001
      meshRef.current.rotation.x += 0.005
      meshRef.current.rotation.y += 0.003
      haloRef.current.rotation.x += 0.005
      haloRef.current.rotation.y += 0.003
      const y = position[1] + breathingOffset(t, seed, 0.04, 0.03)
      const x = position[0] + breathingOffset(t, seed + 5.5, 0.025, 0.02)
      const z = position[2] + breathingOffset(t, seed + 7.7, 0.02, 0.018)
      meshRef.current.position.set(x, y, z)
      haloRef.current.position.set(x, y, z)
    }
  })

  const scale = isHovered || isSelected ? 1.2 : 1

  return (
    <group>
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
      <mesh ref={haloRef} position={position} scale={scale * 1.25}>
        <sphereGeometry args={[0.15, 14, 14]} />
        <meshBasicMaterial
          color="#e67e22"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
    </group>
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

function AutoRotateController({
  controlsRef,
}: {
  controlsRef: React.MutableRefObject<any>
}) {
  const { autoRotate } = useAppStore()
  const userActiveRef = useRef(false)
  const resumeTimerRef = useRef<number | null>(null)
  const rotatingGroupRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    let enabled = true

    const handleStart = () => {
      if (!enabled) return
      userActiveRef.current = true
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current)
        resumeTimerRef.current = null
      }
    }
    const handleEnd = () => {
      if (!enabled) return
      resumeTimerRef.current = window.setTimeout(() => {
        userActiveRef.current = false
        resumeTimerRef.current = null
      }, 3000)
    }
    controls.addEventListener('start', handleStart)
    controls.addEventListener('end', handleEnd)
    return () => {
      enabled = false
      controls.removeEventListener('start', handleStart)
      controls.removeEventListener('end', handleEnd)
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current)
      }
    }
  }, [controlsRef])

  const { scene } = useThree()
  useEffect(() => {
    let rotator = scene.getObjectByName('__AUTO_ROTATOR__') as THREE.Group | undefined
    if (!rotator) {
      rotator = new THREE.Group()
      rotator.name = '__AUTO_ROTATOR__'
      const childrenToMove = [...scene.children].filter(
        (c) =>
          c.type !== 'AmbientLight' &&
          c.type !== 'DirectionalLight' &&
          c.type !== 'PointLight' &&
          c.type !== 'Fog' &&
          c.name !== '__AUTO_ROTATOR__' &&
          !(c as any).isOrbitControls
      )
      childrenToMove.forEach((c) => rotator!.add(c))
      scene.add(rotator)
    }
    rotatingGroupRef.current = rotator
  }, [scene])

  useFrame((_, delta) => {
    if (!autoRotate || userActiveRef.current) return
    if (rotatingGroupRef.current) {
      rotatingGroupRef.current.rotation.y += 0.08 * delta
    }
  })

  return null
}

function Scene({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  const { viewMode } = useAppStore()
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
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={8}
        enablePan={false}
      />

      <AutoRotateController controlsRef={controlsRef} />
    </>
  )
}

function AutoRotateToggle() {
  const { autoRotate, setAutoRotate, isCapturing } = useAppStore()
  if (isCapturing) return null
  const Icon = autoRotate ? RotateCw : RotateCcw
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '28px',
        zIndex: 150,
      }}
    >
      <button
        onClick={() => setAutoRotate(!autoRotate)}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          borderRadius: '8px',
          background: autoRotate
            ? 'rgba(74, 144, 217, 0.85)'
            : 'rgba(42, 47, 82, 0.85)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = autoRotate
            ? 'rgba(74, 144, 217, 1)'
            : 'rgba(58, 63, 98, 0.95)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = autoRotate
            ? 'rgba(74, 144, 217, 0.85)'
            : 'rgba(42, 47, 82, 0.85)'
        }}
        onMouseDown={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        }}
        title={autoRotate ? '自动旋转：开启（点击关闭）' : '自动旋转：关闭（点击开启）'}
      >
        <Icon size={18} className={autoRotate ? 'spin-icon' : ''} />
      </button>
      <style>{`
        .spin-icon {
          animation: slow-spin 4s linear infinite;
        }
        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function CellScene() {
  const controlsRef = useRef<any>(null)

  return (
    <>
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
        <Scene controlsRef={controlsRef} />
      </Canvas>
      <AutoRotateToggle />
    </>
  )
}
