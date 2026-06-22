import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Float,
  Stars,
  Html,
  Sparkles,
} from '@react-three/drei'
import * as THREE from 'three'
import { useForgeStore, RuneType, WeaponType } from './store'

const RUNE_COLORS: Record<string, string> = {
  fire: '#ff6b35',
  ice: '#87ceeb',
  thunder: '#9b59b6',
  shadow: '#2d5a27',
  holy: '#ffd700',
}

const WEAPON_BASE_COLOR: Record<WeaponType, string> = {
  sword: '#c0c0c0',
  bow: '#8b4513',
  staff: '#4a4a4a',
}

function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

function lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  return color1.clone().lerp(color2, t)
}

interface WeaponModelProps {
  color: THREE.Color
  emissive: THREE.Color
  emissiveIntensity: number
}

function SwordModel({ color, emissive, emissiveIntensity }: WeaponModelProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  const bladeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.9,
        roughness: 0.15,
        emissive,
        emissiveIntensity,
      }),
    [color, emissive, emissiveIntensity],
  )

  const guardMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e6b800'),
        metalness: 0.85,
        roughness: 0.25,
        emissive: new THREE.Color('#e6b800'),
        emissiveIntensity: emissiveIntensity * 0.3,
      }),
    [emissiveIntensity],
  )

  const gripMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#3d1f1a'),
        metalness: 0.2,
        roughness: 0.85,
      }),
    [],
  )

  const gemMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: emissive,
        emissive,
        emissiveIntensity: Math.max(emissiveIntensity, 0.6),
        metalness: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9,
      }),
    [emissive, emissiveIntensity],
  )

  const glowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: emissive,
        emissive,
        emissiveIntensity: Math.max(emissiveIntensity, 0.4),
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    [emissive, emissiveIntensity],
  )

  return (
    <group ref={groupRef}>
      <mesh material={bladeMat} position={[0, 0.9, 0]}>
        <boxGeometry args={[0.12, 1.8, 0.03]} />
      </mesh>
      <mesh material={bladeMat} position={[0, 0.9, 0]}>
        <boxGeometry args={[0.03, 1.8, 0.08]} />
      </mesh>
      <mesh material={bladeMat} position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.02, 0.15, 4]} />
      </mesh>
      <mesh material={guardMat} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.07, 0.12]} />
      </mesh>
      <mesh material={guardMat} position={[-0.32, 0, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
      </mesh>
      <mesh material={guardMat} position={[0.32, 0, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
      </mesh>
      <mesh material={gemMat} position={[0, 0.0, 0.07]}>
        <octahedronGeometry args={[0.04, 0]} />
      </mesh>
      <mesh material={gripMat} position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.05, 0.055, 0.55, 12]} />
      </mesh>
      <mesh material={guardMat} position={[0, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.055, 0.012, 8, 16]} />
      </mesh>
      <mesh material={guardMat} position={[0, -0.6, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
      </mesh>
      <mesh material={gemMat} position={[0, -0.6, 0.04]}>
        <sphereGeometry args={[0.025, 8, 8]} />
      </mesh>
      {emissiveIntensity > 0.1 && (
        <mesh material={glowMat} position={[0, 0.9, 0]}>
          <boxGeometry args={[0.2, 2.0, 0.1]} />
        </mesh>
      )}
    </group>
  )
}

function BowModel({ color, emissive, emissiveIntensity }: WeaponModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = emissiveIntensity + Math.sin(Date.now() * 0.003) * 0.2
    }
  })

  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.3,
        roughness: 0.65,
        emissive,
        emissiveIntensity: emissiveIntensity * 0.4,
      }),
    [color, emissive, emissiveIntensity],
  )

  const tipMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#c0c0c0'),
        metalness: 0.8,
        roughness: 0.2,
      }),
    [],
  )

  const stringMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#d4d4d4'),
        metalness: 0.1,
        roughness: 0.5,
      }),
    [],
  )

  const gemMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: emissive,
        emissive,
        emissiveIntensity: Math.max(emissiveIntensity, 0.6),
        metalness: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9,
      }),
    [emissive, emissiveIntensity],
  )

  const upperCurve = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 30; i++) {
      const t = i / 30
      const y = t * 1.6
      const x = Math.sin(t * Math.PI) * 0.55
      points.push(new THREE.Vector3(x, y, 0))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  const lowerCurve = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 30; i++) {
      const t = i / 30
      const y = -t * 1.6
      const x = Math.sin(t * Math.PI) * 0.55
      points.push(new THREE.Vector3(x, y, 0))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  const glowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: emissive,
        emissive,
        emissiveIntensity: Math.max(emissiveIntensity, 0.3),
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    [emissive, emissiveIntensity],
  )

  return (
    <group ref={groupRef}>
      <mesh material={woodMat}>
        <tubeGeometry args={[upperCurve, 40, 0.04, 8, false]} />
      </mesh>
      <mesh material={woodMat}>
        <tubeGeometry args={[lowerCurve, 40, 0.04, 8, false]} />
      </mesh>
      <mesh material={woodMat}>
        <cylinderGeometry args={[0.055, 0.055, 0.2, 10]} />
      </mesh>
      <mesh material={tipMat} position={[0.22, 1.5, 0]}>
        <coneGeometry args={[0.03, 0.1, 6]} />
      </mesh>
      <mesh material={tipMat} position={[0.22, -1.5, 0]}>
        <coneGeometry args={[0.03, 0.1, 6]} />
      </mesh>
      <mesh
        material={stringMat}
        position={[0.02, 0, 0]}
        rotation={[0, 0, 0]}
      >
        <cylinderGeometry args={[0.008, 0.008, 3.0, 4]} />
      </mesh>
      <mesh material={gemMat} position={[0.08, 0, 0.06]}>
        <octahedronGeometry args={[0.05, 0]} />
      </mesh>
      {emissiveIntensity > 0.1 && (
        <mesh ref={glowRef} material={glowMat} position={[0.15, 0, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
        </mesh>
      )}
      <mesh material={woodMat} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.055, 0.012, 8, 16, Math.PI]} />
      </mesh>
    </group>
  )
}

function StaffModel({ color, emissive, emissiveIntensity }: WeaponModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const orbRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
    if (orbRef.current) {
      orbRef.current.rotation.y += delta * 2
      orbRef.current.rotation.x += delta * 1.3
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.8
      ringRef.current.rotation.z += delta * 0.5
    }
  })

  const shaftMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.3,
        roughness: 0.7,
        emissive,
        emissiveIntensity: emissiveIntensity * 0.2,
      }),
    [color, emissive, emissiveIntensity],
  )

  const goldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e6b800'),
        metalness: 0.85,
        roughness: 0.25,
        emissive: new THREE.Color('#e6b800'),
        emissiveIntensity: emissiveIntensity * 0.2,
      }),
    [emissiveIntensity],
  )

  const crystalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: emissive,
        emissive,
        emissiveIntensity: Math.max(emissiveIntensity, 0.7),
        metalness: 0.4,
        roughness: 0.1,
        wireframe: true,
      }),
    [emissive, emissiveIntensity],
  )

  const orbCoreMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: emissive,
        emissive,
        emissiveIntensity: Math.max(emissiveIntensity, 0.5),
        metalness: 0.2,
        roughness: 0.05,
        transparent: true,
        opacity: 0.85,
      }),
    [emissive, emissiveIntensity],
  )

  const glowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: emissive,
        emissive,
        emissiveIntensity: Math.max(emissiveIntensity, 0.4),
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    [emissive, emissiveIntensity],
  )

  return (
    <group ref={groupRef}>
      <mesh material={shaftMat} position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 2.4, 14]} />
      </mesh>
      <mesh material={goldMat} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.025, 8, 24]} />
      </mesh>
      <mesh material={goldMat} position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.015, 8, 16]} />
      </mesh>
      <mesh material={goldMat} position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.08, 14]} />
      </mesh>
      <mesh material={goldMat} position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.15, 0.3, 6, 1, true]} />
      </mesh>
      <mesh ref={orbRef} material={crystalMat} position={[0, 0.85, 0]}>
        <icosahedronGeometry args={[0.18, 1]} />
      </mesh>
      <mesh material={orbCoreMat} position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>
      <mesh ref={ringRef} material={goldMat} position={[0, 0.85, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.22, 0.015, 8, 32]} />
      </mesh>
      {emissiveIntensity > 0.1 && (
        <mesh material={glowMat} position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
        </mesh>
      )}
      <mesh material={goldMat} position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.02, 8, 16]} />
      </mesh>
    </group>
  )
}

function WeaponModel({
  weaponType,
  color,
  emissive,
  emissiveIntensity,
}: WeaponModelProps & { weaponType: WeaponType }) {
  switch (weaponType) {
    case 'sword':
      return <SwordModel color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
    case 'bow':
      return <BowModel color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
    case 'staff':
      return <StaffModel color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
  }
}

interface WeaponSwitchProps {
  enhanceLevel: number
  dominantRune: RuneType | null
}

function WeaponSwitch({ enhanceLevel, dominantRune }: WeaponSwitchProps) {
  const weaponType = useForgeStore((state) => state.weaponType)

  const baseColor = useMemo(
    () => hexToThreeColor(WEAPON_BASE_COLOR[weaponType]),
    [weaponType],
  )

  const targetColor = useMemo(() => {
    if (dominantRune) {
      return hexToThreeColor(RUNE_COLORS[dominantRune])
    }
    return baseColor
  }, [dominantRune, baseColor])

  const [displayColor, setDisplayColor] = useState(baseColor)
  const [transitionProgress, setTransitionProgress] = useState(0)
  const prevDominantRef = useRef(dominantRune)

  useEffect(() => {
    if (prevDominantRef.current !== dominantRune) {
      setTransitionProgress(0)
      prevDominantRef.current = dominantRune
    }
  }, [dominantRune])

  useFrame((_, delta) => {
    if (transitionProgress < 1) {
      const next = Math.min(1, transitionProgress + delta / 0.3)
      setTransitionProgress(next)
      setDisplayColor(lerpColor(baseColor, targetColor, next))
    }
  })

  const { emissiveColor, emissiveIntensity } = useMemo(() => {
    let intensity = 0
    let color = new THREE.Color(0x000000)

    if (enhanceLevel >= 1 && enhanceLevel <= 2) {
      intensity = 0.15
    } else if (enhanceLevel >= 3 && enhanceLevel <= 4) {
      intensity = 0.45
    } else if (enhanceLevel >= 5) {
      intensity = 1.0
    }

    if (dominantRune && enhanceLevel > 0) {
      color = hexToThreeColor(RUNE_COLORS[dominantRune])
    }

    return { emissiveColor: color, emissiveIntensity: intensity }
  }, [enhanceLevel, dominantRune])

  const rainbowRef = useRef(0)
  const [rainbowEmissive, setRainbowEmissive] = useState(emissiveColor)

  useFrame((_, delta) => {
    if (enhanceLevel >= 5) {
      rainbowRef.current += delta * 0.5
      const hue = rainbowRef.current % 1
      setRainbowEmissive(new THREE.Color().setHSL(hue, 1, 0.5))
    } else {
      setRainbowEmissive(emissiveColor)
    }
  })

  return (
    <WeaponModel
      weaponType={weaponType}
      color={displayColor}
      emissive={enhanceLevel >= 5 ? rainbowEmissive : emissiveColor}
      emissiveIntensity={emissiveIntensity}
    />
  )
}

interface RuneSlotModelProps {
  slot: { id: number; rune: RuneType | null; level: number }
  index: number
}

function RuneSlotModel({ slot, index }: RuneSlotModelProps) {
  const angle = (index / 5) * Math.PI * 2 - Math.PI / 2
  const radius = 2.5
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius

  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2
      const scale = hovered ? 1.15 : 1.0
      meshRef.current.scale.setScalar(scale)
    }
  })

  const runeColor = slot.rune ? RUNE_COLORS[slot.rune] : '#555555'
  const color = hexToThreeColor(runeColor)

  const slotMaterial = useMemo(() => {
    if (slot.rune) {
      return new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2,
      })
    }
    return new THREE.MeshStandardMaterial({
      color: 0x333344,
      metalness: 0.5,
      roughness: 0.6,
      transparent: true,
      opacity: 0.6,
    })
  }, [slot.rune, color])

  return (
    <group position={[x, 0.5, z]}>
      {slot.rune && (
        <pointLight
          color={runeColor}
          intensity={1.5}
          distance={2}
          decay={2}
        />
      )}
      <mesh
        ref={meshRef}
        material={slotMaterial}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {slot.rune ? (
          <torusGeometry args={[0.2, 0.08, 16, 32]} />
        ) : (
          <sphereGeometry args={[0.2, 16, 16]} />
        )}
      </mesh>
      {slot.rune && slot.level > 0 && (
        <Html center position={[0, 0.35, 0]} distanceFactor={8}>
          <div
            style={{
              color: '#fff',
              fontSize: '12px',
              fontWeight: 'bold',
              textShadow: '0 0 4px rgba(0,0,0,0.8)',
              background: 'rgba(0,0,0,0.5)',
              padding: '2px 6px',
              borderRadius: '8px',
              border: `1px solid ${runeColor}`,
              whiteSpace: 'nowrap',
            }}
          >
            Lv.{slot.level}
          </div>
        </Html>
      )}
    </group>
  )
}

interface ParticleBurst {
  id: number
  type: RuneType
  time: number
}

interface ParticleSystemProps {
  bursts: ParticleBurst[]
}

function ParticleSystem({ bursts }: ParticleSystemProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const lineRef = useRef<THREE.LineSegments>(null)

  const MAX_PARTICLES = 500

  const { positions, colors, sizes, velocities, lifetimes, types } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const colors = new Float32Array(MAX_PARTICLES * 3)
    const sizes = new Float32Array(MAX_PARTICLES)
    const velocities = new Float32Array(MAX_PARTICLES * 3)
    const lifetimes = new Float32Array(MAX_PARTICLES)
    const types = new Array<RuneType>(MAX_PARTICLES).fill(null)

    return { positions, colors, sizes, velocities, lifetimes, types }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, colors, sizes])

  const [activeCount, setActiveCount] = useState(0)
  const activeBurstsRef = useRef<Set<number>>(new Set())

  const spawnParticle = (
    idx: number,
    type: RuneType,
    basePos: THREE.Vector3,
  ) => {
    const color = new THREE.Color(RUNE_COLORS[type!])
    positions[idx * 3] = basePos.x + (Math.random() - 0.5) * 0.5
    positions[idx * 3 + 1] = basePos.y + (Math.random() - 0.5) * 0.5
    positions[idx * 3 + 2] = basePos.z + (Math.random() - 0.5) * 0.5

    colors[idx * 3] = color.r
    colors[idx * 3 + 1] = color.g
    colors[idx * 3 + 2] = color.b

    if (type === 'fire') {
      velocities[idx * 3] = (Math.random() - 0.5) * 0.8
      velocities[idx * 3 + 1] = 1.5 + Math.random() * 1.5
      velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.8
    } else if (type === 'ice') {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.8 + Math.random() * 0.5
      velocities[idx * 3] = Math.cos(angle) * speed
      velocities[idx * 3 + 1] = (Math.random() - 0.3) * 0.5
      velocities[idx * 3 + 2] = Math.sin(angle) * speed
    } else if (type === 'thunder') {
      velocities[idx * 3] = (Math.random() - 0.5) * 2
      velocities[idx * 3 + 1] = (Math.random() - 0.5) * 2
      velocities[idx * 3 + 2] = (Math.random() - 0.5) * 2
    } else {
      velocities[idx * 3] = (Math.random() - 0.5) * 1
      velocities[idx * 3 + 1] = (Math.random() - 0.5) * 1
      velocities[idx * 3 + 2] = (Math.random() - 0.5) * 1
    }

    sizes[idx] = 0.03 + Math.random() * 0.04
    lifetimes[idx] = 2.0
    types[idx] = type
  }

  const nextIndexRef = useRef(0)

  const thunderLinePositions = useRef(new Float32Array(200 * 3))
  const thunderLineColors = useRef(new Float32Array(200 * 3))
  const thunderLineLifetimes = useRef(new Float32Array(100))

  const thunderGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(thunderLinePositions.current, 3),
    )
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(thunderLineColors.current, 3),
    )
    geo.setDrawRange(0, 0)
    return geo
  }, [])

  useFrame((state, delta) => {
    const now = Date.now()
    let count = activeCount

    bursts.forEach((burst) => {
      if (!activeBurstsRef.current.has(burst.id) && burst.type) {
        activeBurstsRef.current.add(burst.id)
        const particlesToSpawn = Math.min(80, MAX_PARTICLES - count)
        for (let i = 0; i < particlesToSpawn; i++) {
          const idx = (nextIndexRef.current + i) % MAX_PARTICLES
          spawnParticle(idx, burst.type, new THREE.Vector3(0, 0, 0))
          count++
        }
        nextIndexRef.current = (nextIndexRef.current + particlesToSpawn) % MAX_PARTICLES

        if (burst.type === 'thunder') {
          const thunderColor = new THREE.Color(RUNE_COLORS.thunder)
          const linePairs = 20
          const offset = thunderGeometry.drawRange.count / 2
          for (let i = 0; i < linePairs; i++) {
            const lineIdx = ((offset / 2 + i) % 100) * 2
            const start = new THREE.Vector3(
              (Math.random() - 0.5) * 0.8,
              Math.random() * 1.5 - 0.3,
              (Math.random() - 0.5) * 0.8,
            )
            thunderLinePositions.current[lineIdx * 3] = start.x
            thunderLinePositions.current[lineIdx * 3 + 1] = start.y
            thunderLinePositions.current[lineIdx * 3 + 2] = start.z

            let current = start.clone()
            const segs = 4
            for (let s = 0; s < segs; s++) {
              const next = current.clone().add(
                new THREE.Vector3(
                  (Math.random() - 0.5) * 0.3,
                  Math.random() * 0.3 - 0.1,
                  (Math.random() - 0.5) * 0.3,
                ),
              )
              if (s === segs - 1) {
                thunderLinePositions.current[(lineIdx + 1) * 3] = next.x
                thunderLinePositions.current[(lineIdx + 1) * 3 + 1] = next.y
                thunderLinePositions.current[(lineIdx + 1) * 3 + 2] = next.z
              }
              current = next
            }

            thunderLineColors.current[lineIdx * 3] = thunderColor.r
            thunderLineColors.current[lineIdx * 3 + 1] = thunderColor.g
            thunderLineColors.current[lineIdx * 3 + 2] = thunderColor.b
            thunderLineColors.current[(lineIdx + 1) * 3] = thunderColor.r
            thunderLineColors.current[(lineIdx + 1) * 3 + 1] = thunderColor.g
            thunderLineColors.current[(lineIdx + 1) * 3 + 2] = thunderColor.b

            thunderLineLifetimes.current[(lineIdx / 2) | 0] = 0.3
          }
          thunderGeometry.setDrawRange(0, Math.min(200, thunderGeometry.drawRange.count + linePairs * 2))
          thunderGeometry.attributes.position.needsUpdate = true
          thunderGeometry.attributes.color.needsUpdate = true
        }
      }
    })

    const age = (now: number, t: number) => (now - t) / 1000
    const expired = Array.from(activeBurstsRef.current).filter(
      (id) => {
        const b = bursts.find((x) => x.id === id)
        return !b || age(now, b.time) > 2.0
      },
    )
    expired.forEach((id) => activeBurstsRef.current.delete(id))

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta
        if (lifetimes[i] <= 0) {
          sizes[i] = 0
          continue
        }

        positions[i * 3] += velocities[i * 3] * delta
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta

        if (types[i] === 'fire') {
          velocities[i * 3 + 1] += delta * 0.5
        } else if (types[i] === 'ice') {
          const distFromCenter = Math.sqrt(
            positions[i * 3] ** 2 + positions[i * 3 + 2] ** 2,
          )
          if (distFromCenter > 0.1) {
            velocities[i * 3] += (-positions[i * 3] / distFromCenter) * delta * 0.5
            velocities[i * 3 + 2] += (-positions[i * 3 + 2] / distFromCenter) * delta * 0.5
          }
        }

        const alpha = Math.max(0, lifetimes[i] / 2.0)
        sizes[i] = (0.03 + Math.random() * 0.01) * alpha * 1.5
      }
    }

    for (let i = 0; i < 100; i++) {
      if (thunderLineLifetimes.current[i] > 0) {
        thunderLineLifetimes.current[i] -= delta
        if (thunderLineLifetimes.current[i] <= 0) {
          const lineStart = i * 2
          thunderLineColors.current[lineStart * 3 + 3] = 0
          thunderLineColors.current[lineStart * 3 + 4] = 0
          thunderLineColors.current[lineStart * 3 + 5] = 0
        }
      }
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.attributes.size.needsUpdate = true

    if (count !== activeCount) {
      setActiveCount(count)
    }
  })

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [],
  )

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  return (
    <>
      <points ref={particlesRef} geometry={geometry} material={material} />
      <lineSegments ref={lineRef} geometry={thunderGeometry} material={lineMaterial} />
    </>
  )
}

interface EnhanceEffectProps {
  status: {
    enhancing: boolean
    lastResult: 'success' | 'fail' | null
    effectTime: number
  }
  runeSlots: { rune: RuneType | null; level: number }[]
}

function EnhanceEffect({ status, runeSlots }: EnhanceEffectProps) {
  const beamRef = useRef<THREE.Mesh>(null)
  const failParticlesRef = useRef<THREE.Points>(null)
  const weaponGroupRef = useRef<THREE.Group>(null)

  const [showEffect, setShowEffect] = useState(false)
  const [effectPhase, setEffectPhase] = useState(0)
  const effectStartRef = useRef(0)

  useEffect(() => {
    if (status.enhancing && status.lastResult !== null) {
      setShowEffect(true)
      setEffectPhase(0)
      effectStartRef.current = Date.now()
    }
  }, [status.effectTime, status.enhancing, status.lastResult])

  const getDominantRune = (slots: { rune: RuneType | null; level: number }[]) => {
    let dominant: RuneType | null = null
    let maxLevel = 0
    slots.forEach((slot) => {
      if (slot.rune && slot.level >= maxLevel) {
        maxLevel = slot.level
        dominant = slot.rune
      }
    })
    return dominant
  }

  const failParticleData = useMemo(() => {
    const count = 200
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const lifetimes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5

      const shade = 0.15 + Math.random() * 0.2
      colors[i * 3] = shade
      colors[i * 3 + 1] = shade * 0.8
      colors[i * 3 + 2] = shade * 0.6

      const phi = Math.random() * Math.PI * 2
      const theta = Math.random() * Math.PI
      const speed = 1 + Math.random() * 2
      velocities[i * 3] = Math.sin(theta) * Math.cos(phi) * speed
      velocities[i * 3 + 1] = Math.cos(theta) * speed
      velocities[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * speed

      lifetimes[i] = 0
    }

    return { positions, colors, velocities, lifetimes, count }
  }, [])

  const failGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(failParticleData.positions, 3),
    )
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(failParticleData.colors, 3),
    )
    return geo
  }, [failParticleData])

  useFrame((state, delta) => {
    if (!showEffect) return

    const elapsed = (Date.now() - effectStartRef.current) / 1000

    if (status.lastResult === 'success') {
      if (elapsed > 1.2) {
        setShowEffect(false)
        return
      }

      const beamPhase = Math.min(1, elapsed / 0.3)
      const fadePhase = elapsed > 0.8 ? 1 - (elapsed - 0.8) / 0.4 : 1

      if (beamRef.current) {
        const scale = beamPhase * 1.2
        beamRef.current.scale.set(scale, Math.max(0.01, beamPhase * 8), scale)
        ;(beamRef.current.material as THREE.MeshBasicMaterial).opacity =
          fadePhase * 0.7
      }
    } else if (status.lastResult === 'fail') {
      if (elapsed > 0.6) {
        setShowEffect(false)
        return
      }

      if (weaponGroupRef.current) {
        const shake = Math.sin(elapsed * 80) * 0.05 * (1 - elapsed / 0.6)
        weaponGroupRef.current.position.x = shake
        weaponGroupRef.current.position.z = shake * 0.7
      }

      if (elapsed < 0.3) {
        for (let i = 0; i < failParticleData.count; i++) {
          failParticleData.lifetimes[i] = Math.max(
            0,
            0.3 - elapsed,
          )
          failParticleData.positions[i * 3] +=
            failParticleData.velocities[i * 3] * delta
          failParticleData.positions[i * 3 + 1] +=
            failParticleData.velocities[i * 3 + 1] * delta
          failParticleData.positions[i * 3 + 2] +=
            failParticleData.velocities[i * 3 + 2] * delta

          const alpha = Math.max(0, (0.3 - elapsed) / 0.3)
          failParticleData.colors[i * 3] *= alpha + 0.01
          failParticleData.colors[i * 3 + 1] *= alpha + 0.01
          failParticleData.colors[i * 3 + 2] *= alpha + 0.01
        }
        failGeometry.attributes.position.needsUpdate = true
        failGeometry.attributes.color.needsUpdate = true
      }
    }

    setEffectPhase(elapsed)
  })

  const dominant = getDominantRune(runeSlots)
  const beamColor = dominant ? RUNE_COLORS[dominant] : '#ffd700'

  return (
    <group>
      {showEffect && status.lastResult === 'success' && (
        <>
          <mesh ref={beamRef} position={[0, 2, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
            <meshBasicMaterial
              color={beamColor}
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1, 16]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <Html center position={[0, 3, 0]} distanceFactor={10}>
            <div
              style={{
                color: '#ffd700',
                fontSize: '32px',
                fontWeight: 'bold',
                textShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4)',
                whiteSpace: 'nowrap',
                animation: 'successPulse 0.8s ease-out',
                letterSpacing: '2px',
              }}
            >
              ✨ SUCCESS ✨
            </div>
          </Html>
        </>
      )}
      {showEffect && status.lastResult === 'fail' && (
        <group ref={weaponGroupRef}>
          <points
            ref={failParticlesRef}
            geometry={failGeometry}
          >
            <pointsMaterial
              size={0.05}
              vertexColors
              transparent
              opacity={0.9}
              blending={THREE.NormalBlending}
              depthWrite={false}
            />
          </points>
        </group>
      )}
    </group>
  )
}

function RuneLightSources({ slots }: { slots: { id: number; rune: RuneType | null; level: number }[] }) {
  return (
    <>
      {slots.map((slot) => {
        if (!slot.rune) return null
        const angle = (slot.id / 5) * Math.PI * 2 - Math.PI / 2
        const radius = 2.5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <pointLight
            key={slot.id}
            color={RUNE_COLORS[slot.rune]}
            intensity={0.8 + slot.level * 0.3}
            distance={3}
            position={[x, 0.5, z]}
          />
        )
      })}
    </>
  )
}

function Scene() {
  const weaponType = useForgeStore((state) => state.weaponType)
  const slots = useForgeStore((state) => state.slots)
  const enhanceLevel = useForgeStore((state) => state.upgradeLevel)
  const effectStatus = useForgeStore((state) => ({
    enhancing: state.animation !== '',
    lastResult: state.animation === 'success' ? 'success' : state.animation === 'fail' ? 'fail' : null,
    effectTime: state.animation ? Date.now() : 0,
  }))
  const particleType = useForgeStore((state) => state.effects.particleType)

  const [particleBursts, setParticleBursts] = useState<ParticleBurst[]>([])

  useEffect(() => {
    if (particleType) {
      setParticleBursts((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), type: particleType, time: Date.now() },
      ].slice(-10))
    }
  }, [particleType])

  const getDominantRune = (slots: { rune: RuneType | null; level: number }[]) => {
    let dominant: RuneType | null = null
    let maxLevel = 0
    slots.forEach((slot) => {
      if (slot.rune && slot.level >= maxLevel) {
        maxLevel = slot.level
        dominant = slot.rune
      }
    })
    return dominant
  }

  const dominantRune = getDominantRune(slots)
  const runeSlotsForEffect = slots.map((s) => ({
    rune: s.rune,
    level: s.rune ? s.rune.level : 0,
  }))

  return (
    <>
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 8, 25]} />

      <ambientLight intensity={0.35} color="#ffffff" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
      />
      <directionalLight
        position={[-5, 3, -5]}
        intensity={0.4}
        color="#6699cc"
      />
      <pointLight position={[0, 3, 0]} intensity={0.6} color="#8888aa" distance={10} />

      <Stars radius={30} depth={20} count={1500} factor={3} fade speed={0.5} />

      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={10}
        enableDamping
        dampingFactor={0.08}
      />

      <Sparkles
        count={30}
        scale={6}
        size={2}
        speed={0.3}
        opacity={0.4}
        color="#ffffff"
      />

      <group position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh receiveShadow>
          <circleGeometry args={[4, 64]} />
          <meshStandardMaterial
            color="#2a2a4a"
            metalness={0.3}
            roughness={0.8}
          />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <ringGeometry args={[3.8, 4, 64]} />
          <meshBasicMaterial color="#4a4a6a" transparent opacity={0.5} />
        </mesh>
      </group>

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <WeaponSwitch enhanceLevel={enhanceLevel} dominantRune={dominantRune} />
      </Float>

      {slots.map((slot, index) => (
        <RuneSlotModel
          key={slot.id}
          slot={{ id: slot.id, rune: slot.rune?.type || null, level: slot.rune?.level || 0 }}
          index={index}
        />
      ))}

      <RuneLightSources
        slots={slots.map((s) => ({
          id: s.id,
          rune: s.rune?.type || null,
          level: s.rune?.level || 0,
        }))}
      />

      <ParticleSystem bursts={particleBursts} />

      <EnhanceEffect status={effectStatus} runeSlots={runeSlotsForEffect} />

      <Sparkles
        count={enhanceLevel * 15}
        scale={2.5}
        size={enhanceLevel >= 5 ? 4 : 2}
        speed={enhanceLevel >= 3 ? 0.6 : 0.4}
        opacity={0.6}
        color={dominantRune ? RUNE_COLORS[dominantRune] : '#aaddff'}
        position={[0, 0.5, 0]}
      />
    </>
  )
}

export default function Forge() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1, 6], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', background: '#1a1a2e' }}
    >
      <Scene />
    </Canvas>
  )
}
