/*
 * ============================================================
 * 模块调用关系与数据流向
 *
 * 运行环境：Web Worker (独立线程，不阻塞主线程)
 *
 * 职责：
 *   - 运行 Purkinje 纤维网络传导模型
 *   - 以每帧 5ms 的步长计算窦房结、房室结、希氏束等节点的激活时间
 *   - 输出长度为 40 的浮点数组，表示各部位电兴奋程度 (0-1)
 *
 * 数据流入（通过 onmessage 接收）：
 *   - 'START': 重置模拟状态，从 0 开始
 *   - 'SET_HEART_RATE': 调整心率倍率 (0.5x - 3.0x)
 *   - 'SET_PAUSED': 暂停/继续模拟
 *
 * 内部处理：
 *   1. 维护窦房结 → 房室结 → 希氏束 → 左右束支 → Purkinje 纤维的传导链
 *   2. 每 5ms 推进一次模拟步长
 *   3. 根据传导延迟依次激活各节点，扩散到对应心肌节段
 *   4. 每个节段的激活值遵循：上升(30ms) → 峰值(50ms) → 衰减(200ms) 曲线
 *
 * 数据流出（通过 postMessage 发送）：
 *   - 每 16ms 推送一次 SimulationData
 *   - activationArray: Float32Array (长度40，通过 Transferable 对象零拷贝传输)
 *   - cycleNumber: 当前心跳周期编号
 *   - avDelay: 房室延迟 (ms)
 *   - cardiacOutput: 心输出量估算 (L/min)
 *   - simulationTime: 累计模拟时间 (ms)
 *
 * 调用方：
 *   - 主线程 simulation.ts 管理 Worker 生命周期
 * ============================================================
 */

const SEGMENTS_PER_CHAMBER = 10
const TOTAL_SEGMENTS = 40
const SIMULATION_STEP_MS = 5
const MESSAGE_INTERVAL_MS = 16

let simulationTimeMs = 0
let heartRateMultiplier = 1.0
let isPaused = false
let lastMessageTimeMs = 0

const activationArray = new Float32Array(TOTAL_SEGMENTS)
const activationTimersMs = new Float32Array(TOTAL_SEGMENTS)
let cycleNumber = 0

const SINOATRIAL_NODE_DELAY_MS = 0
const ATRIOVENTRICULAR_NODE_DELAY_MS = 120
const HIS_BUNDLE_DELAY_MS = 30
const PURKINJE_DELAY_MS = 20
const INTERATRIAL_DELAY_MS = 40

const BASE_CYCLE_DURATION_MS = 800

interface ConductionNode {
  id: number
  name: string
  delayMs: number
  targetSegments: number[]
  dependsOn: number[]
  activated: boolean
  activationTimeMs: number
  conductionVelocity: number
}

const conductionNodes: ConductionNode[] = [
  { id: 0, name: 'SA_Node', delayMs: SINOATRIAL_NODE_DELAY_MS, targetSegments: [0, 1, 2], dependsOn: [], activated: false, activationTimeMs: 0, conductionVelocity: 1.0 },
  { id: 1, name: 'RA_Spread', delayMs: 30, targetSegments: [3, 4, 5, 6], dependsOn: [0], activated: false, activationTimeMs: 0, conductionVelocity: 0.8 },
  { id: 2, name: 'RA_Lower', delayMs: 60, targetSegments: [7, 8, 9], dependsOn: [1], activated: false, activationTimeMs: 0, conductionVelocity: 0.6 },
  { id: 3, name: 'Interatrial_Tract', delayMs: INTERATRIAL_DELAY_MS, targetSegments: [10, 11, 12], dependsOn: [0], activated: false, activationTimeMs: 0, conductionVelocity: 1.5 },
  { id: 4, name: 'LA_Spread', delayMs: 25, targetSegments: [13, 14, 15, 16], dependsOn: [3], activated: false, activationTimeMs: 0, conductionVelocity: 0.8 },
  { id: 5, name: 'LA_Lower', delayMs: 55, targetSegments: [17, 18, 19], dependsOn: [4], activated: false, activationTimeMs: 0, conductionVelocity: 0.6 },
  { id: 6, name: 'AV_Node', delayMs: ATRIOVENTRICULAR_NODE_DELAY_MS, targetSegments: [], dependsOn: [2], activated: false, activationTimeMs: 0, conductionVelocity: 0.1 },
  { id: 7, name: 'Bundle_of_His', delayMs: HIS_BUNDLE_DELAY_MS, targetSegments: [20, 21], dependsOn: [6], activated: false, activationTimeMs: 0, conductionVelocity: 1.2 },
  { id: 8, name: 'RBB_Proximal', delayMs: 15, targetSegments: [22, 23, 24], dependsOn: [7], activated: false, activationTimeMs: 0, conductionVelocity: 1.0 },
  { id: 9, name: 'RBB_Purkinje', delayMs: PURKINJE_DELAY_MS, targetSegments: [25, 26, 27, 28, 29], dependsOn: [8], activated: false, activationTimeMs: 0, conductionVelocity: 2.5 },
  { id: 10, name: 'LBB_Proximal', delayMs: HIS_BUNDLE_DELAY_MS + 5, targetSegments: [30, 31], dependsOn: [6], activated: false, activationTimeMs: 0, conductionVelocity: 1.3 },
  { id: 11, name: 'LBB_Purkinje', delayMs: PURKINJE_DELAY_MS + 10, targetSegments: [32, 33, 34, 35], dependsOn: [10], activated: false, activationTimeMs: 0, conductionVelocity: 2.5 },
  { id: 12, name: 'LV_Apex', delayMs: 45, targetSegments: [36, 37, 38, 39], dependsOn: [11], activated: false, activationTimeMs: 0, conductionVelocity: 2.0 },
]

const ACTIVATION_RISE_MS = 30
const ACTIVATION_PEAK_MS = 50
const ACTIVATION_DECAY_MS = 200

function resetConductionSystem(): void {
  conductionNodes.forEach((node) => {
    node.activated = false
    node.activationTimeMs = 0
  })
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    activationTimersMs[i] = 0
    activationArray[i] = 0
  }
}

function calculateActivationValue(timeSinceActivationMs: number): number {
  if (timeSinceActivationMs <= 0) return 0

  if (timeSinceActivationMs < ACTIVATION_RISE_MS) {
    return timeSinceActivationMs / ACTIVATION_RISE_MS
  } else if (timeSinceActivationMs < ACTIVATION_RISE_MS + ACTIVATION_PEAK_MS) {
    return 1.0
  } else if (timeSinceActivationMs < ACTIVATION_RISE_MS + ACTIVATION_PEAK_MS + ACTIVATION_DECAY_MS) {
    const decayTime = timeSinceActivationMs - ACTIVATION_RISE_MS - ACTIVATION_PEAK_MS
    return 1.0 - decayTime / ACTIVATION_DECAY_MS
  }
  return 0
}

function updateActivationArray(deltaTimeMs: number): void {
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    if (activationTimersMs[i] > 0 || activationArray[i] > 0) {
      activationTimersMs[i] += deltaTimeMs
      activationArray[i] = calculateActivationValue(activationTimersMs[i])
    }
  }
}

function activateSegments(segmentIndices: number[]): void {
  segmentIndices.forEach((idx) => {
    if (idx >= 0 && idx < TOTAL_SEGMENTS && activationTimersMs[idx] === 0) {
      activationTimersMs[idx] = 0.001
    }
  })
}

function updateConductionSystem(currentCycleTimeMs: number): void {
  const rateFactor = 1.0 / heartRateMultiplier

  for (const node of conductionNodes) {
    if (node.activated) continue

    const allDependenciesMet = node.dependsOn.every((depId) => {
      const depNode = conductionNodes.find((n) => n.id === depId)
      if (!depNode || !depNode.activated) return false

      const effectiveDelay = node.delayMs * rateFactor
      return currentCycleTimeMs >= depNode.activationTimeMs + effectiveDelay
    })

    if (allDependenciesMet) {
      node.activated = true
      node.activationTimeMs = currentCycleTimeMs
      if (node.targetSegments.length > 0) {
        activateSegments(node.targetSegments)
      }
    }
  }
}

function simulationStep(deltaTimeMs: number): void {
  const cycleDurationMs = BASE_CYCLE_DURATION_MS / heartRateMultiplier
  const currentCycleTimeMs = simulationTimeMs % cycleDurationMs

  if (currentCycleTimeMs < deltaTimeMs && simulationTimeMs > 0) {
    resetConductionSystem()
    cycleNumber++
  }

  updateConductionSystem(currentCycleTimeMs)
  updateActivationArray(deltaTimeMs)

  simulationTimeMs += deltaTimeMs
}

function calculateCardiacOutput(): number {
  const baseOutput = 5.0
  return baseOutput * heartRateMultiplier
}

function calculateAVDelay(): number {
  return ATRIOVENTRICULAR_NODE_DELAY_MS / heartRateMultiplier
}

function sendMessage(): void {
  const transferArray = new Float32Array(activationArray)
  
  const data = {
    activationArray: transferArray,
    cycleNumber,
    avDelay: calculateAVDelay(),
    cardiacOutput: calculateCardiacOutput(),
    simulationTime: simulationTimeMs,
  }

  ;(self as unknown as Worker).postMessage(data, [transferArray.buffer])
}

let lastSimulationTimeMs = performance.now()
let animationFrameId: number

function simulationLoop(): void {
  const now = performance.now()
  const realDeltaMs = now - lastSimulationTimeMs
  lastSimulationTimeMs = now

  if (!isPaused) {
    const steps = Math.max(1, Math.floor(realDeltaMs / SIMULATION_STEP_MS))
    for (let i = 0; i < steps; i++) {
      simulationStep(SIMULATION_STEP_MS)
    }
  }

  if (now - lastMessageTimeMs >= MESSAGE_INTERVAL_MS) {
    sendMessage()
    lastMessageTimeMs = now
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
      if (!isPaused) {
        lastSimulationTimeMs = performance.now()
      }
      break
    case 'START':
      resetConductionSystem()
      cycleNumber = 0
      simulationTimeMs = 0
      lastSimulationTimeMs = performance.now()
      lastMessageTimeMs = 0
      break
    default:
      break
  }
})

animationFrameId = requestAnimationFrame(simulationLoop)

export {}
