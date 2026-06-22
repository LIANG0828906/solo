import * as THREE from 'three'

export type FieldType = 'gravity' | 'vortex'

export interface FieldParams {
  gravity: { strength: number }
  vortex: { speed: number; strength: number }
}

export const defaultParams: FieldParams = {
  gravity: { strength: 5 },
  vortex: { speed: 2, strength: 3 }
}

export function getVector(
  point: THREE.Vector3,
  fieldType: FieldType,
  params: FieldParams
): THREE.Vector3 {
  switch (fieldType) {
    case 'gravity':
      return new THREE.Vector3(0, -params.gravity.strength, 0)
    case 'vortex': {
      const { speed, strength } = params.vortex
      const x = point.x
      const z = point.z
      const r = Math.sqrt(x * x + z * z) + 0.001
      const tangentX = -z / r
      const tangentZ = x / r
      const vy = -point.y * strength * 0.1
      return new THREE.Vector3(
        tangentX * speed,
        vy,
        tangentZ * speed
      )
    }
    default:
      return new THREE.Vector3()
  }
}

export function getFieldMagnitude(
  point: THREE.Vector3,
  fieldType: FieldType,
  params: FieldParams
): number {
  return getVector(point, fieldType, params).length()
}
