import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface HunYiProps {
  monthIndex: number
  onRingClick?: (ringType: 'horizon' | 'meridian' | 'equator') => void
}

const COPPER_GREEN = '#5b7a4a'
const MATERIAL_PROPS = {
  color: COPPER_GREEN,
  metalness: 0.8,
  roughness: 0.2,
  transparent: true,
  opacity: 0.85,
}

function createRingPath(radius: number): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
  }
  return new THREE.CatmullRomCurve3(points, true)
}

function ScaleMarks({ radius, count = 72 }: { radius: number; count?: number }) {
  const marks = useMemo(() => {
    const result: { position: [number, number, number]; rotation: [number, number, number] }[] = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const isMajor = i % 6 === 0
      const length = isMajor ? 0.15 : 0.08
      result.push({
        position: [Math.cos(angle) * (radius + length / 2), 0, Math.sin(angle) * (radius + length / 2)],
        rotation: [0, -angle + Math.PI / 2, 0],
      })
    }
    return result
  }, [radius, count])

  return (
    <group>
      {marks.map((mark, i) => (
        <mesh key={i} position={mark.position} rotation={mark.rotation}>
          <boxGeometry args={[0.02, 0.02, i % 6 === 0 ? 0.15 : 0.08]} />
          <meshStandardMaterial {...MATERIAL_PROPS} />
        </mesh>
      ))}
    </group>
  )
}

function HorizonRing({ onClick }: { onClick?: () => void }) {
  const path = useMemo(() => createRingPath(5), [])
  const ref = useRef<THREE.Mesh>(null)

  return (
    <group>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      >
        <tubeGeometry args={[path, 128, 0.08, 12, true]} />
        <meshStandardMaterial {...MATERIAL_PROPS} />
      </mesh>
      <ScaleMarks radius={5} />
    </group>
  )
}

function MeridianRing({ onClick }: { onClick?: () => void }) {
  const path = useMemo(() => createRingPath(4.8), [])
  const ref = useRef<THREE.Mesh>(null)

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      >
        <tubeGeometry args={[path, 128, 0.07, 12, true]} />
        <meshStandardMaterial {...MATERIAL_PROPS} />
      </mesh>
      <ScaleMarks radius={4.8} />
    </group>
  )
}

function EquatorRing({
  monthIndex,
  onClick,
}: {
  monthIndex: number
  onClick?: () => void
}) {
  const path = useMemo(() => createRingPath(4.6), [])
  const ref = useRef<THREE.Group>(null)
  const targetRotation = useRef(0)

  useFrame((_, delta) => {
    if (ref.current) {
      targetRotation.current = (monthIndex / 12) * Math.PI * 2
      const current = ref.current.rotation.y
      const diff = targetRotation.current - current
      ref.current.rotation.y = current + diff * delta * 2
    }
  })

  return (
    <group ref={ref} rotation={[0.41, 0, 0]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      >
        <tubeGeometry args={[path, 128, 0.07, 12, true]} />
        <meshStandardMaterial {...MATERIAL_PROPS} />
      </mesh>
      <ScaleMarks radius={4.6} />
    </group>
  )
}

function SightTube({ monthIndex }: { monthIndex: number }) {
  const ref = useRef<THREE.Group>(null)
  const targetRotation = useRef(0)

  useFrame((_, delta) => {
    if (ref.current) {
      targetRotation.current = (monthIndex / 12) * Math.PI * 2
      const current = ref.current.rotation.y
      const diff = targetRotation.current - current
      ref.current.rotation.y = current + diff * delta * 2
    }
  })

  return (
    <group ref={ref} rotation={[0.41, 0, 0]}>
      <mesh position={[0, 0, 2]}>
        <cylinderGeometry args={[0.06, 0.06, 4, 16]} />
        <meshStandardMaterial {...MATERIAL_PROPS} />
      </mesh>
      <mesh position={[0, 0, 4]}>
        <cylinderGeometry args={[0.1, 0.08, 0.2, 16]} />
        <meshStandardMaterial {...MATERIAL_PROPS} />
      </mesh>
    </group>
  )
}

function DecorativePillars() {
  const pillars = useMemo(() => {
    const result: { position: [number, number, number]; rotation: [number, number, number] }[] = []
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2
      result.push({
        position: [Math.cos(angle) * 5, 0, Math.sin(angle) * 5],
        rotation: [0, -angle, Math.PI / 4],
      })
    }
    return result
  }, [])

  return (
    <group>
      {pillars.map((pillar, i) => (
        <group key={i} position={pillar.position} rotation={pillar.rotation}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 10, 8]} />
            <meshStandardMaterial {...MATERIAL_PROPS} />
          </mesh>
          <mesh position={[0, 4.8, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial {...MATERIAL_PROPS} />
          </mesh>
          <mesh position={[0, -4.8, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial {...MATERIAL_PROPS} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function BaseCloudPattern({ radius, y }: { radius: number; y: number }) {
  const cloudPoints = useMemo(() => {
    const points: [number, number, number][] = []
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const r = radius * (0.85 + Math.sin(i * 2.5) * 0.15)
      points.push([Math.cos(angle) * r, y, Math.sin(angle) * r])
    }
    return points
  }, [radius, y])

  const shape = useMemo(() => {
    const s = new THREE.Shape()
    cloudPoints.forEach((p, i) => {
      if (i === 0) s.moveTo(p[0], p[2])
      else s.lineTo(p[0], p[2])
    })
    s.closePath()
    return s
  }, [cloudPoints])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial {...MATERIAL_PROPS} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Base() {
  return (
    <group position={[0, -5.2, 0]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[5.2, 5.5, 0.6, 64]} />
        <meshStandardMaterial {...MATERIAL_PROPS} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[5.5, 5.8, 0.1, 64]} />
        <meshStandardMaterial {...MATERIAL_PROPS} />
      </mesh>
      <BaseCloudPattern radius={5.3} y={0.6} />
      <BaseCloudPattern radius={5.3} y={0.05} />
      <group position={[0, 0.6, 0]}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 4.8, 0, Math.sin(angle) * 4.8]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[0.1, 0.08, 0.8]} />
              <meshStandardMaterial {...MATERIAL_PROPS} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

export function HunYi({ monthIndex, onRingClick }: HunYiProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, 5, -10]} intensity={0.5} />
      <pointLight position={[0, 8, 0]} intensity={0.6} />

      <group>
        <HorizonRing onClick={() => onRingClick?.('horizon')} />
        <MeridianRing onClick={() => onRingClick?.('meridian')} />
        <EquatorRing
          monthIndex={monthIndex}
          onClick={() => onRingClick?.('equator')}
        />
        <SightTube monthIndex={monthIndex} />
        <DecorativePillars />
        <Base />
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={20}
        enablePan={false}
      />
    </>
  )
}

export default HunYi
