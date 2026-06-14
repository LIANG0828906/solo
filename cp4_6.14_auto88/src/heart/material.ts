import * as THREE from 'three'

const REST_COLOR_VENTRICLE = new THREE.Color('#b91c1c')
const REST_COLOR_ATRIUM = new THREE.Color('#ef4444')
const ACTIVATED_COLOR = new THREE.Color('#fcd34d')
const TRANSITION_DURATION = 0.3
const DECAY_DURATION = 0.5

export interface HeartMaterials {
  rightAtrium: THREE.MeshStandardMaterial
  leftAtrium: THREE.MeshStandardMaterial
  rightVentricle: THREE.MeshStandardMaterial
  leftVentricle: THREE.MeshStandardMaterial
  valve: THREE.MeshStandardMaterial
}

export function createHeartMaterials(): HeartMaterials {
  const createChamberMaterial = (baseColor: THREE.Color) => {
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })
  }

  return {
    rightAtrium: createChamberMaterial(REST_COLOR_ATRIUM),
    leftAtrium: createChamberMaterial(REST_COLOR_ATRIUM),
    rightVentricle: createChamberMaterial(REST_COLOR_VENTRICLE),
    leftVentricle: createChamberMaterial(REST_COLOR_VENTRICLE),
    valve: new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.5,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    }),
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export function updateMaterialColor(
  material: THREE.MeshStandardMaterial,
  baseColor: THREE.Color,
  activationValue: number,
  timeSinceActivation: number
): void {
  let transitionProgress: number
  
  if (activationValue > 0 && timeSinceActivation < TRANSITION_DURATION) {
    transitionProgress = easeInOut(timeSinceActivation / TRANSITION_DURATION)
  } else if (activationValue <= 0 && timeSinceActivation < DECAY_DURATION) {
    transitionProgress = 1 - (timeSinceActivation / DECAY_DURATION)
    transitionProgress = Math.max(0, transitionProgress)
  } else {
    transitionProgress = activationValue > 0 ? 1 : 0
  }

  const r = baseColor.r + (ACTIVATED_COLOR.r - baseColor.r) * transitionProgress
  const g = baseColor.g + (ACTIVATED_COLOR.g - baseColor.g) * transitionProgress
  const b = baseColor.b + (ACTIVATED_COLOR.b - baseColor.b) * transitionProgress

  material.color.setRGB(r, g, b)
}

export function updateAllMaterials(
  materials: HeartMaterials,
  activationArray: Float32Array,
  activationTimestamps: number[],
  currentTime: number
): void {
  const chamberSegments = 10
  
  const getChamberActivation = (startIdx: number): { maxValue: number; latestTime: number } => {
    let maxValue = 0
    let latestTime = 0
    for (let i = 0; i < chamberSegments; i++) {
      const idx = startIdx + i
      if (activationArray[idx] > maxValue) {
        maxValue = activationArray[idx]
      }
      const timeSince = currentTime - activationTimestamps[idx]
      if (timeSince > latestTime && activationArray[idx] > 0) {
        latestTime = timeSince
      }
    }
    return { maxValue, latestTime }
  }

  const ra = getChamberActivation(0)
  updateMaterialColor(materials.rightAtrium, REST_COLOR_ATRIUM, ra.maxValue, ra.latestTime)

  const la = getChamberActivation(10)
  updateMaterialColor(materials.leftAtrium, REST_COLOR_ATRIUM, la.maxValue, la.latestTime)

  const rv = getChamberActivation(20)
  updateMaterialColor(materials.rightVentricle, REST_COLOR_VENTRICLE, rv.maxValue, rv.latestTime)

  const lv = getChamberActivation(30)
  updateMaterialColor(materials.leftVentricle, REST_COLOR_VENTRICLE, lv.maxValue, lv.latestTime)
}
