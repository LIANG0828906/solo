import * as THREE from 'three'

export function angleBetweenRotations(
  rot1: THREE.Euler,
  rot2: THREE.Euler
): number {
  const q1 = new THREE.Quaternion().setFromEuler(rot1)
  const q2 = new THREE.Quaternion().setFromEuler(rot2)
  
  const dot = Math.min(1, Math.abs(q1.dot(q2)))
  const angleRad = 2 * Math.acos(dot)
  
  return THREE.MathUtils.radToDeg(angleRad)
}

export function distanceBetweenPositions(
  pos1: THREE.Vector3,
  pos2: THREE.Vector3
): number {
  return pos1.distanceTo(pos2)
}

export function checkSnapEligibility(
  currentPos: THREE.Vector3,
  currentRot: THREE.Euler,
  targetPos: THREE.Vector3,
  targetRot: THREE.Euler,
  distanceThreshold: number = 1.2,
  angleThreshold: number = 15
): boolean {
  const distance = distanceBetweenPositions(currentPos, targetPos)
  const angle = angleBetweenRotations(currentRot, targetRot)
  
  return distance < distanceThreshold && angle < angleThreshold
}

export function lerpTowardsTarget(
  currentPos: THREE.Vector3,
  currentRot: THREE.Euler,
  targetPos: THREE.Vector3,
  targetRot: THREE.Euler,
  alpha: number = 0.15
): { position: THREE.Vector3; rotation: THREE.Euler } {
  const newPos = currentPos.clone().lerp(targetPos, alpha)
  
  const qCurrent = new THREE.Quaternion().setFromEuler(currentRot)
  const qTarget = new THREE.Quaternion().setFromEuler(targetRot)
  const qNew = qCurrent.slerp(qTarget, alpha)
  const newRot = new THREE.Euler().setFromQuaternion(qNew)
  
  return { position: newPos, rotation: newRot }
}

export function calculatePerfectScore(
  fuseSequence: number[],
  fragments: { id: number; correctOrder: number }[]
): number {
  if (fuseSequence.length === 0) return 0
  
  let correctCount = 0
  const sortedByOrder = [...fragments].sort((a, b) => a.correctOrder - b.correctOrder)
  const correctSequence = sortedByOrder.map(f => f.id)
  
  for (let i = 0; i < fuseSequence.length; i++) {
    if (fuseSequence[i] === correctSequence[i]) {
      correctCount++
    }
  }
  
  return Math.round((correctCount / fuseSequence.length) * 100)
}

export function generateRandomEdgeSeed(fragmentId: number): number {
  return (fragmentId * 7919 + 12345) % 100000
}

export function getNearestFragments(
  currentPos: THREE.Vector3,
  fragments: { id: number; correctPosition: THREE.Vector3; isFused: boolean }[],
  limit: number = 3
): { id: number; distance: number }[] {
  return fragments
    .filter(f => !f.isFused)
    .map(f => ({
      id: f.id,
      distance: distanceBetweenPositions(currentPos, f.correctPosition)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
}
