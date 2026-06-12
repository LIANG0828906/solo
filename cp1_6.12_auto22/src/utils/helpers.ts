import { v4 as uuidv4 } from 'uuid'
import type { DeviceType } from '@/types'

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function distance3D(
  a: [number, number, number],
  b: [number, number, number]
): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function getDeviceType(): DeviceType {
  const width = window.innerWidth

  if (width >= 1024) {
    return 'desktop'
  } else if (width >= 768) {
    return 'tablet'
  } else {
    return 'mobile'
  }
}

export function generateUserId(): string {
  return uuidv4()
}
