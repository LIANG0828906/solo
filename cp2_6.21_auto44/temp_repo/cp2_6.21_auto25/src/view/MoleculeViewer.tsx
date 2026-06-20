import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMoleculeStore } from '@/store/moleculeStore'
import { getMoleculePreset } from '@/logic/MoleculeData'
import type { Atom, Bond, MoleculePreset } from '@/logic/MoleculeData'
import { VibrationEngine } from '@/logic/VibrationEngine'
import { LightSimulator } from '@/logic/LightSimulator'

const heatmapVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vEnergy;
  uniform float uEnergy;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vEnergy = uEnergy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const heatmapFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vEnergy;
  uniform float uEnergy;
  void main() {
    float t = clamp(uEnergy, 0.0, 1.0);
    vec3 lowColor = vec3(0.0, 0.0, 1.0);
    vec3 midColor = vec3(0.0, 1.0, 0.0);
    vec3 highColor = vec3(1.0, 0.0, 0.0);
    vec3 color;
    if (t < 0.5) {
      color = mix(lowColor, midColor, t * 2.0);
    } else {
      color = mix(midColor, highColor, (t - 0.5) * 2.0);
    }
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    float alpha = 0.18 + fresnel * 0.22;
    gl_FragColor = vec4(color, alpha);
  }
`

function AtomSphere({ atom, offset, intensity, heatmapEnabled, energyValue }: {
  atom: Atom
  offset: [number, number, number]
  intensity: number
  heatmapEnabled: boolean
  energyValue: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const heatmapRef = useRef<THREE.Mesh>(null)
  const energyUniform = useRef({ value: 0 })

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
      if (energyUniform.current) {
        energyUniform.current.value = energyValue
      }
    }
  })

  const emissiveIntensity = Math.min(1, intensity * 0.5)
  const heatmapMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: heatmapVertexShader,
      fragmentShader: heatmapFragmentShader,
      uniforms: {
        uEnergy: energyUniform.current,
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[atom.radius, 32, 32]} />
        <meshStandardMaterial
          color={atom.color}
          emissive={atom.color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>
      {heatmapEnabled && (
        <mesh ref={heatmapRef} material={heatmapMaterial}>
          <sphereGeometry args={[atom.radius * 1.55, 32, 32]} />
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
  const blinkRef = useRef(0)

  useFrame((_, delta) => {
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
      labelRef.current.position.y += 0.35
      blinkRef.current += delta
    }
  })

  const blinkOpacity = exceedsThreshold
    ? 0.5 + 0.5 * Math.sin(blinkRef.current * 8)
    : 1

  return (
    <group>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.04, 0.04, 1, 12]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.65}
          roughness={0.35}
        />
      </mesh>
      {energyLabel != null && (
        <group ref={labelRef}>
          <Html center distanceFactor={8} zIndexRange={[0, 0]}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: exceedsThreshold ? `rgba(255,80,80,${blinkOpacity})` : '#00f0ff',
              background: exceedsThreshold
                ? `rgba(80,0,0,${0.4 + blinkOpacity * 0.3})`
                : 'rgba(0,120,180,0.45)',
              borderRadius: '3px',
              padding: '1px 4px',
              border: `1px solid ${exceedsThreshold ? `rgba(255,80,80,${blinkOpacity})` : '#00f0ff60'}`,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              textShadow: exceedsThreshold ? `0 0 4px rgba(255,80,80,${blinkOpacity})` : '0 0 4px rgba(0,240,255,0.6)',
              fontFamily: 'monospace',
            }}>
              {energyLabel} kJ
            </div>
          </Html>
        </group>
      )}
    </group>
  )
}

function MoleculeScene({ glRef, lightWorldPos }: {
  glRef: React.MutableRefObject<THREE.WebGLRenderer | null>
  lightWorldPos: [number, number]
}) {
  const {
    currentMoleculeId,
    energyMode,
    temperature,
    heatmapEnabled,
    screenshotTrigger,
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
  const atomEnergiesRef = useRef<Map<string, number>>(new Map())
  const timeRef = useRef(0)
  const groupRef = useRef<THREE.Group>(null)

  const { gl, camera, size } = useThree()

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
    lightSimulator.updateLightPosition(lightWorldPos[0], lightWorldPos[1], size.width, size.height)
  }, [lightWorldPos, lightSimulator, size])

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

      const energies = new Map<string, number>()
      for (const atom of molecule.atoms) {
        const off = offsets.get(atom.id)
        if (off) {
          const magnitude = Math.sqrt(off[0] * off[0] + off[1] * off[1] + off[2] * off[2])
          const normalized = Math.min(1, magnitude / 0.25)
          energies.set(atom.id, normalized)
        } else {
          energies.set(atom.id, 0)
        }
      }
      atomEnergiesRef.current = energies
    } else {
      offsetsRef.current = new Map()
      atomEnergiesRef.current = new Map()
    }

    if (energyMode === 'light') {
      const result = lightSimulator.computeAll(
        molecule.atoms,
        molecule.bonds,
        camera.position.clone(),
      )
      atomIntensitiesRef.current = result.atomIntensities
      bondEnergiesRef.current = result.bondEnergies

      const energies = new Map<string, number>()
      for (const atom of molecule.atoms) {
        const intensity = result.atomIntensities.get(atom.id) ?? 0
        energies.set(atom.id, Math.min(1, intensity))
      }
      atomEnergiesRef.current = energies
    } else if (energyMode !== 'thermal') {
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
    return atomIntensitiesRef.current.get(atomId) ?? 0.3
  }, [])

  const getEnergyValue = useCallback((atomId: string): number => {
    return atomEnergiesRef.current.get(atomId) ?? 0
  }, [])

  const getBondEnergy = useCallback((bondId: string): { value: number; exceedsThreshold: boolean } | undefined => {
    return bondEnergiesRef.current.get(bondId)
  }, [])

  if (!molecule) return null

  const atomMap = new Map(molecule.atoms.map(a => [a.id, a]))

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-4, -2, -3]} intensity={0.3} />

      {energyMode === 'light' && (
        <pointLight
          position={[lightWorldPos[0] * 0.01, lightWorldPos[1] * 0.01, 3]}
          intensity={1.5}
          distance={15}
          color="#ffe680"
        />
      )}

      {molecule.atoms.map(atom => (
        <AtomSphere
          key={atom.id}
          atom={atom}
          offset={getOffset(atom.id)}
          intensity={getIntensity(atom.id)}
          heatmapEnabled={heatmapEnabled}
          energyValue={getEnergyValue(atom.id)}
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

function DraggableLightIndicator({ onPositionChange, currentPos }: {
  onPositionChange: (pos: [number, number]) => void
  currentPos: [number, number]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<[number, number]>(currentPos)
  const isDragging = useRef(false)

  useEffect(() => {
    setPos(currentPos)
  }, [currentPos])

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
    setPos([x, y])
    onPositionChange([x, y])
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'absolute',
          left: pos[0] - 12,
          top: pos[1] - 12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffdd00 0%, #ffaa00 40%, transparent 70%)',
          boxShadow: '0 0 20px #ffdd00, 0 0 40px #ffaa0080, 0 0 60px #ff880040',
          cursor: 'grab',
          pointerEvents: 'auto',
          touchAction: 'none',
          transition: 'transform 0.1s',
        }}
        onMouseDown={(e) => {
          (e.target as HTMLElement).style.transform = 'scale(0.9)'
        }}
        onMouseUp={(e) => {
          (e.target as HTMLElement).style.transform = 'scale(1)'
        }}
      />
    </div>
  )
}

export default function MoleculeViewer() {
  const glRef = useRef<THREE.WebGLRenderer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { screenshotTrigger, energyMode, lightPosition, setLightPosition } = useMoleculeStore()
  const [viewportSize, setViewportSize] = useState<[number, number]>([100, 100])

  useEffect(() => {
    if (!containerRef.current) return
    const updateSize = () => {
      const rect = containerRef.current!.getBoundingClientRect()
      setViewportSize([rect.width, rect.height])
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleLightPositionChange = useCallback((pos: [number, number]) => {
    setLightPosition(pos)
  }, [setLightPosition])

  useEffect(() => {
    if (screenshotTrigger === 0) return
    if (!glRef.current) return

    const dataUrl = glRef.current.domElement.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `molecule-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }, [screenshotTrigger])

  const lightPos = lightPosition[0] === 100 && lightPosition[1] === 100
    ? [80, 80] as [number, number]
    : lightPosition

  return (
    <div
      ref={containerRef}
      style={{
        width: '70%',
        height: '100%',
        position: 'relative',
        background: 'radial-gradient(ellipse at center, #0b0e1a 0%, #0a0e1a 100%)',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50, near: 0.1, far: 100 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0e1a')
        }}
      >
        <MoleculeScene glRef={glRef} lightWorldPos={lightPos} />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={0.5 * 4}
          maxDistance={5 * 4}
          enablePan={false}
          rotateSpeed={0.7}
          zoomSpeed={0.8}
        />
      </Canvas>
      {energyMode === 'light' && (
        <DraggableLightIndicator
          onPositionChange={handleLightPositionChange}
          currentPos={lightPos}
        />
      )}
    </div>
  )
}
