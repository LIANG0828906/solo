import * as THREE from 'three'
import { Particle, getColorFromSpeed, BOUNDARY } from '@/store/flowStore'

const MAX_SPEED = 5
const MAX_HISTORY = 20
const WIND_TRANSITION_DURATION = 500
const CLICK_PARTICLE_FADE_DURATION = 2000

interface PhysicsParams {
  gravityVector: THREE.Vector3
  windVector: THREE.Vector3
  targetWindVector: THREE.Vector3
  windTransitionStartTime: number
  clickPosition: THREE.Vector3 | null
  specialEffect: 'none' | 'smoke' | 'spark'
  effectStartTime: number
}

const lerpVector = (a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 => {
  return new THREE.Vector3(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (b.z - a.z) * t
  )
}

export const updateParticlesPhysics = (
  particles: Particle[],
  params: PhysicsParams,
  currentTime: number
): { particles: Particle[]; currentWindVector: THREE.Vector3 } => {
  const {
    gravityVector,
    windVector,
    targetWindVector,
    windTransitionStartTime,
    clickPosition,
    specialEffect,
    effectStartTime,
  } = params

  const windTransitionProgress = windTransitionStartTime > 0
    ? Math.min((currentTime - windTransitionStartTime) / WIND_TRANSITION_DURATION, 1)
    : 1

  const currentWindVector = windTransitionStartTime > 0
    ? lerpVector(windVector, targetWindVector, windTransitionProgress)
    : windVector.clone()

  let effectSmokeProgress = 0
  let effectSparkActive = false
  let effectSparkPhase = 0
  let effectSpeedMultiplier = 1
  let effectSizeMultiplier = 1
  let effectOpacityMultiplier = 1

  if (specialEffect !== 'none') {
    const elapsed = currentTime - effectStartTime

    if (specialEffect === 'smoke') {
      if (elapsed < 1000) {
        effectSmokeProgress = elapsed / 1000
      } else if (elapsed < 3000) {
        effectSmokeProgress = 1
      } else if (elapsed < 4000) {
        effectSmokeProgress = 1 - (elapsed - 3000) / 1000
      }
      effectSizeMultiplier = 1 + (20 / 4 - 1) * effectSmokeProgress
      effectOpacityMultiplier = 1 - (1 - 0.2 / 0.9) * effectSmokeProgress
    } else if (specialEffect === 'spark') {
      if (elapsed < 2000) {
        effectSparkActive = true
        effectSparkPhase = Math.floor(elapsed / 100) % 2
        effectSpeedMultiplier = 1.5
      }
    }
  }

  const updatedParticles: Particle[] = []
  const sparkOrange = new THREE.Color('#FF8C00')
  const sparkRed = new THREE.Color('#FF4500')

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    let clickForce = new THREE.Vector3(0, 0, 0)
    if (clickPosition) {
      const dir = new THREE.Vector3().subVectors(p.position, clickPosition)
      const dist = dir.length()
      if (dist < 5 && dist > 0.1) {
        const strength = (1 - dist / 5) * 0.3
        dir.normalize().multiplyScalar(strength)
        clickForce = dir
      }
    }

    const acceleration = new THREE.Vector3()
      .add(gravityVector)
      .add(currentWindVector)
      .add(clickForce)

    p.velocity.add(acceleration)

    const currentSpeed = p.velocity.length()
    if (currentSpeed > MAX_SPEED) {
      p.velocity.multiplyScalar(MAX_SPEED / currentSpeed)
    }

    if (effectSpeedMultiplier !== 1) {
      p.velocity.multiplyScalar(effectSpeedMultiplier)
      const s = p.velocity.length()
      if (s > MAX_SPEED * effectSpeedMultiplier) {
        p.velocity.multiplyScalar((MAX_SPEED * effectSpeedMultiplier) / s)
      }
    }

    const newPosition = p.position.clone().add(p.velocity)

    if (Math.abs(newPosition.x) > BOUNDARY) {
      newPosition.x = -Math.sign(newPosition.x) * BOUNDARY
    }
    if (Math.abs(newPosition.y) > BOUNDARY) {
      newPosition.y = -Math.sign(newPosition.y) * BOUNDARY
    }
    if (Math.abs(newPosition.z) > BOUNDARY) {
      newPosition.z = -Math.sign(newPosition.z) * BOUNDARY
    }

    p.position.copy(newPosition)

    const newHistory = [...p.history, p.position.clone()]
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }

    const speedForColor = p.velocity.length()
    let finalColor = getColorFromSpeed(speedForColor)

    if (effectSparkActive) {
      finalColor = effectSparkPhase === 0 ? sparkOrange.clone() : sparkRed.clone()
    } else if (p.isClickParticle) {
      const clickElapsed = currentTime - p.clickStartTime
      const clickFadeProgress = Math.min(clickElapsed / CLICK_PARTICLE_FADE_DURATION, 1)
      p.clickOpacity = 1 - clickFadeProgress
      if (p.clickOpacity > 0) {
        const baseColor = getColorFromSpeed(speedForColor)
        finalColor = p.clickColor.clone().lerp(baseColor, clickFadeProgress)
      }
    }

    let finalOpacity = p.opacity
    if (p.isClickParticle && p.clickOpacity > 0) {
      const targetOpacity = 0.6 + (p.clickOpacity * 0.4)
      finalOpacity = targetOpacity
    }
    if (effectOpacityMultiplier !== 1) {
      finalOpacity = Math.max(0.2, finalOpacity * effectOpacityMultiplier)
    }

    let finalSize = p.size
    if (effectSizeMultiplier !== 1) {
      finalSize = p.size * effectSizeMultiplier
    }

    updatedParticles.push({
      ...p,
      position: p.position.clone(),
      velocity: p.velocity.clone(),
      color: finalColor,
      opacity: finalOpacity,
      size: finalSize,
      history: newHistory,
    })
  }

  return {
    particles: updatedParticles,
    currentWindVector,
  }
}
