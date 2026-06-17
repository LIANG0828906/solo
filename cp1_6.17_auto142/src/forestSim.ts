export interface EnvironmentParams {
  light: number
  humidity: number
  temperature: number
}

export interface Particle {
  x: number
  y: number
  z: number
  size: number
  color: string
}

export interface TreeParticle {
  id: number
  baseX: number
  baseZ: number
  particles: Particle[]
  trunkColor: string
  leafColor: string
}

export interface WeatherParticle {
  x: number
  y: number
  z: number
  size: number
  speed: number
  opacity: number
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('').toUpperCase()
}

export const getTreeColor = (temperature: number): string => {
  const t = Math.max(-10, Math.min(40, temperature))
  let h: number, s: number, l: number

  if (t < 5) {
    const progress = (t + 10) / 15
    h = lerp(0.72, 0.68, progress)
    s = lerp(0.7, 0.65, progress)
    l = lerp(0.6, 0.65, progress)
  } else if (t < 25) {
    const progress = (t - 5) / 20
    h = lerp(0.44, 0.40, progress)
    s = lerp(0.7, 0.8, progress)
    l = lerp(0.55, 0.58, progress)
  } else {
    const progress = (t - 25) / 15
    h = lerp(0.0, 0.05, progress)
    s = lerp(0.7, 0.8, progress)
    l = lerp(0.55, 0.6, progress)
  }

  const [r, g, b] = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

export const getBranchAngle = (light: number, humidity: number): number => {
  const baseAngle = 25
  const lightEffect = (light / 100) * 20
  const humidityEffect = (humidity / 100) * 15
  return baseAngle + lightEffect - humidityEffect * 0.5
}

export const getBranchDepth = (light: number, humidity: number): number => {
  const baseDepth = 4
  const lightBonus = Math.floor(light / 35)
  const humidityBonus = Math.floor(humidity / 30)
  return Math.min(7, baseDepth + lightBonus + humidityBonus)
}

export const getGrowthSpeed = (light: number, humidity: number, temperature: number): number => {
  const lightScore = light / 100
  const humidityScore = humidity / 100
  const tempScore = temperature >= 10 && temperature <= 30
    ? 1 - Math.abs(temperature - 20) / 20
    : 0.3
  return (lightScore * 0.4 + humidityScore * 0.3 + tempScore * 0.3)
}

export const generateTree = (
  id: number,
  baseX: number,
  baseZ: number,
  env: EnvironmentParams,
  existingParticles: number,
  maxParticles: number = 10000
): TreeParticle => {
  const { light, humidity, temperature } = env
  const branchDepth = getBranchDepth(light, humidity)
  const branchAngle = getBranchAngle(light, humidity)
  const growthSpeed = getGrowthSpeed(light, humidity, temperature)
  const leafColor = getTreeColor(temperature)
  const trunkColor = '#5D4E37'

  const particles: Particle[] = []
  const maxTreeParticles = Math.max(50, Math.min(200, Math.floor((maxParticles - existingParticles) / 100)))

  const addBranch = (
    x: number,
    y: number,
    z: number,
    angle: number,
    length: number,
    depth: number,
    isTrunk: boolean = false
  ) => {
    if (depth <= 0 || particles.length >= maxTreeParticles) return

    const segments = Math.ceil(length / 0.5)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const px = x + Math.sin(angle * Math.PI / 180) * length * t
      const py = y + length * t * 0.9
      const pz = z + Math.cos(angle * Math.PI / 180) * length * t * 0.3
      const size = isTrunk ? 2.5 - depth * 0.2 : 2 - depth * 0.15
      const color = isTrunk ? trunkColor : (depth <= 2 ? leafColor : trunkColor)

      particles.push({
        x: px,
        y: py,
        z: pz,
        size: Math.max(1, size),
        color,
      })
    }

    if (depth > 1) {
      const newLength = length * (0.6 + growthSpeed * 0.15)
      const newDepth = depth - 1

      addBranch(
        x + Math.sin(angle * Math.PI / 180) * length,
        y + length * 0.9,
        z + Math.cos(angle * Math.PI / 180) * length * 0.3,
        angle + branchAngle,
        newLength,
        newDepth
      )
      addBranch(
        x + Math.sin(angle * Math.PI / 180) * length,
        y + length * 0.9,
        z + Math.cos(angle * Math.PI / 180) * length * 0.3,
        angle - branchAngle,
        newLength,
        newDepth
      )
      if (depth > 3 && humidity > 40) {
        addBranch(
          x + Math.sin(angle * Math.PI / 180) * length,
          y + length * 0.9,
          z + Math.cos(angle * Math.PI / 180) * length * 0.3,
          angle + branchAngle * 0.5 + (Math.random() - 0.5) * 20,
          newLength * 0.8,
          newDepth - 1
        )
      }
    }
  }

  const trunkLength = 4 + growthSpeed * 3 + (Math.random() - 0.5) * 2
  addBranch(baseX, 0, baseZ, 90 + (Math.random() - 0.5) * 10, trunkLength, branchDepth, true)

  return {
    id,
    baseX,
    baseZ,
    particles,
    trunkColor,
    leafColor,
  }
}

export const generateForest = (
  env: EnvironmentParams,
  treeCount: number = 50,
  maxParticles: number = 10000
): TreeParticle[] => {
  const trees: TreeParticle[] = []
  let totalParticles = 0
  const spacing = 100 / Math.sqrt(treeCount)

  for (let i = 0; i < treeCount && totalParticles < maxParticles; i++) {
    const gridX = (i % Math.floor(Math.sqrt(treeCount))) * spacing + spacing / 2
    const gridZ = Math.floor(i / Math.floor(Math.sqrt(treeCount))) * spacing + spacing / 2
    const baseX = gridX - 50 + (Math.random() - 0.5) * spacing * 0.6
    const baseZ = gridZ - 50 + (Math.random() - 0.5) * spacing * 0.6

    const tree = generateTree(i, baseX, baseZ, env, totalParticles, maxParticles)
    trees.push(tree)
    totalParticles += tree.particles.length
  }

  return trees
}

export const generateWeatherParticles = (
  humidity: number,
  count?: number
): WeatherParticle[] => {
  const particleCount = count ?? Math.floor(50 + (humidity / 100) * 150)
  const particles: WeatherParticle[] = []

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 120,
      y: 20 + Math.random() * 40,
      z: (Math.random() - 0.5) * 120,
      size: 1 + Math.random() * 2,
      speed: 0.1 + Math.random() * 0.4,
      opacity: 0.3,
    })
  }

  return particles
}

export const updateWeatherParticles = (
  particles: WeatherParticle[],
  delta: number
): WeatherParticle[] => {
  return particles.map(p => {
    let newY = p.y - p.speed * delta * 60
    if (newY < 0.5) {
      newY = 30 + Math.random() * 30
      return {
        ...p,
        y: newY,
        x: (Math.random() - 0.5) * 120,
        z: (Math.random() - 0.5) * 120,
      }
    }
    return { ...p, y: newY }
  })
}

export const interpolateTreeColors = (
  trees: TreeParticle[],
  targetTemp: number,
  progress: number
): TreeParticle[] => {
  const targetColor = getTreeColor(targetTemp)
  return trees.map(tree => {
    const newLeafColor = interpolateColor(tree.leafColor, targetColor, progress)
    return {
      ...tree,
      leafColor: newLeafColor,
      particles: tree.particles.map(p => ({
        ...p,
        color: p.color !== tree.trunkColor ? newLeafColor : p.color,
      })),
    }
  })
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

const interpolateColor = (color1: string, color2: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(color1)
  const [r2, g2, b2] = hexToRgb(color2)
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t))
}
