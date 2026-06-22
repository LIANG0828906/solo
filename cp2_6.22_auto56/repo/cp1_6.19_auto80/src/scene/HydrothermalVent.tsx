import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_PARTICLES = 500
const PARTICLE_LIFETIME = 3
const INITIAL_VELOCITY = 2
const SPAWN_RATE = Math.floor(MAX_PARTICLES / PARTICLE_LIFETIME)

interface ParticleState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  age: number
  size: number
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number, target: THREE.Color): void {
  target.r = a.r + (b.r - a.r) * t
  target.g = a.g + (b.g - a.g) * t
  target.b = a.b + (b.b - a.b) * t
}

export function getTemperatureAt(distance: number): number {
  const T0 = 50
  const T_env = 5
  const decayDistance = 8
  return T_env + (T0 - T_env) * Math.exp(-distance / decayDistance)
}

interface HydrothermalVentProps {
  ventPosition: [number, number, number]
}

const COLOR_DEEP_GRAY = new THREE.Color('#333333')
const COLOR_DARK_GREEN = new THREE.Color('#2E6B2E')
const COLOR_FADE = new THREE.Color('#000000')
const COLOR_NEAR = new THREE.Color('#FF4500')
const COLOR_FAR = new THREE.Color('#00BFFF')
const tmpColor = new THREE.Color()
const tmpMatrix = new THREE.Matrix4()
const tmpVec = new THREE.Vector3()

function VentChimney({ position }: { position: [number, number, number] }) {
  const geom = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.15, 0.35, 1.2, 8, 1)
    return g
  }, [])

  return (
    <mesh position={[position[0], position[1] + 0.5, position[2]]} geometry={geom}>
      <meshStandardMaterial color="#1a1008" roughness={0.95} metalness={0.1} />
    </mesh>
  )
}

function ParticleSystem({ ventPosition }: { ventPosition: [number, number, number] }) {
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const particles = useRef<ParticleState[]>([])
  const spawnAccum = useRef(0)

  const ventOrigin = useMemo(() => new THREE.Vector3(...ventPosition), [ventPosition])

  const initParticle = useCallback(
    (p: ParticleState): void => {
      p.position.set(
        ventOrigin.x + (Math.random() - 0.5) * 0.15,
        ventOrigin.y,
        ventOrigin.z + (Math.random() - 0.5) * 0.15
      )
      const spread = (Math.random() - 0.5) * 0.3
      p.velocity.set(spread, INITIAL_VELOCITY + (Math.random() - 0.5) * 0.4, spread)
      p.age = Math.random() * PARTICLE_LIFETIME
      p.size = 0.05 + Math.random() * 0.15
    },
    [ventOrigin]
  )

  useMemo(() => {
    const arr: ParticleState[] = []
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p: ParticleState = {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        age: 0,
        size: 0.1
      }
      initParticle(p)
      arr.push(p)
    }
    particles.current = arr
  }, [initParticle])

  const sphereGeom = useMemo(() => new THREE.SphereGeometry(1, 6, 4), [])

  useFrame((_, delta) => {
    const mesh = instancedRef.current
    if (!mesh) return

    const dt = Math.min(delta, 0.05)
    spawnAccum.current += dt * SPAWN_RATE
    const toSpawn = Math.floor(spawnAccum.current)
    spawnAccum.current -= toSpawn

    let spawnIndex = 0
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles.current[i]
      p.age += dt

      if (p.age >= PARTICLE_LIFETIME) {
        if (spawnIndex < toSpawn) {
          initParticle(p)
          p.age = 0
          spawnIndex++
        } else {
          p.age = PARTICLE_LIFETIME
        }
      }

      if (p.age < PARTICLE_LIFETIME) {
        const diffusion = 0.15 * p.age
        p.position.x += (p.velocity.x * dt) + (Math.random() - 0.5) * diffusion * dt
        p.position.y += p.velocity.y * dt
        p.position.z += (p.velocity.z * dt) + (Math.random() - 0.5) * diffusion * dt
        p.velocity.y += 0.1 * dt
        p.velocity.x *= 1 + 0.3 * dt
        p.velocity.z *= 1 + 0.3 * dt
      }

      const lifeRatio = p.age / PARTICLE_LIFETIME
      const visible = p.age < PARTICLE_LIFETIME ? 1 : 0

      if (lifeRatio < 0.4) {
        lerpColor(COLOR_DEEP_GRAY, COLOR_DARK_GREEN, lifeRatio / 0.4, tmpColor)
      } else {
        lerpColor(COLOR_DARK_GREEN, COLOR_FADE, (lifeRatio - 0.4) / 0.6, tmpColor)
      }

      const scale = visible ? p.size * (1 - lifeRatio * 0.5) : 0
      tmpMatrix.makeTranslation(p.position.x, p.position.y, p.position.z)
      tmpMatrix.scale(tmpVec.set(scale, scale, scale))

      mesh.setMatrixAt(i, tmpMatrix)
      mesh.setColorAt(i, tmpColor)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={instancedRef} args={[sphereGeom, undefined, MAX_PARTICLES]}>
      <meshBasicMaterial transparent opacity={0.7} depthWrite={false} />
    </instancedMesh>
  )
}

function TemperatureField({ ventPosition }: { ventPosition: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  const timerRef = useRef(0)

  const shells = useMemo(() => {
    const items: { radius: number; opacity: number; color: string }[] = []
    const count = 6
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      const radius = 0.5 + t * 7.5
      const c = new THREE.Color()
      lerpColor(COLOR_NEAR, COLOR_FAR, t, c)
      items.push({
        radius,
        opacity: 0.12 * (1 - t * 0.7),
        color: `#${c.getHexString()}`
      })
    }
    return items
  }, [])

  useFrame((_, delta) => {
    timerRef.current += delta
    if (timerRef.current >= 0.5 && groupRef.current) {
      timerRef.current = 0
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh
        const mat = mesh.material as THREE.MeshBasicMaterial
        const t = i / (shells.length - 1)
        const pulse = 1 + 0.05 * Math.sin(Date.now() * 0.002 + i)
        mesh.scale.setScalar(pulse)
        mat.opacity = shells[i].opacity * (0.9 + 0.1 * Math.sin(Date.now() * 0.003 + i * 0.5))
      })
    }
  })

  return (
    <group ref={groupRef} position={ventPosition}>
      {shells.map((shell, i) => (
        <mesh key={i}>
          <sphereGeometry args={[shell.radius, 16, 12]} />
          <meshBasicMaterial
            color={shell.color}
            transparent
            opacity={shell.opacity}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export function HydrothermalVent({ ventPosition }: HydrothermalVentProps) {
  return (
    <group>
      <VentChimney position={ventPosition} />
      <ParticleSystem ventPosition={ventPosition} />
      <TemperatureField ventPosition={ventPosition} />
      <pointLight
        position={ventPosition}
        color="#FF8C00"
        intensity={1.5}
        distance={5}
        decay={2}
      />
    </group>
  )
}
