import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMoleculeStore } from '@/store'
import type { Molecule, Atom, Bond } from '@/store'
import { createAtomGeometry, createAtomMaterial, createBondMaterial, getBondTransform, BOND_RADIUS } from '@/utils/renderAtoms'

const SCENE_BACKGROUND = '#1a1a2e'
const AUTO_ROTATE_SPEED = 0.005
const FADE_OUT_DURATION = 300
const FADE_IN_DURATION = 300

interface InstancedAtomsProps {
  atoms: Atom[]
  opacity: number
  onAtomRefs?: (refs: Map<string, THREE.InstancedMesh>) => void
}

function InstancedAtoms({ atoms, opacity, onAtomRefs }: InstancedAtomsProps) {
  const meshRefs = useRef<Map<string, THREE.InstancedMesh>>(new Map())
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const atomGroups = useMemo(() => {
    const groups = new Map<string, { atoms: Atom[], color: string; radius: number }>()
    atoms.forEach((atom) => {
      const key = `${atom.element}-${atom.radius}-${atom.color}`
      if (!groups.has(key)) {
        groups.set(key, { atoms: [], color: atom.color, radius: atom.radius })
      }
      groups.get(key)!.atoms.push(atom)
    })
    return groups
  }, [atoms])

  const entries = useMemo(() => Array.from(atomGroups.entries()), [atomGroups])

  useEffect(() => {
    if (onAtomRefs) {
      onAtomRefs(meshRefs.current)
    }
  }, [entries, onAtomRefs])

  useFrame(() => {
    entries.forEach(([key, group]) => {
      const mesh = meshRefs.current.get(key)
      if (!mesh) return
      group.atoms.forEach((atom, i) => {
        dummy.position.set(atom.x, atom.y, atom.z)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <>
      {entries.map(([key, group]) => {
        const geometry = createAtomGeometry(group.radius)
        const material = createAtomMaterial(group.color)
        return (
          <instancedMesh
            key={key}
            ref={(el) => {
              if (el) meshRefs.current.set(key, el)
            }}
            args={[geometry, material, group.atoms.length]}
          >
            <meshStandardMaterial
              color={group.color}
              transparent
              opacity={opacity * 0.85}
              roughness={0.3}
              metalness={0.1}
            />
          </instancedMesh>
        )
      })}
    </>
  )
}

interface InstancedBondsProps {
  atoms: Atom[]
  bonds: Bond[]
}

function InstancedBonds({ atoms, bonds }: InstancedBondsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const bondTransforms = useMemo(() => {
    return bonds.map((bond) => {
      const fromAtom = atoms[bond.from]
      const toAtom = atoms[bond.to]
      return getBondTransform(fromAtom, toAtom)
    })
  }, [atoms, bonds])

  const averageGeometry = useMemo(() => {
    const avgLength = bondTransforms.length > 0
      ? bondTransforms.reduce((sum, t) => sum + t.length, 0) / bondTransforms.length
      : 1
    return new THREE.CylinderGeometry(BOND_RADIUS, BOND_RADIUS, avgLength, 12, 1)
  }, [bondTransforms])

  useFrame(() => {
    if (!meshRef.current) return
    bondTransforms.forEach((transform, i) => {
      dummy.position.copy(transform.position)
      dummy.quaternion.copy(transform.rotation)
      const scale = transform.length > 0 ? transform.length / 1 : 1
      dummy.scale.set(1, scale, 1)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (bonds.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[averageGeometry, createBondMaterial(), bonds.length]}
    />
  )
}

function AtomLabels({ atoms, show }: { atoms: Atom[]; show: boolean }) {
  const { camera } = useThree()
  const [cameraDistance, setCameraDistance] = useState(10)

  useFrame(() => {
    setCameraDistance(camera.position.length())
  })

  if (!show) return null

  const scale = Math.max(0.3, 10 / cameraDistance)

  return (
    <>
      {atoms.map((atom, index) => {
        const labelPosition: [number, number, number] = [
          atom.x,
          atom.y + atom.radius + 0.5,
          atom.z,
        ]
        return (
          <Html
            key={`label-${index}`}
            position={labelPosition}
            center
            zIndexRange={[100, 0]}
            style={{
              pointerEvents: 'none',
              transform: `scale(${scale})`,
              transition: 'transform 0.1s linear',
            }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                color: '#ffffff',
                padding: '3px 9px',
                borderRadius: '5px',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(0, 212, 255, 0.15)',
                userSelect: 'none',
                border: '1px solid rgba(0, 212, 255, 0.2)',
              }}
            >
              {atom.element}
            </div>
          </Html>
        )
      })}
    </>
  )
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

interface MoleculeContentProps {
  molecule: Molecule
  opacity: number
}

function MoleculeContent({ molecule, opacity }: MoleculeContentProps) {
  const { showLabels } = useMoleculeStore()

  return (
    <group>
      <InstancedBonds atoms={molecule.atoms} bonds={molecule.bonds} />
      <InstancedAtoms atoms={molecule.atoms} opacity={opacity} />
      <AtomLabels atoms={molecule.atoms} show={showLabels} />
    </group>
  )
}

type TransitionPhase = 'idle' | 'fadeOut' | 'fadeIn'

function SceneContent() {
  const currentMolecule = useMoleculeStore((state) => state.getCurrentMolecule())
  const currentMoleculeId = useMoleculeStore((state) => state.currentMoleculeId)
  const autoRotate = useMoleculeStore((state) => state.autoRotate)

  const [oldMolecule, setOldMolecule] = useState<Molecule | undefined>(currentMolecule)
  const [newMolecule, setNewMolecule] = useState<Molecule | undefined>(currentMolecule)
  const [oldOpacity, setOldOpacity] = useState(1)
  const [newOpacity, setNewOpacity] = useState(1)
  const [phase, setPhase] = useState<TransitionPhase>('idle')
  const phaseRef = useRef<TransitionPhase>('idle')
  const startTimeRef = useRef<number>(0)
  const pendingMoleculeRef = useRef<Molecule | undefined>(undefined)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    if (!currentMolecule) return
    if (currentMolecule.id === newMolecule?.id) return
    if (currentMolecule.id === oldMolecule?.id && phase === 'fadeOut') return

    pendingMoleculeRef.current = currentMolecule

    if (phaseRef.current === 'idle') {
      setPhase('fadeOut')
      phaseRef.current = 'fadeOut'
      startTimeRef.current = performance.now()
      setOldMolecule(newMolecule)
      setNewMolecule(undefined)
    }
  }, [currentMoleculeId, currentMolecule])

  useFrame(() => {
    if (phaseRef.current === 'fadeOut' && oldMolecule) {
      const elapsed = performance.now() - startTimeRef.current
      const progress = Math.min(elapsed / FADE_OUT_DURATION, 1)
      const opacity = 1 - progress
      setOldOpacity(opacity)

      if (progress >= 1) {
        setPhase('fadeIn')
        phaseRef.current = 'fadeIn'
        startTimeRef.current = performance.now()
        setOldMolecule(undefined)
        setOldOpacity(0)
        setNewMolecule(pendingMoleculeRef.current)
        setNewOpacity(0)
      }
    } else if (phaseRef.current === 'fadeIn' && newMolecule) {
      const elapsed = performance.now() - startTimeRef.current
      const progress = Math.min(elapsed / FADE_IN_DURATION, 1)
      setNewOpacity(progress)

      if (progress >= 1) {
        setPhase('idle')
        phaseRef.current = 'idle'
        setNewOpacity(1)
      }
    }
  })

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

      {oldMolecule && (
        <MoleculeContent molecule={oldMolecule} opacity={oldOpacity} />
      )}
      {newMolecule && (
        <MoleculeContent molecule={newMolecule} opacity={newOpacity} />
      )}

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
        frameloop="always"
      >
        <color attach="background" args={[SCENE_BACKGROUND]} />
        <fog attach="fog" args={[SCENE_BACKGROUND, 20, 50]} />
        <SceneContent />
      </Canvas>
    </div>
  )
}
