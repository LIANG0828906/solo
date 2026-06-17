import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMoleculeStore } from '@/store'
import type { Molecule } from '@/store'
import { generateAtomMeshes, generateBondMeshes } from '@/utils/renderAtoms'
import type { AtomMeshData, BondMeshData } from '@/utils/renderAtoms'

const SCENE_BACKGROUND = '#1a1a2e'
const AUTO_ROTATE_SPEED = 0.005
const TRANSITION_DURATION = 600

interface MoleculeContentProps {
  molecule: Molecule
  opacity: number
}

function AutoRotator({ enabled }: { enabled: boolean }) {
  const { camera } = useThree()

  useFrame((_, delta) => {
    if (enabled) {
      const spherical = new THREE.Spherical()
      spherical.setFromVector3(camera.position)
      spherical.theta -= AUTO_ROTATE_SPEED * delta * 60
      camera.position.setFromSpherical(spherical)
      camera.lookAt(0, 0, 0)
    }
  })

  return null
}

function CameraController() {
  const { camera } = useThree()
  const { cameraDistance, rotationY, rotationX } = useMoleculeStore()

  useEffect(() => {
    const phi = (90 - rotationX) * (Math.PI / 180)
    const theta = rotationY * (Math.PI / 180)

    const x = cameraDistance * Math.sin(phi) * Math.cos(theta)
    const y = cameraDistance * Math.cos(phi)
    const z = cameraDistance * Math.sin(phi) * Math.sin(theta)

    camera.position.set(x, y, z)
    camera.lookAt(0, 0, 0)
  }, [cameraDistance, rotationY, rotationX, camera])

  return null
}

function AtomLabel({ position, element, distance }: {
  position: [number, number, number]
  element: string
  distance: number
}) {
  const scale = Math.max(0.3, 10 / distance)
  const labelPosition: [number, number, number] = [
    position[0],
    position[1] + 0.8,
    position[2],
  ]

  return (
    <Html
      position={labelPosition}
      center
      zIndexRange={[100, 0]}
      style={{
        pointerEvents: 'none',
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#ffffff',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 600,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
          userSelect: 'none',
        }}
      >
        {element}
      </div>
    </Html>
  )
}

function MoleculeContent({ molecule, opacity }: MoleculeContentProps) {
  const { camera } = useThree()
  const { showLabels } = useMoleculeStore()

  const { atomMeshes, bondMeshes } = useMemo(() => {
    const atoms = generateAtomMeshes(molecule.atoms)
    const bonds = generateBondMeshes(molecule.atoms, molecule.bonds)
    return { atomMeshes: atoms, bondMeshes: bonds }
  }, [molecule])

  const cameraDistance = useMemo(() => {
    return camera.position.length()
  }, [camera.position])

  return (
    <group>
      {bondMeshes.map((bond: BondMeshData, index: number) => (
        <mesh
          key={`bond-${index}`}
          position={bond.position}
          rotation={bond.rotation}
          geometry={bond.geometry}
          material={bond.material}
        />
      ))}

      {atomMeshes.map((atom: AtomMeshData, index: number) => (
        <group key={`atom-group-${index}`}>
          <mesh
            position={atom.position}
            geometry={atom.geometry}
          >
            <meshStandardMaterial
              color={atom.material.color}
              transparent
              opacity={opacity * 0.85}
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
          {showLabels && (
            <AtomLabel
              position={atom.position}
              element={atom.element}
              distance={cameraDistance}
            />
          )}
        </group>
      ))}
    </group>
  )
}

function SceneContent() {
  const currentMolecule = useMoleculeStore((state) => state.getCurrentMolecule())
  const currentMoleculeId = useMoleculeStore((state) => state.currentMoleculeId)
  const autoRotate = useMoleculeStore((state) => state.autoRotate)

  const [displayMolecule, setDisplayMolecule] = useState<Molecule | undefined>(currentMolecule)
  const [opacity, setOpacity] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (currentMolecule && currentMolecule.id !== displayMolecule?.id) {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }

      setIsTransitioning(true)
      const startTime = Date.now()

      const animateOut = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / (TRANSITION_DURATION / 2), 1)
        const newOpacity = 1 - progress

        setOpacity(newOpacity)

        if (progress < 1) {
          transitionTimerRef.current = window.requestAnimationFrame(animateOut)
        } else {
          setDisplayMolecule(currentMolecule)

          const startTime2 = Date.now()
          const animateIn = () => {
            const elapsed2 = Date.now() - startTime2
            const progress2 = Math.min(elapsed2 / (TRANSITION_DURATION / 2), 1)
            setOpacity(progress2)

            if (progress2 < 1) {
              transitionTimerRef.current = window.requestAnimationFrame(animateIn)
            } else {
              setIsTransitioning(false)
            }
          }
          transitionTimerRef.current = window.requestAnimationFrame(animateIn)
        }
      }

      transitionTimerRef.current = window.requestAnimationFrame(animateOut)
    }

    return () => {
      if (transitionTimerRef.current) {
        window.cancelAnimationFrame(transitionTimerRef.current)
      }
    }
  }, [currentMoleculeId, currentMolecule, displayMolecule?.id])

  if (!displayMolecule) return null

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      <pointLight position={[0, 5, 0]} intensity={0.6} />
      <pointLight position={[0, -5, 0]} intensity={0.3} color="#6666ff" />
      <pointLight position={[5, 0, 5]} intensity={0.2} color="#00d4ff" />

      <CameraController />
      <AutoRotator enabled={autoRotate} />

      <MoleculeContent
        molecule={displayMolecule}
        opacity={opacity}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={20}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />
    </>
  )
}

export default function MoleculeViewer() {
  return (
    <div style={{ width: '100%', height: '100%', background: SCENE_BACKGROUND }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[SCENE_BACKGROUND]} />
        <fog attach="fog" args={[SCENE_BACKGROUND, 20, 50]} />
        <SceneContent />
      </Canvas>
    </div>
  )
}
