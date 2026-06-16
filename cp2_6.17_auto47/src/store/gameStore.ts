import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { dbSave, dbLoad, dbGetAllSaves, dbDeleteSave } from '../utils/db'

export type NodeType = 'dialogue' | 'choice' | 'event'

export interface Connection {
  label: string
  targetNodeId: string
}

export interface StoryNode {
  id: string
  type: NodeType
  title: string
  text: string
  x: number
  y: number
  outputs: Connection[]
}

export interface PlayerState {
  playerName: string
  decisions: Record<string, string>
  inventory: string[]
}

export interface SaveData {
  nodeId: string
  playerState: PlayerState
  timestamp: number
  storyData: {
    nodes: StoryNode[]
  }
}

export interface StoryFile {
  nodes: StoryNode[]
  initialNodeId: string
  initialState: PlayerState
}

interface GameState {
  nodes: StoryNode[]
  selectedNodeId: string | null
  currentNodeId: string | null
  playerState: PlayerState
  saveSlots: (SaveData | null)[]
  isSaving: boolean
  lastDecision: string | null
  decisionVisible: boolean
  initialNodeId: string
  importResult: { success: boolean; message: string } | null

  addNode: (type: NodeType, x?: number, y?: number) => void
  removeNode: (id: string) => void
  updateNode: (id: string, updates: Partial<StoryNode>) => void
  selectNode: (id: string | null) => void
  moveNode: (id: string, x: number, y: number) => void
  addConnection: (nodeId: string, connection: Connection) => void
  removeConnection: (nodeId: string, targetNodeId: string) => void

  setCurrentNode: (id: string) => void
  makeDecision: (key: string, value: string) => void
  addItem: (item: string) => void
  removeItem: (item: string) => void
  setPlayerName: (name: string) => void

  saveProgress: (slotIndex: number) => Promise<void>
  loadProgress: (slotIndex: number) => Promise<void>
  loadAllSaves: () => Promise<void>
  deleteSave: (slotIndex: number) => Promise<void>
  setSaving: (saving: boolean) => void

  importStory: (jsonStr: string) => boolean
  exportStory: () => string
  setImportResult: (result: { success: boolean; message: string } | null) => void

  setLastDecision: (decision: string) => void
  hideDecision: () => void
  initializeSampleStory: () => void
  resetEngine: () => void
}

const MAX_SAVE_SLOTS = 5

const initialPlayerState: PlayerState = {
  playerName: '旅行者',
  decisions: {},
  inventory: [],
}

function createSampleStory(): { nodes: StoryNode[]; initialNodeId: string } {
  const startId = uuidv4()
  const choiceAId = uuidv4()
  const choiceBId = uuidv4()
  const eventAId = uuidv4()
  const eventBId = uuidv4()
  const endId = uuidv4()

  return {
    initialNodeId: startId,
    nodes: [
      {
        id: startId,
        type: 'dialogue',
        title: '星际港口',
        text: '你站在银河联邦最大的星际港口——天枢站的中央大厅。巨大的穹顶外，星际飞船穿梭不息。一个全息投影出现在你面前："旅行者，欢迎来到天枢站。你有两个选择：前往未知星域探索，还是前往核心区获取情报。"',
        x: 400,
        y: 80,
        outputs: [{ label: '继续', targetNodeId: choiceAId }],
      },
      {
        id: choiceAId,
        type: 'choice',
        title: '命运抉择',
        text: '全息投影闪烁着等待你的回答。两条截然不同的道路在你面前展开——',
        x: 400,
        y: 240,
        outputs: [
          { label: '前往未知星域探索', targetNodeId: choiceBId },
          { label: '前往核心区获取情报', targetNodeId: eventAId },
        ],
      },
      {
        id: choiceBId,
        type: 'choice',
        title: '未知星域',
        text: '你登上了前往未知星域的飞船。航行途中，传感器探测到了两个异常信号源：一个来自废弃的空间站，另一个来自一颗未知的行星。',
        x: 200,
        y: 400,
        outputs: [
          { label: '调查空间站', targetNodeId: eventBId },
          { label: '登陆未知行星', targetNodeId: endId },
        ],
      },
      {
        id: eventAId,
        type: 'event',
        title: '情报交易',
        text: '你深入核心区，在一间幽暗的酒吧中找到了情报贩子。他用沙哑的声音说："你想要的信息……代价不小。"你将随身携带的能量核心交给了他。他递给你一枚加密的数据芯片。',
        x: 600,
        y: 400,
        outputs: [{ label: '继续', targetNodeId: endId }],
      },
      {
        id: eventBId,
        type: 'event',
        title: '空间站秘密',
        text: '废弃空间站的走廊中闪烁着应急灯光。你在一个密封的实验室中发现了远古文明的遗物——一块记录着星图的水晶。这将改变人类对宇宙的认知。',
        x: 100,
        y: 560,
        outputs: [{ label: '继续', targetNodeId: endId }],
      },
      {
        id: endId,
        type: 'event',
        title: '旅途的终点',
        text: '你的选择塑造了这段旅程。无论结果如何，你都在浩瀚星海中留下了自己的足迹。银河的历史将记住这位勇敢的旅行者。',
        x: 400,
        y: 560,
        outputs: [],
      },
    ],
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  nodes: [],
  selectedNodeId: null,
  currentNodeId: null,
  playerState: { ...initialPlayerState },
  saveSlots: Array(MAX_SAVE_SLOTS).fill(null),
  isSaving: false,
  lastDecision: null,
  decisionVisible: false,
  initialNodeId: '',
  importResult: null,

  addNode: (type, x = 300, y = 200) => {
    const node: StoryNode = {
      id: uuidv4(),
      type,
      title: type === 'dialogue' ? '新对话节点' : type === 'choice' ? '新选择节点' : '新事件节点',
      text: '',
      x,
      y,
      outputs: [],
    }
    set((s) => ({ nodes: [...s.nodes, node] }))
  },

  removeNode: (id) => {
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id).map((n) => ({
        ...n,
        outputs: n.outputs.filter((o) => o.targetNodeId !== id),
      })),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    }))
  },

  updateNode: (id, updates) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }))
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  moveNode: (id, x, y) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }))
  },

  addConnection: (nodeId, connection) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, outputs: [...n.outputs, connection] } : n
      ),
    }))
  },

  removeConnection: (nodeId, targetNodeId) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, outputs: n.outputs.filter((o) => o.targetNodeId !== targetNodeId) }
          : n
      ),
    }))
  },

  setCurrentNode: (id) => set({ currentNodeId: id }),

  makeDecision: (key, value) => {
    set((s) => ({
      playerState: {
        ...s.playerState,
        decisions: { ...s.playerState.decisions, [key]: value },
      },
      lastDecision: value,
      decisionVisible: true,
    }))
    setTimeout(() => get().hideDecision(), 2000)
  },

  addItem: (item) => {
    set((s) => ({
      playerState: { ...s.playerState, inventory: [...s.playerState.inventory, item] },
    }))
  },

  removeItem: (item) => {
    set((s) => ({
      playerState: {
        ...s.playerState,
        inventory: s.playerState.inventory.filter((i) => i !== item),
      },
    }))
  },

  setPlayerName: (name) => {
    set((s) => ({ playerState: { ...s.playerState, playerName: name } }))
  },

  saveProgress: async (slotIndex) => {
    const s = get()
    if (slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) return
    set({ isSaving: true })
    try {
      const saveData: SaveData = {
        nodeId: s.currentNodeId ?? s.initialNodeId,
        playerState: { ...s.playerState },
        timestamp: Date.now(),
        storyData: { nodes: [...s.nodes] },
      }
      await dbSave(slotIndex, saveData)
      const newSlots = [...s.saveSlots]
      newSlots[slotIndex] = saveData
      set({ saveSlots: newSlots, isSaving: false })
    } catch {
      set({ isSaving: false })
    }
  },

  loadProgress: async (slotIndex) => {
    try {
      const data = (await dbLoad(slotIndex)) as SaveData | null
      if (data) {
        set({
          nodes: data.storyData.nodes,
          currentNodeId: data.nodeId,
          playerState: { ...data.playerState },
          initialNodeId: data.nodeId,
        })
      }
    } catch {
      // ignore
    }
  },

  loadAllSaves: async () => {
    try {
      const map = await dbGetAllSaves()
      const slots: (SaveData | null)[] = Array(MAX_SAVE_SLOTS).fill(null)
      map.forEach((data, idx) => {
        if (idx >= 0 && idx < MAX_SAVE_SLOTS) {
          slots[idx] = data as SaveData
        }
      })
      set({ saveSlots: slots })
    } catch {
      // ignore
    }
  },

  deleteSave: async (slotIndex) => {
    try {
      await dbDeleteSave(slotIndex)
      const newSlots = [...get().saveSlots]
      newSlots[slotIndex] = null
      set({ saveSlots: newSlots })
    } catch {
      // ignore
    }
  },

  setSaving: (saving) => set({ isSaving: saving }),

  importStory: (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr) as StoryFile
      if (!data.nodes || !Array.isArray(data.nodes)) {
        set({ importResult: { success: false, message: '缺少节点列表(nodes)字段' } })
        return false
      }
      if (!data.initialNodeId || typeof data.initialNodeId !== 'string') {
        set({ importResult: { success: false, message: '缺少初始节点ID(initialNodeId)字段' } })
        return false
      }
      for (const node of data.nodes) {
        if (!node.id || !node.type || !node.title) {
          set({ importResult: { success: false, message: `节点 "${node.title || node.id}" 缺少必要字段(id/type/title)` } })
          return false
        }
        if (!['dialogue', 'choice', 'event'].includes(node.type)) {
          set({ importResult: { success: false, message: `节点 "${node.title}" 的类型无效: ${node.type}` } })
          return false
        }
      }
      const initNode = data.nodes.find((n) => n.id === data.initialNodeId)
      if (!initNode) {
        set({ importResult: { success: false, message: '初始节点ID在节点列表中不存在' } })
        return false
      }
      set({
        nodes: data.nodes,
        initialNodeId: data.initialNodeId,
        playerState: data.initialState ? { ...data.initialState } : { ...initialPlayerState },
        currentNodeId: null,
        selectedNodeId: null,
        importResult: { success: true, message: `成功导入 ${data.nodes.length} 个节点` },
      })
      return true
    } catch (e) {
      set({ importResult: { success: false, message: 'JSON 解析失败，请检查文件格式' } })
      return false
    }
  },

  exportStory: () => {
    const s = get()
    const storyFile: StoryFile = {
      nodes: s.nodes,
      initialNodeId: s.initialNodeId,
      initialState: { ...initialPlayerState },
    }
    return JSON.stringify(storyFile, null, 2)
  },

  setImportResult: (result) => set({ importResult: result }),

  setLastDecision: (decision) => set({ lastDecision: decision, decisionVisible: true }),

  hideDecision: () => set({ decisionVisible: false, lastDecision: null }),

  initializeSampleStory: () => {
    const { nodes, initialNodeId } = createSampleStory()
    set({
      nodes,
      initialNodeId,
      currentNodeId: initialNodeId,
      selectedNodeId: null,
      playerState: { ...initialPlayerState },
    })
  },

  resetEngine: () => {
    const s = get()
    set({
      currentNodeId: s.initialNodeId,
      playerState: { ...initialPlayerState },
    })
  },
}))
