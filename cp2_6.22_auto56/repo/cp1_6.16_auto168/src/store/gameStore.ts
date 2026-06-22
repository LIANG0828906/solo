import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { NetworkNode, LogEntry, LeaderboardEntry, HackResult, FirewallChoice, GameStatus, AnimationEvent } from '@/types'
import { generateNetwork as generateNetworkUtil } from '@/utils/nodeGenerator'
import { calculateScore } from '@/utils/scoring'

interface GameState {
  nodes: Map<string, NetworkNode>
  entryNodeId: string
  targetNodeId: string

  codeFragments: number
  maxFragments: number

  score: number
  capturedCount: number
  totalNodes: number
  startTime: number
  elapsedTime: number

  hackCount: number
  lastFirewallTime: number
  firewallActive: boolean
  currentFirewallChoices: FirewallChoice[] | null
  halfDefenseUntil: number

  operationLogs: LogEntry[]

  animationEvents: AnimationEvent[]

  gameStatus: GameStatus

  leaderboard: LeaderboardEntry[]
}

interface GameActions {
  generateNetwork: (canvasWidth: number, canvasHeight: number) => void
  hackNode: (nodeId: string) => HackResult
  applyFirewallChoice: (choiceId: string) => void
  closeFirewallModal: () => void
  resetGame: (canvasWidth: number, canvasHeight: number) => void
  regenerateFragments: () => void
  checkFirewallTrigger: () => void
  tickTime: () => void
  addLog: (message: string) => void
  addAnimationEvent: (event: AnimationEvent) => void
  clearExpiredAnimations: (now: number) => void
  saveToLeaderboard: () => void
  loadLeaderboard: () => void
  getAdjacentCaptured: (nodeId: string) => boolean
  getEffectiveDefense: (nodeId: string) => number
}

export type GameStore = GameState & GameActions

const FIREWALL_TEMPLATES = [
  {
    type: 'redirect' as const,
    labels: [
      { label: '重定向流量到诱饵节点', description: '可能获得额外碎片或丢失碎片' },
      { label: '流量镜像转发', description: '随机获得或消耗碎片' },
    ],
    effects: [
      { type: 'addFragments' as const, value: () => Math.floor(Math.random() * 3) + 1 },
      { type: 'removeFragments' as const, value: () => Math.floor(Math.random() * 3) + 1 },
    ],
  },
  {
    type: 'inject' as const,
    labels: [
      { label: '注入病毒数据包', description: '削弱目标防御或获得碎片' },
      { label: 'SQL注入攻击', description: '半防御效果或额外碎片' },
    ],
    effects: [
      { type: 'halfDefense' as const, value: 1, duration: () => Math.floor(Math.random() * 3) + 10 },
      { type: 'addFragments' as const, value: () => Math.floor(Math.random() * 3) + 1 },
    ],
  },
  {
    type: 'disguise' as const,
    labels: [
      { label: '伪装管理员身份', description: '获得碎片或削弱防御' },
      { label: '伪造访问令牌', description: '额外碎片或半防御效果' },
    ],
    effects: [
      { type: 'addFragments' as const, value: () => Math.floor(Math.random() * 3) + 1 },
      { type: 'halfDefense' as const, value: 1, duration: () => Math.floor(Math.random() * 3) + 10 },
    ],
  },
]

function generateFirewallChoices(): FirewallChoice[] {
  const shuffled = [...FIREWALL_TEMPLATES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map((template) => {
    const labelIdx = Math.floor(Math.random() * template.labels.length)
    const effectIdx = Math.floor(Math.random() * template.effects.length)
    const labelData = template.labels[labelIdx]
    const effectData = template.effects[effectIdx]

    const choice: FirewallChoice = {
      id: uuidv4(),
      label: labelData.label,
      description: labelData.description,
      effect: {
        type: effectData.type,
        value: typeof effectData.value === 'function' ? effectData.value() : effectData.value,
      },
    }

    if (effectData.type === 'halfDefense' && 'duration' in effectData && typeof effectData.duration === 'function') {
      choice.effect.duration = effectData.duration()
    }

    return choice
  })
}

export const useGameStore = create<GameStore>((set, get) => ({
  nodes: new Map(),
  entryNodeId: '',
  targetNodeId: '',

  codeFragments: 3,
  maxFragments: 10,

  score: 0,
  capturedCount: 0,
  totalNodes: 0,
  startTime: Date.now(),
  elapsedTime: 0,

  hackCount: 0,
  lastFirewallTime: Date.now(),
  firewallActive: false,
  currentFirewallChoices: null,
  halfDefenseUntil: 0,

  operationLogs: [],
  animationEvents: [],

  gameStatus: 'playing',

  leaderboard: (() => {
    try {
      const stored = localStorage.getItem('hack_sim_leaderboard')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })(),

  loadLeaderboard: () => {
    try {
      const stored = localStorage.getItem('hack_sim_leaderboard')
      set({ leaderboard: stored ? JSON.parse(stored) : [] })
    } catch {
      set({ leaderboard: [] })
    }
  },

  saveToLeaderboard: () => {
    const state = get()
    const finalScore = calculateScore({
      capturedCount: state.capturedCount,
      totalNodes: state.totalNodes,
      elapsedTime: state.elapsedTime,
      remainingFragments: state.codeFragments,
      maxFragments: state.maxFragments,
    })

    const entry: LeaderboardEntry = {
      id: uuidv4(),
      score: finalScore,
      time: state.elapsedTime,
      date: Date.now(),
    }

    set((state) => {
      const newLeaderboard = [...state.leaderboard, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      localStorage.setItem('hack_sim_leaderboard', JSON.stringify(newLeaderboard))
      return { leaderboard: newLeaderboard, score: finalScore }
    })
  },

  generateNetwork: (canvasWidth: number, canvasHeight: number) => {
    const { nodes, entryId, targetId } = generateNetworkUtil(canvasWidth, canvasHeight)
    const totalNodes = nodes.size

    get().addLog('网络拓扑初始化完成，准备入侵')

    set(() => ({
      nodes,
      entryNodeId: entryId,
      targetNodeId: targetId,
      totalNodes,
      capturedCount: 1,
      startTime: Date.now(),
      elapsedTime: 0,
      gameStatus: 'playing',
    }))
  },

  resetGame: (canvasWidth: number, canvasHeight: number) => {
    get().generateNetwork(canvasWidth, canvasHeight)
    set(() => ({
      codeFragments: 3,
      score: 0,
      hackCount: 0,
      lastFirewallTime: Date.now(),
      halfDefenseUntil: 0,
      operationLogs: [],
      animationEvents: [],
      firewallActive: false,
      currentFirewallChoices: null,
    }))
  },

  getAdjacentCaptured: (nodeId: string) => {
    const state = get()
    const node = state.nodes.get(nodeId)
    if (!node) return false

    const isCaptured = (id: string) => {
      const n = state.nodes.get(id)
      return !!n && (n.status === 'captured' || n.status === 'entry')
    }

    if (node.parentId && isCaptured(node.parentId)) return true
    for (const childId of node.childrenIds) {
      if (isCaptured(childId)) return true
    }
    return false
  },

  getEffectiveDefense: (nodeId: string) => {
    const state = get()
    const node = state.nodes.get(nodeId)
    if (!node) return 0

    const now = Date.now()
    if (now < state.halfDefenseUntil && state.getAdjacentCaptured(nodeId)) {
      return Math.ceil(node.defense / 2)
    }
    return node.defense
  },

  hackNode: (nodeId: string): HackResult => {
    const state = get()
    const node = state.nodes.get(nodeId)

    if (!node || node.status !== 'locked') return 'invalid'
    if (!state.getAdjacentCaptured(nodeId)) return 'invalid'

    const effDef = state.getEffectiveDefense(nodeId)
    const fragments = state.codeFragments

    if (fragments <= 0) return 'invalid'

    const animEvent: AnimationEvent = {
      type: fragments >= effDef ? 'pulse' : 'flash',
      nodeId,
      startTime: Date.now(),
      duration: 500,
    }
    state.addAnimationEvent(animEvent)

    let result: HackResult

    if (fragments >= effDef) {
      set((state) => {
        const newNodes = new Map(state.nodes)
        const targetNode = { ...newNodes.get(nodeId)!, status: 'captured' as const }
        newNodes.set(nodeId, targetNode)

        const newCapturedCount = state.capturedCount + 1
        const isCompleted = newCapturedCount === state.totalNodes

        if (isCompleted) {
          setTimeout(() => get().saveToLeaderboard(), 0)
        }

        return {
          nodes: newNodes,
          capturedCount: newCapturedCount,
          codeFragments: state.codeFragments - effDef,
          hackCount: state.hackCount + 1,
          gameStatus: isCompleted ? 'completed' : state.gameStatus,
        }
      })

      get().addLog(`入侵成功：攻破节点「${node.name}」，消耗 ${effDef} 碎片`)
      result = 'success'
    } else {
      set((state) => ({
        codeFragments: state.codeFragments - 1,
        hackCount: state.hackCount + 1,
      }))

      get().addLog(`入侵失败：节点「${node.name}」防御过高，消耗 1 碎片`)
      result = 'failure'
    }

    get().checkFirewallTrigger()
    return result
  },

  addLog: (message: string) => {
    set((state) => {
      const newLogs = [...state.operationLogs, { timestamp: Date.now(), message }]
      if (newLogs.length > 50) {
        newLogs.splice(0, newLogs.length - 50)
      }
      return { operationLogs: newLogs }
    })
  },

  addAnimationEvent: (event: AnimationEvent) => {
    set((state) => ({
      animationEvents: [...state.animationEvents, event],
    }))
  },

  clearExpiredAnimations: (now: number) => {
    set((state) => ({
      animationEvents: state.animationEvents.filter(
        (ev) => ev.startTime + ev.duration >= now
      ),
    }))
  },

  regenerateFragments: () => {
    set((state) => ({
      codeFragments: Math.min(state.maxFragments, state.codeFragments + 1),
    }))
    get().addLog('系统生成了 1 个新的代码碎片')
  },

  tickTime: () => {
    set((state) => ({
      elapsedTime: Math.floor((Date.now() - state.startTime) / 1000),
    }))
    get().checkFirewallTrigger()
  },

  checkFirewallTrigger: () => {
    const state = get()
    if (state.firewallActive || state.gameStatus !== 'playing') return

    const now = Date.now()
    const shouldTrigger =
      (state.hackCount > 0 && state.hackCount % 5 === 0) ||
      now - state.lastFirewallTime >= 30000

    if (shouldTrigger) {
      const choices = generateFirewallChoices()
      set(() => ({
        lastFirewallTime: now,
        firewallActive: true,
        currentFirewallChoices: choices,
      }))
      get().addLog('⚠️ 防火墙警报：检测到异常流量，请选择应对策略')
    }
  },

  applyFirewallChoice: (choiceId: string) => {
    const state = get()
    const choices = state.currentFirewallChoices
    if (!choices) return

    const choice = choices.find((c) => c.id === choiceId)
    if (!choice) return

    const effect = choice.effect

    if (effect.type === 'addFragments') {
      set((s) => ({
        codeFragments: Math.min(s.maxFragments, s.codeFragments + effect.value),
      }))
      get().addLog(`策略生效：获得 ${effect.value} 个代码碎片`)
    } else if (effect.type === 'removeFragments') {
      set((s) => ({
        codeFragments: Math.max(0, s.codeFragments - effect.value),
      }))
      get().addLog(`策略生效：损失 ${effect.value} 个代码碎片`)
    } else if (effect.type === 'halfDefense') {
      const duration = effect.duration || 10
      set(() => ({
        halfDefenseUntil: Date.now() + duration * 1000,
      }))
      get().addLog(`策略生效：后续 ${duration} 秒内相邻节点防御减半`)
    }

    set(() => ({
      firewallActive: false,
      currentFirewallChoices: null,
    }))
  },

  closeFirewallModal: () => {
    set(() => ({
      firewallActive: false,
      currentFirewallChoices: null,
    }))
  },
}))
