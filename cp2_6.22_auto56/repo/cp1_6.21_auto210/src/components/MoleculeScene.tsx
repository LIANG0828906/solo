import { useRef, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useMoleculeContext } from '../utils/context'
import type { Atom, Bond } from '../data/molecules'

function AtomMesh({ atom, displayMode, isDisassembled, displaceDir, onAtomClick, isSelected, isMeasured }: {
  atom: Atom
  displayMode: string
  isDisassembled: boolean
  displaceDir: THREE.Vector3
  onAtomClick: (id: string) => void
  isSelected: boolean
  isMeasured: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const basePos = useMemo(() => new THREE.Vector3(...atom.position), [atom.position])
  const targetPos = useRef(new THREE.Vector3(...atom.position))
  const currentOffset = useRef(0)

  const radius = useMemo(() => {
    if (displayMode === 'space-fill') return atom.radius * 1.8
    if (displayMode === 'wireframe') return atom.radius * 0.15
    return atom.radius * 0.6
  }, [displayMode, atom.radius])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const targetOffset = isDisassembled ? 2.0 : 0
    currentOffset.current += (targetOffset - currentOffset.current) * Math.min(1, delta * 4)
    const pos = basePos.clone().add(displaceDir.clone().multiplyScalar(currentOffset.current))
    meshRef.current.position.copy(pos)

    if (isSelected || isMeasured) {
      const scale = 1 + 0.08 * Math.sin(Date.now() * 0.005)
      meshRef.current.scale.setScalar(scale)
    } else {
      meshRef.current.scale.setScalar(1)
    }
  })

  if (displayMode === 'wireframe') {
    return (
      <mesh ref={meshRef} position={atom.position}>
        <sphereGeometry args={[radius, 8, 8]} />
        <meshBasicMaterial color={atom.color} transparent opacity={0.8} />
      </mesh>
    )
  }

  return (
    <mesh ref={meshRef} position={atom.position} onClick={(e) => { e.stopPropagation(); onAtomClick(atom.id) }}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={atom.color}
        emissive={isSelected ? '#3B82F6' : isMeasured ? '#10B981' : '#000000'}
        emissiveIntensity={isSelected || isMeasured ? 0.5 : 0}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  )
}

function BondMesh({ bond, atomsMap, displayMode }: {
  bond: Bond
  atomsMap: Record<string, Atom>
  displayMode: string
}) {
  const meshRef = useRef<THREE.Group>(null)
  const atom1 = atomsMap[bond.atom1Id]
  const atom2 = atomsMap[bond.atom2Id]

  const { midpoint, direction, length } = useMemo(() => {
    if (!atom1 || !atom2) return { midpoint: new THREE.Vector3(), direction: new THREE.Vector3(0, 1, 0), length: 0 }
    const p1 = new THREE.Vector3(...atom1.position)
    const p2 = new THREE.Vector3(...atom2.position)
    const mid = p1.clone().add(p2).multiplyScalar(0.5)
    const dir = p2.clone().sub(p1)
    const len = dir.length()
    dir.normalize()
    return { midpoint: mid, direction: dir, length: len }
  }, [atom1, atom2])

  if (displayMode === 'space-fill' || displayMode === 'wireframe') return null

  const cylinderRadius = bond.order === 2 ? 0.04 : 0.03

  return (
    <group ref={meshRef} position={midpoint}>
      <mesh
        rotation={[0, 0, 0]}
        quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)}
      >
        <cylinderGeometry args={[cylinderRadius, cylinderRadius, length, 8]} />
        <meshStandardMaterial color="#8899AA" roughness={0.5} metalness={0.1} />
      </mesh>
      {bond.order === 2 && (
        <mesh
          position={[0.06, 0, 0]}
          quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)}
        >
          <cylinderGeometry args={[cylinderRadius, cylinderRadius, length, 8]} />
          <meshStandardMaterial color="#8899AA" roughness={0.5} metalness={0.1} />
        </mesh>
      )}
    </group>
  )
}

function MeasurementLine({ atom1Pos, atom2Pos, distance }: {
  atom1Pos: [number, number, number]
  atom2Pos: [number, number, number]
  distance: number
}) {
  const points = useMemo(() => [
    new THREE.Vector3(...atom1Pos),
    new THREE.Vector3(...atom2Pos),
  ], [atom1Pos, atom2Pos])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points)
    return g
  }, [points])

  return (
    <group>
      <line geometry={geometry}>
        <lineBasicMaterial color="#10B981" linewidth={2} />
      </line>
      {/* Arrow heads */}
      <mesh position={atom1Pos}>
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshBasicMaterial color="#10B981" />
      </mesh>
      <mesh position={atom2Pos}>
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshBasicMaterial color="#10B981" />
      </mesh>
    </group>
  )
}

function AtomInfoCard({ atom, position }: { atom: Atom; position: [number, number, number] }) {
  const { viewport } = useThree()
  return (
    <group position={[position[0], position[1] + atom.radius + 0.4, position[2]]}>
      <mesh>
        <planeGeometry args={[1.8, 0.9]} />
        <meshBasicMaterial color="#1E293B" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function SceneContent() {
  const {
    currentMolecule, mode, displayMode,
    selectedAtoms, setSelectedAtoms,
    measuredAtoms, setMeasuredAtoms,
    disassembledAtoms, setDisassembledAtoms,
    cameraAzimuthRef, resetViewFnRef, moleculeKey,
  } = useMoleculeContext()

  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const fadeRef = useRef(0)
  const { camera } = useThree()

  const atomsMap = useMemo(() => {
    const map: Record<string, Atom> = {}
    currentMolecule.atoms.forEach(a => { map[a.id] = a })
    return map
  }, [currentMolecule])

  const centroid = useMemo(() => {
    const c = new THREE.Vector3()
    currentMolecule.atoms.forEach(a => c.add(new THREE.Vector3(...a.position)))
    c.divideScalar(currentMolecule.atoms.length)
    return c
  }, [currentMolecule])

  const displaceDirs = useMemo(() => {
    const dirs: Record<string, THREE.Vector3> = {}
    currentMolecule.atoms.forEach(a => {
      const pos = new THREE.Vector3(...a.position)
      const dir = pos.clone().sub(centroid)
      if (dir.length() < 0.01) dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
      dir.normalize()
      dirs[a.id] = dir
    })
    return dirs
  }, [currentMolecule, centroid])

  const handleAtomClick = useCallback((atomId: string) => {
    if (mode === 'select') {
      setSelectedAtoms(selectedAtoms[0] === atomId ? [] : [atomId])
      setMeasuredAtoms([])
    } else if (mode === 'measure') {
      if (measuredAtoms.length >= 2) {
        setMeasuredAtoms([atomId])
      } else {
        setMeasuredAtoms([...measuredAtoms, atomId])
      }
      setSelectedAtoms([])
    } else if (mode === 'disassemble') {
      setDisassembledAtoms(
        disassembledAtoms.includes(atomId)
          ? disassembledAtoms.filter(id => id !== atomId)
          : [...disassembledAtoms, atomId]
      )
      setSelectedAtoms([])
    }
  }, [mode, selectedAtoms, measuredAtoms, disassembledAtoms, setSelectedAtoms, setMeasuredAtoms, setDisassembledAtoms])

  useFrame((_, delta) => {
    fadeRef.current = Math.min(1, fadeRef.current + delta * 3.33)
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const mat = mesh.material as THREE.MeshStandardMaterial
          if (mat) mat.opacity = fadeRef.current
        }
      })
    }

    if (controlsRef.current) {
      const azimuth = controlsRef.current.getAzimuthalAngle?.() ?? 0
      cameraAzimuthRef.current = azimuth
    }
  })

  useEffect(() => {
    fadeRef.current = 0
  }, [moleculeKey])

  useEffect(() => {
    resetViewFnRef.current = () => {
      if (controlsRef.current) {
        controlsRef.current.reset()
      }
    }
  }, [resetViewFnRef])

  const measuredDistance = useMemo(() => {
    if (measuredAtoms.length < 2) return null
    const a1 = atomsMap[measuredAtoms[0]]
    const a2 = atomsMap[measuredAtoms[1]]
    if (!a1 || !a2) return null
    const p1 = new THREE.Vector3(...a1.position)
    const p2 = new THREE.Vector3(...a2.position)
    const dist = p1.distanceTo(p2) * 100
    return dist
  }, [measuredAtoms, atomsMap])

  const selectedAtom = useMemo(() => {
    if (selectedAtoms.length === 0) return null
    return atomsMap[selectedAtoms[0]] ?? null
  }, [selectedAtoms, atomsMap])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, -3, -3]} intensity={0.3} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={30}
        enablePan
      />

      <group ref={groupRef}>
        {currentMolecule.atoms.map(atom => (
          <AtomMesh
            key={atom.id}
            atom={atom}
            displayMode={displayMode}
            isDisassembled={disassembledAtoms.includes(atom.id)}
            displaceDir={displaceDirs[atom.id]}
            onAtomClick={handleAtomClick}
            isSelected={selectedAtoms.includes(atom.id)}
            isMeasured={measuredAtoms.includes(atom.id)}
          />
        ))}

        {currentMolecule.bonds.map(bond => (
          <BondMesh
            key={bond.id}
            bond={bond}
            atomsMap={atomsMap}
            displayMode={displayMode}
          />
        ))}

        {measuredAtoms.length === 2 && measuredDistance !== null && (
          <MeasurementLine
            atom1Pos={atomsMap[measuredAtoms[0]]!.position}
            atom2Pos={atomsMap[measuredAtoms[1]]!.position}
            distance={measuredDistance}
          />
        )}
      </group>
    </>
  )
}

function BackgroundGradient() {
  const meshRef = useRef<THREE.Mesh>(null)
  const shaderData = useMemo(() => ({
    uniforms: {
      color1: { value: new THREE.Color('#0A0A1A') },
      color2: { value: new THREE.Color('#1A1A3A') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
      }
    `,
  }), [])

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        {...shaderData}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function MoleculeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0A0A1A')
      }}
    >
      <BackgroundGradient />
      <SceneContent />
    </Canvas>
  )
}
