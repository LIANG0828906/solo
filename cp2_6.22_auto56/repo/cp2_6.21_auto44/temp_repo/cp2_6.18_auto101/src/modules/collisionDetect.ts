import * as THREE from 'three'
import { Pipe, CollisionPair } from '../store/pipeStore'

const SAFETY_MARGIN = 0.5

const closestPointsBetweenSegments = (
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  p4: THREE.Vector3
): { pointA: THREE.Vector3; pointB: THREE.Vector3; distance: number } => {
  const d1 = new THREE.Vector3().subVectors(p2, p1)
  const d2 = new THREE.Vector3().subVectors(p4, p3)
  const r = new THREE.Vector3().subVectors(p1, p3)

  const a = d1.dot(d1)
  const e = d2.dot(d2)
  const f = d2.dot(r)

  let s: number, t: number

  if (a <= 1e-10 && e <= 1e-10) {
    return {
      pointA: p1.clone(),
      pointB: p3.clone(),
      distance: p1.distanceTo(p3)
    }
  }

  if (a <= 1e-10) {
    s = 0
    t = Math.max(0, Math.min(1, f / e))
  } else {
    const c = d1.dot(r)

    if (e <= 1e-10) {
      t = 0
      s = Math.max(0, Math.min(1, -c / a))
    } else {
      const b = d1.dot(d2)
      const denom = a * e - b * b

      if (denom !== 0) {
        s = Math.max(0, Math.min(1, (b * f - c * e) / denom))
      } else {
        s = 0
      }

      t = (b * s + f) / e

      if (t < 0) {
        t = 0
        s = Math.max(0, Math.min(1, -c / a))
      } else if (t > 1) {
        t = 1
        s = Math.max(0, Math.min(1, (b - c) / a))
      }
    }
  }

  const pointA = new THREE.Vector3().addVectors(p1, d1.multiplyScalar(s))
  const pointB = new THREE.Vector3().addVectors(p3, d2.multiplyScalar(t))
  const distance = pointA.distanceTo(pointB)

  return { pointA, pointB, distance }
}

export const detectCollisions = (pipes: Pipe[]): CollisionPair[] => {
  const collisions: CollisionPair[] = []

  for (let i = 0; i < pipes.length; i++) {
    for (let j = i + 1; j < pipes.length; j++) {
      const pipeA = pipes[i]
      const pipeB = pipes[j]

      const { pointA, pointB, distance } = closestPointsBetweenSegments(
        pipeA.start,
        pipeA.end,
        pipeB.start,
        pipeB.end
      )

      const minAllowedDistance = pipeA.radius + pipeB.radius + SAFETY_MARGIN

      if (distance < minAllowedDistance) {
        const closestPoint = new THREE.Vector3()
          .addVectors(pointA, pointB)
          .multiplyScalar(0.5)

        collisions.push({
          pipeA,
          pipeB,
          closestPoint,
          minDistance: distance
        })
      }
    }
  }

  return collisions
}
