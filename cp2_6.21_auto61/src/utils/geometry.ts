import * as THREE from 'three'

export interface FragmentEdgeProfile {
  fragmentId: number
  leftEdgePoints: THREE.Vector3[]
  rightEdgePoints: THREE.Vector3[]
  heightSegments: number
}

export interface FragmentCollisionState {
  edgeProfiles: Map<number, FragmentEdgeProfile>
}

export const fragmentCollisionState: FragmentCollisionState = {
  edgeProfiles: new Map()
}

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

export function generateFragmentEdgeProfile(
  fragmentId: number,
  totalFragments: number,
  heightSegments: number = 8
): FragmentEdgeProfile {
  const angleStep = (Math.PI * 2) / totalFragments
  const startAngle = fragmentId * angleStep - Math.PI / 2
  const endAngle = startAngle + angleStep
  
  const leftEdgePoints: THREE.Vector3[] = []
  const rightEdgePoints: THREE.Vector3[] = []
  
  const seed = fragmentId * 7919 + 12345
  function pseudoRandom(step: number): number {
    const x = Math.sin(seed + step * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }
  
  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments
    const y = t * 3 - 1.5
    
    let r: number
    if (t < 0.15) {
      r = 0.3 + (0.4 - 0.3) * (t / 0.15)
    } else if (t < 0.35) {
      r = 0.4 + (0.9 - 0.4) * ((t - 0.15) / 0.2)
    } else if (t < 0.7) {
      r = 0.9 + (1.0 - 0.9) * ((t - 0.35) / 0.35)
    } else if (t < 0.9) {
      r = 1.0 + (0.6 - 1.0) * ((t - 0.7) / 0.2)
    } else {
      r = 0.6 + (0.35 - 0.6) * ((t - 0.9) / 0.1)
    }
    
    const jaggedOffsetL = (pseudoRandom(i * 2) - 0.5) * 0.15
    const jaggedOffsetR = (pseudoRandom(i * 2 + 1) - 0.5) * 0.15
    
    const leftX = Math.cos(startAngle) * (r + jaggedOffsetL)
    const leftZ = Math.sin(startAngle) * (r + jaggedOffsetL)
    leftEdgePoints.push(new THREE.Vector3(leftX, y, leftZ))
    
    const rightX = Math.cos(endAngle) * (r + jaggedOffsetR)
    const rightZ = Math.sin(endAngle) * (r + jaggedOffsetR)
    rightEdgePoints.push(new THREE.Vector3(rightX, y, rightZ))
  }
  
  const profile: FragmentEdgeProfile = {
    fragmentId,
    leftEdgePoints,
    rightEdgePoints,
    heightSegments
  }
  
  fragmentCollisionState.edgeProfiles.set(fragmentId, profile)
  return profile
}

export function transformEdgePoints(
  points: THREE.Vector3[],
  position: THREE.Vector3,
  rotation: THREE.Euler
): THREE.Vector3[] {
  const quaternion = new THREE.Quaternion().setFromEuler(rotation)
  return points.map(p => {
    const transformed = p.clone()
    transformed.applyQuaternion(quaternion)
    transformed.add(position)
    return transformed
  })
}

export function checkEdgeAlignment(
  fragment1Id: number,
  fragment1Pos: THREE.Vector3,
  fragment1Rot: THREE.Euler,
  fragment2Id: number,
  fragment2Pos: THREE.Vector3,
  fragment2Rot: THREE.Euler,
  edgeDistanceThreshold: number = 0.5
): boolean {
  const profile1 = fragmentCollisionState.edgeProfiles.get(fragment1Id)
  const profile2 = fragmentCollisionState.edgeProfiles.get(fragment2Id)
  
  if (!profile1 || !profile2) return false
  
  const expectedNeighbor = Math.abs(fragment1Id - fragment2Id) === 1 ||
                          Math.abs(fragment1Id - fragment2Id) === 9
  if (!expectedNeighbor) return false
  
  let leftPoints1 = profile1.leftEdgePoints
  let rightPoints1 = profile1.rightEdgePoints
  let leftPoints2 = profile2.leftEdgePoints
  let rightPoints2 = profile2.rightEdgePoints
  
  if (fragment1Id > fragment2Id && !(fragment1Id === 9 && fragment2Id === 0)) {
    [leftPoints1, rightPoints1] = [rightPoints1, leftPoints1]
    ;[leftPoints2, rightPoints2] = [rightPoints2, leftPoints2]
  }
  
  const transformedRight1 = transformEdgePoints(rightPoints1, fragment1Pos, fragment1Rot)
  const transformedLeft2 = transformEdgePoints(leftPoints2, fragment2Pos, fragment2Rot)
  
  let totalDistance = 0
  let matchedPoints = 0
  
  for (let i = 0; i < transformedRight1.length; i++) {
    const dist = transformedRight1[i].distanceTo(transformedLeft2[i])
    if (dist < edgeDistanceThreshold * 2) {
      totalDistance += dist
      matchedPoints++
    }
  }
  
  if (matchedPoints < transformedRight1.length * 0.6) return false
  
  const avgDistance = totalDistance / matchedPoints
  return avgDistance < edgeDistanceThreshold
}

export function checkSnapEligibility(
  currentPos: THREE.Vector3,
  currentRot: THREE.Euler,
  currentFragmentId: number,
  targetPos: THREE.Vector3,
  targetRot: THREE.Euler,
  allFragments: { id: number; initialPosition: THREE.Vector3; initialRotation: THREE.Euler; isFused: boolean }[],
  distanceThreshold: number = 1.2,
  angleThreshold: number = 15
): { eligible: boolean; edgeMatchScore: number } {
  const distance = distanceBetweenPositions(currentPos, targetPos)
  const angle = angleBetweenRotations(currentRot, targetRot)
  
  if (distance >= distanceThreshold || angle >= angleThreshold) {
    return { eligible: false, edgeMatchScore: 0 }
  }
  
  let edgeMatchScore = 0
  const unfused = allFragments.filter(f => f.id !== currentFragmentId && !f.isFused)
  const fused = allFragments.filter(f => f.id !== currentFragmentId && f.isFused)
  
  const neighborsToCheck = [...fused, ...unfused.slice(0, 2)]
  
  for (const neighbor of neighborsToCheck) {
    if (checkEdgeAlignment(
      currentFragmentId,
      currentPos,
      currentRot,
      neighbor.id,
      neighbor.initialPosition,
      neighbor.initialRotation,
      0.6
    )) {
      edgeMatchScore += neighbor.isFused ? 2 : 1
    }
  }
  
  const positionAndAngleOk = distance < distanceThreshold * 0.8 && angle < angleThreshold * 0.7
  const eligible = (edgeMatchScore > 0) || positionAndAngleOk
  
  return { eligible, edgeMatchScore }
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

export function calculateProgress(
  fusedCount: number,
  totalFragments: number,
  fuseSequence: number[],
  fragments: { id: number; correctOrder: number }[]
): number {
  const countProgress = (fusedCount / totalFragments) * 100
  const perfectScore = calculatePerfectScore(fuseSequence, fragments)
  const qualityMultiplier = 0.6 + (perfectScore / 100) * 0.4
  return Math.min(100, Math.round(countProgress * qualityMultiplier))
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
