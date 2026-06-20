import { useRef, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useMoleculeStore } from '@/store/moleculeStore'
import { getMoleculePreset } from '@/logic/MoleculeData'
import type { Atom, Bond, MoleculePreset } from '@/logic/MoleculeData'
import { VibrationEngine } from '@/logic/VibrationEngine'
import { LightSimulator } from '@/logic/LightSimulator'

function energyToColor(energy: number, maxEnergy: number): string {
  const t = Math.min(1, energy / maxEnergy)
  if (t < 0.5) {
    const r = Math.round(t * 2 * 255)
    const g = Math.round(t * 2 * 255)
    const b = Math.round((1 - t * 2) * 255)
    return `rgb(${r},${g},${b})`
  } else {
    const r = 255
    const g = Math.round((1 - (t - 0.5) * 2) * 255)
    const b = 0
    return `rgb(${r},${g},${b})`
  }
}

function AtomSphere({ atom, offset, intensity, heatmapEnabled, maxEnergy }: {
  atom: Atom
  offset: [number, number, number]
  intensity: number
  heatmapEnabled: boolean
  maxEnergy: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const heatmapRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        atom.position[0] + offset[0],
        atom.position[1] + offset[1],
        atom.position[2] + offset[2],
      )
    }
    if (heatmapRef.current) {
      heatmapRef.current.position.set(
        atom.position[0] + offset[0],
        atom.position[1] + offset[1],
        atom.position[2] + offset[2],
      )
    }
  })

  const emissiveIntensity = Math.min(1, intensity * 0.4)

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[atom.radius, 32, 32]} />
        <meshStandardMaterial
          color={atom.color}
          emissive={atom.color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {heatmapEnabled && (
        <mesh ref={heatmapRef}>
          <sphereGeometry args={[atom.radius * 1.5, 24, 24]} />
          <meshBasicMaterial
            color={energyToColor(intensity * maxEnergy, maxEnergy)}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

function BondCylinder({ atomA, atomB, offsetA, offsetB, energyLabel, exceedsThreshold }: {
  atomA: Atom
  atomB: Atom
  offsetA: [number, number, number]
  offsetB: [number, number, number]
  energyLabel?: number | null
  exceedsThreshold?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const labelRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!meshRef.current) return

    const posA = new THREE.Vector3(
      atomA.position[0] + offsetA[0],
      atomA.position[1] + offsetA[1],
      atomA.position[2] + offsetA[2],
    )
    const posB = new THREE.Vector3(
      atomB.position[0] + offsetB[0],
      atomB.position[1] + offsetB[1],
      atomB.position[2] + offsetB[2],
    )

    const mid = posA.clone().add(posB).multiplyScalar(0.5)
    const direction = posB.clone().sub(posA)
    const length = direction.length()

    meshRef.current.position.copy(mid)
    meshRef.current.scale.set(1, length, 1)

    const axis = new THREE.Vector3(0, 1, 0)
    const dir = direction.normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir)
    meshRef.current.quaternion.copy(quaternion)

    if (labelRef.current) {
      labelRef.current.position.copy(mid)
      labelRef.current.position.y += 0.3
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.6}
          roughness={0.4}
        />
      </mesh>
      {energyLabel != null && (
        <group ref={labelRef}>
          <sprite scale={[0.5, 0.25, 1]}>
            <spriteMaterial
              color={exceedsThreshold ? '#ff3333' : '#00f0ff'}
              transparent
              opacity={0.85}
            />
          </sprite>
        </group>
      )}
    </group>
  )
}

function MoleculeScene({ glRef }: { glRef: React.MutableRefObject<THREE.WebGLRenderer | null> }) {
  const {
    currentMoleculeId,
    energyMode,
    temperature,
    heatmapEnabled,
    lightPosition,
    screenshotTrigger,
    setLightPosition,
  } = useMoleculeStore()

  const molecule = useMemo<MoleculePreset | undefined>(
    () => getMoleculePreset(currentMoleculeId),
    [currentMoleculeId],
  )

  const vibrationEngine = useMemo(() => new VibrationEngine(), [])
  const lightSimulator = useMemo(() => new LightSimulator(), [])

  const offsetsRef = useRef<Map<string, Float32Array>>(new Map())
  const bondEnergiesRef = useRef<Map<string, { value: number; exceedsThreshold: boolean }>>(new Map())
  const atomIntensitiesRef = useRef<Map<string, number>>(new Map())
  const timeRef = useRef(0)
  const groupRef = useRef<THREE.Group>(null)

  const { gl, camera } = useThree()

  useEffect(() => {
    glRef.current = gl
  }, [gl, glRef])

  useEffect(() => {
    if (molecule) {
      vibrationEngine.initBondStates(molecule.bonds, molecule.atoms)
      offsetsRef.current = new Map()
    }
  }, [molecule, vibrationEngine])

  useEffect(() => {
    const vpWidth = gl.domElement.clientWidth
    const vpHeight = gl.domElement.clientHeight
    lightSimulator.updateLightPosition(lightPosition[0], lightPosition[1], vpWidth, vpHeight)
  }, [lightPosition, lightSimulator, gl])

  useFrame((_, delta) => {
    if (!molecule) return

    timeRef.current += delta

    if (energyMode === 'thermal') {
      const offsets = vibrationEngine.computeOffsets(
        molecule.bonds,
        molecule.atoms,
        temperature,
        timeRef.current,
      )
      offsetsRef.current = offsets
    } else {
      offsetsRef.current = new Map()
    }

    if (energyMode === 'light') {
      const result = lightSimulator.computeAll(
        molecule.atoms,
        molecule.bonds,
        camera.position.clone(),
      )
      atomIntensitiesRef.current = result.atomIntensities
      bondEnergiesRef.current = result.bondEnergies
    } else {
      atomIntensitiesRef.current = new Map()
      bondEnergiesRef.current = new Map()
    }

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.3 * delta
    }
  })

  const getOffset = useCallback((atomId: string): [number, number, number] => {
    const o = offsetsRef.current.get(atomId)
    if (!o) return [0, 0, 0]
    return [o[0], o[1], o[2]]
  }, [])

  const getIntensity = useCallback((atomId: string): number => {
    return atomIntensitiesRef.current.get(atomId) ?? 0.5
  }, [])

  const getBondEnergy = useCallback((bondId: string): { value: number; exceedsThreshold: boolean } | undefined => {
    return bondEnergiesRef.current.get(bondId)
  }, [])

  const maxEnergy = useMemo(() => {
    if (!molecule) return 1
    return Math.max(...molecule.bonds.map(b => b.energy))
  }, [molecule])

  if (!molecule) return null

  const atomMap = new Map(molecule.atoms.map(a => [a.id, a]))

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, -3, -3]} intensity={0.3} />

      {molecule.atoms.map(atom => (
        <AtomSphere
          key={atom.id}
          atom={atom}
          offset={getOffset(atom.id)}
          intensity={getIntensity(atom.id)}
          heatmapEnabled={heatmapEnabled}
          maxEnergy={maxEnergy}
        />
      ))}

      {molecule.bonds.map(bond => {
        const aA = atomMap.get(bond.atomAId)
        const aB = atomMap.get(bond.atomBId)
        if (!aA || !aB) return null

        const be = energyMode === 'light' ? getBondEnergy(bond.id) : undefined

        return (
          <BondCylinder
            key={bond.id}
            atomA={aA}
            atomB={aB}
            offsetA={getOffset(bond.atomAId)}
            offsetB={getOffset(bond.atomBId)}
            energyLabel={be?.value}
            exceedsThreshold={be?.exceedsThreshold}
          />
        )
      })}
    </group>
  )
}

function LightIndicator() {
  const { lightPosition, setLightPosition, energyMode } = useMoleculeStore()
  const meshRef = useRef<THREE.Mesh>(null)
  const isDragging = useRef(false)

  if (energyMode !== 'light') return null

  return (
    <mesh
      ref={meshRef}
      position={[0, 3, 2]}
      onPointerDown={() => { isDragging.current = true }}
      onPointerUp={() => { isDragging.current = false }}
      onPointerMove={(e) => {
        if (!isDragging.current) return
        e.stopPropagation()
        const x = e.point.x
        const y = e.point.y
        setLightPosition([x, y])
      }}
    >
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#ffdd00" />
      <pointLight color="#ffdd00" intensity={2} distance={10} />
    </mesh>
  )
}

export default function MoleculeViewer() {
  const glRef = useRef<THREE.WebGLRenderer | null>(null)
  const { screenshotTrigger } = useMoleculeStore()

  useEffect(() => {
    if (screenshotTrigger === 0) return
    if (!glRef.current) return

    const dataUrl = glRef.current.domElement.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `molecule-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }, [screenshotTrigger])

  return (
    <div style={{
      width: '70%',
      height: '100%',
      position: 'relative',
      background: 'radial-gradient(ellipse at center, #0b0e1a 0%, #0a0e1a 100%)',
    }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50, near: 0.1, far: 100 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <MoleculeScene glRef={glRef} />
        <LightIndicator />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={0.5 * 4}
          maxDistance={5 * 4}
          enablePan={false}
        />
      </Canvas>
    </div>
  )
}
