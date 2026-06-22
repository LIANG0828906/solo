import { useRef, useMemo } from 'react'
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
const MAX_BURST_PARTICLES = BURST_COUNT * 8

const WARM_COLORS = ['#FF6B6B', '#FFA94D', '#FFD93D', '#FF8787', '#FA5252']
const COOL_COLORS = ['#4DABF7', '#74C0FC', '#9775FA', '#DA77F2', '#5C7CFA']

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

interface BurstParticleData {
  px: number
  py: number
  pz: number
  vx: number
  vy: number
  vz: number
  r: number
  g: number
  b: number
  life: number
  maxLife: number
  active: boolean
}

export function SculptureSystem() {
  const ringRefs = useRef<(THREE.Mesh | null)[]>([null, null, null])
  const groupRef = useRef<THREE.Group>(null)
  const scaleAnimRef = useRef({ current: 1, target: 1, progress: 1 })
  const lastBeatTimeRef = useRef(0)

  const burstPool = useRef<BurstParticleData[]>([])
  const burstWriteIdx = useRef(0)

  const geometries = useMemo(() => {
    return RING_CONFIGS.map((c) => createRingGeometry(c.radius))
  }, [])

  const burstGeometry = useMemo(() => {
    const positions = new Float32Array(MAX_BURST_PARTICLES * 3)
    const colors = new Float32Array(MAX_BURST_PARTICLES * 3)
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.setDrawRange(0, 0)
    return geom
  }, [])

  const burstMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  }, [])

  function spawnBurst(intensity: number) {
    const pool = burstPool.current
    const colorPool = [...WARM_COLORS, ...COOL_COLORS]

    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = (i / BURST_COUNT) * Math.PI * 2 + Math.random() * 0.2
      const phi = (Math.random() - 0.5) * Math.PI * 0.8
      const speed =
        (0.8 + Math.random() * 1.2) * (0.5 + intensity * 0.5) * BURST_RADIUS

      const dx = Math.cos(angle) * Math.cos(phi)
      const dy = Math.sin(phi)
      const dz = Math.sin(angle) * Math.cos(phi)
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const nx = dx / len
      const ny = dy / len
      const nz = dz / len

      const startR = 1.5 + Math.random() * 0.5
      const colorHex = colorPool[Math.floor(Math.random() * colorPool.length)]
      const c = new THREE.Color(colorHex)

      const particle: BurstParticleData = {
        px: nx * startR,
        py: ny * startR,
        pz: nz * startR,
        vx: nx * speed * 3,
        vy: ny * speed * 3,
        vz: nz * speed * 3,
        r: c.r,
        g: c.g,
        b: c.b,
        life: BURST_LIFETIME,
        maxLife: BURST_LIFETIME,
        active: true,
      }

      if (burstWriteIdx.current < pool.length) {
        pool[burstWriteIdx.current] = particle
      } else {
        pool.push(particle)
      }
      burstWriteIdx.current++
    }
  }

  useFrame((_state, delta) => {
    const now = Date.now()
    const beat = useAudioStore.getState().beat

    if (beat > BEAT_THRESHOLD && now - lastBeatTimeRef.current > 150) {
      lastBeatTimeRef.current = now
      const anim = scaleAnimRef.current
      anim.target = 1 + 0.3 * beat
      anim.progress = 0
      spawnBurst(beat)
    }

    ringRefs.current.forEach((mesh, idx) => {
      if (mesh) {
        mesh.rotation.y += RING_CONFIGS[idx].speed * delta
        mesh.rotation.x =
          Math.sin(now * 0.0003 + idx) * 0.15 + idx * 0.2
      }
    })

    if (groupRef.current) {
      const anim = scaleAnimRef.current
      if (anim.progress < 1) {
        anim.progress = Math.min(1, anim.progress + delta / 0.1)
        const t = anim.progress
        const eased = 1 - Math.pow(1 - t, 3)
        anim.current = 1 + (anim.target - 1) * eased
      } else {
        anim.current += (1 - anim.current) * Math.min(1, delta * 8)
      }
      groupRef.current.scale.setScalar(anim.current)
    }

    const pool = burstPool.current
    const activeCount = burstWriteIdx.current
    if (activeCount > 0) {
      const posAttr = burstGeometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute
      const colAttr = burstGeometry.getAttribute(
        'color'
      ) as THREE.BufferAttribute
      const posArr = posAttr.array as Float32Array
      const colArr = colAttr.array as Float32Array

      let writePos = 0
      for (let i = 0; i < activeCount; i++) {
        const p = pool[i]
        if (!p || !p.active) continue

        p.life -= delta
        if (p.life <= 0) {
          p.active = false
          continue
        }

        p.px += p.vx * delta
        p.py += p.vy * delta
        p.pz += p.vz * delta
        p.vx *= 0.96
        p.vy *= 0.96
        p.vz *= 0.96

        if (writePos < MAX_BURST_PARTICLES) {
          const i3 = writePos * 3
          posArr[i3] = p.px
          posArr[i3 + 1] = p.py
          posArr[i3 + 2] = p.pz

          const alpha = p.life / p.maxLife
          colArr[i3] = p.r * alpha
          colArr[i3 + 1] = p.g * alpha
          colArr[i3 + 2] = p.b * alpha
          writePos++
        }
      }

      burstWriteIdx.current = 0
      for (let i = 0; i < pool.length; i++) {
        if (pool[i].active) {
          pool[burstWriteIdx.current] = pool[i]
          burstWriteIdx.current++
        }
      }

      posAttr.needsUpdate = true
      colAttr.needsUpdate = true
      burstGeometry.setDrawRange(0, writePos)
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
      <points geometry={burstGeometry} material={burstMaterial} />
    </>
  )
}
