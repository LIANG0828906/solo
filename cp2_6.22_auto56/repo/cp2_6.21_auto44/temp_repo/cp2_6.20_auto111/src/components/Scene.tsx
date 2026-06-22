import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Atom, Molecule, Bond } from '../data/molecules'
import type { DisplayMode } from '../stores/atomsStore'

interface SceneProps {
  molecule: Molecule
  displayMode: DisplayMode
  highlightedAtomId: number | null
  hoveredAtom: { atom: Atom; screenPosition: { x: number; y: number } } | null
  setHoveredAtom: (hovered: { atom: Atom; screenPosition: { x: number; y: number } } | null) => void
  onAtomClick: (atomId: number) => void
  onAtomDoubleClick: (atomId: number) => void
  moleculeChanged: string
}

interface AtomComponentProps {
  atom: Atom
  displayMode: DisplayMode
  sphereSegments: number
  isHighlighted: boolean
  isHovered: boolean
  onScaleRef: (id: number, ref: THREE.Mesh | null, baseScale: number) => void
}

function AtomComponent({
  atom,
  displayMode,
  sphereSegments,
  isHighlighted,
  isHovered,
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

  const baseScale = getAtomScale(atom.radius)
  const targetScale = isHovered ? 1.15 : isHighlighted ? 1.2 : 1.0

  useEffect(() => {
    onScaleRef(atom.id, meshRef.current, baseScale)
    return () => {
      onScaleRef(atom.id, null, 0)
    }
  }, [atom.id, baseScale, onScaleRef])

  const emissiveColor = isHighlighted
    ? new THREE.Color(atom.color).multiplyScalar(0.3)
    : isHovered
    ? new THREE.Color(atom.color).multiplyScalar(0.15)
    : new THREE.Color(0x000000)

  return (
    <mesh
      ref={meshRef}
      position={atom.position}
      scale={[baseScale * targetScale, baseScale * targetScale, baseScale * targetScale]}
      userData={{ atomId: atom.id }}
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
  const { camera, size, gl, scene } = useThree()
  const moleculeGroupRef = useRef<THREE.Group>(null)
  const atomMeshMap = useRef<Map<number, { mesh: THREE.Mesh | null; baseScale: number }>>(new Map())
  const hoveredAtomIdRef = useRef<number | null>(null)
  const lastClickTimeRef = useRef<Map<number, number>>(new Map())

  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())

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

  const handleScaleRef = (id: number, mesh: THREE.Mesh | null, baseScale: number) => {
    if (mesh) {
      atomMeshMap.current.set(id, { mesh, baseScale })
    } else {
      atomMeshMap.current.delete(id)
    }
  }

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

  useEffect(() => {
    const canvas = gl.domElement
    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.current.setFromCamera(mouse.current, camera)
      const meshes: THREE.Object3D[] = []
      atomMeshMap.current.forEach((data) => {
        if (data.mesh) meshes.push(data.mesh)
      })

      const intersects = raycaster.current.intersectObjects(meshes, false)

      if (intersects.length > 0) {
        const hit = intersects[0]
        const mesh = hit.object as THREE.Mesh
        const atomId = mesh.userData.atomId as number
        const atom = molecule.atoms.find((a) => a.id === atomId)

        if (atom && hoveredAtomIdRef.current !== atomId) {
          hoveredAtomIdRef.current = atomId
          canvas.style.cursor = 'pointer'
          const screenPos = projectToScreen(atom.position)
          setHoveredAtom({ atom, screenPosition: screenPos })
        } else if (atom) {
          const screenPos = projectToScreen(atom.position)
          setHoveredAtom({ atom, screenPosition: screenPos })
        }
      } else if (hoveredAtomIdRef.current !== null) {
        hoveredAtomIdRef.current = null
        canvas.style.cursor = 'default'
        setHoveredAtom(null)
      }
    }

    const handleClick = (event: PointerEvent) => {
      if (hoveredAtomIdRef.current !== null) {
        const atomId = hoveredAtomIdRef.current
        const now = Date.now()
        const lastTime = lastClickTimeRef.current.get(atomId) || 0

        if (now - lastTime < 350) {
          onAtomDoubleClick(atomId)
          lastClickTimeRef.current.delete(atomId)
        } else {
          lastClickTimeRef.current.set(atomId, now)
          const atomIdCopy = atomId
          const clickTime = now
          setTimeout(() => {
            if (lastClickTimeRef.current.get(atomIdCopy) === clickTime) {
              onAtomClick(atomIdCopy)
              lastClickTimeRef.current.delete(atomIdCopy)
            }
          }, 300)
        }
      }
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [camera, gl.domElement, molecule.atoms, onAtomClick, onAtomDoubleClick, setHoveredAtom, size.width, size.height])

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

  const atomMap = useMemo(() => {
    const map = new Map<string, Atom>()
    molecule.atoms.forEach((a) => map.set(a.elementId, a))
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
            isHovered={hoveredAtomIdRef.current === atom.id}
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
