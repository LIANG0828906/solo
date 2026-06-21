import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Atom, Bond, Marker } from '@/utils/moleculeData'
import { elementColors, getAtomById } from '@/utils/moleculeData'

interface MoleculeSceneProps {
  atoms: Atom[]
  bonds: Bond[]
  highlightedAtomId: string | null
  markers: Marker[]
  onAtomClick: (atomId: string) => void
  onAtomContextMenu: (atomId: string, event: React.MouseEvent) => void
  resetTrigger: number
}

function AtomSphere({
  atom,
  isHighlighted,
  onClick,
  onContextMenu,
}: {
  atom: Atom
  isHighlighted: boolean
  onClick: () => void
  onContextMenu: (e: any) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const color = elementColors[atom.element] || '#888888'

  const scale = atom.element === 'H' ? 0.25 : 0.35

  useFrame(({ clock }) => {
    if (isHighlighted && glowRef.current) {
      const t = clock.getElapsedTime()
      const pulse = 1.2 + Math.sin(t * 2 * Math.PI / 0.8) * 0.1
      glowRef.current.scale.setScalar(pulse)
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.3 + Math.sin(t * 2 * Math.PI / 0.8) * 0.15
    }
  })

  return (
    <group position={[atom.x, atom.y, atom.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onContextMenu={(e) => {
          e.stopPropagation()
          onContextMenu(e)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[scale, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      {isHighlighted && (
        <mesh ref={glowRef} scale={1.2}>
          <ringGeometry args={[scale * 0.9, scale * 1.1, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

function BondCylinder({ bond, atoms }: { bond: Bond; atoms: Atom[] }) {
  const atom1 = atoms.find((a) => a.id === bond.atom1Id)
  const atom2 = atoms.find((a) => a.id === bond.atom2Id)

  if (!atom1 || !atom2) return null

  const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z)
  const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z)
  const direction = end.clone().sub(start)
  const length = direction.length()
  const midPoint = start.clone().add(end).multiplyScalar(0.5)

  const orientation = new THREE.Quaternion()
  orientation.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())

  const radius = bond.type === 'triple' ? 0.06 : bond.type === 'double' ? 0.05 : 0.04

  const cylinders = useMemo(() => {
    if (bond.type === 'single') {
      return [{ offset: new THREE.Vector3(0, 0, 0) }]
    } else if (bond.type === 'double') {
      const offsetDir = new THREE.Vector3(1, 0, 0).applyQuaternion(orientation)
      return [
        { offset: offsetDir.clone().multiplyScalar(0.08) },
        { offset: offsetDir.clone().multiplyScalar(-0.08) },
      ]
    } else {
      const offsetDir = new THREE.Vector3(1, 0, 0).applyQuaternion(orientation)
      return [
        { offset: offsetDir.clone().multiplyScalar(0.1) },
        { offset: new THREE.Vector3(0, 0, 0) },
        { offset: offsetDir.clone().multiplyScalar(-0.1) },
      ]
    }
  }, [bond.type, orientation])

  return (
    <group position={midPoint} quaternion={orientation}>
      {cylinders.map((cyl, i) => (
        <mesh key={i} position={[cyl.offset.x, 0, cyl.offset.z]}>
          <cylinderGeometry args={[radius, radius, length, 12]} />
          <meshStandardMaterial color="#808080" transparent opacity={0.6} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function MarkerLabel({ marker, atom }: { marker: Marker; atom: Atom }) {
  return (
    <Html position={[atom.x, atom.y + 0.5, atom.z]} center distanceFactor={10}>
      <div
        style={{
          background: '#1E293B',
          borderRadius: '8px',
          padding: '4px 8px',
          fontSize: '12px',
          color: '#F8FAFC',
          whiteSpace: 'nowrap',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '1px',
            height: '6px',
            backgroundColor: '#64748B',
          }}
        />
        {marker.label}
      </div>
    </Html>
  )
}

function ViewHelper({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera } = useThree()
  const miniCamera = useRef<THREE.PerspectiveCamera>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion).invert()
    }
  })

  return (
    <Html position={[3, 2.5, -2]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60">
          <defs>
            <linearGradient id="sphereGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <circle cx="30" cy="30" r="25" fill="url(#sphereGrad)" stroke="#475569" strokeWidth="1" />
          <line x1="5" y1="30" x2="55" y2="30" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="30" y1="5" x2="30" y2="55" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
          <ellipse cx="30" cy="30" rx="25" ry="8" fill="none" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
          <ellipse cx="30" cy="30" rx="8" ry="25" fill="none" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
          <text x="48" y="20" fill="#94A3B8" fontSize="10" fontWeight="bold">X</text>
          <text x="27" y="8" fill="#94A3B8" fontSize="10" fontWeight="bold">Y</text>
          <text x="10" y="45" fill="#94A3B8" fontSize="10" fontWeight="bold">Z</text>
        </svg>
      </div>
    </Html>
  )
}

function SceneContent({
  atoms,
  bonds,
  highlightedAtomId,
  markers,
  onAtomClick,
  onAtomContextMenu,
  controlsRef,
}: Omit<MoleculeSceneProps, 'resetTrigger'> & { controlsRef: React.RefObject<any> }) {
  const markerAtoms = markers
    .map((m) => ({ marker: m, atom: atoms.find((a) => a.id === m.atomId) }))
    .filter((item): item is { marker: Marker; atom: Atom } => !!item.atom)

  return (
    <>
      <ambientLight intensity={0.4} color={0x404060} />
      <directionalLight position={[10, 10, 10]} intensity={0.5} color={0xffffff} />
      <directionalLight position={[-10, -5, -10]} intensity={0.2} color={0x606080} />

      {bonds.map((bond, i) => (
        <BondCylinder key={`bond-${i}`} bond={bond} atoms={atoms} />
      ))}

      {atoms.map((atom) => (
        <AtomSphere
          key={atom.id}
          atom={atom}
          isHighlighted={highlightedAtomId === atom.id}
          onClick={() => onAtomClick(atom.id)}
          onContextMenu={(e) => onAtomContextMenu(atom.id, e)}
        />
      ))}

      {markerAtoms.map(({ marker, atom }) => (
        <MarkerLabel key={marker.id} marker={marker} atom={atom} />
      ))}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={16}
        enablePan={true}
        panSpeed={0.5}
        screenSpacePanning={false}
      />

      <ViewHelper controlsRef={controlsRef} />
    </>
  )
}

export default function MoleculeScene({
  atoms,
  bonds,
  highlightedAtomId,
  markers,
  onAtomClick,
  onAtomContextMenu,
  resetTrigger,
}: MoleculeSceneProps) {
  const controlsRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
    setFadeIn(false)
    const timer1 = setTimeout(() => setIsLoaded(true), 50)
    const timer2 = setTimeout(() => setFadeIn(true), 100)
    const timer3 = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 200)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [atoms])

  useEffect(() => {
    if (resetTrigger > 0 && controlsRef.current) {
      controlsRef.current.reset()
    }
  }, [resetTrigger])

  const bgColor = useMemo(() => {
    return '#0A0A2E'
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      <Canvas
        camera={{ position: [6, 4, 6], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0A0A2E 0%, #1A0A2E 100%)',
        }}
        resize={{ scroll: false }}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 15, 30]} />
        <SceneContent
          atoms={isLoaded ? atoms : []}
          bonds={isLoaded ? bonds : []}
          highlightedAtomId={highlightedAtomId}
          markers={markers}
          onAtomClick={onAtomClick}
          onAtomContextMenu={onAtomContextMenu}
          controlsRef={controlsRef}
        />
      </Canvas>
    </div>
  )
}
