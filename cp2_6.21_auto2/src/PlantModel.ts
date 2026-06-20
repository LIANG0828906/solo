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
  lightResponse: number
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
  thickness: number
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
  const cx = Math.max(0.001, Math.min(0.999, x))
  return 1 / (1 + Math.exp(-k * (cx - mid)))
}

const easeInOutQuad = (t: number): number => {
  const ct = Math.max(0, Math.min(1, t))
  return ct < 0.5 ? 2 * ct * ct : 1 - Math.pow(-2 * ct + 2, 2) / 2
}

const easeOutCubic = (t: number): number => {
  const ct = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - ct, 3)
}

const easeInCubic = (t: number): number => {
  const ct = Math.max(0, Math.min(1, t))
  return ct * ct * ct
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

const hslSetSaturation = (color: THREE.Color, satFactor: number): THREE.Color => {
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.s = clamp(hsl.s * satFactor, 0, 1)
  return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l)
}

const hslShiftLightness = (color: THREE.Color, lightShift: number): THREE.Color => {
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.l = clamp(hsl.l + lightShift, 0, 1)
  return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l)
}

const hslShiftHue = (color: THREE.Color, hueShift: number): THREE.Color => {
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

  const photoCenter = clamp(species.phototropismCenter ?? 0.35, 0.15, 0.65)
  const heatTol = clamp(species.heatTolerance ?? 0.6, 0.3, 0.95)

  const lightResponseRaw = sigmoid(lightNorm, 6.5, photoCenter)
  const lightResponse = easeOutCubic(lightResponseRaw)

  const leafOpenFactor = lightResponse

  const saturationBase = 0.35 + easeInOutQuad(lightResponseRaw) * 0.75
  const leafSaturation = saturationBase

  const colorShiftRaw = sigmoid(lightNorm, 5.5, photoCenter - 0.08)
  const leafColorShift = easeInOutQuad(colorShiftRaw)

  const stemCurveRaw = 1 - easeInOutQuad(waterNorm)
  const stemCurve = stemCurveRaw * 0.55

  const stemTintRaw = 1 - sigmoid(waterNorm, 6, 0.3)
  const stemColorTint = easeInOutQuad(stemTintRaw) * 0.6

  const stemThickness = 0.65 + easeInOutQuad(waterNorm) * 0.5

  const tempThreshold = 0.55 + (heatTol - 0.5) * 0.4
  const tempStressHigh = clamp((tempNorm - tempThreshold) / (1 - tempThreshold), 0, 1)
  const leafCurl = easeInCubic(tempStressHigh) * 0.5

  const lightFadeFactor = 1 - lightNorm
  const rawFade = tempStressHigh * 0.35 + lightFadeFactor * 0.25
  const combinedFade = 1 - (1 - tempStressHigh * 0.45) * (1 - lightFadeFactor * 0.3)
  const leafFade = easeInOutQuad(clamp(combinedFade, 0, 0.55))

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
    lightResponse,
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

    const spiralAngle = i * GOLDEN_ANGLE + (species.leaves.spiralOffset || 0) * Math.PI * 2
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

    const satFactor = morph.leafSaturation
    leafBase = hslSetSaturation(leafBase, satFactor)
    leafEdge = hslSetSaturation(leafEdge, satFactor * 1.05)

    const fadeTint = new THREE.Color(1.0, 0.96, 0.85)
    const fadeAmt = morph.leafFade
    leafBase = lerpColor(leafBase, fadeTint, fadeAmt * 0.55)
    leafEdge = lerpColor(leafEdge, fadeTint, fadeAmt * 0.75)

    if (species.id === 'cactus') {
      const darkTint = new THREE.Color(0.1, 0.1, 0.1)
      leafBase = lerpColor(leafBase, darkTint, 0.4)
      leafEdge = new THREE.Color(1, 1, 1)
    }

    if (species.id === 'maple') {
      leafBase = hslShiftHue(leafBase, -0.02)
      leafEdge = hslShiftHue(leafEdge, -0.01)
    }

    leaves.push({
      position: new THREE.Vector3(baseX, yPos, baseZ),
      rotation: new THREE.Euler(tiltX, finalAngle + Math.PI * 0.5, 0, 'ZYX'),
      scale: new THREE.Vector3(leafW, leafT * 2, leafL),
      baseColor: leafBase,
      edgeColor: leafEdge,
      curl: curlEffect,
      index: i,
      thickness: leafT,
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

    const innerColor = hslShiftLightness(petalCol, 0.1)
    const outerColor = hslShiftLightness(petalCol, -0.08)
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
  thickness: number,
  taperStrength: number = 1.0
): { geometry: THREE.BufferGeometry } => {
  const wSegs = 10
  const lSegs = 14
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const edgeFactors: number[] = []

  const halfLen = length * 0.5

  for (let li = 0; li <= lSegs; li++) {
    const lt = li / lSegs
    const z = -halfLen + lt * length
    const lengthTaper =
      0.15 + Math.sin(lt * Math.PI) * 0.75 + Math.pow(Math.sin(lt * Math.PI), 3) * 0.1
    const effectiveWidth = width * lengthTaper * taperStrength

    const tipFactor = Math.max(0, (lt - 0.6) / 0.4)
    const baseFactor = 1 - Math.max(0, (0.15 - lt) / 0.15) * 0.6
    const curlAmount = curl * Math.sin(lt * Math.PI) * 0.7 * tipFactor

    const edgeCurl = curl * 0.4 * tipFactor
    const midBend = curl * 0.15 * baseFactor

    for (let wi = 0; wi <= wSegs; wi++) {
      const wt = wi / wSegs
      const xNorm = wt * 2 - 1
      const x = xNorm * effectiveWidth * 0.5

      const yFromEdge = -Math.abs(xNorm) * edgeCurl * thickness * 20
      const yFromLength = -curlAmount * thickness * 22
      const yFromMid = -midBend * thickness * 8
      const y = yFromEdge + yFromLength + yFromMid

      positions.push(x, y, z)
      uvs.push(wt, 1 - lt)

      const edgeDist = Math.abs(wt - 0.5) * 2
      const tipDist = lt
      const edgeFactor = Math.max(edgeDist * 0.7, tipDist * 0.5)
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
  geo.setAttribute('aEdgeFactor', new THREE.Float32BufferAttribute(edgeFactors, 1))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return { geometry: geo }
}

export const applyLeafVertexColors = (
  geometry: THREE.BufferGeometry,
  baseColor: THREE.Color,
  edgeColor: THREE.Color
): void => {
  const posCount = geometry.getAttribute('position').count
  const colors = new Float32Array(posCount * 3)
  const uvAttr = geometry.getAttribute('uv')

  for (let i = 0; i < posCount; i++) {
    const u = uvAttr.getX(i)
    const v = uvAttr.getY(i)

    const edgeDist = Math.abs(u - 0.5) * 2
    const tipDist = 1 - v
    const t = Math.min(1, Math.max(edgeDist, tipDist * 0.7))

    colors[i * 3] = baseColor.r + (edgeColor.r - baseColor.r) * t
    colors[i * 3 + 1] = baseColor.g + (edgeColor.g - baseColor.g) * t
    colors[i * 3 + 2] = baseColor.b + (edgeColor.b - baseColor.b) * t
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
}

export { clamp, lerpColor, easeInOutQuad, easeOutCubic, easeInCubic, sigmoid }
