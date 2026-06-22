
export type NoiseType = 'perlin' | 'simplex' | 'worley'

export interface NoiseParams {
  type: NoiseType
  width: number
  height: number
  seed: number
  frequency: number
  octaves: number
}

class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff
    return (this.seed >>> 0) / 0xffffffff
  }
}

class PerlinNoise {
  private permutation: number[]

  constructor(seed: number) {
    const rng = new SeededRandom(seed)
    this.permutation = []
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1))
      ;[this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]]
    }
    for (let i = 0; i < 256; i++) {
      this.permutation[i + 256] = this.permutation[i]
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = this.fade(x)
    const v = this.fade(y)
    const A = this.permutation[X] + Y
    const B = this.permutation[X + 1] + Y
    return this.lerp(
      this.lerp(this.grad(this.permutation[A], x, y), this.grad(this.permutation[B], x - 1, y), u),
      this.lerp(this.grad(this.permutation[A + 1], x, y - 1), this.grad(this.permutation[B + 1], x - 1, y - 1), u),
      v
    )
  }
}

class SimplexNoise {
  private perm: number[]
  private grad3: number[][]

  constructor(seed: number) {
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ]
    const rng = new SeededRandom(seed)
    this.perm = []
    const p: number[] = []
    for (let i = 0; i < 256; i++) {
      p[i] = i
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255]
    }
  }

  private dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y
  }

  noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1)
    const G2 = (3 - Math.sqrt(3)) / 6

    const s = (xin + yin) * F2
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const t = (i + j) * G2
    const X0 = i - t
    const Y0 = j - t
    const x0 = xin - X0
    const y0 = yin - Y0

    let i1: number, j1: number
    if (x0 > y0) {
      i1 = 1; j1 = 0
    } else {
      i1 = 0; j1 = 1
    }

    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2

    const ii = i & 255
    const jj = j & 255
    const gi0 = this.perm[ii + this.perm[jj]] % 12
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12
    const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12

    let n0: number, n1: number, n2: number
    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 < 0) n0 = 0
    else {
      t0 *= t0
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0)
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 < 0) n1 = 0
    else {
      t1 *= t1
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1)
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 < 0) n2 = 0
    else {
      t2 *= t2
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2)
    }
    return 70 * (n0 + n1 + n2)
  }
}

class WorleyNoise {
  private points: { x: number; y: number }[]
  private gridSize: number

  constructor(seed: number, gridSize: number = 8) {
    this.gridSize = gridSize
    const rng = new SeededRandom(seed)
    this.points = []
    for (let gx = -1; gx <= gridSize; gx++) {
      for (let gy = -1; gy <= gridSize; gy++) {
        this.points.push({
          x: gx + rng.next(),
          y: gy + rng.next()
        })
      }
    }
  }

  noise2D(x: number, y: number): number {
    const gx = Math.floor(x)
    const gy = Math.floor(y)
    const fx = x - gx
    const fy = y - gy

    let minDist = Infinity
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const point of this.points) {
          const px = point.x + (gx + dx)
          const py = point.y + (gy + dy)
          const distX = px - x
          const distY = py - y
          const dist = Math.sqrt(distX * distX + distY * distY)
          if (dist < minDist) {
            minDist = dist
          }
        }
      }
    }
    return 1 - Math.min(1, minDist * this.gridSize * 0.5)
  }
}

export function generateNoise(params: NoiseParams): Float32Array {
  const { type, width, height, seed, frequency, octaves } = params
  const result = new Float32Array(width * height)
  let min = Infinity
  let max = -Infinity

  let noise: { noise2D(x: number, y: number): number }

  switch (type) {
    case 'perlin':
      noise = new PerlinNoise(seed)
      break
    case 'simplex':
      noise = new SimplexNoise(seed)
      break
    case 'worley':
      noise = new WorleyNoise(seed)
      break
    default:
      noise = new PerlinNoise(seed)
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0
      let amplitude = 1
      let freq = frequency
      let maxValue = 0

      for (let o = 0; o < octaves; o++) {
        value += noise.noise2D(x * freq, y * freq) * amplitude
        maxValue += amplitude
        amplitude *= 0.5
        freq *= 2
      }

      value /= maxValue
      if (value < min) min = value
      if (value > max) max = value
      result[y * width + x] = value
    }
  }

  const range = max - min || 1
  for (let i = 0; i < result.length; i++) {
    result[i] = (result[i] - min) / range
  }

  return result
}
