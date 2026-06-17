import { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, PerspectiveCamera } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useViewerStore } from '../store'
import moleculesData from '../data/molecules.json'
import { getAtomsAndBonds } from '../utils/renderAtoms'
import type { Molecule } from '../types'

const molecules = moleculesData as unknown as Record<string, Molecule>

function Atom({
  position,
  color,
  radius,
  element,
  showLabel,
  scale
}: {
  position: [number, number, number]
  color: string
  radius: number
  element: string
  showLabel: boolean
  scale: number
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.85}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {showLabel && (
        <Html
          center
          distanceFactor={8}
          position={[0, radius + 0.3, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: `${16 * scale}px`,
              fontFamily: 'sans-serif',
              whiteSpace: 'nowrap',
              fontWeight: 'bold',
              border: '1px solid rgba(0, 212, 255, 0.3)'
            }}
          >
            {element}
          </div>
        </Html>
      )}
    </group>
  )
}

function Bond({
  position,
  rotation,
  length
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  length: number
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.08, 0.08, length, 16]} />
      <meshStandardMaterial
        color="#888888"
        roughness={0.5}
        metalness={0.3}
      />
    </mesh>
  )
}

function MoleculeMesh({ moleculeKey }: { moleculeKey: string }) {
  const molecule = molecules[moleculeKey]
  const { atoms, bonds } = useMemo(
    () => getAtomsAndBonds(molecule.atoms, molecule.bonds),
    [molecule]
  )
  const showLabels = useViewerStore((s) => s.showLabels)
  const cameraDistance = useViewerStore((s) => s.cameraDistance)
  const labelScale = useMemo(() => Math.max(0.5, 10 / cameraDistance), [cameraDistance])

  return (
    <group>
      {atoms.map((atom, idx) => (
        <Atom
          key={`atom-${idx}`}
          position={atom.position}
          color={atom.color}
          radius={atom.radius}
          element={atom.element}
          showLabel={showLabels}
          scale={labelScale}
        />
      ))}
      {bonds.map((bond, idx) => (
        <Bond
          key={`bond-${idx}`}
          position={bond.position}
          rotation={bond.rotation}
          length={bond.length}
        />
      ))}
    </group>
  )
}

function AutoRotateGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const autoRotate = useViewerStore((s) => s.autoRotate)
  const rotationY = useViewerStore((s) => s.rotationY)
  const tiltX = useViewerStore((s) => s.tiltX)

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (autoRotate) {
        groupRef.current.rotation.y += delta * 0.5
      } else {
        groupRef.current.rotation.y = (rotationY * Math.PI) / 180
      }
      groupRef.current.rotation.x = (tiltX * Math.PI) / 180
    }
  })

  return <group ref={groupRef}>{children}</group>
}

function MoleculeTransition({ moleculeKey }: { moleculeKey: string }) {
  const [displayKey, setDisplayKey] = useState(moleculeKey)
  const [opacity, setOpacity] = useState(1)
  const groupRef = useRef<THREE.Group>(null)
  const isTransitioning = useRef(false)

  useEffect(() => {
    if (moleculeKey !== displayKey) {
      isTransitioning.current = true
      let startTime: number | null = null
      const duration = 300
      const animate = (time: number) => {
        if (startTime === null) startTime = time
        const elapsed = time - startTime
        const progress = Math.min(elapsed / duration, 1)
        setOpacity(1 - progress)
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setDisplayKey(moleculeKey)
          startTime = null
          const animateIn = (time2: number) => {
            if (startTime === null) startTime = time2
            const elapsed2 = time2 - startTime
            const progress2 = Math.min(elapsed2 / duration, 1)
            setOpacity(progress2)
            if (progress2 < 1) {
              requestAnimationFrame(animateIn)
            } else {
              setOpacity(1)
              isTransitioning.current = false
            }
          }
          requestAnimationFrame(animateIn)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [moleculeKey, displayKey])

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = 0.8 + 0.2 * opacity
      groupRef.current.scale.setScalar(targetScale)
      groupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const material = mesh.material as THREE.MeshStandardMaterial
          if (material.transparent || material.opacity !== undefined) {
            material.opacity = 0.85 * opacity
            material.transparent = true
          }
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      <AutoRotateGroup>
        <MoleculeMesh moleculeKey={displayKey} />
      </AutoRotateGroup>
    </group>
  )
}

export default function MoleculeViewer() {
  const currentMolecule = useViewerStore((s) => s.currentMolecule)
  const cameraDistance = useViewerStore((s) => s.cameraDistance)
  const tiltX = useViewerStore((s) => s.tiltX)
  const rotationY = useViewerStore((s) => s.rotationY)
  const autoRotate = useViewerStore((s) => s.autoRotate)
  const controlsRef = useRef<OrbitControlsImpl>(null)

  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (autoRotate) {
      return [0, 0, cameraDistance]
    }
    const tiltRad = (tiltX * Math.PI) / 180
    const rotRad = (rotationY * Math.PI) / 180
    return [
      cameraDistance * Math.sin(rotRad) * Math.cos(tiltRad),
      cameraDistance * Math.sin(tiltRad),
      cameraDistance * Math.cos(rotRad) * Math.cos(tiltRad)
    ]
  }, [cameraDistance, tiltX, rotationY, autoRotate])

  return (
    <div style={{ width: '100%', height: '100%', background: '#1a1a2e' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={50}
          near={0.1}
          far={1000}
        />

        <color attach="background" args={['#1a1a2e']} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
          enableDamping
          dampingFactor={0.05}
        />

        <MoleculeTransition moleculeKey={currentMolecule} />
      </Canvas>
    </div>
  )
}
