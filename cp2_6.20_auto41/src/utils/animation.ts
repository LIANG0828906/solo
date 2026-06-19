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
