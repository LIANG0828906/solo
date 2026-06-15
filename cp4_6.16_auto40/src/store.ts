import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { get, set } from 'idb-keyval'

export interface NodeOption {
  id: string
  text: string
  targetNodeId: string | null
}

export interface StoryNode {
  id: string
  title: string
  description: string
  options: NodeOption[]
  x: number
  y: number
  isStart?: boolean
  isEnd?: boolean
}

export interface Connection {
  id: string
  sourceNodeId: string
  sourceOptionId: string
  targetNodeId: string
}

export type AppMode = 'editor' | 'reader'

export interface DragState {
  isDragging: boolean
  nodeId: string | null
  startX: number
  startY: number
  nodeStartX: number
  nodeStartY: number
}

export interface PanState {
  x: number
  y: number
  scale: number
}

export interface ConnectingState {
  isConnecting: boolean
  sourceNodeId: string | null
  sourceOptionId: string | null
  mouseX: number
  mouseY: number
}

interface StoreState {
  nodes: StoryNode[]
  connections: Connection[]
  mode: AppMode
  dragState: DragState
  panState: PanState
  selectedNodeId: string | null
  highlightedNodeId: string | null
  connecting: ConnectingState
  currentReaderNodeId: string | null
  visitedNodeIds: Set<string>
  panelOpen: boolean
  isHydrated: boolean

  addNode: (x?: number, y?: number) => void
  updateNode: (id: string, updates: Partial<StoryNode>) => void
  deleteNode: (id: string) => void
  reorderNodes: (fromIndex: number, toIndex: number) => void
  addOption: (nodeId: string) => void
  updateOption: (nodeId: string, optionId: string, updates: Partial<NodeOption>) => void
  deleteOption: (nodeId: string, optionId: string) => void
  addConnection: (sourceNodeId: string, sourceOptionId: string, targetNodeId: string) => void
  deleteConnection: (connectionId: string) => void
  setMode: (mode: AppMode) => void
  setDragState: (dragState: Partial<DragState>) => void
  setPanState: (panState: Partial<PanState>) => void
  setSelectedNodeId: (id: string | null) => void
  setHighlightedNodeId: (id: string | null) => void
  setConnecting: (connecting: Partial<ConnectingState>) => void
  setCurrentReaderNodeId: (id: string | null) => void
  addVisitedNode: (id: string) => void
  resetReader: () => void
  setPanelOpen: (open: boolean) => void
  panToNode: (nodeId: string, containerWidth: number, containerHeight: number) => void
  persistToIdb: () => Promise<void>
  loadFromIdb: () => Promise<void>
  clearHighlightTimeout: () => void
}

const defaultNodes: StoryNode[] = [
  {
    id: 'node-start',
    title: '故事的开端',
    description: '你站在一条古老的森林小径上，空气中弥漫着神秘的气息。夕阳西下，金色的阳光透过树叶的缝隙洒落在你面前。前方有两条路：一条通向幽深的山谷，另一条蜿蜒向上通往废弃的古堡。',
    options: [
      { id: 'opt-1', text: '走向幽深的山谷', targetNodeId: 'node-valley' },
      { id: 'opt-2', text: '攀登古堡', targetNodeId: 'node-castle' },
      { id: 'opt-3', text: '原地等待', targetNodeId: 'node-wait' },
    ],
    x: 400,
    y: 200,
    isStart: true,
  },
  {
    id: 'node-valley',
    title: '幽深山谷',
    description: '山谷中弥漫着淡淡的薄雾，你听到远处传来潺潺的溪水声。突然间，一只银白色的狐狸出现在你面前，它那双智慧的眼睛仿佛能洞察一切。',
    options: [
      { id: 'opt-4', text: '跟随狐狸', targetNodeId: 'node-fox-end' },
      { id: 'opt-5', text: '继续探索溪水', targetNodeId: 'node-river' },
    ],
    x: 100,
    y: 500,
  },
  {
    id: 'node-castle',
    title: '废弃古堡',
    description: '古堡的大门虚掩着，仿佛在邀请你进入。推开门后，大厅中央的水晶吊灯依然散发着微弱的光芒。墙上的画像似乎在注视着你。',
    options: [
      { id: 'opt-6', text: '上楼探索', targetNodeId: 'node-upstairs' },
      { id: 'opt-7', text: '检查画像', targetNodeId: 'node-portrait-end' },
    ],
    x: 700,
    y: 500,
  },
  {
    id: 'node-wait',
    title: '原地等待',
    description: '你决定原地等待。时间一分一秒过去，夜色渐浓。当第一颗星星出现时，天空突然划过一道流星，落在你面前不远处...',
    options: [
      { id: 'opt-8', text: '查看流星落点', targetNodeId: 'node-meteor-end' },
    ],
    x: 400,
    y: 550,
    isEnd: true,
  },
  {
    id: 'node-fox-end',
    title: '灵狐的指引',
    description: '银白色的狐狸带你来到了一个隐藏的花园。花园中央有一座古老的许愿池，池水中倒映着星空。狐狸轻声说："许个愿吧，善良的旅人。"——你的冒险在这里画上圆满的句号。',
    options: [],
    x: -200,
    y: 800,
    isEnd: true,
  },
  {
    id: 'node-river',
    title: '神秘溪水',
    description: '溪水清澈见底，你看到水底有什么东西在闪闪发光。那是一枚古老的钥匙，钥匙上刻着"希望"二字。你拾起它，感觉人生从此充满了无限可能。',
    options: [],
    x: 100,
    y: 850,
    isEnd: true,
  },
  {
    id: 'node-upstairs',
    title: '楼上的秘密',
    description: '楼上的房间里放着一本古老的日记本。翻开它，你发现这是这座古堡前任主人的日记。最后一页写着："恭喜勇敢的探索者，这座古堡的宝藏属于你了！"',
    options: [
      { id: 'opt-9', text: '带着宝藏离开', targetNodeId: 'node-treasure-end' },
    ],
    x: 900,
    y: 800,
  },
  {
    id: 'node-portrait-end',
    title: '画中人',
    description: '当你凝视画像时，画中的人突然对你眨了眨眼！下一秒，你感觉自己被吸入了画中世界，开始了一段全新的旅程...',
    options: [],
    x: 700,
    y: 850,
    isEnd: true,
  },
  {
    id: 'node-meteor-end',
    title: '星辰之礼',
    description: '流星落地后化作一颗璀璨的宝石。当你触碰它的瞬间，脑海中涌入无穷的智慧——你成为了这个世界上最博学的智者。',
    options: [],
    x: 400,
    y: 850,
    isEnd: true,
  },
  {
    id: 'node-treasure-end',
    title: '古堡宝藏',
    description: '你带着满满的宝藏离开了古堡，从此过上了富足而幸福的生活。而古堡的秘密，只有你一个人知道...',
    options: [],
    x: 900,
    y: 1100,
    isEnd: true,
  },
]

const generateDefaultConnections = (nodes: StoryNode[]): Connection[] => {
  const connections: Connection[] = []
  nodes.forEach((node) => {
    node.options.forEach((opt) => {
      if (opt.targetNodeId) {
        connections.push({
          id: `conn-${node.id}-${opt.id}`,
          sourceNodeId: node.id,
          sourceOptionId: opt.id,
          targetNodeId: opt.targetNodeId,
        })
      }
    })
  })
  return connections
}

let highlightTimer: ReturnType<typeof setTimeout> | null = null

export const useStore = create<StoreState>((set, get) => ({
  nodes: defaultNodes,
  connections: generateDefaultConnections(defaultNodes),
  mode: 'editor',
  dragState: {
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    nodeStartX: 0,
    nodeStartY: 0,
  },
  panState: {
    x: 0,
    y: 0,
    scale: 1,
  },
  selectedNodeId: null,
  highlightedNodeId: null,
  connecting: {
    isConnecting: false,
    sourceNodeId: null,
    sourceOptionId: null,
    mouseX: 0,
    mouseY: 0,
  },
  currentReaderNodeId: null,
  visitedNodeIds: new Set(),
  panelOpen: true,
  isHydrated: false,

  addNode: (x = 400, y = 300) => {
    const id = `node-${uuidv4()}`
    const newNode: StoryNode = {
      id,
      title: '新节点',
      description: '在这里描述你的场景...',
      options: [
        { id: `opt-${uuidv4()}`, text: '选项 1', targetNodeId: null },
        { id: `opt-${uuidv4()}`, text: '选项 2', targetNodeId: null },
      ],
      x,
      y,
    }
    set((state) => ({ nodes: [...state.nodes, newNode] }))
    get().persistToIdb()
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }))
    get().persistToIdb()
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter(
        (c) => c.sourceNodeId !== id && c.targetNodeId !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }))
    get().persistToIdb()
  },

  reorderNodes: (fromIndex, toIndex) => {
    set((state) => {
      const newNodes = [...state.nodes]
      const [removed] = newNodes.splice(fromIndex, 1)
      newNodes.splice(toIndex, 0, removed)
      return { nodes: newNodes }
    })
    get().persistToIdb()
  },

  addOption: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId && n.options.length < 4) {
          return {
            ...n,
            options: [
              ...n.options,
              { id: `opt-${uuidv4()}`, text: `选项 ${n.options.length + 1}`, targetNodeId: null },
            ],
          }
        }
        return n
      }),
    }))
    get().persistToIdb()
  },

  updateOption: (nodeId, optionId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            options: n.options.map((o) =>
              o.id === optionId ? { ...o, ...updates } : o
            ),
          }
        }
        return n
      }),
    }))
    if (updates.targetNodeId !== undefined) {
      get().persistToIdb()
    }
  },

  deleteOption: (nodeId, optionId) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId && n.options.length > 2) {
          return {
            ...n,
            options: n.options.filter((o) => o.id !== optionId),
          }
        }
        return n
      }),
      connections: state.connections.filter(
        (c) => !(c.sourceNodeId === nodeId && c.sourceOptionId === optionId)
      ),
    }))
    get().persistToIdb()
  },

  addConnection: (sourceNodeId, sourceOptionId, targetNodeId) => {
    set((state) => {
      const existing = state.connections.find(
        (c) => c.sourceNodeId === sourceNodeId && c.sourceOptionId === sourceOptionId
      )
      if (existing) return state

      const newConn: Connection = {
        id: `conn-${uuidv4()}`,
        sourceNodeId,
        sourceOptionId,
        targetNodeId,
      }

      const updatedNodes = state.nodes.map((n) => {
        if (n.id === sourceNodeId) {
          return {
            ...n,
            options: n.options.map((o) =>
              o.id === sourceOptionId ? { ...o, targetNodeId } : o
            ),
          }
        }
        return n
      })

      return {
        connections: [...state.connections, newConn],
        nodes: updatedNodes,
      }
    })
    get().persistToIdb()
  },

  deleteConnection: (connectionId) => {
    set((state) => {
      const conn = state.connections.find((c) => c.id === connectionId)
      if (!conn) return state
      return {
        connections: state.connections.filter((c) => c.id !== connectionId),
        nodes: state.nodes.map((n) => {
          if (n.id === conn.sourceNodeId) {
            return {
              ...n,
              options: n.options.map((o) =>
                o.id === conn.sourceOptionId ? { ...o, targetNodeId: null } : o
              ),
            }
          }
          return n
        }),
      }
    })
    get().persistToIdb()
  },

  setMode: (mode) => set({ mode }),

  setDragState: (dragState) =>
    set((state) => ({ dragState: { ...state.dragState, ...dragState } })),

  setPanState: (panState) =>
    set((state) => ({ panState: { ...state.panState, ...panState } })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setHighlightedNodeId: (id) => {
    if (highlightTimer) clearTimeout(highlightTimer)
    set({ highlightedNodeId: id })
    if (id) {
      highlightTimer = setTimeout(() => {
        set({ highlightedNodeId: null })
      }, 1500)
    }
  },

  setConnecting: (connecting) =>
    set((state) => ({ connecting: { ...state.connecting, ...connecting } })),

  setCurrentReaderNodeId: (id) => {
    set({ currentReaderNodeId: id })
    if (id) {
      get().addVisitedNode(id)
    }
  },

  addVisitedNode: (id) =>
    set((state) => {
      const newSet = new Set(state.visitedNodeIds)
      newSet.add(id)
      return { visitedNodeIds: newSet }
    }),

  resetReader: () => {
    const startNode = get().nodes.find((n) => n.isStart) || get().nodes[0]
    set({
      currentReaderNodeId: startNode?.id || null,
      visitedNodeIds: startNode ? new Set([startNode.id]) : new Set(),
    })
  },

  setPanelOpen: (open) => set({ panelOpen: open }),

  panToNode: (nodeId, containerWidth, containerHeight) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return

    const { scale } = get().panState
    const nodeCenterX = node.x + 140
    const nodeCenterY = node.y + 120

    const targetX = containerWidth / 2 / scale - nodeCenterX
    const targetY = containerHeight / 2 / scale - nodeCenterY

    get().setPanState({ x: targetX, y: targetY })
    get().setHighlightedNodeId(nodeId)
  },

  persistToIdb: async () => {
    try {
      const { nodes, connections, panState } = get()
      await set('wordweaver_nodes', nodes)
      await set('wordweaver_connections', connections)
      await set('wordweaver_pan', panState)
    } catch (e) {
      console.warn('IndexedDB persist failed:', e)
    }
  },

  loadFromIdb: async () => {
    try {
      const nodes = await get<StoryNode[]>('wordweaver_nodes')
      const connections = await get<Connection[]>('wordweaver_connections')
      const panState = await get<PanState>('wordweaver_pan')

      const updates: Partial<StoreState> = {}
      if (Array.isArray(nodes) && nodes.length > 0) updates.nodes = nodes
      if (Array.isArray(connections)) updates.connections = connections
      if (panState && typeof panState === 'object' && 'scale' in panState) updates.panState = panState
      updates.isHydrated = true

      set((state) => ({
        ...state,
        ...(updates as Partial<StoreState>),
      }))
    } catch (e) {
      console.warn('IndexedDB load failed, using defaults:', e)
      set({ isHydrated: true })
    }
  },

  clearHighlightTimeout: () => {
    if (highlightTimer) {
      clearTimeout(highlightTimer)
      highlightTimer = null
    }
  },
}))
