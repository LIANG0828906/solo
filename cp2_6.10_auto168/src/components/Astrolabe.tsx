import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RING_DATA, useAppStore } from '@/store/useAppStore'
import { useParticleSystem } from '@/hooks/useParticleSystem'

interface RingComponentProps {
  ringData: typeof RING_DATA[0]
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovered: boolean) => void
  monthRotation: number
  particles: ReturnType<typeof useParticleSystem>
}

function RingComponent({ ringData, isSelected, isHovered, onSelect, onHover, monthRotation, particles }: RingComponentProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const lastPosition = useRef(new THREE.Vector3())
  const [hovered, setHovered] = useState(false)

  const { tubeGeometry, glowGeometry } = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,
      ringData.radius, ringData.radius,
      0, 2 * Math.PI,
      false, 0
    )
    const points = curve.getPoints(128)
    const tubeGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, 0, p.y))),
      128, 0.03, 8, true
    )
    const glowGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, 0, p.y))),
      128, 0.06, 8, true
    )
    return { tubeGeometry: tubeGeo, glowGeometry: glowGeo }
  }, [ringData.radius])

  const markings = useMemo(() => {
    return ringData.markings.map((marking, i) => {
      const x = ringData.radius * Math.cos(marking.angle)
      const z = ringData.radius * Math.sin(marking.angle)
      return {
        position: [x, 0, z] as [number, number, number],
        rotation: [0, -marking.angle + Math.PI / 2, 0] as [number, number, number],
        label: marking.label,
        index: i,
      }
    })
  }, [ringData])

  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return

    const time = state.clock.elapsedTime
    let targetRotationY = 0

    if (ringData.id === 'equator') {
      targetRotationY = monthRotation * Math.PI * 2
    } else if (ringData.id === 'ecliptic') {
      targetRotationY = monthRotation * Math.PI * 2 + Math.PI / 6
    } else if (ringData.id === 'sight') {
      targetRotationY = Math.sin(time * 0.3) * 0.5
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.3
    }

    groupRef.current.rotation.y += (targetRotationY - groupRef.current.rotation.y) * 0.05

    if (glowRef.current) {
      const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial
      const targetOpacity = isSelected ? 0.6 : isHovered ? 0.4 : 0.15
      glowMaterial.opacity += (targetOpacity - glowMaterial.opacity) * 0.1
      
      const pulseIntensity = isSelected ? 1 + Math.sin(time * 4) * 0.2 : 1
      glowRef.current.scale.setScalar(pulseIntensity)
    }

    const meshMaterial = meshRef.current.material as THREE.MeshStandardMaterial
    const targetEmissive = isSelected ? 0.5 : isHovered ? 0.3 : 0.1
    meshMaterial.emissiveIntensity += (targetEmissive - meshMaterial.emissiveIntensity) * 0.1

    if (Math.abs(targetRotationY - groupRef.current.rotation.y) > 0.01) {
      const currentPosition = new THREE.Vector3()
      meshRef.current.getWorldPosition(currentPosition)
      
      if (lastPosition.current.distanceTo(currentPosition) > 0.01) {
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2
          const samplePos = new THREE.Vector3(
            ringData.radius * Math.cos(angle),
            0,
            ringData.radius * Math.sin(angle)
          )
          groupRef.current.localToWorld(samplePos)
          
          const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          ).normalize()
          
          particles.spawnParticle(samplePos, direction)
        }
      }
      lastPosition.current.copy(currentPosition)
    }
  })

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    setHovered(true)
    onHover(true)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    onHover(false)
    document.body.style.cursor = 'auto'
  }

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onSelect()
  }

  useEffect(() => {
    if (meshRef.current && groupRef.current) {
      meshRef.current.getWorldPosition(lastPosition.current)
    }
  }, [])

  return (
    <group
      ref={groupRef}
      rotation={ringData.rotation}
    >
      <mesh
        ref={meshRef}
        geometry={tubeGeometry}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshStandardMaterial
          color={ringData.color}
          metalness={0.8}
          roughness={0.2}
          emissive={ringData.color}
          emissiveIntensity={0.1}
        />
      </mesh>

      <mesh ref={glowRef} geometry={glowGeometry}>
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {markings.map((marking) => (
        <group
          key={marking.index}
          position={marking.position}
          rotation={marking.rotation}
        >
          <mesh position={[0.05, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffd700"
              emissiveIntensity={isHovered || isSelected ? 0.8 : 0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function Astrolabe() {
  const groupRef = useRef<THREE.Group>(null)
  const currentMonth = useAppStore(state => state.currentMonth)
  const selectedRing = useAppStore(state => state.selectedRing)
  const hoveredRing = useAppStore(state => state.hoveredRing)
  const autoRotate = useAppStore(state => state.autoRotate)
  const setSelectedRing = useAppStore(state => state.setSelectedRing)
  const setHoveredRing = useAppStore(state => state.setHoveredRing)
  const setHoveredMarking = useAppStore(state => state.setHoveredMarking)

  const particles = useParticleSystem(200)
  const particlesRef = useRef<THREE.Points>(null)

  const monthRotation = currentMonth / 11

  useFrame((state, delta) => {
    particles.update(delta)

    if (groupRef.current && autoRotate && !selectedRing) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })

  const handleRingSelect = (ringId: string) => {
    if (selectedRing === ringId) {
      setSelectedRing(null)
    } else {
      setSelectedRing(ringId)
      setHoveredMarking(null)
    }
  }

  return (
    <group ref={groupRef}>
      {RING_DATA.map((ringData) => (
        <RingComponent
          key={ringData.id}
          ringData={ringData}
          isSelected={selectedRing === ringData.id}
          isHovered={hoveredRing === ringData.id}
          onSelect={() => handleRingSelect(ringData.id)}
          onHover={(hovered) => setHoveredRing(hovered ? ringData.id : null)}
          monthRotation={monthRotation}
          particles={particles}
        />
      ))}

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color="#b8860b"
          metalness={0.9}
          roughness={0.1}
          emissive="#ffd700"
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh position={[0, -3.5, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 0.3, 32]} />
        <meshStandardMaterial
          color="#6b8e23"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, -3.7, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 64]} />
        <meshStandardMaterial
          color="#556b2f"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      <points ref={particlesRef} geometry={particles.geometry} material={particles.material} />
    </group>
  )
}
