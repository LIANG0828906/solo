import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Atom, Molecule, Bond } from '../data/molecules'
import type { DisplayMode } from '../stores/atomsStore'

interface SceneProps {
  molecule: Molecule
  displayMode: DisplayMode
  highlightedAtomId: string | null
  hoveredAtom: { atom: Atom; screenPosition: { x: number; y: number } } | null
  setHoveredAtom: (hovered: { atom: Atom; screenPosition: { x: number; y: number } } | null) => void
  onAtomClick: (atomId: string) => void
  onAtomDoubleClick: (atomId: string) => void
  moleculeChanged: string
}

interface AtomComponentProps {
  atom: Atom
  displayMode: DisplayMode
  sphereSegments: number
  isHighlighted: boolean
  onPointerOver: (atom: Atom, e: any) => void
  onPointerOut: (atom: Atom, e: any) => void
  onPointerMove: (atom: Atom, e: any) => void
  onClick: (atom: Atom, e: any) => void
  onScaleRef: (id: string, ref: THREE.Mesh | null, baseScale: number) => void
}

function AtomComponent({
  atom,
  displayMode,
  sphereSegments,
  isHighlighted,
  onPointerOver,
  onPointerOut,
  onPointerMove,
  onClick,
  onScaleRef,
}: AtomComponentProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const getAtomScale = (radius: number) => {
    switch (displayMode) {
      case 'spacefill':
        return radius * 2.2
      case 'wireframe':
        return radius * 0.6
      default:
        return radius * 1.3
    }
  }

  const scale = getAtomScale(atom.radius)
  const emissiveColor = isHighlighted
    ? new THREE.Color(atom.color).multiplyScalar(0.3)
    : new THREE.Color(0x000000)

  useEffect(() => {
    onScaleRef(atom.id, meshRef.current, scale)
    return () => {
      onScaleRef(atom.id, null, 0)
    }
  }, [atom.id, scale, onScaleRef])

  return (
    <mesh
      ref={meshRef}
      position={atom.position}
      scale={[scale, scale, scale]}
      onPointerOver={(e) => onPointerOver(atom, e)}
      onPointerOut={(e) => onPointerOut(atom, e)}
      onPointerMove={(e) => onPointerMove(atom, e)}
      onClick={(e) => onClick(atom, e)}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[1, sphereSegments, sphereSegments]} />
      {displayMode === 'wireframe' ? (
        <meshBasicMaterial
          color={atom.color}
          wireframe
          transparent
          opacity={0.7}
        />
      ) : (
        <meshStandardMaterial
          color={atom.color}
          roughness={0.25}
          metalness={0.2}
          emissive={emissiveColor}
          envMapIntensity={1.2}
        />
      )}
    </mesh>
  )
}

interface BondComponentProps {
  bond: Bond
  fromAtom: Atom
  toAtom: Atom
  displayMode: DisplayMode
  cylinderSegments: number
}

function BondComponent({
  bond,
  fromAtom,
  toAtom,
  displayMode,
  cylinderSegments,
}: BondComponentProps) {
  if (displayMode === 'spacefill') return null

  const baseRadius = displayMode === 'wireframe' ? 0.015 : 0.1
  const opacity = displayMode === 'wireframe' ? 0.6 : 0.85
  const order = bond.order

  const from = new THREE.Vector3(...fromAtom.position)
  const to = new THREE.Vector3(...toAtom.position)
  const direction = to.clone().sub(from)
  const length = direction.length()
  const midpoint = from.clone().add(to).multiplyScalar(0.5)
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  )

  const cylinders = useMemo(() => {
    const result: { position: THREE.Vector3; offset: THREE.Vector3 }[] = []
    for (let i = 0; i < order; i++) {
      let offset = new THREE.Vector3(0, 0, 0)
      if (order > 1) {
        const perp = new THREE.Vector3(0, 0, 1)
        const bondDir = to.clone().sub(from).normalize()
        perp.crossVectors(bondDir, perp)
        if (perp.length() < 0.001) {
          perp.set(1, 0, 0)
          perp.crossVectors(bondDir, perp)
        }
        perp.normalize()
        const offsetAmount = 0.18 * (order - 1)
        offset = perp.multiplyScalar(-offsetAmount + i * (offsetAmount * 2 / (order - 1 || 1)))
      }
      const position = midpoint.clone().add(offset)
      result.push({ position, offset })
    }
    return result
  }, [order, from, to, midpoint])

  return (
    <group key={bond.id}>
      {cylinders.map((cyl, i) => (
        <mesh
          key={`${bond.id}_${i}`}
          position={[cyl.position.x, cyl.position.y, cyl.position.z]}
          quaternion={quaternion}
        >
          <cylinderGeometry
            args={[baseRadius, baseRadius, length, cylinderSegments, 1, false]}
          />
          {displayMode === 'wireframe' ? (
            <meshBasicMaterial
              color="#8899aa"
              transparent
              opacity={opacity}
              wireframe
            />
          ) : (
            <meshStandardMaterial
              color="#aaaaaa"
              transparent
              opacity={opacity}
              roughness={0.4}
              metalness={0.6}
            />
          )}
        </mesh>
      ))}
    </group>
  )
}

export default function Scene({
  molecule,
  displayMode,
  highlightedAtomId,
  hoveredAtom,
  setHoveredAtom,
  onAtomClick,
  onAtomDoubleClick,
  moleculeChanged,
}: SceneProps) {
  const { camera, size, gl } = useThree()
  const moleculeGroupRef = useRef<THREE.Group>(null)
  const atomMeshMap = useRef<Map<string, { mesh: THREE.Mesh | null; baseScale: number }>>(new Map())
  const hoveredAtomIdRef = useRef<string | null>(null)
  const lastClickTimeRef = useRef<Map<string, number>>(new Map())

  const atomCount = molecule.atoms.length
  const sphereSegments = useMemo(() => {
    if (atomCount > 500) return 12
    if (atomCount > 200) return 20
    return 32
  }, [atomCount])

  const cylinderSegments = useMemo(() => {
    if (atomCount > 500) return 8
    if (atomCount > 200) return 16
    return 24
  }, [atomCount])

  useEffect(() => {
    atomMeshMap.current.clear()
    hoveredAtomIdRef.current = null
    lastClickTimeRef.current.clear()
    setHoveredAtom(null)
  }, [moleculeChanged, setHoveredAtom])

  const handleScaleRef = (id: string, mesh: THREE.Mesh | null, baseScale: number) => {
    if (mesh) {
      atomMeshMap.current.set(id, { mesh, baseScale })
    } else {
      atomMeshMap.current.delete(id)
    }
  }

  useFrame((_, delta) => {
    atomMeshMap.current.forEach((data, atomId) => {
      const mesh = data.mesh
      if (!mesh) return

      const isHovered = hoveredAtomIdRef.current === atomId
      const isHighlighted = highlightedAtomId === atomId
      const targetScale = isHovered ? 1.15 : isHighlighted ? 1.2 : 1.0

      const sx = targetScale * data.baseScale
      const sy = targetScale * data.baseScale
      const sz = targetScale * data.baseScale

      mesh.scale.x += (sx - mesh.scale.x) * Math.min(delta * 10, 1)
      mesh.scale.y += (sy - mesh.scale.y) * Math.min(delta * 10, 1)
      mesh.scale.z += (sz - mesh.scale.z) * Math.min(delta * 10, 1)
    })
  })

  const projectToScreen = (position: [number, number, number]) => {
    const vector = new THREE.Vector3(...position)
    if (moleculeGroupRef.current) {
      moleculeGroupRef.current.localToWorld(vector)
    }
    vector.project(camera)
    return {
      x: (vector.x * 0.5 + 0.5) * size.width,
      y: (-vector.y * 0.5 + 0.5) * size.height,
    }
  }

  const handlePointerOver = (atom: Atom, event: any) => {
    event.stopPropagation()
    const mesh = event.target as THREE.Mesh
    if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).emissive) {
      ;(mesh.material as THREE.MeshStandardMaterial).emissive.setHex?.(0x444444)
    }
    gl.domElement.style.cursor = 'pointer'
    hoveredAtomIdRef.current = atom.id
    const screenPos = projectToScreen(atom.position)
    setHoveredAtom({ atom, screenPosition: screenPos })
  }

  const handlePointerOut = (atom: Atom, event: any) => {
    event.stopPropagation()
    const mesh = event.target as THREE.Mesh
    if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).emissive) {
      ;(mesh.material as THREE.MeshStandardMaterial).emissive.setHex?.(0x000000)
    }
    gl.domElement.style.cursor = 'default'
    hoveredAtomIdRef.current = null
    setHoveredAtom(null)
  }

  const handlePointerMove = (atom: Atom, _event: any) => {
    if (hoveredAtomIdRef.current === atom.id) {
      const screenPos = projectToScreen(atom.position)
      setHoveredAtom({ atom, screenPosition: screenPos })
    }
  }

  const handleClick = (atom: Atom, _event: any) => {
    const now = Date.now()
    const lastTime = lastClickTimeRef.current.get(atom.id) || 0
    if (now - lastTime < 350) {
      onAtomDoubleClick(atom.id)
      lastClickTimeRef.current.delete(atom.id)
    } else {
      lastClickTimeRef.current.set(atom.id, now)
      const atomIdCopy = atom.id
      const clickTime = now
      setTimeout(() => {
        if (lastClickTimeRef.current.get(atomIdCopy) === clickTime) {
          onAtomClick(atomIdCopy)
          lastClickTimeRef.current.delete(atomIdCopy)
        }
      }, 300)
    }
  }

  const atomMap = useMemo(() => {
    const map = new Map<string, Atom>()
    molecule.atoms.forEach((a) => map.set(a.id, a))
    return map
  }, [molecule.atoms])

  return (
    <group ref={moleculeGroupRef}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
      <directionalLight position={[-5, -3, 3]} intensity={0.5} />
      <pointLight position={[0, 0, 10]} intensity={0.6} />
      <pointLight position={[0, 0, -10]} intensity={0.3} color="#667eea" />

      <group>
        {molecule.atoms.map((atom) => (
          <AtomComponent
            key={atom.id}
            atom={atom}
            displayMode={displayMode}
            sphereSegments={sphereSegments}
            isHighlighted={highlightedAtomId === atom.id}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerMove={handlePointerMove}
            onClick={handleClick}
            onScaleRef={handleScaleRef}
          />
        ))}
        {molecule.bonds.map((bond) => {
          const fromAtom = atomMap.get(bond.from)
          const toAtom = atomMap.get(bond.to)
          if (!fromAtom || !toAtom) return null
          return (
            <BondComponent
              key={bond.id}
              bond={bond}
              fromAtom={fromAtom}
              toAtom={toAtom}
              displayMode={displayMode}
              cylinderSegments={cylinderSegments}
            />
          )
        })}
      </group>
    </group>
  )
}
