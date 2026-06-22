import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type TicketStatus = '待审核' | '审核中' | '已通过' | '已驳回' | '退款完成'

export interface Ticket {
  id: string
  orderId: string
  itemName: string
  amount: number
  reason: string
  status: TicketStatus
  createdAt: string
}

interface TicketFormData {
  orderId: string
  itemName: string
  amount: number
  reason: string
}

interface TicketStore {
  tickets: Ticket[]
  statusFilter: TicketStatus | '全部'
  createTicket: (data: TicketFormData) => void
  updateStatus: (id: string, status: TicketStatus) => void
  approve: (id: string) => void
  reject: (id: string) => void
  completeRefund: (id: string) => void
  updateFilter: (filter: TicketStatus | '全部') => void
  filteredTickets: () => Ticket[]
  countByStatus: (status: TicketStatus | '全部') => number
}

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  '待审核': ['审核中'],
  '审核中': ['已通过', '已驳回'],
  '已通过': ['退款完成'],
  '已驳回': [],
  '退款完成': [],
}

function generateTicketId(): string {
  const now = Date.now().toString()
  const timestampSuffix = now.slice(-8)
  const random4 = Math.floor(1000 + Math.random() * 9000).toString()
  return `RF${timestampSuffix}${random4}`
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: [],
  statusFilter: '全部',

  createTicket: (data: TicketFormData) => {
    const ticket: Ticket = {
      id: generateTicketId(),
      orderId: data.orderId,
      itemName: data.itemName,
      amount: data.amount,
      reason: data.reason,
      status: '待审核',
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ tickets: [ticket, ...state.tickets] }))
  },

  updateStatus: (id: string, status: TicketStatus) => {
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id !== id) return t
        const allowed = VALID_TRANSITIONS[t.status]
        if (!allowed.includes(status)) return t
        return { ...t, status }
      }),
    }))
  },

  approve: (id: string) => {
    get().updateStatus(id, '已通过')
  },

  reject: (id: string) => {
    get().updateStatus(id, '已驳回')
  },

  completeRefund: (id: string) => {
    get().updateStatus(id, '退款完成')
  },

  updateFilter: (filter: TicketStatus | '全部') => {
    set({ statusFilter: filter })
  },

  filteredTickets: () => {
    const { tickets, statusFilter } = get()
    if (statusFilter === '全部') return tickets
    return tickets.filter((t) => t.status === statusFilter)
  },

  countByStatus: (status: TicketStatus | '全部') => {
    const { tickets } = get()
    if (status === '全部') return tickets.length
    return tickets.filter((t) => t.status === status).length
  },
}))
