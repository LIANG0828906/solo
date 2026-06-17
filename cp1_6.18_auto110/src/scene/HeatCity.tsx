import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, HoveredBuilding } from '../store'
import {
  GRID_SIZE,
  CELL_SPACING,
  BuildingData,
  PulseData,
  heatToColor,
  BUILDING_TYPE_CONFIG,
} from '../utils/heatSimulation'

function Ground() {
  const totalSize = (GRID_SIZE - 1) * CELL_SPACING + CELL_SPACING
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[totalSize * 1.2, totalSize * 1.2]} />
      <meshStandardMaterial
        color="#0a0a12"
        transparent
        opacity={0.7}
        metalness={0.1}
        roughness={0.9}
      />
    </mesh>
  )
}

function GridLines() {
  const lines = useMemo(() => {
    const half = (GRID_SIZE - 1) * CELL_SPACING / 2
    const points: THREE.Vector3[] = []

    for (let i = 0; i < GRID_SIZE; i++) {
      const p = i * CELL_SPACING - half
      points.push(new THREE.Vector3(-half - 1, -0.01, p))
      points.push(new THREE.Vector3(half + 1, -0.01, p))
      points.push(new THREE.Vector3(p, -0.01, -half - 1))
      points.push(new THREE.Vector3(p, -0.01, half + 1))
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return geometry
  }, [])

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.15} linewidth={0.5} />
    </lineSegments>
  )
}

interface BuildingMeshProps {
  building: BuildingData
  onClick: (id: string) => void
  onHover: (hovered: HoveredBuilding | null) => void
}

function BuildingMesh({ building, onClick, onHover }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()

  const color = useMemo(
    () => heatToColor(building.heat, building.brightnessBoost),
    [building.heat, building.brightnessBoost]
  )

  const heightScale = useMemo(() => {
    return 0.6 + (building.heat / 100) * 0.8
  }, [building.heat])

  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    const rect = gl.domElement.getBoundingClientRect()
    const screenX = rect.left + (e.point ? 0 : e.clientX)
    const screenY = rect.top + (e.point ? 0 : e.clientY)

    const vec = new THREE.Vector3(building.x, heightScale * 0.3 + 0.6, building.z)
    vec.project(camera)
    const ndcX = (vec.x + 1) / 2 * window.innerWidth
    const ndcY = (-vec.y + 1) / 2 * window.innerHeight

    onHover({
      id: building.id,
      type: building.type,
      heat: building.heat,
      screenX: ndcX,
      screenY: ndcY,
    })
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    onHover(null)
    document.body.style.cursor = 'default'
  }

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick(building.id)
  }

  return (
    <mesh
      ref={meshRef}
      position={[building.x, heightScale * 0.3, building.z]}
      castShadow
      receiveShadow
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <boxGeometry args={[0.6, heightScale * 0.6, 0.6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2 + building.brightnessBoost * 0.6}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  )
}

interface PulseMeshProps {
  pulse: PulseData
}

function PulseMesh({ pulse }: PulseMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [progress, setProgress] = useState(0)

  useFrame(() => {
    const elapsed = (performance.now() - pulse.startTime) / 1000
    const totalDuration = pulse.maxRadius / pulse.speed
    const p = Math.min(1, elapsed / totalDuration)
    setProgress(p)

    if (meshRef.current) {
      const radius = Math.max(0.01, pulse.radius)
      meshRef.current.scale.setScalar(radius)
      ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - p * 0.9)
    }
  })

  const color = '#FF6B35'

  return (
    <mesh
      ref={meshRef}
      position={[pulse.x, 0.1, pulse.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[1, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

interface PulseRingProps {
  pulse: PulseData
}

function PulseRing({ pulse }: PulseRingProps) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (ringRef.current) {
      const radius = Math.max(0.01, pulse.radius)
      ringRef.current.scale.setScalar(radius)
      const elapsed = (performance.now() - pulse.startTime) / 1000
      const totalDuration = pulse.maxRadius / pulse.speed
      const p = Math.min(1, elapsed / totalDuration)
      ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - p * 0.85)
    }
  })

  return (
    <mesh
      ref={ringRef}
      position={[pulse.x, 0.11, pulse.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.95, 1, 48]} />
      <meshBasicMaterial
        color="#FFAA00"
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function HoverLabel() {
  const hovered = useStore(s => s.hoveredBuilding)
  const [el, setEl] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hovered) {
      if (el) {
        document.body.removeChild(el)
        setEl(null)
      }
      return
    }

    if (!el) {
      const div = document.createElement('div')
      div.className = 'hover-label'
      document.body.appendChild(div)
      setEl(div)
    }

    if (el) {
      const typeName = BUILDING_TYPE_CONFIG[hovered.type].name
      el.innerHTML = `
        <div class="label-type">${typeName}</div>
        <div class="label-heat">热量: <span class="label-heat-value">${hovered.heat.toFixed(1)}</span></div>
      `
      el.style.left = `${hovered.screenX}px`
      el.style.top = `${hovered.screenY}px`
      el.style.opacity = '1'
    }

    return () => {
      if (el) {
        el.style.opacity = '0'
      }
    }
  }, [hovered, el])

  return null
}

export default function HeatCity() {
  const buildings = useStore(s => s.buildings)
  const pulses = useStore(s => s.pulses)
  const { stepSimulation, addPulse, setHovered } = useStore(s => s.actions)
  const lastTimeRef = useRef<number>(performance.now())

  useFrame(() => {
    const now = performance.now()
    const delta = now - lastTimeRef.current
    lastTimeRef.current = now
    stepSimulation(delta)
  })

  const buildingMeshes = useMemo(() => {
    return buildings.map(b => (
      <BuildingMesh
        key={b.id}
        building={b}
        onClick={addPulse}
        onHover={setHovered}
      />
    ))
  }, [buildings, addPulse, setHovered])

  const pulseMeshes = useMemo(() => {
    return pulses.map(p => (
      <group key={p.id}>
        <PulseMesh pulse={p} />
        <PulseRing pulse={p} />
      </group>
    ))
  }, [pulses])

  return (
    <>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
      <Ground />
      <GridLines />
      <group>{buildingMeshes}</group>
      <group>{pulseMeshes}</group>
      <HoverLabel />
    </>
  )
}
