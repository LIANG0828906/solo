import { useRef, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  useMoleculeStore,
  getElementColor,
  getElementRadius,
  type Atom,
  type Bond,
  type MoleculeData,
  type DisplayMode,
  type Measurement,
} from '@/store'

const BOND_RADIUS = 0.12
const TRANSITION_DURATION = 0.3

function getAtomScale(displayMode: DisplayMode): number {
  switch (displayMode) {
    case 'wireframe': return 0.15
    case 'ball-stick': return 0.5
    case 'space-filling': return 1.0
  }
}

function getBondVisible(displayMode: DisplayMode): boolean {
  return displayMode !== 'space-filling'
}

interface AnimatedAtomProps {
  atom: Atom
  isSelected: boolean
  isHighlighted: boolean
  targetScale: number
}

function AnimatedAtom({ atom, isSelected, isHighlighted, targetScale }: AnimatedAtomProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const currentScale = useRef(targetScale)
  const baseRadius = getElementRadius(atom.element)
  const color = getElementColor(atom.element)

  useFrame((_, delta) => {
    if (meshRef.current) {
      const diff = targetScale - currentScale.current
      if (Math.abs(diff) > 0.001) {
        currentScale.current += diff * (delta / TRANSITION_DURATION)
        if (Math.abs(targetScale - currentScale.current) < 0.001) {
          currentScale.current = targetScale
        }
      }
      const radius = baseRadius * currentScale.current
      meshRef.current.scale.setScalar(radius)

      if (isHighlighted) {
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.15
        meshRef.current.scale.multiplyScalar(pulse)
      }
    }
  })

  useEffect(() => {
    if (meshRef.current) {
      const radius = baseRadius * targetScale
      meshRef.current.scale.setScalar(radius)
      currentScale.current = targetScale
    }
  }, [targetScale, baseRadius])

  const displayColor = isSelected ? '#e94560' : color

  return (
    <mesh
      ref={meshRef}
      position={[atom.x, atom.y, atom.z]}
      userData={{ type: 'atom', atomId: atom.id }}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={displayColor}
        roughness={0.3}
        metalness={0.1}
        emissive={isSelected ? '#e94560' : isHighlighted ? '#e94560' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : isHighlighted ? 0.2 : 0}
      />
    </mesh>
  )
}

interface AnimatedBondProps {
  bond: Bond
  atom1: Atom
  atom2: Atom
  isHighlighted: boolean
  visible: boolean
}

function AnimatedBond({ bond, atom1, atom2, isHighlighted, visible }: AnimatedBondProps) {
  const groupRef = useRef<THREE.Group>(null)
  const cylinderRef = useRef<THREE.Mesh>(null)
  const opacity = useRef(visible ? 1 : 0)

  const direction = useMemo(() => {
    return new THREE.Vector3(
      atom2.x - atom1.x,
      atom2.y - atom1.y,
      atom2.z - atom1.z,
    )
  }, [atom1, atom2])

  const center = useMemo(() => {
    return [
      (atom1.x + atom2.x) / 2,
      (atom1.y + atom2.y) / 2,
      (atom1.z + atom2.z) / 2,
    ]
  }, [atom1, atom2])

  const length = direction.length()
  const targetOpacity = visible ? 1 : 0

  useFrame((_, delta) => {
    if (cylinderRef.current) {
      const diff = targetOpacity - opacity.current
      if (Math.abs(diff) > 0.001) {
        opacity.current += diff * (delta / TRANSITION_DURATION)
        if (Math.abs(targetOpacity - opacity.current) < 0.001) {
          opacity.current = targetOpacity
        }
      }
      const material = cylinderRef.current.material as THREE.MeshStandardMaterial
      material.opacity = opacity.current
      material.transparent = opacity.current < 1
      cylinderRef.current.visible = opacity.current > 0.01

      if (isHighlighted) {
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.15
        cylinderRef.current.scale.set(pulse, pulse, pulse)
      } else {
        cylinderRef.current.scale.set(1, 1, 1)
      }
    }
  })

  useEffect(() => {
    if (cylinderRef.current) {
      const material = cylinderRef.current.material as THREE.MeshStandardMaterial
      material.opacity = targetOpacity
      material.transparent = targetOpacity < 1
      cylinderRef.current.visible = targetOpacity > 0.01
      opacity.current = targetOpacity
    }
  }, [targetOpacity])

  const rotation = useMemo(() => {
    const axis = new THREE.Vector3(0, 1, 0)
    const dir = direction.clone().normalize()
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(axis, dir)
    const euler = new THREE.Euler().setFromQuaternion(quaternion)
    return [euler.x, euler.y, euler.z]
  }, [direction])

  const color = isHighlighted ? '#e94560' : '#808080'

  return (
    <group ref={groupRef} position={center as [number, number, number]}>
      <mesh
        ref={cylinderRef}
        rotation={rotation as [number, number, number]}
        userData={{ type: 'bond', bondId: bond.id }}
      >
        <cylinderGeometry args={[BOND_RADIUS, BOND_RADIUS, length, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          metalness={0.3}
          emissive={isHighlighted ? '#e94560' : '#000000'}
          emissiveIntensity={isHighlighted ? 0.2 : 0}
        />
      </mesh>
    </group>
  )
}

interface AtomLabelProps {
  atom: Atom
}

function AtomLabel({ atom }: AtomLabelProps) {
  return (
    <Html
      position={[atom.x, atom.y, atom.z]}
      center
      style={{
        color: '#e0e0e0',
        fontSize: '12px',
        fontWeight: 600,
        textShadow: '0 0 3px rgba(0,0,0,0.8)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {atom.element}
    </Html>
  )
}

interface MeasureLineProps {
  atom1: Atom
  atom2: Atom
  color: string
}

function MeasureLine({ atom1, atom2, color }: MeasureLineProps) {
  const points = useMemo(() => {
    return [
      new THREE.Vector3(atom1.x, atom1.y, atom1.z),
      new THREE.Vector3(atom2.x, atom2.y, atom2.z),
    ]
  }, [atom1, atom2])

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [points])

  const midpoint = useMemo(() => {
    return [
      (atom1.x + atom2.x) / 2,
      (atom1.y + atom2.y) / 2 + 0.3,
      (atom1.z + atom2.z) / 2,
    ]
  }, [atom1, atom2])

  const distance = useMemo(() => {
    const dx = atom1.x - atom2.x
    const dy = atom1.y - atom2.y
    const dz = atom1.z - atom2.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }, [atom1, atom2])

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>
      <Html
        position={midpoint as [number, number, number]}
        center
        style={{
          color: color,
          fontSize: '14px',
          fontWeight: 700,
          backgroundColor: 'rgba(26, 26, 46, 0.85)',
          padding: '2px 8px',
          borderRadius: '4px',
          pointerEvents: 'none',
          userSelect: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        {distance.toFixed(3)} Å
      </Html>
    </group>
  )
}

interface MeasureAngleProps {
  atom1: Atom
  atom2: Atom
  atom3: Atom
}

function MeasureAngle({ atom1, atom2, atom3 }: MeasureAngleProps) {
  const v1 = useMemo(() => {
    return new THREE.Vector3(
      atom1.x - atom2.x,
      atom1.y - atom2.y,
      atom1.z - atom2.z,
    ).normalize()
  }, [atom1, atom2])

  const v2 = useMemo(() => {
    return new THREE.Vector3(
      atom3.x - atom2.x,
      atom3.y - atom2.y,
      atom3.z - atom2.z,
    ).normalize()
  }, [atom3, atom2])

  const angle = useMemo(() => {
    return Math.acos(v1.dot(v2)) * (180 / Math.PI)
  }, [v1, v2])

  const labelPos = useMemo(() => {
    const avg = v1.clone().add(v2).normalize()
    return [
      atom2.x + avg.x * 0.8,
      atom2.y + avg.y * 0.8,
      atom2.z + avg.z * 0.8,
    ]
  }, [atom2, v1, v2])

  const curvePoints = useMemo(() => {
    const points: THREE.Vector3[] = []
    const angleRad = Math.acos(v1.dot(v2))
    const axis = new THREE.Vector3().crossVectors(v1, v2).normalize()
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * angleRad
      const rotated = v1.clone().applyAxisAngle(axis, t)
      points.push(new THREE.Vector3(
        atom2.x + rotated.x * 0.6,
        atom2.y + rotated.y * 0.6,
        atom2.z + rotated.z * 0.6,
      ))
    }
    return points
  }, [atom2, v1, v2])

  const curveGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(curvePoints)
  }, [curvePoints])

  return (
    <group>
      <lineSegments geometry={curveGeometry}>
        <lineBasicMaterial color="#e94560" linewidth={2} />
      </lineSegments>
      <Html
        position={labelPos as [number, number, number]}
        center
        style={{
          color: '#e94560',
          fontSize: '14px',
          fontWeight: 700,
          backgroundColor: 'rgba(26, 26, 46, 0.85)',
          padding: '2px 8px',
          borderRadius: '4px',
          pointerEvents: 'none',
          userSelect: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        {angle.toFixed(2)}°
      </Html>
    </group>
  )
}

interface MeasureDihedralProps {
  atom1: Atom
  atom2: Atom
  atom3: Atom
  atom4: Atom
}

function MeasureDihedral({ atom1, atom2, atom3, atom4 }: MeasureDihedralProps) {
  const dihedral = useMemo(() => {
    const b1 = new THREE.Vector3(
      atom2.x - atom1.x,
      atom2.y - atom1.y,
      atom2.z - atom1.z,
    )
    const b2 = new THREE.Vector3(
      atom3.x - atom2.x,
      atom3.y - atom2.y,
      atom3.z - atom2.z,
    )
    const b3 = new THREE.Vector3(
      atom4.x - atom3.x,
      atom4.y - atom3.y,
      atom4.z - atom3.z,
    )

    const n1 = new THREE.Vector3().crossVectors(b1, b2).normalize()
    const n2 = new THREE.Vector3().crossVectors(b2, b3).normalize()
    const b2Norm = b2.clone().normalize()
    const m1 = new THREE.Vector3().crossVectors(n1, b2Norm)

    const x = n1.dot(n2)
    const y = m1.dot(n2)

    return Math.atan2(y, x) * (180 / Math.PI)
  }, [atom1, atom2, atom3, atom4])

  const midpoint = useMemo(() => {
    return [
      (atom2.x + atom3.x) / 2,
      (atom2.y + atom3.y) / 2 + 0.8,
      (atom2.z + atom3.z) / 2,
    ]
  }, [atom2, atom3])

  return (
    <Html
      position={midpoint as [number, number, number]}
      center
      style={{
        color: '#e94560',
        fontSize: '14px',
        fontWeight: 700,
        backgroundColor: 'rgba(26, 26, 46, 0.85)',
        padding: '2px 8px',
        borderRadius: '4px',
        pointerEvents: 'none',
        userSelect: 'none',
        backdropFilter: 'blur(4px)',
      }}
    >
      {dihedral.toFixed(2)}°
    </Html>
  )
}

interface MoleculeContentProps {
  data: MoleculeData
}

function MoleculeContent({ data }: MoleculeContentProps) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  const displayMode = useMoleculeStore((s) => s.displayMode)
  const measureMode = useMoleculeStore((s) => s.measureMode)
  const selectedAtomIds = useMoleculeStore((s) => s.selectedAtomIds)
  const measurements = useMoleculeStore((s) => s.measurements)
  const highlightedAtomId = useMoleculeStore((s) => s.highlightedAtomId)
  const highlightedBondId = useMoleculeStore((s) => s.highlightedBondId)
  const showLabels = useMoleculeStore((s) => s.showLabels)
  const addSelectedAtom = useMoleculeStore((s) => s.addSelectedAtom)
  const addMeasurement = useMoleculeStore((s) => s.addMeasurement)

  const atomMap = useMemo(() => {
    const map = new Map<number, Atom>()
    data.atoms.forEach((a) => map.set(a.id, a))
    return map
  }, [data.atoms])

  const atomScale = useMemo(() => getAtomScale(displayMode), [displayMode])
  const bondVisible = useMemo(() => getBondVisible(displayMode), [displayMode])

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    const obj = e.object
    if (obj && obj.userData && obj.userData.type === 'atom') {
      if (measureMode !== 'none') {
        addSelectedAtom(obj.userData.atomId)
      }
    }
  }, [measureMode, addSelectedAtom])

  useEffect(() => {
    const maxAtoms =
      measureMode === 'distance' ? 2 :
      measureMode === 'angle' ? 3 :
      measureMode === 'dihedral' ? 4 : 0

    if (maxAtoms > 0 && selectedAtomIds.length >= maxAtoms) {
      const atoms = selectedAtomIds.map((id) => atomMap.get(id)!).filter(Boolean)
      if (atoms.length === maxAtoms) {
        let value = 0
        let label = ''

        if (measureMode === 'distance' && atoms.length >= 2) {
          const dx = atoms[0].x - atoms[1].x
          const dy = atoms[0].y - atoms[1].y
          const dz = atoms[0].z - atoms[1].z
          value = Math.sqrt(dx * dx + dy * dy + dz * dz)
          label = `${atoms[0].element}${atoms[0].id}-${atoms[1].element}${atoms[1].id}`
        } else if (measureMode === 'angle' && atoms.length >= 3) {
          const v1 = new THREE.Vector3(
            atoms[0].x - atoms[1].x,
            atoms[0].y - atoms[1].y,
            atoms[0].z - atoms[1].z,
          ).normalize()
          const v2 = new THREE.Vector3(
            atoms[2].x - atoms[1].x,
            atoms[2].y - atoms[1].y,
            atoms[2].z - atoms[1].z,
          ).normalize()
          value = Math.acos(v1.dot(v2)) * (180 / Math.PI)
          label = `${atoms[0].element}${atoms[0].id}-${atoms[1].element}${atoms[1].id}-${atoms[2].element}${atoms[2].id}`
        } else if (measureMode === 'dihedral' && atoms.length >= 4) {
          const b1 = new THREE.Vector3(
            atoms[1].x - atoms[0].x,
            atoms[1].y - atoms[0].y,
            atoms[1].z - atoms[0].z,
          )
          const b2 = new THREE.Vector3(
            atoms[2].x - atoms[1].x,
            atoms[2].y - atoms[1].y,
            atoms[2].z - atoms[1].z,
          )
          const b3 = new THREE.Vector3(
            atoms[3].x - atoms[2].x,
            atoms[3].y - atoms[2].y,
            atoms[3].z - atoms[2].z,
          )
          const n1 = new THREE.Vector3().crossVectors(b1, b2).normalize()
          const n2 = new THREE.Vector3().crossVectors(b2, b3).normalize()
          const b2Norm = b2.clone().normalize()
          const m1 = new THREE.Vector3().crossVectors(n1, b2Norm)
          const x = n1.dot(n2)
          const y = m1.dot(n2)
          value = Math.atan2(y, x) * (180 / Math.PI)
          label = `${atoms[0].element}${atoms[0].id}-${atoms[1].element}${atoms[1].id}-${atoms[2].element}${atoms[2].id}-${atoms[3].element}${atoms[3].id}`
        }

        addMeasurement({
          type: measureMode,
          atomIds: selectedAtomIds,
          value,
          label,
        })
      }
    }
  }, [selectedAtomIds, measureMode, atomMap, addMeasurement])

  useEffect(() => {
    if (data.atoms.length > 0 && controlsRef.current) {
      const positions = data.atoms.map((a) => new THREE.Vector3(a.x, a.y, a.z))
      const boundingBox = new THREE.Box3().setFromPoints(positions)
      const center = new THREE.Vector3()
      boundingBox.getCenter(center)
      const size = new THREE.Vector3()
      boundingBox.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
      const cameraZ = maxDim / (2 * Math.tan(fov / 2))
      camera.position.set(center.x, center.y, center.z + cameraZ * 1.5)
      camera.lookAt(center)
      if (controlsRef.current) {
        controlsRef.current.target.copy(center)
        controlsRef.current.update()
      }
    }
  }, [data, camera])

  const renderMeasurement = (measurement: Measurement, index: number) => {
    const atoms = measurement.atomIds.map((id) => atomMap.get(id)).filter(Boolean) as Atom[]
    if (atoms.length < 2) return null

    if (measurement.type === 'distance') {
      return <MeasureLine key={index} atom1={atoms[0]} atom2={atoms[1]} color="#e94560" />
    } else if (measurement.type === 'angle' && atoms.length >= 3) {
      return <MeasureAngle key={index} atom1={atoms[0]} atom2={atoms[1]} atom3={atoms[2]} />
    } else if (measurement.type === 'dihedral' && atoms.length >= 4) {
      return <MeasureDihedral key={index} atom1={atoms[0]} atom2={atoms[1]} atom3={atoms[2]} atom4={atoms[3]} />
    }
    return null
  }

  const renderSelectionPreview = () => {
    if (measureMode === 'none' || selectedAtomIds.length === 0) return null
    const atoms = selectedAtomIds.map((id) => atomMap.get(id)).filter(Boolean) as Atom[]

    if (atoms.length >= 2 && measureMode === 'distance') {
      return <MeasureLine atom1={atoms[0]} atom2={atoms[1]} color="#e94560" />
    }
    if (atoms.length >= 3 && measureMode === 'angle') {
      return <MeasureAngle atom1={atoms[0]} atom2={atoms[1]} atom3={atoms[2]} />
    }
    if (atoms.length >= 4 && measureMode === 'dihedral') {
      return <MeasureDihedral atom1={atoms[0]} atom2={atoms[1]} atom3={atoms[2]} atom4={atoms[3]} />
    }
    return null
  }

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      <group onClick={handleClick}>
        {data.atoms.map((atom) => (
          <AnimatedAtom
            key={atom.id}
            atom={atom}
            isSelected={selectedAtomIds.includes(atom.id)}
            isHighlighted={highlightedAtomId === atom.id}
            targetScale={atomScale}
          />
        ))}
      </group>

      <group>
        {data.bonds.map((bond) => {
          const a1 = atomMap.get(bond.atom1Id)
          const a2 = atomMap.get(bond.atom2Id)
          if (!a1 || !a2) return null
          return (
            <AnimatedBond
              key={bond.id}
              bond={bond}
              atom1={a1}
              atom2={a2}
              isHighlighted={highlightedBondId === bond.id}
              visible={bondVisible}
            />
          )
        })}
      </group>

      {showLabels && (
        <group>
          {data.atoms.map((atom) => (
            <AtomLabel key={`label-${atom.id}`} atom={atom} />
          ))}
        </group>
      )}

      <group>
        {measurements.map((m, i) => renderMeasurement(m, i))}
      </group>

      {renderSelectionPreview()}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={100}
      />
    </>
  )
}

interface MoleculeViewerProps {
  onReset?: (resetFn: () => void) => void
}

export default function MoleculeViewer({ onReset }: MoleculeViewerProps) {
  const moleculeData = useMoleculeStore((s) => s.moleculeData)
  const backgroundTheme = useMoleculeStore((s) => s.backgroundTheme)
  const customBgColor = useMoleculeStore((s) => s.customBgColor)

  const bgColor = useMemo(() => {
    switch (backgroundTheme) {
      case 'dark': return '#1a1a2e'
      case 'light': return '#f5f5f5'
      case 'custom': return customBgColor
    }
  }, [backgroundTheme, customBgColor])

  const keyRef = useRef(0)
  useEffect(() => {
    if (onReset) {
      onReset(() => {
        keyRef.current += 1
      })
    }
  }, [onReset])

  if (!moleculeData) {
    return null
  }

  return (
    <Canvas
      key={keyRef.current}
      camera={{ position: [0, 0, 10], fov: 45 }}
      style={{ background: bgColor, width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <MoleculeContent data={moleculeData} />
    </Canvas>
  )
}
