import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useTrafficStore } from '../store/trafficStore'
import { Direction, LightColor } from '../modules/trafficSimulator'

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

const getFlowColor = (flow: number): string => {
  if (flow <= 50) {
    const t = flow / 50
    const r = Math.floor(34 + (234 - 34) * t)
    const g = Math.floor(197 + (179 - 197) * t)
    const b = Math.floor(94 + (8 - 94) * t)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } else {
    const t = (flow - 50) / 50
    const r = Math.floor(234 + (239 - 234) * t)
    const g = Math.floor(179 + (68 - 179) * t)
    const b = Math.floor(8 + (68 - 8) * t)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
}

const LIGHT_COLORS: Record<LightColor, string> = {
  red: '#EF4444',
  yellow: '#EAB308',
  green: '#22C55E'
}

const DIRECTION_POSITIONS: Record<Direction, { x: number; z: number; rotation: number }> = {
  north: { x: 0, z: -40, rotation: 0 },
  south: { x: 0, z: 40, rotation: Math.PI },
  east: { x: 40, z: 0, rotation: -Math.PI / 2 },
  west: { x: -40, z: 0, rotation: Math.PI / 2 }
}

const BAR_POSITIONS: Record<Direction, { x: number; z: number }[]> = {
  north: [
    { x: -8, z: -25 }, { x: -3, z: -25 }, { x: 2, z: -25 }, { x: 7, z: -25 }
  ],
  south: [
    { x: -7, z: 25 }, { x: -2, z: 25 }, { x: 3, z: 25 }, { x: 8, z: 25 }
  ],
  east: [
    { x: 25, z: -8 }, { x: 25, z: -3 }, { x: 25, z: 2 }, { x: 25, z: 7 }
  ],
  west: [
    { x: -25, z: -7 }, { x: -25, z: -2 }, { x: -25, z: 3 }, { x: -25, z: 8 }
  ]
}

function TrafficLight({ direction, activeLight }: { direction: Direction; activeLight: LightColor }) {
  const groupRef = useRef<THREE.Group>(null)
  const pulseRef = useRef<THREE.Mesh>(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const [prevLight, setPrevLight] = useState<LightColor>(activeLight)
  const flashStartTime = useRef(0)
  const pulseStartTime = useRef(0)

  const pos = DIRECTION_POSITIONS[direction]

  useEffect(() => {
    if (prevLight !== activeLight) {
      setPrevLight(activeLight)
      setIsFlashing(true)
      flashStartTime.current = performance.now()
      pulseStartTime.current = performance.now()
    }
  }, [activeLight, prevLight])

  useFrame(() => {
    if (isFlashing) {
      const elapsed = performance.now() - flashStartTime.current
      if (elapsed > 300) {
        setIsFlashing(false)
      }
    }

    if (pulseRef.current) {
      const elapsed = performance.now() - pulseStartTime.current
      const cycleDuration = 3000
      const progress = (elapsed % cycleDuration) / cycleDuration
      const scale = 0.8 + progress * 0.8
      const opacity = 0.6 * (1 - progress)
      
      pulseRef.current.scale.setScalar(scale)
      const material = pulseRef.current.material as THREE.MeshBasicMaterial
      material.opacity = opacity
    }
  })

  const lights: { color: LightColor; y: number }[] = [
    { color: 'red', y: 4 },
    { color: 'yellow', y: 2 },
    { color: 'green', y: 0 }
  ]

  return (
    <group ref={groupRef} position={[pos.x, 3, pos.z]} rotation={[0, pos.rotation, 0]}>
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[2, 6, 2]} />
        <meshStandardMaterial color="#1A1A2E" />
      </mesh>

      {lights.map(({ color, y }) => {
        const isActive = activeLight === color
        const flashIntensity = isFlashing && isActive ? (Math.sin(performance.now() * 0.05) + 1) / 2 : 1
        const emissiveColor = isActive ? LIGHT_COLORS[color] : '#1A1A1A'
        const emissiveIntensity = isActive ? 1.5 * flashIntensity : 0.1

        return (
          <group key={color} position={[0, y, 1.1]}>
            <mesh>
              <sphereGeometry args={[0.6, 32, 32]} />
              <meshStandardMaterial
                color={isActive ? LIGHT_COLORS[color] : '#2A2A2A'}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
            {isActive && (
              <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.6, 0.8, 64]} />
                <meshBasicMaterial
                  color={LIGHT_COLORS[color]}
                  transparent
                  opacity={0.6}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        )
      })}

      <mesh position={[0, -4.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 3, 16]} />
        <meshStandardMaterial color="#333344" />
      </mesh>
    </group>
  )
}

function FlowBar({ position, targetFlow, color }: { position: { x: number; z: number }; targetFlow: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const baseRef = useRef<THREE.Mesh>(null)
  const currentHeight = useRef(targetFlow * 0.15)
  const targetHeight = useRef(targetFlow * 0.15)
  const animationStartTime = useRef(0)
  const animationDuration = 600
  const isAnimating = useRef(false)

  useEffect(() => {
    targetHeight.current = targetFlow * 0.15
    animationStartTime.current = performance.now()
    isAnimating.current = true
  }, [targetFlow])

  useFrame(() => {
    if (meshRef.current && isAnimating.current) {
      const elapsed = performance.now() - animationStartTime.current
      const progress = Math.min(elapsed / animationDuration, 1)
      const easedProgress = easeOutCubic(progress)
      
      const startHeight = currentHeight.current
      const endHeight = targetHeight.current
      const newHeight = startHeight + (endHeight - startHeight) * easedProgress
      
      meshRef.current.scale.y = newHeight / 5
      meshRef.current.position.y = newHeight / 2
      
      if (progress >= 1) {
        isAnimating.current = false
        currentHeight.current = endHeight
      }
    }
  })

  return (
    <group position={[position.x, 0, position.z]}>
      <mesh ref={baseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      <mesh ref={meshRef} castShadow position={[0, currentHeight.current / 2, 0]}>
        <boxGeometry args={[1.5, 5, 1.5]} />
        <meshPhongMaterial color={color} shininess={100} />
      </mesh>
    </group>
  )
}

function CityGrid() {
  const gridSize = 100
  const gridDivisions = 10
  const roadWidth = 12
  const gridRef = useRef<THREE.GridHelper>(null)

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.material.transparent = true
      gridRef.current.material.opacity = 0.3
    }
  }, [])

  const roads = useMemo(() => [
    { position: [0, 0.02, 0], rotation: [0, 0, 0], size: [roadWidth, gridSize] },
    { position: [0, 0.02, 0], rotation: [0, Math.PI / 2, 0], size: [roadWidth, gridSize] }
  ], [])

  const borderPoints = useMemo(() => {
    const points = []
    for (let i = 0; i <= 100; i++) {
      const t = i / 100
      const angle = t * Math.PI * 2
      const r = 50
      points.push(new THREE.Vector3(Math.cos(angle) * r, 0.1, Math.sin(angle) * r))
    }
    return points
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>

      <gridHelper
        ref={gridRef}
        args={[gridSize, gridDivisions, '#1E293B', '#1E293B']}
        position={[0, 0.01, 0]}
      />

      {roads.map((road, index) => (
        <mesh key={index} rotation={road.rotation as [number, number, number]} position={road.position as [number, number, number]} receiveShadow>
          <boxGeometry args={[road.size[0], 0.1, road.size[1]]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={borderPoints.length}
            array={new Float32Array(borderPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#6366F1" transparent opacity={0.6} />
      </line>
    </group>
  )
}

function DataCollector() {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.y += 0.5 * Math.PI * 2 / 60
    }
  })

  return (
    <mesh ref={ringRef} position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[5, 0.3, 16, 100]} />
      <meshBasicMaterial color="#6366F1" transparent opacity={0.6} />
    </mesh>
  )
}

interface SceneProps {
  controlsRef: React.RefObject<any>
}

export default function Scene({ controlsRef }: SceneProps) {
  const { data } = useTrafficStore()

  const flowBars = useMemo(() => {
    const bars: { position: { x: number; z: number }; flow: number; color: string; key: string }[] = []
    
    data.forEach(item => {
      const positions = BAR_POSITIONS[item.direction]
      const baseFlow = item.flow
      
      positions.forEach((pos, idx) => {
        const variance = (Math.sin(idx * 1.5 + item.flow) * 0.3 + 1)
        const flow = Math.min(100, Math.max(0, baseFlow * variance))
        bars.push({
          position: pos,
          flow,
          color: getFlowColor(flow),
          key: `${item.direction}-${idx}`
        })
      })
    })
    
    return bars
  }, [data])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[-30, 40, -30]}
        intensity={0.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <directionalLight
        position={[30, 40, -30]}
        intensity={0.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      <fog attach="fog" args={['#0F172A', 40, 120]} />

      <CityGrid />
      <DataCollector />

      {data.map(item => (
        <TrafficLight
          key={item.direction}
          direction={item.direction}
          activeLight={item.light}
        />
      ))}

      {flowBars.map(bar => (
        <FlowBar
          key={bar.key}
          position={bar.position}
          targetFlow={bar.flow}
          color={bar.color}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
        target={[0, 0, 0]}
      />
    </>
  )
}
