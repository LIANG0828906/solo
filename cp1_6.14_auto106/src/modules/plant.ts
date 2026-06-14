import * as THREE from 'three'
import type { PlantType, GrowthStage, EnvironmentParams, HealthMetrics, PlantTypeConfig } from '@/types'
import { PLANT_CONFIGS, GROWTH_STAGES } from '@/types'
import { clamp, lerp, calculateFitness } from '@/utils/helpers'

export interface PlantInstance {
  id: string
  type: PlantType
  group: THREE.Group
  position: THREE.Vector3
  stage: GrowthStage
  growthProgress: number
  targetScale: number
  currentScale: number
  health: HealthMetrics
  config: PlantTypeConfig
  accumulated: EnvironmentParams
  parts: {
    stem?: THREE.Mesh
    leaves: THREE.Mesh[]
    flowers?: THREE.Mesh[]
    fruits?: THREE.Mesh[]
    seed?: THREE.Mesh
  }
  leafDropParticles: THREE.Points | null
}

export function createPlantMesh(type: PlantType): PlantInstance {
  const config = PLANT_CONFIGS[type]
  const group = new THREE.Group()
  const parts: PlantInstance['parts'] = {
    leaves: []
  }

  const seedGeo = new THREE.SphereGeometry(0.1, 16, 16)
  const seedMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.2
  })
  const seed = new THREE.Mesh(seedGeo, seedMat)
  seed.position.y = 0.1
  seed.castShadow = true
  group.add(seed)
  parts.seed = seed

  const stemGeo = new THREE.CylinderGeometry(0.05, 0.08, 1.5, 8)
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x4a7c59,
    roughness: 0.9
  })
  const stem = new THREE.Mesh(stemGeo, stemMat)
  stem.position.y = 0.75
  stem.castShadow = true
  stem.visible = false
  group.add(stem)
  parts.stem = stem

  const leafCount = type === 'succulent' ? 8 : type === 'fruit' ? 6 : 5
  for (let i = 0; i < leafCount; i++) {
    const leafGeo = createLeafGeometry(type)
    const leafMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.color),
      side: THREE.DoubleSide,
      roughness: 0.8,
      transparent: true,
      opacity: 0.9
    })
    const leaf = new THREE.Mesh(leafGeo, leafMat)
    leaf.castShadow = true
    leaf.visible = false

    const angle = (i / leafCount) * Math.PI * 2
    const height = type === 'succulent' ? 0.2 + i * 0.08 : 0.5 + Math.random() * 0.5
    const radius = type === 'succulent' ? 0.15 : 0.3 + Math.random() * 0.2

    leaf.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    )
    leaf.rotation.set(
      Math.PI / 4 + Math.random() * 0.3,
      angle + Math.random() * 0.5,
      Math.random() * 0.2 - 0.1
    )

    group.add(leaf)
    parts.leaves.push(leaf)
  }

  if (type === 'flower' || type === 'fruit') {
    parts.flowers = []
    const flowerCount = type === 'flower' ? 5 : 3
    const flowerColor = type === 'flower' ? 0xff69b4 : 0xff6347

    for (let i = 0; i < flowerCount; i++) {
      const flowerGeo = new THREE.ConeGeometry(0.15, 0.3, 6)
      const flowerMat = new THREE.MeshStandardMaterial({
        color: flowerColor,
        roughness: 0.6,
        emissive: flowerColor,
        emissiveIntensity: 0.2
      })
      const flower = new THREE.Mesh(flowerGeo, flowerMat)
      flower.visible = false

      const angle = (i / flowerCount) * Math.PI * 2
      const height = 1.2 + Math.random() * 0.3
      const radius = 0.2 + Math.random() * 0.2

      flower.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )
      flower.rotation.x = Math.PI

      group.add(flower)
      parts.flowers.push(flower)
    }
  }

  if (type === 'fruit') {
    parts.fruits = []
    const fruitCount = 4

    for (let i = 0; i < fruitCount; i++) {
      const fruitGeo = new THREE.SphereGeometry(0.15, 16, 16)
      const fruitMat = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        roughness: 0.5,
        metalness: 0.1
      })
      const fruit = new THREE.Mesh(fruitGeo, fruitMat)
      fruit.visible = false

      const angle = (i / fruitCount) * Math.PI * 2 + Math.PI / 4
      const height = 0.8 + Math.random() * 0.5
      const radius = 0.3 + Math.random() * 0.2

      fruit.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )

      group.add(fruit)
      parts.fruits.push(fruit)
    }
  }

  group.scale.setScalar(0.1)

  return {
    id: '',
    type,
    group,
    position: group.position.clone(),
    stage: 'seed',
    growthProgress: 0,
    targetScale: 1,
    currentScale: 0.1,
    health: {
      light: 80,
      water: 80,
      temperature: 80,
      nutrients: 80,
      pests: 90
    },
    config,
    accumulated: {
      light: 0,
      water: 0,
      temperature: 0,
      nutrients: 0
    },
    parts,
    leafDropParticles: null
  }
}

function createLeafGeometry(type: PlantType): THREE.BufferGeometry {
  if (type === 'succulent') {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.quadraticCurveTo(0.15, 0.2, 0, 0.5)
    shape.quadraticCurveTo(-0.15, 0.2, 0, 0)
    return new THREE.ShapeGeometry(shape)
  } else if (type === 'fruit') {
    return new THREE.PlaneGeometry(0.4, 0.25)
  } else {
    return new THREE.PlaneGeometry(0.35, 0.2)
  }
}

export function updatePlantGrowth(
  plant: PlantInstance,
  envParams: EnvironmentParams,
  deltaTime: number
): { stageChanged: boolean; newStage: GrowthStage | null; healthChanged: boolean } {
  const lightFitness = calculateFitness(envParams.light, plant.config.optimalLight)
  const waterFitness = calculateFitness(envParams.water, plant.config.optimalWater)
  const tempFitness = calculateFitness(envParams.temperature, plant.config.optimalTemperature)
  const nutrientFitness = calculateFitness(envParams.nutrients, plant.config.optimalNutrients)

  const overallFitness = (lightFitness + waterFitness + tempFitness + nutrientFitness) / 4

  const growthRate = plant.config.baseGrowthRate * overallFitness * deltaTime * 0.5

  plant.accumulated.light += envParams.light * deltaTime * 0.1
  plant.accumulated.water += envParams.water * deltaTime * 0.1
  plant.accumulated.temperature += envParams.temperature * deltaTime * 0.1
  plant.accumulated.nutrients += envParams.nutrients * deltaTime * 0.1

  const oldProgress = plant.growthProgress
  plant.growthProgress = clamp(plant.growthProgress + growthRate, 0, 100)

  const newHealth: HealthMetrics = {
    light: Math.round(lightFitness * 100),
    water: Math.round(waterFitness * 100),
    temperature: Math.round(tempFitness * 100),
    nutrients: Math.round(nutrientFitness * 100),
    pests: clamp(90 - (1 - overallFitness) * 30, 20, 100)
  }

  const healthChanged =
    Math.abs(newHealth.light - plant.health.light) > 1 ||
    Math.abs(newHealth.water - plant.health.water) > 1 ||
    Math.abs(newHealth.temperature - plant.health.temperature) > 1 ||
    Math.abs(newHealth.nutrients - plant.health.nutrients) > 1

  plant.health = newHealth

  const currentStageIndex = GROWTH_STAGES.indexOf(plant.stage)
  let newStageIndex = currentStageIndex

  if (plant.growthProgress >= 80 && currentStageIndex < 4) {
    newStageIndex = 4
  } else if (plant.growthProgress >= 55 && currentStageIndex < 3) {
    newStageIndex = 3
  } else if (plant.growthProgress >= 25 && currentStageIndex < 2) {
    newStageIndex = 2
  } else if (plant.growthProgress >= 8 && currentStageIndex < 1) {
    newStageIndex = 1
  }

  const stageChanged = newStageIndex !== currentStageIndex
  const newStage = stageChanged ? GROWTH_STAGES[newStageIndex] : null
  if (stageChanged && newStage) {
    plant.stage = newStage
  }

  updatePlantAppearance(plant, deltaTime)

  return { stageChanged, newStage, healthChanged }
}

export function updatePlantAppearance(plant: PlantInstance, deltaTime: number) {
  const stageIndex = GROWTH_STAGES.indexOf(plant.stage)
  const progress = plant.growthProgress

  let targetScale = 0.1
  if (progress > 0) {
    targetScale = Math.min(1, 0.1 + progress / 100 * 0.9)
  }

  plant.currentScale = lerp(plant.currentScale, targetScale, deltaTime * 2)
  plant.group.scale.setScalar(plant.currentScale)

  if (plant.parts.seed) {
    plant.parts.seed.visible = stageIndex <= 1
  }

  if (plant.parts.stem) {
    plant.parts.stem.visible = stageIndex >= 1
    if (stageIndex >= 1) {
      const stemProgress = Math.min(1, (progress - 8) / 47)
      const targetHeight = lerp(0.3, 1.5, stemProgress)
      plant.parts.stem.scale.y = lerp(plant.parts.stem.scale.y, targetHeight / 1.5, deltaTime * 2)
      plant.parts.stem.position.y = lerp(plant.parts.stem.position.y, targetHeight / 2, deltaTime * 2)
    }
  }

  plant.parts.leaves.forEach((leaf, i) => {
    const leafStartProgress = 10 + i * 3
    if (progress >= leafStartProgress && stageIndex >= 1) {
      leaf.visible = true
      const leafProgress = Math.min(1, (progress - leafStartProgress) / 30)
      const targetScale = 0.3 + leafProgress * 0.7
      leaf.scale.setScalar(lerp(leaf.scale.x, targetScale, deltaTime * 3))
    }
  })

  if (plant.parts.flowers) {
    plant.parts.flowers.forEach((flower, i) => {
      const flowerStartProgress = 70 + i * 2
      if (progress >= flowerStartProgress && stageIndex >= 3) {
        flower.visible = true
        const flowerProgress = Math.min(1, (progress - flowerStartProgress) / 20)
        const targetScale = 0.5 + flowerProgress * 0.5
        flower.scale.setScalar(lerp(flower.scale.x, targetScale, deltaTime * 2))
      }
    })
  }

  if (plant.parts.fruits) {
    plant.parts.fruits.forEach((fruit, i) => {
      const fruitStartProgress = 75 + i * 3
      if (progress >= fruitStartProgress && stageIndex >= 3) {
        fruit.visible = true
        const fruitProgress = Math.min(1, (progress - fruitStartProgress) / 15)
        const targetScale = 0.4 + fruitProgress * 0.6
        fruit.scale.setScalar(lerp(fruit.scale.x, targetScale, deltaTime * 2))
      }
    })
  }

  const healthFactor = plant.health.light + plant.health.water + plant.health.temperature + plant.health.nutrients
  const avgHealth = healthFactor / 400

  const dimFactor = 0.5 + avgHealth * 0.5

  plant.parts.leaves.forEach(leaf => {
    const mat = leaf.material as THREE.MeshStandardMaterial
    if (mat.color) {
      const baseColor = new THREE.Color(plant.config.color)
      mat.color.copy(baseColor).multiplyScalar(dimFactor)
    }
  })
}

export function getPlantHealth(plant: PlantInstance): HealthMetrics {
  return { ...plant.health }
}
