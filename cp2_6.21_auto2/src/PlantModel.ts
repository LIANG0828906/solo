import * as THREE from 'three'
import type { PlantSpecies } from './PlantData'
import type { EnvironmentParams, GrowthStage } from './store'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export interface MorphologyParams {
  stemHeight: number
  stemCurve: number
  stemColorTint: number
  leafOpenFactor: number
  leafColorShift: number
  leafSaturation: number
  leafCurl: number
  leafFade: number
  animationSpeed: number
  leafCount: number
  flowerBloom: number
  stemThickness: number
}

export interface LeafMorph {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  baseColor: THREE.Color
  edgeColor: THREE.Color
  curl: number
  index: number
}

export interface StemSegment {
  y: number
  radius: number
  color: THREE.Color
  curveX: number
  curveZ: number
}

export interface PetalMorph {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  color: THREE.Color
  index: number
}

const sigmoid = (x: number, k: number = 5, mid: number = 0.5): number => {
  return 1 / (1 + Math.exp(-k * (x - mid)))
}

const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3)
}

const easeInCubic = (t: number): number => {
  return t * t * t
}

const clamp = (v: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, v))
}

const lerpColor = (a: THREE.Color, b: THREE.Color, t: number): THREE.Color => {
  return new THREE.Color().lerpColors(a, b, clamp(t, 0, 1))
}

const rgbToColor = (rgb: [number, number, number]): THREE.Color => {
  return new THREE.Color(rgb[0], rgb[1], rgb[2])
}

const hsvShiftSaturation = (color: THREE.Color, satFactor: number): THREE.Color => {
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.s = clamp(hsl.s * satFactor, 0, 1)
  return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l)
}

const hsvShiftValue = (color: THREE.Color, valShift: number): THREE.Color => {
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.l = clamp(hsl.l + valShift, 0, 1)
  return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l)
}

const hsvShiftHue = (color: THREE.Color, hueShift: number): THREE.Color => {
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.h = (hsl.h + hueShift + 1) % 1
  return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l)
}

export const computeMorphology = (
  species: PlantSpecies,
  env: EnvironmentParams,
  growthProgress: number,
  stage: GrowthStage
): MorphologyParams => {
  const lightNorm = clamp(env.light / 100, 0, 1)
  const waterNorm = clamp(env.water / 100, 0, 1)
  const tempNorm = clamp((env.temperature - 10) / 30, 0, 1)

  const leafOpenFactorRaw = sigmoid(lightNorm, 6, 0.35)
  const leafOpenFactor = easeOutCubic(leafOpenFactorRaw)

  const colorShiftRaw = sigmoid(lightNorm, 5, 0.25)
  const leafColorShift = easeInOutQuad(colorShiftRaw)

  const satSigmoid = sigmoid(lightNorm, 4.5, 0.4)
  const leafSaturation = 0.35 + easeInOutQuad(satSigmoid) * 0.75

  const stemCurveRaw = 1 - easeInOutQuad(waterNorm)
  const stemCurve = stemCurveRaw * 0.55

  const stemTintRaw = 1 - sigmoid(waterNorm, 6, 0.3)
  const stemColorTint = easeInOutQuad(stemTintRaw) * 0.6

  const stemThickness = 0.65 + easeInOutQuad(waterNorm) * 0.5

  const tempMid = 0.5
  const tempDist = Math.abs(tempNorm - tempMid) * 2
  const tempStressHigh = clamp((tempNorm - 0.6) / 0.4, 0, 1)
  const leafCurl = easeInCubic(tempStressHigh) * 0.45
  const leafFade = easeInOutQuad(tempStressHigh) * 0.3

  const speedBase = 0.35
  const speedPeak = 1.0
  const tempSpeed =
    tempNorm < 0.5
      ? speedBase + easeInOutQuad(tempNorm * 2) * (speedPeak - speedBase)
      : speedPeak - easeInOutQuad((tempNorm - 0.5) * 2) * (speedPeak - 0.45)
  const animationSpeed = tempSpeed

  const gp = clamp(growthProgress, 0, 1)
  const stageProgress = easeInOutQuad(gp)

  let leafCount = species.leaves.count
  if (stage === 'seedling') leafCount = Math.max(3, Math.round(species.leaves.count * 0.25))
  else if (stage === 'growing') leafCount = Math.round(species.leaves.count * 0.6)
  else if (stage === 'mature') leafCount = Math.round(species.leaves.count * 0.9)

  const flowerBloom = stage === 'flowering' ? 1 : stage === 'mature' ? 0.15 : 0

  const heightScale = 0.25 + stageProgress * 0.8 + stageProgress * stageProgress * 0.2

  return {
    stemHeight: species.baseHeight * heightScale,
    stemCurve,
    stemColorTint,
    leafOpenFactor,
    leafColorShift,
    leafSaturation,
    leafCurl,
    leafFade,
    animationSpeed,
    leafCount,
    flowerBloom,
    stemThickness,
  }
}

export const generateStemSegments = (
  species: PlantSpecies,
  morph: MorphologyParams
): StemSegment[] => {
  const segments: StemSegment[] = []
  const segCount = species.stem.segments + 4
  const baseCol = rgbToColor(species.stem.baseColor)
  const topCol = rgbToColor(species.stem.topColor)
  const browntint = new THREE.Color(0.45, 0.3, 0.15)

  for (let i = 0; i <= segCount; i++) {
    const t = i / segCount
    const height = t * morph.stemHeight

    const curveIntensity = Math.sin(t * Math.PI)
    const angle = t * Math.PI * 1.6
    const curveX = Math.cos(angle) * morph.stemCurve * curveIntensity * height * 0.25
    const curveZ = Math.sin(angle) * morph.stemCurve * curveIntensity * height * 0.25

    const radiusLerp = 1 - easeInOutQuad(t)
    const baseR = species.stem.baseRadius * morph.stemThickness
    const topR = species.stem.topRadius * morph.stemThickness
    const radius = topR + (baseR - topR) * radiusLerp

    let col = lerpColor(baseCol, topCol, easeInOutQuad(t))
    const tintAmount = morph.stemColorTint * (1 - t * 0.5)
    col = lerpColor(col, browntint, tintAmount)

    segments.push({ y: height, radius, color: col, curveX, curveZ })
  }
  return segments
}

export const generateLeafMorphs = (
  species: PlantSpecies,
  morph: MorphologyParams,
  stemSegments: StemSegment[]
): LeafMorph[] => {
  const leaves: LeafMorph[] = []
  const totalLeaves = morph.leafCount
  const stemHeight = morph.stemHeight

  const minY = stemHeight * 0.08
  const maxY = stemHeight * (species.id === 'cactus' ? 0.95 : 0.88)

  for (let i = 0; i < totalLeaves; i++) {
    const rawT = totalLeaves === 1 ? 0.5 : i / (totalLeaves - 1)
    const verticalT = easeInOutQuad(rawT)
    const yPos = minY + (maxY - minY) * verticalT

    const spiralAngle = i * GOLDEN_ANGLE + species.leaves.spiralOffset * Math.PI * 2
    const heightPhase = yPos / stemHeight
    const additionalTwist = heightPhase * Math.PI * 0.8
    const finalAngle = spiralAngle + additionalTwist

    const segIndex = Math.min(
      stemSegments.length - 1,
      Math.floor((yPos / stemHeight) * (stemSegments.length - 1))
    )
    const seg = stemSegments[Math.max(0, Math.min(segIndex, stemSegments.length - 1))]

    const radialOffset = seg.radius * 0.3
    const baseX = seg.curveX + Math.cos(finalAngle) * radialOffset
    const baseZ = seg.curveZ + Math.sin(finalAngle) * radialOffset

    const verticalFactor = easeOutCubic(verticalT)
    const lightOpenAmount = morph.leafOpenFactor

    const minAngle = species.id === 'cactus'
      ? 0.8 - lightOpenAmount * 0.5
      : species.leaves.baseAngle - 0.55 + lightOpenAmount * 0.25
    const maxAngle = species.id === 'cactus'
      ? 1.5
      : species.leaves.baseAngle + 0.45 + lightOpenAmount * 0.55

    const baseOpen = minAngle + (maxAngle - minAngle) * easeOutCubic(verticalFactor)
    const droopFactor = (1 - lightOpenAmount) * (0.7 - verticalFactor * 0.4)
    const tiltX = baseOpen - droopFactor

    const curlEffect = morph.leafCurl * (0.4 + verticalFactor * 0.6)

    const sizeScale = 0.5 + easeInOutQuad(1 - Math.abs(verticalT - 0.55) * 1.8)
    const lightSizeBoost = 0.7 + lightOpenAmount * 0.5
    const leafW = species.leaves.width * sizeScale * lightSizeBoost
    const leafL = species.leaves.length * sizeScale * lightSizeBoost
    const leafT = species.leaves.thickness * (0.8 + sizeScale * 0.4)

    let leafBase = rgbToColor(species.leaves.baseColor)
    let leafEdge = rgbToColor(species.leaves.edgeColor)

    const yellowTint = new THREE.Color(0.85, 0.78, 0.25)
    const shiftAmount = (1 - morph.leafColorShift) * 0.75
    leafBase = lerpColor(leafBase, yellowTint, shiftAmount * 0.55)
    leafEdge = lerpColor(leafEdge, yellowTint, shiftAmount * 0.4)

    leafBase = hsvShiftSaturation(leafBase, morph.leafSaturation)
    leafEdge = hsvShiftSaturation(leafEdge, morph.leafSaturation * 1.05)

    const fadeTint = new THREE.Color(1.0, 0.95, 0.8)
    leafBase = lerpColor(leafBase, fadeTint, morph.leafFade * 0.6)
    leafEdge = lerpColor(leafEdge, fadeTint, morph.leafFade * 0.8)

    if (species.id === 'cactus') {
      const tint = new THREE.Color(0.1, 0.1, 0.1)
      leafBase = lerpColor(leafBase, tint, 0.4)
      leafEdge = rgbToColor([1, 1, 1])
    }

    if (species.id === 'maple') {
      const cool = (1 - (morph.leafCurl > 0 ? 0 : 0)) * 1
      leafBase = hsvShiftHue(leafBase, -0.02 * cool)
      leafEdge = hsvShiftHue(leafEdge, -0.01 * cool)
    }

    leaves.push({
      position: new THREE.Vector3(baseX, yPos, baseZ),
      rotation: new THREE.Euler(tiltX, finalAngle + Math.PI * 0.5, 0, 'ZYX'),
      scale: new THREE.Vector3(leafW, leafT * 2, leafL),
      baseColor: leafBase,
      edgeColor: leafEdge,
      curl: curlEffect,
      index: i,
    })
  }
  return leaves
}

export const generatePetalMorphs = (
  species: PlantSpecies,
  morph: MorphologyParams,
  stemSegments: StemSegment[]
): PetalMorph[] => {
  const petals: PetalMorph[] = []
  if (!species.flower.hasFlower) return petals

  const top = stemSegments[stemSegments.length - 1]
  const baseY = top.y + 0.05
  const center = new THREE.Vector3(top.curveX, baseY, top.curveZ)

  const bloom = easeOutCubic(morph.flowerBloom)
  const petalCount = species.flower.petalCount
  const size = species.flower.size * (0.5 + bloom * 0.7)
  const petalCol = rgbToColor(species.flower.petalColor)

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2
    const openTilt = (1 - bloom) * 1.2 + 0.25
    const length = size * (0.7 + bloom * 0.5)
    const width = size * 0.32 * (0.6 + bloom * 0.6)
    const thickness = 0.015 + bloom * 0.015

    const radial = top.radius * 0.25 + size * 0.15 * bloom
    const x = center.x + Math.cos(angle) * radial
    const z = center.z + Math.sin(angle) * radial
    const y = center.y + size * 0.15 * (1 - bloom * 0.3)

    const innerColor = hsvShiftValue(petalCol, 0.1)
    const outerColor = hsvShiftValue(petalCol, -0.08)
    const color = lerpColor(innerColor, outerColor, i % 2 === 0 ? 0.3 : 0.6)

    petals.push({
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(openTilt, angle + Math.PI * 0.5, 0, 'ZYX'),
      scale: new THREE.Vector3(width, thickness, length),
      color,
      index: i,
    })
  }
  return petals
}

export const getFlowerCenter = (
  species: PlantSpecies,
  stemSegments: StemSegment[],
  morph: MorphologyParams
): { position: THREE.Vector3; color: THREE.Color; radius: number } => {
  const top = stemSegments[stemSegments.length - 1]
  const col = rgbToColor(species.flower.centerColor)
  const bloom = easeOutCubic(morph.flowerBloom)
  return {
    position: new THREE.Vector3(top.curveX, top.y + 0.02, top.curveZ),
    color: col,
    radius: species.flower.size * 0.22 * (0.5 + bloom * 0.7),
  }
}

export const createStemGeometry = (segments: StemSegment[]): THREE.BufferGeometry => {
  const radialSegs = 12
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const t = i / (segments.length - 1)
    for (let r = 0; r < radialSegs; r++) {
      const a = (r / radialSegs) * Math.PI * 2
      const nx = Math.cos(a)
      const nz = Math.sin(a)
      const x = seg.curveX + nx * seg.radius
      const z = seg.curveZ + nz * seg.radius
      const y = seg.y
      positions.push(x, y, z)
      normals.push(nx, 0, nz)
      colors.push(seg.color.r, seg.color.g, seg.color.b)
      uvs.push(r / radialSegs, t)
    }
  }

  for (let i = 0; i < segments.length - 1; i++) {
    for (let r = 0; r < radialSegs; r++) {
      const a = i * radialSegs + r
      const b = i * radialSegs + ((r + 1) % radialSegs)
      const c = (i + 1) * radialSegs + r
      const d = (i + 1) * radialSegs + ((r + 1) % radialSegs)
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export const createCurvedLeafGeometry = (
  width: number,
  length: number,
  curl: number,
  thickness: number
): { geometry: THREE.BufferGeometry; edgeColorFactor: Float32Array } => {
  const wSegs = 6
  const lSegs = 10
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const edgeFactors: number[] = []

  for (let li = 0; li <= lSegs; li++) {
    const lt = li / lSegs
    for (let wi = 0; wi <= wSegs; wi++) {
      const wt = wi / wSegs
      const x = (wt - 0.5) * width
      const zNorm = lt * 2 - 1
      const halfLen = length * 0.5

      const widthTaper =
        0.15 + Math.sin(lt * Math.PI) * 0.75 + Math.pow(Math.sin(lt * Math.PI), 3) * 0.1
      const finalX = x * widthTaper

      const curlAmount = Math.sin(lt * Math.PI) * curl * 0.5
      const y = -curlAmount * (0.5 + Math.abs(wt - 0.5)) * thickness * 18
      const z = -halfLen + lt * length

      positions.push(finalX, y, z)
      uvs.push(wt, 1 - lt)

      const edgeDist = Math.abs(wt - 0.5) * 2
      const tipDist = lt
      const edgeFactor = Math.max(edgeDist, tipDist * 0.5)
      edgeFactors.push(edgeFactor)
    }
  }

  for (let li = 0; li < lSegs; li++) {
    for (let wi = 0; wi < wSegs; wi++) {
      const a = li * (wSegs + 1) + wi
      const b = a + 1
      const c = a + wSegs + 1
      const d = c + 1
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return {
    geometry: geo,
    edgeColorFactor: new Float32Array(edgeFactors),
  }
}

export { clamp, lerpColor, easeInOutQuad, easeOutCubic, easeInCubic, sigmoid }
