import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWaterfallStore } from './store'

interface ParticleData {
  position: THREE.Vector3
  velocity: THREE.Vector3
  size: number
  life: number
  maxLife: number
  isFragment: boolean
  active: boolean
}

interface RippleData {
  position: THREE.Vector2
  radius: number
  maxRadius: number
  opacity: number
  speed: number
  active: boolean
}

class SpatialHashGrid {
  private cellSize: number = 2
  private grid: Map<string, number[]> = new Map()

  private getKey(pos: THREE.Vector3): string {
    const x = Math.floor(pos.x / this.cellSize)
    const y = Math.floor(pos.y / this.cellSize)
    const z = Math.floor(pos.z / this.cellSize)
    return `${x},${y},${z}`
  }

  clear() {
    this.grid.clear()
  }

  insert(index: number, pos: THREE.Vector3) {
    const key = this.getKey(pos)
    if (!this.grid.has(key)) {
      this.grid.set(key, [])
    }
    this.grid.get(key)!.push(index)
  }

  query(pos: THREE.Vector3, radius: number): number[] {
    const results: number[] = []
    const range = Math.ceil(radius / this.cellSize)
    const baseX = Math.floor(pos.x / this.cellSize)
    const baseY = Math.floor(pos.y / this.cellSize)
    const baseZ = Math.floor(pos.z / this.cellSize)

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        for (let dz = -range; dz <= range; dz++) {
          const key = `${baseX + dx},${baseY + dy},${baseZ + dz}`
          const cell = this.grid.get(key)
          if (cell) {
            results.push(...cell)
          }
        }
      }
    }
    return results
  }
}

export function Waterfall() {
  const pointsRef = useRef<THREE.Points>(null)
  const rippleMeshRef = useRef<THREE.InstancedMesh>(null)

  const flowRate = useWaterfallStore(state => state.flowRate)
  const windDirection = useWaterfallStore(state => state.windDirection)
  const windStrength = useWaterfallStore(state => state.windStrength)
  const maxParticles = useWaterfallStore(state => state.maxParticles)
  const baseParticleCount = useWaterfallStore(state => state.baseParticleCount)
  const rocks = useWaterfallStore(state => state.rocks)
  const playDropSound = useWaterfallStore(state => state.playDropSound)
  const initAudioContext = useWaterfallStore(state => state.initAudioContext)

  const [rippleCount, setRippleCount] = useState(0)

  const particles = useRef<ParticleData[]>([])
  const ripples = useRef<RippleData[]>([])
  const hashGrid = useRef(new SpatialHashGrid())
  const dummy = useRef(new THREE.Object3D())
  const audioPlayedThisFrame = useRef(0)

  const positions = useMemo(() => new Float32Array(maxParticles * 3), [maxParticles])
  const colors = useMemo(() => new Float32Array(maxParticles * 3), [maxParticles])
  const sizes = useMemo(() => new Float32Array(maxParticles), [maxParticles])

  useEffect(() => {
    for (let i = 0; i < maxParticles; i++) {
      particles.current.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        size: 0,
        life: 0,
        maxLife: 0,
        isFragment: false,
        active: false
      })
    }
    for (let i = 0; i < 50; i++) {
      ripples.current.push({
        position: new THREE.Vector2(),
        radius: 0,
        maxRadius: 0,
        opacity: 0,
        speed: 0,
        active: false
      })
    }
  }, [maxParticles])

  const spawnParticle = (isFragment = false, position?: THREE.Vector3, velocity?: THREE.Vector3) => {
    const activeCount = particles.current.filter(p => p.active).length
    if (activeCount >= maxParticles) return -1

    const idx = particles.current.findIndex(p => !p.active)
    if (idx === -1) return -1

    const p = particles.current[idx]
    p.active = true
    p.isFragment = isFragment

    if (isFragment && position && velocity) {
      p.position.copy(position)
      p.velocity.copy(velocity)
      p.size = 2 + Math.random() * 2
      p.life = 0
      p.maxLife = 1.5 + Math.random()
    } else {
      p.position.set(
        (Math.random() - 0.3) * 3,
        5,
        (Math.random() - 0.5) * 1
      )
      p.velocity.set(
        (Math.random() - 0.5) * 0.5,
        -1 - Math.random() * 0.5,
        (Math.random() - 0.5) * 0.3
      )
      p.size = 2 + Math.random() * 4
      p.life = 0
      p.maxLife = 3 + Math.random() * 2
    }

    return idx
  }

  const spawnRipple = (x: number, z: number) => {
    const idx = ripples.current.findIndex(r => !r.active)
    if (idx === -1) return

    const rippleSpeed = 0.5 + (flowRate / 100) * 1.5
    const r = ripples.current[idx]
    r.active = true
    r.position.set(x, z)
    r.radius = 0.05
    r.maxRadius = 0.2 + Math.random() * 0.3
    r.opacity = 0.4
    r.speed = rippleSpeed

    setRippleCount(ripples.current.filter(r => r.active).length)
  }

  const GRAVITY = new THREE.Vector3(0, -9.8, 0)
  const topColor = new THREE.Color(0xffffff)
  const bottomColor = new THREE.Color(0xb0e0e6)
  const tempColor = useRef(new THREE.Color())
  let spawnTimer = 0

  useFrame((_, delta) => {
    const fixedDelta = Math.min(delta, 0.033)

    initAudioContext()
    audioPlayedThisFrame.current = 0

    const windRad = (windDirection - 90) * Math.PI / 180
    const windVector = new THREE.Vector3(
      Math.cos(windRad) * windStrength * 2,
      0,
      Math.sin(windRad) * windStrength * 2
    )

    spawnTimer += fixedDelta
    const spawnInterval = 0.02 / (flowRate / 100 + 0.1)
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0
      const toSpawn = Math.ceil(flowRate / 20)
      for (let i = 0; i < toSpawn; i++) {
        spawnParticle()
      }
    }

    hashGrid.current.clear()
    particles.current.forEach((p, idx) => {
      if (p.active) {
        hashGrid.current.insert(idx, p.position)
      }
    })

    let activeRippleCount = 0

    for (let i = 0; i < maxParticles; i++) {
      const p = particles.current[i]
      if (!p.active) continue

      p.life += fixedDelta

      p.velocity.addScaledVector(GRAVITY, fixedDelta * 0.5)
      p.velocity.addScaledVector(windVector, fixedDelta)
      p.position.addScaledVector(p.velocity, fixedDelta)

      const nearby = hashGrid.current.query(p.position, 1)
      for (const rock of rocks) {
        const dist = p.position.distanceTo(rock.position)
        const collisionRadius = rock.radius * (1 + rock.roughness * 0.3)

        if (dist < collisionRadius + 0.05) {
          if (!p.isFragment && p.life > 0.1) {
            const normal = p.position.clone().sub(rock.position).normalize()
            const fragmentCount = 2 + Math.floor(rock.roughness * 2)
            for (let f = 0; f < fragmentCount; f++) {
              const scatter = new THREE.Vector3(
                (Math.random() - 0.5) * 3 + normal.x * 2,
                Math.abs(Math.random() * 2 + normal.y),
                (Math.random() - 0.5) * 3 + normal.z * 2
              )
              spawnParticle(true, p.position.clone(), scatter)
            }
          }

          const reflect = p.velocity.clone().reflect(
            p.position.clone().sub(rock.position).normalize()
          )
          reflect.multiplyScalar(0.3)
          p.velocity.copy(reflect)
          p.position.addScaledVector(reflect, fixedDelta)
          p.isFragment = true
          p.size *= 0.6
        }
      }

      if (p.position.y < -4) {
        const poolX = 3
        const poolZ = 0
        const poolRadius = 2

        if (Math.abs(p.position.x - poolX) < poolRadius &&
            Math.abs(p.position.z - poolZ) < poolRadius) {
          spawnRipple(p.position.x, p.position.z)
          if (audioPlayedThisFrame.current < 3 && Math.random() < 0.3) {
            playDropSound()
            audioPlayedThisFrame.current++
          }
        }
        p.active = false
        continue
      }

      if (p.life > p.maxLife) {
        p.active = false
        continue
      }

      const normalizedHeight = Math.max(0, Math.min(1, (p.position.y + 4) / 9))
      tempColor.current.copy(topColor).lerp(bottomColor, 1 - normalizedHeight)

      positions[i * 3] = p.position.x
      positions[i * 3 + 1] = p.position.y
      positions[i * 3 + 2] = p.position.z
      colors[i * 3] = tempColor.current.r
      colors[i * 3 + 1] = tempColor.current.g
      colors[i * 3 + 2] = tempColor.current.b
      sizes[i] = p.size
    }

    for (let i = 0; i < maxParticles; i++) {
      if (!particles.current[i].active) {
        positions[i * 3 + 1] = -100
      }
    }

    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
      const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute
      const sizeAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute

      posAttr.array = positions
      colAttr.array = colors
      sizeAttr.array = sizes

      posAttr.needsUpdate = true
      colAttr.needsUpdate = true
      sizeAttr.needsUpdate = true

      pointsRef.current.geometry.computeBoundingSphere()
    }

    for (let i = 0; i < ripples.current.length; i++) {
      const r = ripples.current[i]
      if (!r.active) {
        dummy.current.position.set(100, -4, 0)
        dummy.current.scale.setScalar(0)
        dummy.current.updateMatrix()
        rippleMeshRef.current?.setMatrixAt(i, dummy.current.matrix)
        continue
      }

      r.radius += r.speed * fixedDelta
      r.opacity = 0.4 * (1 - r.radius / r.maxRadius)

      if (r.radius >= r.maxRadius) {
        r.active = false
        continue
      }

      dummy.current.position.set(r.position.x, -3.9, r.position.y)
      dummy.current.scale.setScalar(r.radius * 2)
      dummy.current.updateMatrix()
      rippleMeshRef.current?.setMatrixAt(i, dummy.current.matrix)

      const color = new THREE.Color(0x4a90d9)
      rippleMeshRef.current?.setColorAt(i, color)
      activeRippleCount++
    }

    if (rippleMeshRef.current) {
      rippleMeshRef.current.instanceMatrix.needsUpdate = true
      if (rippleMeshRef.current.instanceColor) {
        rippleMeshRef.current.instanceColor.needsUpdate = true
      }
      rippleMeshRef.current.count = activeRippleCount
    }
  })

  const rippleGeometry = useMemo(() => {
    const geo = new THREE.RingGeometry(0.9, 1, 32)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={maxParticles}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={maxParticles}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={maxParticles}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          transparent
          opacity={0.8}
          size={0.1}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <instancedMesh
        ref={rippleMeshRef}
        args={[rippleGeometry, undefined, 50]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color="#4a90d9"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  )
}
