import * as THREE from 'three'

export interface ParticleSystem {
  points: THREE.Points
  geometry: THREE.BufferGeometry
  material: THREE.PointsMaterial
  velocities: Float32Array
  count: number
}

export interface LeafParticleSystem {
  points: THREE.Points
  geometry: THREE.BufferGeometry
  material: THREE.PointsMaterial
  velocities: Float32Array
  lifetimes: Float32Array
  maxLife: number
  activeCount: number
}

export function createPollenParticles(count: number, bounds: THREE.Box3): ParticleSystem {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    positions[i3] = THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, Math.random())
    positions[i3 + 1] = THREE.MathUtils.lerp(bounds.min.y, bounds.max.y, Math.random())
    positions[i3 + 2] = THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, Math.random())

    velocities[i3] = (Math.random() - 0.5) * 0.2
    velocities[i3 + 1] = Math.random() * 0.15 + 0.05
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.2

    sizes[i] = Math.random() * 2 + 1
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })

  const points = new THREE.Points(geometry, material)

  return {
    points,
    geometry,
    material,
    velocities,
    count
  }
}

export function updatePollenParticles(
  system: ParticleSystem,
  deltaTime: number,
  lightIntensity: number,
  bounds: THREE.Box3
) {
  const positions = system.geometry.attributes.position.array as Float32Array
  const sizes = system.geometry.attributes.size.array as Float32Array

  const lightFactor = 0.3 + (lightIntensity / 100) * 0.7
  system.material.opacity = 0.3 + lightFactor * 0.5

  const targetColor = new THREE.Color().setHSL(0.15 + lightFactor * 0.1, 0.5, 0.7 + lightFactor * 0.3)
  system.material.color.lerp(targetColor, deltaTime * 0.5)

  for (let i = 0; i < system.count; i++) {
    const i3 = i * 3

    positions[i3] += system.velocities[i3] * deltaTime * 0.5 * lightFactor
    positions[i3 + 1] += system.velocities[i3 + 1] * deltaTime * 0.5
    positions[i3 + 2] += system.velocities[i3 + 2] * deltaTime * 0.5 * lightFactor

    sizes[i] = (Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5) * 0.03 + 0.03

    if (positions[i3 + 1] > bounds.max.y) {
      positions[i3] = THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, Math.random())
      positions[i3 + 1] = bounds.min.y
      positions[i3 + 2] = THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, Math.random())
    }
    if (positions[i3] < bounds.min.x) positions[i3] = bounds.max.x
    if (positions[i3] > bounds.max.x) positions[i3] = bounds.min.x
    if (positions[i3 + 2] < bounds.min.z) positions[i3 + 2] = bounds.max.z
    if (positions[i3 + 2] > bounds.max.z) positions[i3 + 2] = bounds.min.z
  }

  system.geometry.attributes.position.needsUpdate = true
  system.geometry.attributes.size.needsUpdate = true
}

export function createLeafParticleSystem(maxCount: number): LeafParticleSystem {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(maxCount * 3)
  const velocities = new Float32Array(maxCount * 3)
  const lifetimes = new Float32Array(maxCount)
  const sizes = new Float32Array(maxCount)
  const colors = new Float32Array(maxCount * 3)

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    vertexColors: true,
    blending: THREE.NormalBlending,
    sizeAttenuation: true
  })

  const points = new THREE.Points(geometry, material)
  points.visible = false

  return {
    points,
    geometry,
    material,
    velocities,
    lifetimes,
    maxLife: 3,
    activeCount: 0
  }
}

export function spawnLeafParticles(
  system: LeafParticleSystem,
  position: THREE.Vector3,
  count: number,
  color: THREE.Color
) {
  const positions = system.geometry.attributes.position.array as Float32Array
  const sizes = system.geometry.attributes.size.array as Float32Array
  const colors = system.geometry.attributes.color.array as Float32Array

  system.points.visible = true

  for (let i = 0; i < count; i++) {
    const index = (system.activeCount + i) % (system.geometry.attributes.position.count)
    const i3 = index * 3

    positions[i3] = position.x + (Math.random() - 0.5) * 0.5
    positions[i3 + 1] = position.y + Math.random() * 1
    positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.5

    system.velocities[i3] = (Math.random() - 0.5) * 0.3
    system.velocities[i3 + 1] = Math.random() * 0.2 + 0.1
    system.velocities[i3 + 2] = (Math.random() - 0.5) * 0.3

    system.lifetimes[index] = system.maxLife
    sizes[index] = 0.08 + Math.random() * 0.06

    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  system.activeCount = Math.min(
    system.geometry.attributes.position.count,
    system.activeCount + count
  )

  system.geometry.attributes.position.needsUpdate = true
  system.geometry.attributes.size.needsUpdate = true
  system.geometry.attributes.color.needsUpdate = true
}

export function updateLeafParticles(system: LeafParticleSystem, deltaTime: number) {
  if (system.activeCount === 0) return

  const positions = system.geometry.attributes.position.array as Float32Array
  const sizes = system.geometry.attributes.size.array as Float32Array
  const colors = system.geometry.attributes.color.array as Float32Array

  let newActiveCount = 0

  for (let i = 0; i < system.activeCount; i++) {
    if (system.lifetimes[i] <= 0) continue

    const i3 = i * 3

    system.lifetimes[i] -= deltaTime

    if (system.lifetimes[i] <= 0) {
      positions[i3 + 1] = -100
      continue
    }

    positions[i3] += system.velocities[i3] * deltaTime
    positions[i3 + 1] -= system.velocities[i3 + 1] * deltaTime
    positions[i3 + 2] += system.velocities[i3 + 2] * deltaTime

    system.velocities[i3 + 1] += deltaTime * 0.1

    const lifeRatio = system.lifetimes[i] / system.maxLife
    const alpha = lifeRatio
    sizes[i] = 0.1 * lifeRatio

    colors[i3 + 3] = alpha

    newActiveCount = Math.max(newActiveCount, i + 1)
  }

  system.activeCount = newActiveCount
  system.material.opacity = 0.8

  system.geometry.attributes.position.needsUpdate = true
  system.geometry.attributes.size.needsUpdate = true
  system.geometry.attributes.color.needsUpdate = true

  if (system.activeCount === 0) {
    system.points.visible = false
  }
}

export function disposeParticleSystem(system: ParticleSystem | LeafParticleSystem) {
  system.geometry.dispose()
  system.material.dispose()
}
