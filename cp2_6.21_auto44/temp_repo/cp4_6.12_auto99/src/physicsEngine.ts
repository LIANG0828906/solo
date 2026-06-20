import { PhysicsOutput } from './store'

export interface PhysicsParams {
  damping: number
  stiffness: number
  forceAmplitude: number
  forceFrequency: number
}

export interface PhysicsState {
  position: number
  velocity: number
}

const MASS = 1
const GRAVITY = 9.8

export function stepPhysics(
  params: PhysicsParams,
  state: PhysicsState,
  elapsedTime: number,
  dt: number
): PhysicsOutput {
  const { damping, stiffness, forceAmplitude, forceFrequency } = params
  const omega = 2 * Math.PI * forceFrequency

  const springForce = -stiffness * state.position
  const dampingForce = -damping * state.velocity
  const driveForce = forceAmplitude * Math.sin(omega * elapsedTime)
  const gravityForce = MASS * GRAVITY

  const totalForce = springForce + dampingForce + driveForce + gravityForce
  const acceleration = totalForce / MASS

  const newVelocity = state.velocity + acceleration * dt
  const newPosition = state.position + newVelocity * dt

  const kineticEnergy = 0.5 * MASS * newVelocity * newVelocity
  const potentialEnergy = 0.5 * stiffness * newPosition * newPosition

  return {
    position: newPosition,
    velocity: newVelocity,
    acceleration,
    kineticEnergy,
    potentialEnergy
  }
}
