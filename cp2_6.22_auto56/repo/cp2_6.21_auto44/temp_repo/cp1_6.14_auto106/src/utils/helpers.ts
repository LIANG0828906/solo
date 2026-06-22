export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

export function getHealthColor(value: number, optimal: [number, number]): string {
  const [min, max] = optimal
  if (value < min * 0.5) return '#ef4444'
  if (value < min) return '#f97316'
  if (value <= max) return '#22c55e'
  if (value <= max * 1.2) return '#f97316'
  return '#ef4444'
}

export function getHealthStatus(value: number, optimal: [number, number]): 'low' | 'good' | 'high' {
  const [min, max] = optimal
  if (value < min) return 'low'
  if (value > max) return 'high'
  return 'good'
}

export function calculateFitness(value: number, optimal: [number, number]): number {
  const [min, max] = optimal
  const mid = (min + max) / 2

  if (value >= min && value <= max) {
    const distanceToMid = Math.abs(value - mid)
    const halfRange = (max - min) / 2
    return 1 - (distanceToMid / halfRange) * 0.3
  }

  if (value < min) {
    const diff = min - value
    return Math.max(0, 1 - (diff / min) * 1.5)
  }

  const diff = value - max
  return Math.max(0, 1 - (diff / (100 - max)) * 1.5)
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}
