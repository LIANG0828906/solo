import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { useSimStore, BuildingType } from '@/store/useSimStore'
import { calculateSolarPosition, radToDeg } from '@/utils/solarCalculator'
import './SunAnalysis.css'

interface BuildingProps {
  type: BuildingType
}

function BuildingMesh({ type }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [scaleY, setScaleY] = useState(0)
  const animRef = useRef({ current: 0, target: 1 })

  useEffect(() => {
    animRef.current = { current: 0, target: 1 }
    setScaleY(0)
  }, [type])

  useFrame((_, delta) => {
    if (animRef.current.current < animRef.current.target) {
      animRef.current.current = Math.min(
        animRef.current.current + delta / 0.8,
        animRef.current.target,
      )
      const t = animRef.current.current
      const eased = 1 - Math.pow(1 - t, 3)
      setScaleY(eased)
    }
  })

  const buildingParts = useMemo(() => {
    switch (type) {
      case 'box':
        return [{ position: [0, 2, 0] as [number, number, number], size: [6, 4, 6] as [number, number, number] }]
      case 'lshape':
        return [
          { position: [-2, 2, -2] as [number, number, number], size: [4, 4, 8] as [number, number, number] },
          { position: [2, 2, 0] as [number, number, number], size: [4, 4, 4] as [number, number, number] },
        ]
      case 'courtyard':
        return [
          { position: [0, 2, -3] as [number, number, number], size: [8, 4, 2] as [number, number, number] },
          { position: [0, 2, 3] as [number, number, number], size: [8, 4, 2] as [number, number, number] },
          { position: [-3, 2, 0] as [number, number, number], size: [2, 4, 4] as [number, number, number] },
          { position: [3, 2, 0] as [number, number, number], size: [2, 4, 4] as [number, number, number] },
        ]
      default:
        return [{ position: [0, 2, 0] as [number, number, number], size: [6, 4, 6] as [number, number, number] }]
    }
  }, [type])

  return (
    <group ref={groupRef} scale={[1, scaleY, 1]} position={[0, 0, 0]}>
      {buildingParts.map((part, index) => (
        <mesh key={index} position={part.position} castShadow receiveShadow>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.8} metalness={0.05} />
        </mesh>
      ))}
    </group>
  )
}

function GroundGrid() {
  const [opacity, setOpacity] = useState(0.3)
  const { camera } = useThree()
  const prevAngle = useRef(0)
  const targetOpacity = useRef(0.3)

  useFrame(() => {
    const angle = camera.rotation.y
    const delta = Math.abs(angle - prevAngle.current)

    if (delta > 0.005) {
      targetOpacity.current = 0.1
    } else {
      targetOpacity.current = 0.3
    }

    setOpacity((prev) => prev + (targetOpacity.current - prev) * 0.1)
    prevAngle.current = angle
  })

  return (
    <Grid
      position={[0, 0.01, 0]}
      args={[20, 20]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#4a5568"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#6C8BFF"
      fadeDistance={30}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid={false}
      transparent
      opacity={opacity}
    />
  )
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <shadowMaterial transparent opacity={0.5} />
    </mesh>
  )
}

function DirectionArrows() {
  const arrows = useMemo(
    () => [
      { label: 'N', position: [0, 0.5, -9] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      { label: 'S', position: [0, 0.5, 9] as [number, number, number], rotation: [Math.PI, 0, 0] as [number, number, number] },
      { label: 'E', position: [9, 0.5, 0] as [number, number, number], rotation: [0, 0, -Math.PI / 2] as [number, number, number] },
      { label: 'W', position: [-9, 0.5, 0] as [number, number, number], rotation: [0, 0, Math.PI / 2] as [number, number, number] },
    ],
    [],
  )

  return (
    <>
      {arrows.map((arrow) => (
        <group key={arrow.label} position={arrow.position}>
          <mesh rotation={arrow.rotation}>
            <coneGeometry args={[0.4, 1, 16]} />
            <meshBasicMaterial color="#6C8BFF" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function SunLight() {
  const dayOfYear = useSimStore((state) => state.dayOfYear)
  const timeHours = useSimStore((state) => state.timeHours)
  const latitude = useSimStore((state) => state.latitude)
  const longitude = useSimStore((state) => state.longitude)

  const solar = useMemo(
    () => calculateSolarPosition(dayOfYear, timeHours, latitude, longitude),
    [dayOfYear, timeHours, latitude, longitude],
  )

  const lightColor = useMemo(() => {
    const elevDeg = radToDeg(solar.elevation)
    if (elevDeg < 10) {
      return new THREE.Color('#ff9955')
    } else if (elevDeg < 30) {
      return new THREE.Color('#ffeedd')
    } else {
      return new THREE.Color('#ffffff')
    }
  }, [solar.elevation])

  const lightIntensity = Math.max(0.1, Math.sin(Math.max(0, solar.elevation)) * 2)

  const shadowOpacity = solar.elevation > Math.PI / 6 ? 0.5 : 1.0

  return (
    <>
      <ambientLight intensity={0.4} color="#aabbdd" />
      <hemisphereLight args={['#87ceeb', '#3d5a3d', 0.4]} />
      <directionalLight
        position={[
          solar.directionVector.x * 20,
          Math.max(solar.directionVector.y * 20, 2),
          solar.directionVector.z * 20,
        ]}
        intensity={lightIntensity}
        color={lightColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0005}
      />
    </>
  )
}

function DynamicSky() {
  const dayOfYear = useSimStore((state) => state.dayOfYear)
  const timeHours = useSimStore((state) => state.timeHours)
  const latitude = useSimStore((state) => state.latitude)
  const longitude = useSimStore((state) => state.longitude)
  const { scene } = useThree()

  const solar = useMemo(
    () => calculateSolarPosition(dayOfYear, timeHours, latitude, longitude),
    [dayOfYear, timeHours, latitude, longitude],
  )

  useEffect(() => {
    const elevDeg = radToDeg(solar.elevation)
