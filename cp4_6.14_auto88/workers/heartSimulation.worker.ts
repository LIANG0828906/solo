const SEGMENTS_PER_CHAMBER = 10
const TOTAL_SEGMENTS = 40
const SIMULATION_STEP = 5
const MESSAGE_INTERVAL = 16

let simulationTime = 0
let heartRateMultiplier = 1.0
let isPaused = false
let lastMessageTime = 0

const activationArray = new Float32Array(TOTAL_SEGMENTS)
const activationTimers = new Float32Array(TOTAL_SEGMENTS)
let cycleNumber = 0

const SINOATRIAL_NODE_DELAY = 0
const ATRIOVENTRICULAR_NODE_DELAY = 120
const HIS_BUNDLE_DELAY = 30
const PURKINJE_DELAY = 20

const BASE_CYCLE_DURATION = 800

interface ConductionNode {
  id: number
  delay: number
  targetSegments: number[]
  dependsOn: number[]
  activated: boolean
  activationTime: number
}

const conductionNodes: ConductionNode[] = [
  { id: 0, delay: SINOATRIAL_NODE_DELAY, targetSegments: [0, 1, 2, 3, 4], dependsOn: [], activated: false, activationTime: 0 },
  { id: 1, delay: 50, targetSegments: [5, 6, 7, 8, 9], dependsOn: [0], activated: false, activationTime: 0 },
  { id: 2, delay: ATRIOVENTRICULAR_NODE_DELAY, targetSegments: [], dependsOn: [1], activated: false, activationTime: 0 },
  { id: 3, delay: HIS_BUNDLE_DELAY, targetSegments: [20, 21, 22], dependsOn: [2], activated: false, activationTime: 0 },
  { id: 4, delay: PURKINJE_DELAY, targetSegments: [23, 24, 25, 26, 27, 28, 29], dependsOn: [3], activated: false, activationTime: 0 },
  { id: 5, delay: 10, targetSegments: [10, 11, 12, 13, 14], dependsOn: [0], activated: false, activationTime: 0 },
  { id: 6, delay: 60, targetSegments: [15, 16, 17, 18, 19], dependsOn: [5], activated: false, activationTime: 0 },
  { id: 7, delay: HIS_BUNDLE_DELAY + 10, targetSegments: [30, 31, 32], dependsOn: [2], activated: false, activationTime: 0 },
  { id: 8, delay: PURKINJE_DELAY, targetSegments: [33, 34, 35, 36, 37, 38, 39], dependsOn: [7], activated: false, activationTime: 0 },
]

const ACTIVATION_RISE_TIME = 30
const ACTIVATION_PEAK_TIME = 50
const ACTIVATION_DECAY_TIME = 200

function resetConductionSystem(): void {
  conductionNodes.forEach((node) => {
    node.activated = false
    node.activationTime = 0
  })
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    activationTimers[i] = 0
    activationArray[i] = 0
  }
}

function calculateActivationValue(timeSinceActivation: number): number {
  if (timeSinceActivation <= 0) return 0
  
  if (timeSinceActivation < ACTIVATION_RISE_TIME) {
    return timeSinceActivation / ACTIVATION_RISE_TIME
  } else if (timeSinceActivation < ACTIVATION_RISE_TIME + ACTIVATION_PEAK_TIME) {
    return 1.0
  } else if (timeSinceActivation < ACTIVATION_RISE_TIME + ACTIVATION_PEAK_TIME + ACTIVATION_DECAY_TIME) {
    const decayTime = timeSinceActivation - ACTIVATION_RISE_TIME - ACTIVATION_PEAK_TIME
    return 1.0 - decayTime / ACTIVATION_DECAY_TIME
  }
  return 0
}

function updateActivationArray(deltaTime: number): void {
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    if (activationTimers[i] > 0 || activationArray[i] > 0) {
      activationTimers[i] += deltaTime
      activationArray[i] = calculateActivationValue(activationTimers[i])
    }
  }
}

function activateSegments(segmentIndices: number[]): void {
  segmentIndices.forEach((idx) => {
    if (idx >= 0 && idx < TOTAL_SEGMENTS && activationTimers[idx] === 0) {
      activationTimers[idx] = 0.001
    }
  })
}

function updateConductionSystem(currentCycleTime: number): void {
  conductionNodes.forEach((node) => {
    if (node.activated) return

    const allDependenciesMet = node.dependsOn.every((depId) => {
      const depNode = conductionNodes.find((n) => n.id === depId)
      return depNode && depNode.activated && currentCycleTime >= depNode.activationTime + node.delay
    })

    if (allDependenciesMet) {
      node.activated = true
      node.activationTime = currentCycleTime
      activateSegments(node.targetSegments)
    }
  })
}

function simulationStep(deltaTime: number): void {
  const cycleDuration = BASE_CYCLE_DURATION / heartRateMultiplier
  const currentCycleTime = simulationTime % cycleDuration

  if (currentCycleTime < deltaTime && simulationTime > 0) {
    resetConductionSystem()
    cycleNumber++
  }

  updateConductionSystem(currentCycleTime)
  updateActivationArray(deltaTime)

  simulationTime += deltaTime
}

function calculateCardiacOutput(): number {
  const baseOutput = 5.0
  return baseOutput * heartRateMultiplier
}

function calculateAVDelay(): number {
  return ATRIOVENTRICULAR_NODE_DELAY / heartRateMultiplier
}

function sendMessage(): void {
  const data = {
    activationArray: new Float32Array(activationArray),
    cycleNumber,
    avDelay: calculateAVDelay(),
    cardiacOutput: calculateCardiacOutput(),
    simulationTime,
  }
  ;(self as unknown as Worker).postMessage(data, [data.activationArray.buffer])
}

let lastSimulationTime = performance.now()
let animationFrameId: number

function simulationLoop(): void {
  const now = performance.now()
  const realDelta = now - lastSimulationTime
  lastSimulationTime = now

  if (!isPaused) {
    const steps = Math.max(1, Math.floor(realDelta / SIMULATION_STEP))
    for (let i = 0; i < steps; i++) {
      simulationStep(SIMULATION_STEP)
    }
  }

  if (now - lastMessageTime >= MESSAGE_INTERVAL) {
    sendMessage()
    lastMessageTime = now
  }

  animationFrameId = requestAnimationFrame(simulationLoop)
}

;(self as unknown as Worker).addEventListener('message', (e: MessageEvent) => {
  const { type, payload } = e.data

  switch (type) {
    case 'SET_HEART_RATE':
      heartRateMultiplier = payload.rate
      break
    case 'SET_PAUSED':
      isPaused = payload.paused
      break
    case 'START':
      resetConductionSystem()
      cycleNumber = 0
      simulationTime = 0
      lastSimulationTime = performance.now()
      lastMessageTime = 0
      break
    default:
      break
  }
})

animationFrameId = requestAnimationFrame(simulationLoop)

export {}
