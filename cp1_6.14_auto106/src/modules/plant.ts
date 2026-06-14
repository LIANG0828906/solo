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
    branches: THREE.Mesh[]
    leaves: THREE.Mesh[]
    petals: THREE.Mesh[]
    flowers?: THREE.Mesh[]
    fruits?: THREE.Mesh[]
    seed?: THREE.Mesh
  }
  privateState: {
    branchTargets: { mesh: THREE.Mesh; targetLength: number; targetRadius: number }[]
    leafTargets: { mesh: THREE.Mesh; targetScale: THREE.Vector3; targetRot: THREE.Euler; startProgress: number }[]
    petalTargets: { mesh: THREE.Mesh; targetRotY: number; startProgress: number }[]
    fruitTargets: { mesh: THREE.Mesh; targetScale: number; startProgress: number }[]
    stemTarget: { height: number; radius: number } | null
  }
  leafDropParticles: THREE.Points | null
}

const BRANCH_CONFIGS: Record<PlantType, { levels: number; angles: number[]; count: number[] }> = {
  fruit: {
    levels: 3,
    angles: [0.87, 1.05, 0.9],
    count: [4, 3, 2]
  },
  flower: {
    levels: 2,
    angles: [0.44, 0.35],
    count: [3, 2]
  },
  succulent: {
    levels: 0,
    angles: [],
    count: []
  }
}

function createBranchGeometry(length: number, radius: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius * 0.6, radius, length, 6)
  geo.translate(0, length / 2, 0)
  return geo
}

function createSucculentLeafGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.18, 12, 8)
  geo.scale(1, 1.6, 0.7)
  return geo
}

function createStandardLeafGeometry(type: PlantType): THREE.BufferGeometry {
  if (type === 'fruit') {
    return new THREE.PlaneGeometry(0.45, 0.28)
  } else {
    return new THREE.PlaneGeometry(0.38, 0.22)
  }
}

function createPetalGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.quadraticCurveTo(0.12, 0.15, 0, 0.35)
  shape.quadraticCurveTo(-0.12, 0.15, 0, 0)
  return new THREE.ShapeGeometry(shape)
}

export function createPlantMesh(type: PlantType): PlantInstance {
  const config = PLANT_CONFIGS[type]
  const group = new THREE.Group()
  const parts: PlantInstance['parts'] = {
    branches: [],
    leaves: [],
    petals: []
  }
  const privateState: PlantInstance['privateState'] = {
    branchTargets: [],
    leafTargets: [],
    petalTargets: [],
    fruitTargets: [],
    stemTarget: null
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

  const stemRadius = type === 'fruit' ? 0.1 : type === 'flower' ? 0.06 : 0.08
  const stemHeight = type === 'fruit' ? 1.8 : type === 'flower' ? 1.2 : 0.6
  const stemGeo = new THREE.CylinderGeometry(stemRadius * 0.7, stemRadius, stemHeight, 8)
  const stemMat = new THREE.MeshStandardMaterial({
    color: type === 'fruit' ? 0x5d4037 : 0x4a7c59,
    roughness: 0.9
  })
  const stem = new THREE.Mesh(stemGeo, stemMat)
  stem.position.y = stemHeight / 2
  stem.castShadow = true
  stem.visible = false
  stem.scale.setScalar(0.01)
  group.add(stem)
  parts.stem = stem
  privateState.stemTarget = { height: stemHeight, radius: stemRadius }

  const branchConfig = BRANCH_CONFIGS[type]
  if (branchConfig.levels > 0) {
    let parentPositions: THREE.Vector3[] = [stem.position.clone().add(new THREE.Vector3(0, stemHeight * 0.85, 0))]
    let parentDirections: THREE.Vector3[] = [new THREE.Vector3(0, 1, 0)]
    let parentLengths: number[] = [stemHeight * 0.5]

    for (let level = 0; level < branchConfig.levels; level++) {
      const newPositions: THREE.Vector3[] = []
      const newDirections: THREE.Vector3[] = []
      const newLengths: number[] = []
      const branchCount = branchConfig.count[level]
      const angle = branchConfig.angles[level]
      const baseLength = (type === 'fruit' ? 0.6 : 0.4) * Math.pow(0.65, level)
      const baseRadius = (type === 'fruit' ? 0.05 : 0.03) * Math.pow(0.7, level)

      for (let pIdx = 0; pIdx < parentPositions.length; pIdx++) {
        const parentPos = parentPositions[pIdx]
        const parentDir = parentDirections[pIdx]
        const parentLen = parentLengths[pIdx]

        for (let b = 0; b < branchCount; b++) {
          const branchLength = baseLength * (0.7 + Math.random() * 0.6)
          const branchRadius = baseRadius * (0.8 + Math.random() * 0.4)
          const branchGeo = createBranchGeometry(branchLength, branchRadius)
          const branchMat = new THREE.MeshStandardMaterial({
            color: type === 'fruit' ? 0x6d4c41 : 0x558b6e,
            roughness: 0.9
          })
          const branch = new THREE.Mesh(branchGeo, branchMat)
          branch.castShadow = true
          branch.visible = false
          branch.scale.setScalar(0.01)

          const horizAngle = (b / branchCount) * Math.PI * 2 + Math.random() * 0.5 + level * 0.3
          const tiltAngle = angle * (0.8 + Math.random() * 0.4)

          const basePos = parentPos.clone()
            .add(parentDir.clone().multiplyScalar(parentLen * (0.5 + (level === 0 ? 0.3 : 0.2))))

          branch.position.copy(basePos)

          const dir = new THREE.Vector3(
            Math.sin(tiltAngle) * Math.cos(horizAngle),
            Math.cos(tiltAngle),
            Math.sin(tiltAngle) * Math.sin(horizAngle)
          ).normalize()

          const quat = new THREE.Quaternion()
          quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
          branch.setRotationFromQuaternion(quat)

          group.add(branch)
          parts.branches.push(branch)
          privateState.branchTargets.push({
            mesh: branch,
            targetLength: branchLength,
            targetRadius: branchRadius
          })

          const endPos = basePos.clone().add(dir.clone().multiplyScalar(branchLength))
          newPositions.push(endPos)
          newDirections.push(dir)
          newLengths.push(branchLength)
        }
      }
      parentPositions = newPositions
      parentDirections = newDirections
      parentLengths = newLengths
    }
  }

  const addLeaf = (pos: THREE.Vector3, rot: THREE.Euler, type: PlantType, idx: number, total: number) => {
    const isSucculent = type === 'succulent'
    const leafGeo = isSucculent ? createSucculentLeafGeometry() : createStandardLeafGeometry(type)
    const leafMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.color),
      side: THREE.DoubleSide,
      roughness: isSucculent ? 0.7 : 0.8,
      transparent: true,
      opacity: 0.92
    })
    const leaf = new THREE.Mesh(leafGeo, leafMat)
    leaf.castShadow = true
    leaf.visible = false
    leaf.scale.setScalar(0.001)

    leaf.position.copy(pos)
    const initialRot = new THREE.Euler(
      rot.x + (isSucculent ? 0 : 1.2),
      rot.y,
      rot.z + (isSucculent ? 0 : 0.4)
    )
    leaf.rotation.copy(initialRot)

    const targetScale = isSucculent
      ? new THREE.Vector3(1, 1, 1)
      : new THREE.Vector3(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 1)
    const targetRot = rot.clone()

    const startProgress = 12 + (idx / total) * 25

    group.add(leaf)
    parts.leaves.push(leaf)
    privateState.leafTargets.push({ mesh: leaf, targetScale, targetRot, startProgress })
  }

  const leafCount = type === 'succulent' ? 12 : type === 'fruit' ? 10 : 7
  if (type === 'succulent') {
    for (let i = 0; i < leafCount; i++) {
      const ring = Math.floor(i / 4)
      const inRing = i % 4
      const ringAngle = (inRing / 4) * Math.PI * 2 + ring * 0.4
      const height = 0.1 + ring * 0.12
      const radius = 0.08 + ring * 0.05
      const pos = new THREE.Vector3(
        Math.cos(ringAngle) * radius,
        height,
        Math.sin(ringAngle) * radius
      )
      const tilt = 0.6 - ring * 0.1
      const rot = new THREE.Euler(
        tilt,
        ringAngle + Math.PI / 2,
        0
      )
      addLeaf(pos, rot, type, i, leafCount)
    }
  } else if (parts.branches.length > 0) {
    const leavesPerBranch = Math.ceil(leafCount / parts.branches.length)
    let leafIdx = 0
    for (let b = 0; b < parts.branches.length && leafIdx < leafCount; b++) {
      const branch = parts.branches[b]
      const bt = privateState.branchTargets[b]
      for (let l = 0; l < leavesPerBranch && leafIdx < leafCount; l++) {
        const t = 0.3 + (l / leavesPerBranch) * 0.6
        const offsetDir = new THREE.Vector3(0, 1, 0).applyQuaternion(branch.quaternion)
        const pos = branch.position.clone().add(offsetDir.clone().multiplyScalar(bt.targetLength * t))
        const sideAngle = (l % 2 === 0 ? 1 : -1) * (0.5 + Math.random() * 0.3)
        const rot = new THREE.Euler(
          0.3 + Math.random() * 0.3,
          branch.rotation.y + sideAngle,
          (l % 2 === 0 ? 1 : -1) * (0.2 + Math.random() * 0.2)
        )
        addLeaf(pos, rot, type, leafIdx, leafCount)
        leafIdx++
      }
    }
  } else {
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2
      const height = 0.4 + (i / leafCount) * 0.5
      const radius = 0.25 + Math.random() * 0.15
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )
      const rot = new THREE.Euler(
        Math.PI / 4 + Math.random() * 0.3,
        angle,
        Math.random() * 0.3 - 0.15
      )
      addLeaf(pos, rot, type, i, leafCount)
    }
  }

  if (type === 'flower' || type === 'fruit') {
    const bloomColors: Record<PlantType, number> = {
      flower: 0xff69b4,
      fruit: 0xff6347,
      succulent: 0xffffff
    }
    const flowerBloomColor = bloomColors[type]
    const flowerCenterColor = type === 'flower' ? 0xffd700 : 0xff8c00
    const bloomCount = type === 'flower' ? 4 : 2

    parts.flowers = []

    const bloomPositions: THREE.Vector3[] = []
    if (parts.branches.length > 0) {
      const step = Math.floor(parts.branches.length / bloomCount)
      for (let i = 0; i < bloomCount; i++) {
        const bIdx = Math.min((i + 1) * step - 1, parts.branches.length - 1)
        const branch = parts.branches[bIdx]
        const bt = privateState.branchTargets[bIdx]
        const tipDir = new THREE.Vector3(0, 1, 0).applyQuaternion(branch.quaternion)
        bloomPositions.push(branch.position.clone().add(tipDir.clone().multiplyScalar(bt.targetLength * 0.9)))
      }
    } else {
      for (let i = 0; i < bloomCount; i++) {
        const angle = (i / bloomCount) * Math.PI * 2
        bloomPositions.push(new THREE.Vector3(
          Math.cos(angle) * 0.15,
          stemHeight * 0.95,
          Math.sin(angle) * 0.15
        ))
      }
    }

    for (let f = 0; f < bloomCount; f++) {
      const petalCount = type === 'flower' ? 6 : 5

      const centerGeo = new THREE.SphereGeometry(0.08, 10, 8)
      const centerMat = new THREE.MeshStandardMaterial({
        color: flowerCenterColor,
        roughness: 0.5,
        emissive: flowerCenterColor,
        emissiveIntensity: 0.1
      })
      const center = new THREE.Mesh(centerGeo, centerMat)
      center.visible = false
      center.scale.setScalar(0.01)
      center.position.copy(bloomPositions[f])
      group.add(center)
      parts.flowers.push(center)

      const fStartProgress = 68 + f * 4

      for (let p = 0; p < petalCount; p++) {
        const petalGeo = createPetalGeometry()
        const petalMat = new THREE.MeshStandardMaterial({
          color: flowerBloomColor,
          side: THREE.DoubleSide,
          roughness: 0.5,
          transparent: true,
          opacity: 0.95,
          emissive: flowerBloomColor,
          emissiveIntensity: 0.05
        })
        const petal = new THREE.Mesh(petalGeo, petalMat)
        petal.visible = false
        petal.scale.set(0.01, 0.01, 0.01)
        petal.position.copy(bloomPositions[f])

        const angleY = (p / petalCount) * Math.PI * 2
        petal.rotation.y = angleY
        petal.rotation.x = 1.3

        const targetRotY = 0.3

        const pStartProgress = fStartProgress + p * 1.2

        group.add(petal)
        parts.petals.push(petal)
        privateState.petalTargets.push({
          mesh: petal,
          targetRotY,
          startProgress: pStartProgress
        })
      }
    }
  }

  if (type === 'fruit') {
    parts.fruits = []
    const fruitCount = 5

    const fruitPositions: THREE.Vector3[] = []
    if (parts.branches.length > 0) {
      for (let i = 0; i < fruitCount; i++) {
        const bIdx = Math.floor((i / fruitCount) * parts.branches.length * 0.7)
        const branch = parts.branches[bIdx]
        const bt = privateState.branchTargets[bIdx]
        const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(branch.quaternion)
        const t = 0.4 + Math.random() * 0.5
        fruitPositions.push(branch.position.clone().add(dir.clone().multiplyScalar(bt.targetLength * t)))
      }
    } else {
      for (let i = 0; i < fruitCount; i++) {
        const angle = (i / fruitCount) * Math.PI * 2 + Math.PI / 5
        fruitPositions.push(new THREE.Vector3(
          Math.cos(angle) * 0.3,
          stemHeight * 0.6 + Math.random() * 0.4,
          Math.sin(angle) * 0.3
        ))
      }
    }

    for (let i = 0; i < fruitCount; i++) {
      const fruitSize = 0.18 + Math.random() * 0.08
      const fruitGeo = new THREE.SphereGeometry(fruitSize, 16, 12)
      const fruitMat = new THREE.MeshStandardMaterial({
        color: 0x6b8e23,
        roughness: 0.45,
        metalness: 0.08
      })
      const fruit = new THREE.Mesh(fruitGeo, fruitMat)
      fruit.visible = false
      fruit.scale.setScalar(0.01)
      fruit.position.copy(fruitPositions[i])
      fruit.castShadow = true

      const startProgress = 72 + i * 4

      group.add(fruit)
      parts.fruits.push(fruit)
      privateState.fruitTargets.push({
        mesh: fruit,
        targetScale: 1,
        startProgress
      })
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
    privateState,
    leafDropParticles: null
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
  const lerpFast = 1 - Math.exp(-deltaTime * 3)
  const lerpMid = 1 - Math.exp(-deltaTime * 2.2)
  const lerpSlow = 1 - Math.exp(-deltaTime * 1.5)

  let targetScale = 0.1
  if (progress > 0) {
    targetScale = Math.min(1, 0.1 + (progress / 100) * 0.9)
  }

  plant.currentScale = lerp(plant.currentScale, targetScale, lerpMid)
  plant.group.scale.setScalar(plant.currentScale)

  if (plant.parts.seed) {
    plant.parts.seed.visible = stageIndex <= 1
    if (stageIndex > 0 && plant.parts.seed.visible) {
      const sproutProgress = Math.min(1, (progress - 0) / 12)
      const t = clamp(sproutProgress, 0, 1)
      plant.parts.seed.scale.setScalar(lerp(plant.parts.seed.scale.x, 1 - t * 0.5, lerpFast))
      plant.parts.seed.position.y = lerp(plant.parts.seed.position.y, 0.1 + t * 0.25, lerpMid)
    }
  }

  if (plant.parts.stem && plant.privateState.stemTarget) {
    const canGrow = stageIndex >= 1
    plant.parts.stem.visible = canGrow

    if (canGrow) {
      const stemProgress = clamp((progress - 8) / 47, 0, 1)
      const targetHeight = plant.privateState.stemTarget.height * (0.35 + stemProgress * 0.65)
      const currentGeoHeight = plant.privateState.stemTarget.height
      const scaleY = targetHeight / currentGeoHeight
      const targetRadius = plant.privateState.stemTarget.radius * (0.4 + stemProgress * 0.6)
      const currentGeoRadius = plant.privateState.stemTarget.radius
      const scaleXZ = targetRadius / currentGeoRadius

      plant.parts.stem.scale.y = lerp(plant.parts.stem.scale.y, scaleY, lerpMid)
      plant.parts.stem.scale.x = lerp(plant.parts.stem.scale.x, scaleXZ, lerpMid)
      plant.parts.stem.scale.z = lerp(plant.parts.stem.scale.z, scaleXZ, lerpMid)
      plant.parts.stem.position.y = lerp(plant.parts.stem.position.y, targetHeight / 2, lerpMid)
    }
  }

  plant.privateState.branchTargets.forEach((bt, idx) => {
    const total = plant.privateState.branchTargets.length
    const config = BRANCH_CONFIGS[plant.type]
    const levelSize = config.count[0] || 1
    const level = Math.floor(idx / levelSize)
    const levelUnlock = [20, 38, 52]
    const unlockProg = levelUnlock[level] || 20
    const branchProgress = clamp((progress - (unlockProg + idx * 0.5)) / 35, 0, 1)
    const canGrow = stageIndex >= 2 && branchProgress > 0

    bt.mesh.visible = canGrow

    if (canGrow) {
      const t = branchProgress
      const currentGeoLen = bt.targetLength
      const scaleY = (bt.targetLength * (0.25 + t * 0.75)) / currentGeoLen
      const currentGeoRad = bt.targetRadius
      const scaleXZ = (bt.targetRadius * (0.35 + t * 0.65)) / currentGeoRad

      bt.mesh.scale.y = lerp(bt.mesh.scale.y, scaleY, lerpMid)
      bt.mesh.scale.x = lerp(bt.mesh.scale.x, scaleXZ, lerpMid)
      bt.mesh.scale.z = lerp(bt.mesh.scale.z, scaleXZ, lerpMid)
    }
  })

  plant.privateState.leafTargets.forEach((lt) => {
    const leafProgress = clamp((progress - lt.startProgress) / 28, 0, 1)
    const canShow = stageIndex >= 1 && leafProgress > 0

    lt.mesh.visible = canShow

    if (canShow) {
      const t = leafProgress
      const easeT = t * t * (3 - 2 * t)

      lt.mesh.scale.x = lerp(lt.mesh.scale.x, lt.targetScale.x * easeT, lerpFast)
      lt.mesh.scale.y = lerp(lt.mesh.scale.y, lt.targetScale.y * easeT, lerpFast)
      lt.mesh.scale.z = lerp(lt.mesh.scale.z, lt.targetScale.z * easeT, lerpFast)

      lt.mesh.rotation.x = lerp(lt.mesh.rotation.x, lt.targetRot.x, lerpMid)
      lt.mesh.rotation.y = lerp(lt.mesh.rotation.y, lt.targetRot.y, lerpMid)
      lt.mesh.rotation.z = lerp(lt.mesh.rotation.z, lt.targetRot.z, lerpMid)
    }
  })

  plant.privateState.petalTargets.forEach((pt) => {
    const petalProgress = clamp((progress - pt.startProgress) / 22, 0, 1)
    const canShow = stageIndex >= 3 && petalProgress > 0

    pt.mesh.visible = canShow

    if (canShow) {
      const t = petalProgress
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

      const scaleBase = 0.01 + easeT * 0.99
      pt.mesh.scale.x = lerp(pt.mesh.scale.x, scaleBase, lerpFast)
      pt.mesh.scale.y = lerp(pt.mesh.scale.y, scaleBase * (0.15 + easeT * 0.85), lerpFast)
      pt.mesh.scale.z = lerp(pt.mesh.scale.z, scaleBase * 0.6, lerpFast)

      pt.mesh.rotation.x = lerp(pt.mesh.rotation.x, 1.3 - pt.targetRotY * easeT, lerpMid)

      const mat = pt.mesh.material as THREE.MeshStandardMaterial
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = lerp(mat.emissiveIntensity, 0.05 + easeT * 0.45, lerpMid)
      }
    }
  })

  if (plant.parts.flowers) {
    plant.parts.flowers.forEach((center, i) => {
      const fStartProgress = 68 + i * 4
      const centerProgress = clamp((progress - fStartProgress) / 18, 0, 1)
      const canShow = stageIndex >= 3 && centerProgress > 0
      center.visible = canShow

      if (canShow) {
        const t = centerProgress
        const targetS = 0.1 + t * 0.9
        center.scale.setScalar(lerp(center.scale.x, targetS, lerpMid))

        const mat = center.material as THREE.MeshStandardMaterial
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = lerp(mat.emissiveIntensity, 0.1 + t * 0.5, lerpMid)
        }
      }
    })
  }

  plant.privateState.fruitTargets.forEach((ft) => {
    const fruitProgress = clamp((progress - ft.startProgress) / 18, 0, 1)
    const canShow = stageIndex >= 3 && fruitProgress > 0

    ft.mesh.visible = canShow

    if (canShow) {
      const t = fruitProgress
      const easeT = t * t

      ft.mesh.scale.setScalar(lerp(ft.mesh.scale.x, easeT, lerpFast))

      const mat = ft.mesh.material as THREE.MeshStandardMaterial
      const green = new THREE.Color(0x6b8e23)
      const yellow = new THREE.Color(0xffa500)
      const red = new THREE.Color(0xff4500)
      let colorTarget: THREE.Color
      if (t < 0.5) {
        const local = t / 0.5
        colorTarget = green.clone().lerp(yellow, local)
      } else {
        const local = (t - 0.5) / 0.5
        colorTarget = yellow.clone().lerp(red, local)
      }
      mat.color.lerp(colorTarget, lerpSlow)
    }
  })

  const healthFactor = plant.health.light + plant.health.water + plant.health.temperature + plant.health.nutrients
  const avgHealth = healthFactor / 400
  const dimFactor = 0.5 + avgHealth * 0.5

  plant.parts.leaves.forEach((leaf) => {
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

export function getLeavesForDrop(plant: PlantInstance, count: number): THREE.Mesh[] {
  const visibleLeaves = plant.parts.leaves.filter(l => l.visible && l.scale.x > 0.3)
  const pool = [...visibleLeaves]
  const result: THREE.Mesh[] = []
  const n = Math.min(count, pool.length)

  for (let i = 0; i < n; i++) {
    if (pool.length === 0) break
    const idx = Math.floor(Math.random() * pool.length)
    const picked = pool.splice(idx, 1)[0]
    result.push(picked)
  }

  return result
}

export function shouldDropLeaves(envParams: EnvironmentParams, plant: PlantInstance): number {
  let score = 0

  const lightOk = envParams.light >= plant.config.optimalLight[0] * 0.5 &&
                  envParams.light <= plant.config.optimalLight[1] * 1.3
  if (!lightOk) {
    const [min, max] = plant.config.optimalLight
    if (envParams.light < min * 0.5) {
      score += Math.min(1.5, ((min * 0.5 - envParams.light) / (min * 0.5)) * 1.5)
    } else {
      score += Math.min(1.5, ((envParams.light - max * 1.3) / (100 - max * 1.3)) * 1.5)
    }
  }

  const waterOk = envParams.water >= plant.config.optimalWater[0] * 0.4 &&
                  envParams.water <= plant.config.optimalWater[1] * 1.4
  if (!waterOk) {
    const [min, max] = plant.config.optimalWater
    if (envParams.water < min * 0.4) {
      score += Math.min(1.5, ((min * 0.4 - envParams.water) / (min * 0.4)) * 1.5)
    } else {
      score += Math.min(1.5, ((envParams.water - max * 1.4) / (100 - max * 1.4)) * 1.5)
    }
  }

  const tempOk = envParams.temperature >= plant.config.optimalTemperature[0] * 0.55 &&
                 envParams.temperature <= plant.config.optimalTemperature[1] * 1.35
  if (!tempOk) {
    const [min, max] = plant.config.optimalTemperature
    if (envParams.temperature < min * 0.55) {
      score += Math.min(1.5, ((min * 0.55 - envParams.temperature) / (min * 0.55)) * 1.5)
    } else {
      score += Math.min(1.5, ((envParams.temperature - max * 1.35) / (100 - max * 1.35)) * 1.5)
    }
  }

  return Math.round(clamp(score, 0, 3))
}
