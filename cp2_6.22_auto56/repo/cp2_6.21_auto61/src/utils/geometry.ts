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

export function generateWoodTexture(
  width: number = 1024,
  height: number = 1024,
  baseColor: string = '#3e2723',
  darkColor: string = '#2c1810',
  lightColor: string = '#5d4037'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const base = new THREE.Color(baseColor)
  const dark = new THREE.Color(darkColor)
  const light = new THREE.Color(lightColor)

  const bgGrad = ctx.createRadialGradient(
    width * 0.5, height * 0.5, 0,
    width * 0.5, height * 0.5, width * 0.7
  )
  bgGrad.addColorStop(0, `rgb(${Math.floor(light.r * 255)}, ${Math.floor(light.g * 255)}, ${Math.floor(light.b * 255)})`)
  bgGrad.addColorStop(0.5, `rgb(${Math.floor(base.r * 255)}, ${Math.floor(base.g * 255)}, ${Math.floor(base.b * 255)})`)
  bgGrad.addColorStop(1, `rgb(${Math.floor(dark.r * 255)}, ${Math.floor(dark.g * 255)}, ${Math.floor(dark.b * 255)})`)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  const rings = 35
  const centerX = width * (0.45 + Math.random() * 0.1)
  const centerY = height * (0.4 + Math.random() * 0.2)
  const maxRadius = Math.sqrt(width * width + height * height) * 0.8

  function pseudoNoise(x: number, y: number, seed: number): number {
    const n = Math.sin(x * 0.01 + seed) * Math.cos(y * 0.015 + seed * 0.7)
            + Math.sin(x * 0.025 - y * 0.01 + seed * 1.3) * 0.5
            + Math.cos(x * 0.008 + y * 0.012 + seed * 2.1) * 0.3
    return (n + 1.8) / 3.6
  }

  for (let i = 0; i < rings; i++) {
    const t = i / rings
    const baseRadius = t * maxRadius * (0.6 + Math.random() * 0.8)
    const ringWidth = 3 + Math.random() * 12
    const irregularity = 15 + Math.random() * 35
    const segments = 120
    
    const ringColor = new THREE.Color()
    const ringType = Math.random()
    if (ringType < 0.35) {
      ringColor.copy(dark).lerp(base, 0.3 + Math.random() * 0.4)
    } else if (ringType < 0.7) {
      ringColor.copy(base).lerp(light, 0.2 + Math.random() * 0.5)
    } else {
      ringColor.copy(base)
    }
    ringColor.lerp(new THREE.Color(Math.random() * 0.05, Math.random() * 0.03, 0), 0.5)
    
    const alpha = 0.25 + Math.random() * 0.55

    ctx.beginPath()
    for (let s = 0; s <= segments; s++) {
      const angle = (s / segments) * Math.PI * 2
      const noiseScale = pseudoNoise(
        Math.cos(angle) * 100 + i * 50,
        Math.sin(angle) * 100 + i * 75,
        i * 3.7
      )
      const waveOffset = Math.sin(angle * (2 + i * 0.3) + i * 1.5) * irregularity * (0.3 + noiseScale * 0.7)
      const radius = baseRadius + waveOffset + (noiseScale - 0.5) * irregularity * 0.6

      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      if (s === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.strokeStyle = `rgba(${Math.floor(ringColor.r * 255)}, ${Math.floor(ringColor.g * 255)}, ${Math.floor(ringColor.b * 255)}, ${alpha})`
    ctx.lineWidth = ringWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  for (let k = 0; k < 8; k++) {
    const startX = Math.random() * width
    const startY = Math.random() * height
    const lineLen = 100 + Math.random() * 400
    const baseAngle = Math.random() * Math.PI * 2
    const curvature = (Math.random() - 0.5) * 2

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    let px = startX
    let py = startY
    for (let step = 0; step < lineLen; step += 5) {
      const t = step / lineLen
      const angleOffset = Math.sin(t * Math.PI * 3 + k) * curvature * 0.5
      const angle = baseAngle + angleOffset
      const noise = (Math.random() - 0.5) * 3
      px += Math.cos(angle) * 5 + noise
      py += Math.sin(angle) * 5 + noise * 0.5
      if (px > 0 && px < width && py > 0 && py < height) {
        ctx.lineTo(px, py)
      } else {
        break
      }
    }
    const lineColor = new THREE.Color().copy(dark).lerp(base, 0.2 + Math.random() * 0.5)
    ctx.strokeStyle = `rgba(${Math.floor(lineColor.r * 255)}, ${Math.floor(lineColor.g * 255)}, ${Math.floor(lineColor.b * 255)}, ${0.1 + Math.random() * 0.3})`
    ctx.lineWidth = 0.5 + Math.random() * 1.5
    ctx.stroke()
  }

  const grainCanvas = document.createElement('canvas')
  grainCanvas.width = width
  grainCanvas.height = height
  const grainCtx = grainCanvas.getContext('2d')!
  const grainImageData = grainCtx.createImageData(width, height)
  for (let i = 0; i < grainImageData.data.length; i += 4) {
    const x = (i / 4) % width
    const y = Math.floor(i / 4 / width)
    const noise = (pseudoNoise(x, y, 999) - 0.5) * 25
    grainImageData.data[i] = Math.max(0, Math.min(255, 128 + noise))
    grainImageData.data[i + 1] = Math.max(0, Math.min(255, 120 + noise * 0.9))
    grainImageData.data[i + 2] = Math.max(0, Math.min(255, 110 + noise * 0.8))
    grainImageData.data[i + 3] = 12
  }
  grainCtx.putImageData(grainImageData, 0, 0)
  ctx.globalAlpha = 0.3
  ctx.globalCompositeOperation = 'overlay'
  ctx.drawImage(grainCanvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  for (let i = 0; i < 15; i++) {
    const kx = Math.random() * width
    const ky = Math.random() * height
    const knotR = 3 + Math.random() * 12
    
    const knotGrad = ctx.createRadialGradient(kx, ky, 0, kx, ky, knotR)
    const knotColor = new THREE.Color().copy(dark).lerp(light, Math.random() * 0.3)
    knotGrad.addColorStop(0, `rgba(${Math.floor(knotColor.r * 255)}, ${Math.floor(knotColor.g * 255)}, ${Math.floor(knotColor.b * 255)}, 0.6)`)
    knotGrad.addColorStop(0.6, `rgba(${Math.floor(knotColor.r * 200)}, ${Math.floor(knotColor.g * 200)}, ${Math.floor(knotColor.b * 200)}, 0.3)`)
    knotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    
    ctx.fillStyle = knotGrad
    ctx.beginPath()
    ctx.ellipse(kx, ky, knotR, knotR * (0.6 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, width * 0.25,
    width / 2, height / 2, width * 0.75
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, `rgba(${Math.floor(dark.r * 128)}, ${Math.floor(dark.g * 128)}, ${Math.floor(dark.b * 128)}, 0.35)`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  texture.colorSpace = THREE.SRGBColorSpace

  return texture
}
