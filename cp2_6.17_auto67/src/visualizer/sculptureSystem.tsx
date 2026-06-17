import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '@/store/audioStore'

const RING_CONFIGS = [
  { radius: 2.5, speed: (30 * Math.PI) / 180, color: '#7C4DFF' },
  { radius: 1.8, speed: (45 * Math.PI) / 180, color: '#7C4DFF' },
  { radius: 1.0, speed: (60 * Math.PI) / 180, color: '#7C4DFF' },
]

const HEIGHT = 0.3
const BURST_COUNT = 60
const BURST_LIFETIME = 0.5
const BURST_RADIUS = 0.5
const BEAT_THRESHOLD = 0.3

const WARM_COLORS = ['#FF6B6B', '#FFA94D', '#FFD93D', '#FF8787', '#FA5252']
const COOL_COLORS = ['#4DABF7', '#74C0FC', '#9775FA', '#DA77F2', '#5C7CFA']

interface BurstParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  color: THREE.Color
  life: number
  maxLife: number
}

function createRingGeometry(radius: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  const segments = 64
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    const deform = 1 + Math.sin(angle * 6) * 0.05 + Math.cos(angle * 4) * 0.03
    if (i === 0) {
      shape.moveTo(x * deform, y * deform)
    } else {
      shape.lineTo(x * deform, y * deform)
    }
  }

  const hole = new THREE.Path()
  const innerRadius = radius * 0.88
  for (let i = segments; i >= 0; i--) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * innerRadius
    const y = Math.sin(angle) * innerRadius
    const deform = 1 + Math.sin(angle * 5) * 0.03
    if (i === segments) {
      hole.moveTo(x * deform, y * deform)
    } else {
      hole.lineTo(x * deform, y * deform)
    }
  }
  shape.holes.push(hole)

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: HEIGHT,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 3,
    curveSegments: 32,
  }

  return new THREE.ExtrudeGeometry(shape, extrudeSettings)
}

export function SculptureSystem() {
  const ringRefs = useRef<(THREE.Mesh | null)[]>([null, null, null])
  const groupRef = useRef<THREE.Group>(null)
  const scaleRef = useRef(1)
  const targetScale = useRef(1)
  const lastBeatRef = useRef(0)

  const burstParticlesRef = useRef<BurstParticle[]>([])
  const [burstVersion, setBurstVersion] = useState(0)

  const geometries = useMemo(() => {
    return RING_CONFIGS.map((c) => createRingGeometry(c.radius))
  }, [])

  const spawnBurst = useCallback((intensity: number) => {
    const particles: BurstParticle[] = []
    const colorPool = [...WARM_COLORS, ...COOL_COLORS]

    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = (i / BURST_COUNT) * Math.PI * 2 + Math.random() * 0.2
      const phi = (Math.random() - 0.5) * Math.PI * 0.8
      const speed = (0.8 + Math.random() * 1.2) * (0.5 + intensity * 0.5) * BURST_RADIUS

      const dir = new THREE.Vector3(
        Math.cos(angle) * Math.cos(phi),
        Math.sin(phi),
        Math.sin(angle) * Math.cos(phi)
      ).normalize()

      const colorHex = colorPool[Math.floor(Math.random() * colorPool.length)]
      const startPos = dir.clone().multiplyScalar(1.5 + Math.random() * 0.5)

      particles.push({
        position: startPos,
        velocity: dir.multiplyScalar(speed * 3),
        color: new THREE.Color(colorHex),
        life: BURST_LIFETIME,
        maxLife: BURST_LIFETIME,
      })
    }

    burstParticlesRef.current.push(...particles)
    setBurstVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const beat = useAudioStore.getState().beat
      if (beat > BEAT_THRESHOLD && now - lastBeatRef.current > 150) {
        lastBeatRef.current = now
        targetScale.current = 1 + 0.3 * beat
        spawnBurst(beat)
      }
    }, 16)
    return () => clearInterval(interval)
  }, [spawnBurst])

  const burstGeometry = useMemo(() => {
    const maxBurst = BURST_COUNT * 5
    const positions = new Float32Array(maxBurst * 3)
    const colors = new Float32Array(maxBurst * 3)
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.setDrawRange(0, 0)
    return geom
  }, [burstVersion])

  useFrame((_state, delta) => {
    ringRefs.current.forEach((mesh, idx) => {
      if (mesh) {
        mesh.rotation.y += RING_CONFIGS[idx].speed * delta
        mesh.rotation.x = Math.sin(Date.now() * 0.0003 + idx) * 0.15 + idx * 0.2
      }
    })

    if (groupRef.current) {
      targetScale.current += (1 - targetScale.current) * Math.min(1, delta * 12)
      scaleRef.current += (targetScale.current - scaleRef.current) * Math.min(1, delta * 15)
      groupRef.current.scale.setScalar(scaleRef.current)
    }

    const particles = burstParticlesRef.current
    if (particles.length > 0) {
      const posAttr = burstGeometry.getAttribute('position') as THREE.BufferAttribute
      const colAttr = burstGeometry.getAttribute('color') as THREE.BufferAttribute
      const posArr = posAttr.array as Float32Array
      const colArr = colAttr.array as Float32Array

      let activeCount = 0
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= delta
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        p.position.addScaledVector(p.velocity, delta)
        p.velocity.multiplyScalar(0.96)

        if (activeCount < posArr.length / 3) {
          const i3 = activeCount * 3
          posArr[i3] = p.position.x
          posArr[i3 + 1] = p.position.y
          posArr[i3 + 2] = p.position.z

          const alpha = p.life / p.maxLife
          colArr[i3] = p.color.r * alpha
          colArr[i3 + 1] = p.color.g * alpha
          colArr[i3 + 2] = p.color.b * alpha
          activeCount++
        }
      }

      posAttr.needsUpdate = true
      colAttr.needsUpdate = true
      burstGeometry.setDrawRange(0, activeCount)
    }
  })

  return (
    <>
      <group ref={groupRef}>
        {RING_CONFIGS.map((config, idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              ringRefs.current[idx] = el
            }}
            geometry={geometries[idx]}
            rotation={[idx * 0.2, 0, Math.PI / 2]}
          >
            <meshPhysicalMaterial
              color={config.color}
              transparent
              opacity={0.5}
              roughness={0.2}
              metalness={0.1}
              transmission={0.3}
              thickness={0.5}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
              side={THREE.DoubleSide}
              emissive={config.color}
              emissiveIntensity={0.15}
            />
          </mesh>
        ))}
      </group>
      <points geometry={burstGeometry}>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </>
  )
}
