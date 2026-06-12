export interface WaveParticle {
  position: [number, number, number]
  color: [number, number, number]
  opacity: number
  size: number
}

export interface WaveParams {
  origin: [number, number, number]
  elapsed: number
  densityLayers: {
    sandstone: number
    mudstone: number
    granite: number
  }
  layerHeights: [number, number, number]
  maxRadius: number
}

const WAVE_BASE_SPEED = 2.0
const MAX_PARTICLES = 800

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [1, 0.2, 0.2]
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ]
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]
}

function getDensityAtHeight(
  y: number,
  layerHeights: [number, number, number],
  densities: { sandstone: number; mudstone: number; granite: number }
): number {
  const [h1, h2, h3] = layerHeights
  const totalBottom = -(h1 + h2 + h3) / 2
  if (y >= totalBottom + h1 + h2) {
    return densities.sandstone
  } else if (y >= totalBottom + h3) {
    return densities.mudstone
  } else {
    return densities.granite
  }
}

export function generateWaveParticles(params: WaveParams): WaveParticle[] {
  const { origin, elapsed, densityLayers, layerHeights, maxRadius } = params
  const particles: WaveParticle[] = []

  const colorStart = hexToRgb('#ff3333')
  const colorEnd = hexToRgb('#3366ff')

  const totalRadius = Math.min(WAVE_BASE_SPEED * elapsed, maxRadius)

  const shellCount = 3
  const shellThickness = 0.3

  for (let shell = 0; shell < shellCount; shell++) {
    const shellRadius = Math.max(0, totalRadius - shell * shellThickness)
    if (shellRadius <= 0) continue

    const particlesPerShell = Math.floor(MAX_PARTICLES / shellCount)
    const phiStep = Math.PI / Math.ceil(Math.sqrt(particlesPerShell))
    const thetaStep = 2 * Math.PI / Math.ceil(Math.sqrt(particlesPerShell))

    for (let phi = 0; phi < Math.PI; phi += phiStep) {
      for (let theta = 0; theta < 2 * Math.PI; theta += thetaStep) {
        const x = origin[0] + shellRadius * Math.sin(phi) * Math.cos(theta)
        const y = origin[1] + shellRadius * Math.cos(phi)
        const z = origin[2] + shellRadius * Math.sin(phi) * Math.sin(theta)

        const localDensity = getDensityAtHeight(y, layerHeights, densityLayers)
        const densityFactor = Math.min(localDensity / 3.0, 1.0)

        const adjustedRadius = shellRadius * (1 + densityFactor * 0.3)
        const ax = origin[0] + adjustedRadius * Math.sin(phi) * Math.cos(theta)
        const ay = origin[1] + adjustedRadius * Math.cos(phi)
        const az = origin[2] + adjustedRadius * Math.sin(phi) * Math.sin(theta)

        const radialProgress = Math.min(adjustedRadius / maxRadius, 1)
        const color = lerpColor(colorStart, colorEnd, radialProgress)

        const opacityBase = 0.6 * (1 - radialProgress)
        const shellOpacity = opacityBase * (1 - shell * 0.2)

        particles.push({
          position: [ax, ay, az],
          color,
          opacity: Math.max(0, Math.min(1, shellOpacity)),
          size: 0.08 + densityFactor * 0.04
        })

        if (particles.length >= MAX_PARTICLES) {
          return particles
        }
      }
    }
  }

  return particles
}

export function isWaveActive(elapsed: number, maxRadius: number): boolean {
  return WAVE_BASE_SPEED * elapsed < maxRadius * 1.5
}

export function getWaveIntensity(elapsed: number, maxRadius: number): number {
  const progress = (WAVE_BASE_SPEED * elapsed) / maxRadius
  return Math.max(0, 1 - progress)
}
