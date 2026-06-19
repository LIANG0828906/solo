const PERM = new Uint8Array(512)
;(function initPerm() {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]
})()

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

export function perlinNoise3D(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const Z = Math.floor(z) & 255
  x -= Math.floor(x)
  y -= Math.floor(y)
  z -= Math.floor(z)
  const u = fade(x)
  const v = fade(y)
  const w = fade(z)
  const A = PERM[X] + Y
  const AA = PERM[A] + Z
  const AB = PERM[A + 1] + Z
  const B = PERM[X + 1] + Y
  const BA = PERM[B] + Z
  const BB = PERM[B + 1] + Z
  return (
    lerp(
      lerp(
        lerp(grad(PERM[AA], x, y, z), grad(PERM[BA], x - 1, y, z), u),
        lerp(grad(PERM[AB], x, y - 1, z), grad(PERM[BB], x - 1, y - 1, z), u),
        v
      ),
      lerp(
        lerp(grad(PERM[AA + 1], x, y, z - 1), grad(PERM[BA + 1], x - 1, y, z - 1), u),
        lerp(grad(PERM[AB + 1], x, y - 1, z - 1), grad(PERM[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    )
  )
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export class ValueAnimator {
  private startValue: number
  private endValue: number
  private currentValue: number
  private duration: number
  private elapsed: number
  private isAnimating: boolean
  private easing: (t: number) => number

  constructor(initialValue: number, duration: number = 2000, easing?: (t: number) => number) {
    this.startValue = initialValue
    this.endValue = initialValue
    this.currentValue = initialValue
    this.duration = duration
    this.elapsed = 0
    this.isAnimating = false
    this.easing = easing || easeInOutCubic
  }

  animateTo(targetValue: number): void {
    this.startValue = this.currentValue
    this.endValue = targetValue
    this.elapsed = 0
    this.isAnimating = true
  }

  update(deltaTime: number): number {
    if (!this.isAnimating) {
      return this.currentValue
    }

    this.elapsed += deltaTime * 1000
    const progress = clamp(this.elapsed / this.duration, 0, 1)
    const easedProgress = this.easing(progress)

    this.currentValue = lerp(this.startValue, this.endValue, easedProgress)

    if (progress >= 1) {
      this.isAnimating = false
      this.currentValue = this.endValue
    }

    return this.currentValue
  }

  getValue(): number {
    return this.currentValue
  }

  isActive(): boolean {
    return this.isAnimating
  }

  setDuration(duration: number): void {
    this.duration = duration
  }
}

export class Vector3Animator {
  private x: ValueAnimator
  private y: ValueAnimator
  private z: ValueAnimator

  constructor(initialX: number, initialY: number, initialZ: number, duration: number = 2000) {
    this.x = new ValueAnimator(initialX, duration)
    this.y = new ValueAnimator(initialY, duration)
    this.z = new ValueAnimator(initialZ, duration)
  }

  animateTo(x: number, y: number, z: number): void {
    this.x.animateTo(x)
    this.y.animateTo(y)
    this.z.animateTo(z)
  }

  update(deltaTime: number): { x: number; y: number; z: number } {
    return {
      x: this.x.update(deltaTime),
      y: this.y.update(deltaTime),
      z: this.z.update(deltaTime),
    }
  }

  getValue(): { x: number; y: number; z: number } {
    return {
      x: this.x.getValue(),
      y: this.y.getValue(),
      z: this.z.getValue(),
    }
  }

  isActive(): boolean {
    return this.x.isActive() || this.y.isActive() || this.z.isActive()
  }
}
