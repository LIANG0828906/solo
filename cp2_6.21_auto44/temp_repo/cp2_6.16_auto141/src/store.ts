import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { get, set } from 'idb-keyval'
import type { BoardStore, Card, Column, Priority } from './types'

const STORAGE_KEY = 'workflow-canvas-data'

const getDefaultColumns = (): Column[] => [
  { id: uuidv4(), title: '待办', order: 0 },
  { id: uuidv4(), title: '进行中', order: 1 },
  { id: uuidv4(), title: '已完成', order: 2 },
]

const getDefaultCards = (columns: Column[]): Card[] => [
  {
    id: uuidv4(),
    title: '设计首页原型',
    description: '完成产品首页的高保真设计稿，包含导航栏、Hero区域和功能模块',
    priority: 'high' as Priority,
    assignee: '张三',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: [{ id: uuidv4(), name: '设计', color: '#9333EA' }],
    columnId: columns[0].id,
    order: 0,
  },
  {
    id: uuidv4(),
    title: '搭建项目脚手架',
    description: '使用Vite初始化React+TypeScript项目，配置ESLint和Prettier',
    priority: 'medium' as Priority,
    assignee: '李四',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: [
      { id: uuidv4(), name: '前端', color: '#2563EB' },
      { id: uuidv4(), name: '基建', color: '#059669' },
    ],
    columnId: columns[0].id,
    order: 1,
  },
  {
    id: uuidv4(),
    title: '编写API接口文档',
    description: '整理后端所有RESTful接口，包含请求参数和响应示例',
    priority: 'low' as Priority,
    assignee: '王五',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: [{ id: uuidv4(), name: '文档', color: '#D97706' }],
    columnId: columns[1].id,
    order: 0,
  },
  {
    id: uuidv4(),
    title: '需求评审会议',
    description: '和产品、设计、测试团队完成Q2需求的评审工作',
    priority: 'high' as Priority,
    assignee: '张三',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: [{ id: uuidv4(), name: '会议', color: '#DC2626' }],
    columnId: columns[2].id,
    order: 0,
  },
]

export const useBoardStore = create<BoardStore>((set, get) => ({
  columns: [],
  cards: [],
  searchQuery: '',
  statsPanelOpen: false,
  editingCardId: null,
  confirmDeleteColumnId: null,

  initFromDB: async () => {
    try {
      const data = await get(STORAGE_KEY)
      if (data && (data as { columns: Column[] }).columns && (data as { cards: Card[] }).cards) {
        set({
          columns: (data as { columns: Column[] }).columns,
          cards: (data as { cards: Card[] }).cards,
        })
      } else {
        const columns = getDefaultColumns()
        const cards = getDefaultCards(columns)
        set({ columns, cards })
        await get().saveToDB()
      }
    } catch {
      const columns = getDefaultColumns()
      const cards = getDefaultCards(columns)
      set({ columns, cards })
    }
  },

  saveToDB: async () => {
    try {
      const { columns, cards } = get()
      await set(STORAGE_KEY, { columns, cards })
    } catch (e) {
      console.error('Failed to save to IndexedDB', e)
    }
  },

  addColumn: (title: string) => {
    const { columns } = get()
    const newColumn: Column = {
      id: uuidv4(),
      title,
      order: columns.length,
    }
    set({ columns: [...columns, newColumn] })
    get().saveToDB()
  },

  updateColumnTitle: (id: string, title: string) => {
    set({
      columns: get().columns.map((col) =>
        col.id === id ? { ...col, title } : col
      ),
    })
    get().saveToDB()
  },

  deleteColumn: (id: string) => {
    const { columns, cards } = get()
    const newColumns = columns
      .filter((col) => col.id !== id)
      .map((col, idx) => ({ ...col, order: idx }))
    const newCards = cards.filter((card) => card.columnId !== id)
    set({ columns: newColumns, cards: newCards, confirmDeleteColumnId: null })
    get().saveToDB()
  },

  addCard: (columnId: string, cardData: Omit<Card, 'id' | 'columnId' | 'order'>) => {
    const { cards } = get()
    const columnCards = cards
      .filter((c) => c.columnId === columnId)
      .sort((a, b) => a.order - b.order)
    const maxOrder = columnCards.length > 0 ? columnCards[columnCards.length - 1].order : -1
    const newCard: Card = {
      ...cardData,
      id: uuidv4(),
      columnId,
      order: maxOrder + 1,
    }
    set({ cards: [...cards, newCard] })
    get().saveToDB()
  },

  updateCard: (id: string, updates: Partial<Card>) => {
    set({
      cards: get().cards.map((card) =>
        card.id === id ? { ...card, ...updates } : card
      ),
    })
    get().saveToDB()
  },

  deleteCard: (id: string) => {
    set({ cards: get().cards.filter((card) => card.id !== id), editingCardId: null })
    get().saveToDB()
  },

  moveCard: (
    sourceColumnId: string,
    destinationColumnId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const { cards } = get()
    let sourceCards = cards
      .filter((c) => c.columnId === sourceColumnId)
      .sort((a, b) => a.order - b.order)
    let destCards = cards
      .filter((c) => c.columnId === destinationColumnId)
      .sort((a, b) => a.order - b.order)

    if (sourceIndex < 0 || sourceIndex >= sourceCards.length) return

    const [movedCard] = sourceCards.splice(sourceIndex, 1)

    if (sourceColumnId === destinationColumnId) {
      const insertIdx = Math.min(destinationIndex, sourceCards.length)
      sourceCards.splice(insertIdx, 0, movedCard)
      sourceCards = sourceCards.map((c, idx) => ({ ...c, order: idx }))
      const otherCards = cards.filter((c) => c.columnId !== sourceColumnId)
      set({ cards: [...otherCards, ...sourceCards] })
    } else {
      movedCard.columnId = destinationColumnId
      const insertIdx = Math.min(destinationIndex, destCards.length)
      destCards.splice(insertIdx, 0, movedCard)
      sourceCards = sourceCards.map((c, idx) => ({ ...c, order: idx }))
      destCards = destCards.map((c, idx) => ({ ...c, order: idx }))
      const otherCards = cards.filter(
        (c) => c.columnId !== sourceColumnId && c.columnId !== destinationColumnId
      )
      set({ cards: [...otherCards, ...sourceCards, ...destCards] })
    }
    get().saveToDB()
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  toggleStatsPanel: () => {
    set({ statsPanelOpen: !get().statsPanelOpen })
  },

  setEditingCardId: (id: string | null) => {
    set({ editingCardId: id })
  },

  setConfirmDeleteColumnId: (id: string | null) => {
    set({ confirmDeleteColumnId: id })
  },
}))
