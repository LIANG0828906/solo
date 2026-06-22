import * as THREE from 'three'

export interface TorusCoordinates {
  angle: number
  radius: number
  height: number
}

export interface PhysicsParticle {
  position: TorusCoordinates
  temperature: number
}

export interface PhysicsParams {
  magneticField: number
  temperature: number
}

export function torusToCartesian(
  coords: TorusCoordinates,
  majorRadiusPx: number
): { x: number; y: number; z: number } {
  const scale = 1.5 / 150
  const adjustedMajorRadius = majorRadiusPx * scale
  const { angle, radius, height } = coords

  const x = (adjustedMajorRadius + radius * Math.cos(height)) * Math.cos(angle)
  const y = (adjustedMajorRadius + radius * Math.cos(height)) * Math.sin(angle)
  const z = radius * Math.sin(height) * scale * 150

  return { x, y, z }
}

export function updateParticleMotion(
  particle: PhysicsParticle,
  params: PhysicsParams,
  deltaTime: number
): PhysicsParticle {
  const { position, temperature } = particle
  const { magneticField } = params

  const angularVelocity = 0.5 * (1 + (temperature / 1e8) * 0.5)
  const fieldScale = 1 + magneticField / 5
  const radialPerturbation = (Math.random() - 0.5) * 0.05
  const heightPerturbation = (Math.random() - 0.5) * 0.02

  const newAngle = position.angle + angularVelocity * fieldScale * deltaTime
  const newRadius = Math.max(0, Math.min(0.4, position.radius + radialPerturbation))
  const newHeight = position.height + heightPerturbation

  return {
    ...particle,
    position: {
      angle: newAngle % (Math.PI * 2),
      radius: newRadius,
      height: newHeight % (Math.PI * 2)
    }
  }
}

export function calculateMagneticField(
  position: { x: number; y: number; z: number },
  magneticField: number
): { bx: number; by: number; bz: number } {
  const { x, y, z } = position
  const r = Math.sqrt(x * x + y * y)
  const phi = Math.atan2(y, x)

  const toroidalStrength = magneticField / (r + 0.001)
  const bx = -toroidalStrength * Math.sin(phi)
  const by = toroidalStrength * Math.cos(phi)

  const poloidalStrength = magneticField * 0.3
  const deviation = r - 1.5
  const poloidalAngle = Math.atan2(z, deviation)

  const bxPoloidal = -poloidalStrength * Math.sin(poloidalAngle) * Math.cos(phi)
  const byPoloidal = -poloidalStrength * Math.sin(poloidalAngle) * Math.sin(phi)
  const bzPoloidal = poloidalStrength * Math.cos(poloidalAngle)

  return {
    bx: bx + bxPoloidal,
    by: by + byPoloidal,
    bz: bzPoloidal
  }
}

export function getTemperatureColor(temperature: number): THREE.Color {
  const minTemp = 1e6
  const maxTemp = 1.5e8
  const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temperature))
  const t = (clampedTemp - minTemp) / (maxTemp - minTemp)

  const startColor = new THREE.Color(0x1e90ff)
  const endColor = new THREE.Color(0xffffff)

  const r = startColor.r + (endColor.r - startColor.r) * t
  const g = startColor.g + (endColor.g - startColor.g) * t
  const b = startColor.b + (endColor.b - startColor.b) * t

  return new THREE.Color(r, g, b)
}
