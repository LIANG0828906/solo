import { useRef, useState, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useHunyuanStore } from '@/stores/hunyuanStore'

interface RingProps {
  radius: number
  color: string
  rotation: [number, number, number]
  onDrag: (delta: number) => void
  tubeSize?: number
  label: string
}

function Ring({ radius, color, rotation, onDrag, tubeSize = 0.08, label }: RingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const lastAngleRef = useRef(0)
  const flashRed = useHunyuanStore((state) => state.flashRed)
  const showSuccessBeam = useHunyuanStore((state) => state.showSuccessBeam)

  const getPointerAngle = useCallback((e: ThreeEvent<PointerEvent>) => {
    const point = e.point
    const angle = Math.atan2(point.y, point.x)
    return angle
  }, [])

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsDragging(true)
    lastAngleRef.current = getPointerAngle(e)
    document.body.style.cursor = 'grabbing'
  }, [getPointerAngle])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return
    e.stopPropagation()
    const currentAngle = getPointerAngle(e)
    const delta = THREE.MathUtils.radToDeg(currentAngle - lastAngleRef.current)
    lastAngleRef.current = currentAngle
    onDrag(delta)
  }, [isDragging, getPointerAngle, onDrag])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    document.body.style.cursor = isHovered ? 'grab' : 'auto'
  }, [isHovered])

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsHovered(true)
    if (!isDragging) document.body.style.cursor = 'grab'
  }, [isDragging])

  const handlePointerOut = useCallback(() => {
    setIsHovered(false)
    if (!isDragging) document.body.style.cursor = 'auto'
  }, [isDragging])

  useFrame(() => {
    if (meshRef.current) {
      const scale = isHovered || isDragging ? 1.02 : 1
      meshRef.current.scale.setScalar(scale)
    }
  })

  const displayColor = flashRed && label === '赤道环' ? '#ff0000' : color

  return (
    <group rotation={rotation}>
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <torusGeometry args={[radius, tubeSize, 16, 128]} />
        <meshStandardMaterial
          color={displayColor}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          emissive={displayColor}
          emissiveIntensity={isHovered ? 0.3 : 0.1}
        />
      </mesh>
      
      {isHovered && (
        <mesh>
          <torusGeometry args={[radius, tubeSize * 1.3, 16, 128]} />
          <meshBasicMaterial
            color="#ffd700"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <Text
        position={[0, radius + 0.3, 0]}
        fontSize={0.3}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  )
}

function SuccessBeam() {
  const showSuccessBeam = useHunyuanStore((state) => state.showSuccessBeam)
  const beamRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (beamRef.current && showSuccessBeam) {
      beamRef.current.rotation.y += delta * 2
    }
  })

  if (!showSuccessBeam) return null

  return (
    <mesh ref={beamRef} position={[0, 0, 0]}>
      <cylinderGeometry args={[0.1, 0.5, 20, 32]} />
      <meshBasicMaterial
        color="#00ff00"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function FrameStructure() {
  const poleRef = useRef<THREE.Mesh>(null)
  const baseRef = useRef<THREE.Mesh>(null)

  return (
    <group>
      <mesh ref={poleRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 16, 16]} />
        <meshStandardMaterial color="#b87333" metalness={0.6} roughness={0.4} />
      </mesh>

      <mesh ref={baseRef} position={[0, -8, 0]}>
        <cylinderGeometry args={[3, 4, 1, 32]} />
        <meshStandardMaterial color="#3a3d44" metalness={0.3} roughness={0.8} />
      </mesh>

      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh key={i} position={[
          Math.cos(THREE.MathUtils.degToRad(angle)) * 2.5,
          -7.5,
          Math.sin(THREE.MathUtils.degToRad(angle)) * 2.5
        ]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#2e8b57" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

export default function ArmillarySphere() {
  const equatorialAngle = useHunyuanStore((state) => state.equatorialAngle)
  const horizonAngle = useHunyuanStore((state) => state.horizonAngle)
  const meridianAngle = useHunyuanStore((state) => state.meridianAngle)
  const setEquatorialAngle = useHunyuanStore((state) => state.setEquatorialAngle)
  const setHorizonAngle = useHunyuanStore((state) => state.setHorizonAngle)
  const setMeridianAngle = useHunyuanStore((state) => state.setMeridianAngle)
  const rotationSpeed = useHunyuanStore((state) => state.rotationSpeed)
  const skyRotation = useHunyuanStore((state) => state.skyRotation)
  const setSkyRotation = useHunyuanStore((state) => state.setSkyRotation)
  const addCalibrationRecord = useHunyuanStore((state) => state.addCalibrationRecord)

  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      const maxSpeed = (Math.PI * 2) / 10
      const rotationDelta = rotationSpeed * maxSpeed * delta
      const newRotation = skyRotation + rotationDelta
      setSkyRotation(newRotation)
      groupRef.current.rotation.y = newRotation
    }
  })

  const handleEquatorialDrag = useCallback((delta: number) => {
    setEquatorialAngle(equatorialAngle + delta * 0.5)
  }, [equatorialAngle, setEquatorialAngle])

  const handleHorizonDrag = useCallback((delta: number) => {
    setHorizonAngle(horizonAngle + delta)
  }, [horizonAngle, setHorizonAngle])

  const handleMeridianDrag = useCallback((delta: number) => {
    setMeridianAngle(meridianAngle + delta * 0.3)
    addCalibrationRecord()
  }, [meridianAngle, setMeridianAngle, addCalibrationRecord])

  return (
    <group ref={groupRef}>
      <FrameStructure />
      <SuccessBeam />
      
      <Ring
        radius={4}
        color="#ff0000"
        rotation={[THREE.MathUtils.degToRad(90 - equatorialAngle), 0, 0]}
        onDrag={handleEquatorialDrag}
        tubeSize={0.1}
        label="赤道环"
      />
      
      <Ring
        radius={4.5}
        color="#0032ff"
        rotation={[0, THREE.MathUtils.degToRad(horizonAngle), 0]}
        onDrag={handleHorizonDrag}
        tubeSize={0.1}
        label="地平环"
      />
      
      <Ring
        radius={3.5}
        color="#ffd700"
        rotation={[THREE.MathUtils.degToRad(meridianAngle), 0, THREE.MathUtils.degToRad(90)]}
        onDrag={handleMeridianDrag}
        tubeSize={0.09}
        label="子午环"
      />

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#1a1a2e" emissive="#4a4a6a" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}
