import * as THREE from 'three'

export type SpeciesType = 'sunflower' | 'vine' | 'cactus'

export interface EnvironmentParams {
  light: number
  water: number
  fertility: number
}

export interface PlantNode {
  id: string
  type: 'stem' | 'leaf' | 'root' | 'flower' | 'thorn' | 'seed'
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: number
  thickness: number
  color: THREE.Color
  length: number
  growthProgress: number
  children: string[]
  parentId: string | null
  maxAge: number
  currentAge: number
}

export interface PlantData {
  nodes: Map<string, PlantNode>
  rootNodeId: string
  species: SpeciesType
  phase: number
  isWilting: boolean
  totalNodeCount: number
}

const NODE_ID_PREFIX = 'plant_node_'
let nodeIdCounter = 0

function generateId(): string {
  return `${NODE_ID_PREFIX}${nodeIdCounter++}`
}

function resetIdCounter(): void {
  nodeIdCounter = 0
}

const SPECIES_CONFIG: Record<SpeciesType, {
  maxDepth: number
  branchingFactor: number
  stemColorStart: string
  stemColorEnd: string
  leafColor: string
  flowerColor?: string
  growthRate: number
  rootDepth: number
  rootBranching: number
}> = {
  sunflower: {
    maxDepth: 6,
    branchingFactor: 2,
    stemColorStart: '#7ed957',
    stemColorEnd: '#8b6914',
    leafColor: '#4caf50',
    flowerColor: '#ffd700',
    growthRate: 0.8,
    rootDepth: 4,
    rootBranching: 3
  },
  vine: {
    maxDepth: 10,
    branchingFactor: 3,
    stemColorStart: '#90ee90',
    stemColorEnd: '#5d4037',
    leafColor: '#2e7d32',
    growthRate: 1.2,
    rootDepth: 3,
    rootBranching: 2
  },
  cactus: {
    maxDepth: 5,
    branchingFactor: 1,
    stemColorStart: '#66bb6a',
    stemColorEnd: '#388e3c',
    leafColor: '#81c784',
    growthRate: 0.4,
    rootDepth: 2,
    rootBranching: 1
  }
}

export function generatePlant(
  species: SpeciesType,
  params: EnvironmentParams
): PlantData {
  resetIdCounter()
  const nodes = new Map<string, PlantNode>()
  const config = SPECIES_CONFIG[species]

  const { light, water, fertility } = params
  const lightFactor = light / 100
  const waterFactor = water / 100
  const fertilityFactor = fertility / 100

  const etiolation = 1 + (1 - lightFactor) * 1.5
  const healthFactor = 0.3 + 0.7 * (lightFactor * 0.3 + waterFactor * 0.3 + fertilityFactor * 0.4)
  const branchingMultiplier = 0.5 + fertilityFactor * 1.5
  const leafSizeMultiplier = 0.6 + fertilityFactor * 0.8 + waterFactor * 0.3

  const rootId = generateId()
  const rootNode: PlantNode = {
    id: rootId,
    type: 'seed',
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    scale: 1,
    thickness: 0.15,
    color: new THREE.Color('#6d4c2b'),
    length: 0.1,
    growthProgress: 0,
    children: [],
    parentId: null,
    maxAge: 100,
    currentAge: 0
  }
  nodes.set(rootId, rootNode)

  generateAerialStructure(rootId, nodes, species, config, 0, healthFactor, etiolation, branchingMultiplier, leafSizeMultiplier, lightFactor, waterFactor)
  generateRootStructure(rootId, nodes, species, config, 0, healthFactor, waterFactor)

  return {
    nodes,
    rootNodeId: rootId,
    species,
    phase: 0,
    isWilting: false,
    totalNodeCount: nodes.size
  }
}

function generateAerialStructure(
  parentId: string,
  nodes: Map<string, PlantNode>,
  species: SpeciesType,
  config: typeof SPECIES_CONFIG[SpeciesType],
  depth: number,
  health: number,
  etiolation: number,
  branchMult: number,
  leafMult: number,
  lightFactor: number,
  waterFactor: number
): void {
  if (depth >= config.maxDepth) return

  const parent = nodes.get(parentId)!
  const numBranches = species === 'sunflower' 
    ? (depth === 0 ? 1 : (Math.random() < 0.6 ? Math.ceil(config.branchingFactor * branchMult) : 0))
    : species === 'vine'
    ? (depth === 0 ? 1 : Math.ceil(config.branchingFactor * branchMult * (0.5 + Math.random() * 0.5)))
    : (depth === 0 ? 1 : (Math.random() < 0.4 ? 1 : 0))

  for (let i = 0; i < numBranches; i++) {
    const stemId = generateId()
    const progress = depth / config.maxDepth

    let angleX = 0
    let angleY = 0
    let angleZ = 0
    let length = 0
    let thickness = 0

    if (species === 'sunflower') {
      if (depth === 0) {
        angleX = -Math.PI / 2 + (1 - lightFactor) * (Math.random() - 0.5) * 0.8
        angleY = Math.random() * Math.PI * 2
        length = (1.5 + Math.random() * 0.3) * etiolation * health
        thickness = 0.12
      } else {
        angleX = -Math.PI / 3 - Math.random() * 0.3
        angleY = (i / numBranches) * Math.PI * 2 + parent.rotation.y
        length = (0.3 + Math.random() * 0.2) * health
        thickness = 0.05
      }
    } else if (species === 'vine') {
      if (depth === 0) {
        angleX = -Math.PI / 2 + 0.15
        angleY = 0
        length = 0.5 * etiolation * health
        thickness = 0.04
      } else {
        angleX = -Math.PI / 2 + (Math.random() - 0.5) * 0.6
        angleY = parent.rotation.y + Math.PI / 6 + (i - numBranches / 2) * 0.5
        length = (0.3 + Math.random() * 0.2) * etiolation * health
        thickness = 0.025
      }
    } else {
      if (depth === 0) {
        angleX = -Math.PI / 2
        angleY = 0
        length = (0.8 + Math.random() * 0.2) * health
        thickness = 0.2
      } else {
        angleX = -Math.PI / 2 + (Math.random() - 0.5) * 0.8
        angleY = (i / numBranches) * Math.PI * 2 + parent.rotation.y
        length = (0.25 + Math.random() * 0.15) * health
        thickness = 0.1
      }
    }

    const stemColor = new THREE.Color(config.stemColorStart).lerp(
      new THREE.Color(config.stemColorEnd),
      progress
    )

    if (waterFactor < 0.3) {
      stemColor.lerp(new THREE.Color('#8b7355'), 0.3)
    }

    const direction = new THREE.Vector3(0, 1, 0)
    direction.applyEuler(new THREE.Euler(angleX, angleY, angleZ))
    direction.normalize().multiplyScalar(length)

    const stemPosition = parent.position.clone().add(
      new THREE.Vector3(0, parent.type === 'seed' ? 0.05 : parent.length * 0.5, 0)
    )

    if (parent.type !== 'seed' && parent.type !== 'stem') {
      stemPosition.copy(parent.position)
    } else if (parent.type === 'stem') {
      const parentDir = new THREE.Vector3(0, 1, 0).applyEuler(parent.rotation).normalize()
      stemPosition.copy(parent.position).add(parentDir.multiplyScalar(parent.length * 0.9))
    }

    const stemNode: PlantNode = {
      id: stemId,
      type: 'stem',
      position: stemPosition,
      rotation: new THREE.Euler(angleX, angleY, angleZ),
      scale: 1,
      thickness: thickness * (1 - progress * 0.5),
      color: stemColor,
      length,
      growthProgress: 0,
      children: [],
      parentId,
      maxAge: 100,
      currentAge: 0
    }

    nodes.set(stemId, stemNode)
    parent.children.push(stemId)

    if (depth > 0 && depth < config.maxDepth - 1) {
      const leafCount = species === 'cactus' ? 0 : (species === 'sunflower' ? (depth === 1 ? 8 : 3) : 2)
      for (let l = 0; l < leafCount; l++) {
        const leafId = generateId()
        const leafAngleY = stemNode.rotation.y + (l / leafCount) * Math.PI * 2 + Math.random() * 0.3
        const leafAngleX = -Math.PI / 4 + Math.random() * 0.4
        
        const leafDir = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(leafAngleX, leafAngleY, 0))
        const leafPos = stemNode.position.clone().add(
          new THREE.Vector3(0, 1, 0).applyEuler(stemNode.rotation).normalize().multiplyScalar(stemNode.length * (0.3 + l * 0.15))
        )

        let leafColor = new THREE.Color(config.leafColor)
        if (waterFactor > 0.85) {
          leafColor.lerp(new THREE.Color('#cddc39'), 0.4)
        } else if (waterFactor < 0.2) {
          leafColor.lerp(new THREE.Color('#a1887f'), 0.3)
        }
        if (lightFactor < 0.3) {
          leafColor.lerp(new THREE.Color('#ffeb3b'), 0.2)
        }

        const leafNode: PlantNode = {
          id: leafId,
          type: 'leaf',
          position: leafPos,
          rotation: new THREE.Euler(leafAngleX, leafAngleY, Math.random() * 0.4 - 0.2),
          scale: leafMult * (species === 'sunflower' ? 0.35 : species === 'vine' ? 0.18 : 0.2),
          thickness: 0.01,
          color: leafColor,
          length: leafMult * (species === 'sunflower' ? 0.5 : species === 'vine' ? 0.25 : 0.3),
          growthProgress: 0,
          children: [],
          parentId: stemId,
          maxAge: 80,
          currentAge: 0
        }
        nodes.set(leafId, leafNode)
        stemNode.children.push(leafId)
      }
    }

    if (species === 'sunflower' && depth === config.maxDepth - 2) {
      const flowerId = generateId()
      const flowerPos = stemNode.position.clone().add(
        new THREE.Vector3(0, 1, 0).applyEuler(stemNode.rotation).normalize().multiplyScalar(stemNode.length * 0.95)
      )
      const flowerNode: PlantNode = {
        id: flowerId,
        type: 'flower',
        position: flowerPos,
        rotation: new THREE.Euler(-Math.PI / 2, stemNode.rotation.y, 0),
        scale: health * 1.2,
        thickness: 0,
        color: new THREE.Color(config.flowerColor || '#ffd700'),
        length: 0.35 * health,
        growthProgress: 0,
        children: [],
        parentId: stemId,
        maxAge: 120,
        currentAge: 0
      }
      nodes.set(flowerId, flowerNode)
      stemNode.children.push(flowerId)
    }

    if (species === 'cactus' && depth >= 1) {
      const thornCount = 12
      for (let t = 0; t < thornCount; t++) {
        const thornId = generateId()
        const thornAngleY = (t / thornCount) * Math.PI * 2
        const thornAngleX = 0
        const heightRatio = Math.random()
        
        const thornDir = new THREE.Vector3(Math.cos(thornAngleY), 0, Math.sin(thornAngleY))
        const stemDir = new THREE.Vector3(0, 1, 0).applyEuler(stemNode.rotation).normalize()
        const thornPos = stemNode.position.clone()
          .add(stemDir.clone().multiplyScalar(stemNode.length * (0.1 + heightRatio * 0.8)))
          .add(thornDir.clone().multiplyScalar(stemNode.thickness * 0.9))

        const thornNode: PlantNode = {
          id: thornId,
          type: 'thorn',
          position: thornPos,
          rotation: new THREE.Euler(thornAngleX, thornAngleY, 0),
          scale: 1,
          thickness: 0.008,
          color: new THREE.Color('#ffffff'),
          length: 0.08 + Math.random() * 0.04,
          growthProgress: 0,
          children: [],
          parentId: stemId,
          maxAge: 100,
          currentAge: 0
        }
        nodes.set(thornId, thornNode)
        stemNode.children.push(thornId)
      }
    }

    generateAerialStructure(
      stemId, nodes, species, config, depth + 1,
      health, etiolation, branchMult, leafMult, lightFactor, waterFactor
    )
  }
}

function generateRootStructure(
  parentId: string,
  nodes: Map<string, PlantNode>,
  species: SpeciesType,
  config: typeof SPECIES_CONFIG[SpeciesType],
  depth: number,
  health: number,
  waterFactor: number
): void {
  if (depth >= config.rootDepth) return

  const parent = nodes.get(parentId)!
  const numRoots = depth === 0 ? 5 : Math.ceil(config.rootBranching * (0.5 + waterFactor))

  for (let i = 0; i < numRoots; i++) {
    const rootId = generateId()
    const progress = depth / config.rootDepth

    const angleX = Math.PI / 4 + Math.random() * Math.PI / 4
    const angleY = (i / numRoots) * Math.PI * 2 + Math.random() * 0.5
    const length = (depth === 0 ? 0.4 : 0.2) * health * (0.6 + waterFactor * 0.6)
    const thickness = (depth === 0 ? 0.06 : 0.025) * (1 - progress * 0.4)

    const rootDir = new THREE.Vector3(0, -1, 0)
    rootDir.applyEuler(new THREE.Euler(angleX, angleY, 0))
    rootDir.normalize().multiplyScalar(length)

    let rootPos: THREE.Vector3
    if (parent.type === 'seed') {
      rootPos = parent.position.clone().add(new THREE.Vector3(0, -0.05, 0))
    } else {
      const pDir = new THREE.Vector3(0, -1, 0).applyEuler(parent.rotation).normalize()
      rootPos = parent.position.clone().add(pDir.multiplyScalar(parent.length * 0.8))
    }

    const rootColor = new THREE.Color('#5d4037').lerp(new THREE.Color('#3e2723'), progress * 0.5)

    const rootNode: PlantNode = {
      id: rootId,
      type: 'root',
      position: rootPos,
      rotation: new THREE.Euler(angleX, angleY, 0),
      scale: 1,
      thickness,
      color: rootColor,
      length,
      growthProgress: 0,
      children: [],
      parentId,
      maxAge: 90,
      currentAge: 0
    }

    nodes.set(rootId, rootNode)
    parent.children.push(rootId)

    generateRootStructure(rootId, nodes, species, config, depth + 1, health, waterFactor)
  }
}

export function updateGrowth(
  plantData: PlantData,
  phase: number,
  speedMultiplier: number = 1,
  params: EnvironmentParams
): PlantData {
  const newNodes = new Map(plantData.nodes)
  const health = 0.3 + 0.7 * ((params.light / 100) * 0.3 + (params.water / 100) * 0.3 + (params.fertility / 100) * 0.4)

  const sortedNodes = Array.from(newNodes.values()).sort((a, b) => {
    const aDepth = getNodeDepth(a, newNodes)
    const bDepth = getNodeDepth(b, newNodes)
    return aDepth - bDepth
  })

  for (const node of sortedNodes) {
    const updatedNode = { ...node }
    const depth = getNodeDepth(node, newNodes)
    const delay = depth * 0.08

    const effectivePhase = Math.max(0, phase - delay)
    const nodeProgress = Math.min(1, effectivePhase * SPECIES_CONFIG[plantData.species].growthRate * speedMultiplier / node.maxAge)

    if (plantData.isWilting) {
      updatedNode.growthProgress = Math.max(0, node.growthProgress - 0.015 * speedMultiplier)
      updatedNode.color = node.color.clone().lerp(new THREE.Color('#6d4c2b'), 0.02)
    } else {
      const targetProgress = Math.min(1, nodeProgress * health)
      const diff = targetProgress - node.growthProgress
      updatedNode.growthProgress = node.growthProgress + diff * 0.08

      if (node.type === 'stem') {
        const config = SPECIES_CONFIG[plantData.species]
        const ageProgress = updatedNode.growthProgress
        const colorProgress = Math.min(1, ageProgress * 1.5)
        updatedNode.color = new THREE.Color(config.stemColorStart).lerp(
          new THREE.Color(config.stemColorEnd),
          colorProgress * (depth / config.maxDepth)
        )
      }
    }

    updatedNode.currentAge = effectivePhase * speedMultiplier
    newNodes.set(node.id, updatedNode)
  }

  return {
    ...plantData,
    nodes: newNodes,
    phase
  }
}

function getNodeDepth(node: PlantNode, nodes: Map<string, PlantNode>): number {
  let depth = 0
  let current = node
  while (current.parentId) {
    depth++
    const parent = nodes.get(current.parentId)
    if (!parent) break
    current = parent
  }
  return depth
}
