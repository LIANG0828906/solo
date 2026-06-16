import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ticketsPath = path.join(__dirname, '..', 'data', 'tickets.json')
const eventsPath = path.join(__dirname, '..', 'data', 'events.json')

interface Ticket {
  id: string
  ticketNo: string
  eventId: string
  tier: string
  userId: string
  status: 'valid' | 'used' | 'cancelled'
  createdAt: string
  usedAt?: string
}

interface Tier {
  name: string
  price: number
  total: number
  sold: number
}

interface Event {
  id: string
  tiers: Tier[]
  [key: string]: unknown
}

function readTickets(): Ticket[] {
  const raw = fs.readFileSync(ticketsPath, 'utf-8')
  return JSON.parse(raw)
}

function writeTickets(tickets: Ticket[]): void {
  fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2), 'utf-8')
}

function readEvents(): Event[] {
  const raw = fs.readFileSync(eventsPath, 'utf-8')
  return JSON.parse(raw)
}

function writeEvents(events: Event[]): void {
  fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf-8')
}

function generateTicketNo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `TK-${code}`
}

function generateUniqueTicketNo(): string {
  const tickets = readTickets()
  const existing = new Set(tickets.map((t) => t.ticketNo))
  let no = generateTicketNo()
  while (existing.has(no)) {
    no = generateTicketNo()
  }
  return no
}

export function createTickets(eventId: string, tier: string, quantity: number, userId: string): Ticket[] {
  const events = readEvents()
  const event = events.find((e) => e.id === eventId)
  if (!event) throw new Error('活动不存在')

  const tierInfo = event.tiers.find((t) => t.name === tier)
  if (!tierInfo) throw new Error('票档不存在')

  const remaining = tierInfo.total - tierInfo.sold
  if (quantity > remaining) throw new Error(`库存不足，剩余 ${remaining} 张`)

  const tickets = readTickets()
  const newTickets: Ticket[] = []

  for (let i = 0; i < quantity; i++) {
    const ticket: Ticket = {
      id: uuidv4(),
      ticketNo: generateUniqueTicketNo(),
      eventId,
      tier,
      userId,
      status: 'valid',
      createdAt: new Date().toISOString(),
    }
    newTickets.push(ticket)
    tickets.push(ticket)
  }

  tierInfo.sold += quantity
  writeEvents(events)
  writeTickets(tickets)

  return newTickets
}

export function getTicketsByUser(userId: string): Ticket[] {
  return readTickets().filter((t) => t.userId === userId)
}

export function checkinTicket(ticketNo: string): Ticket {
  const tickets = readTickets()
  const idx = tickets.findIndex((t) => t.ticketNo === ticketNo)
  if (idx === -1) throw new Error('票券不存在')
  if (tickets[idx].status === 'used') throw new Error('该票券已使用，不可重复核销')

  tickets[idx].status = 'used'
  tickets[idx].usedAt = new Date().toISOString()
  writeTickets(tickets)

  return tickets[idx]
}

export function getAnalytics(eventId: string) {
  const events = readEvents()
  const event = events.find((e) => e.id === eventId)
  if (!event) throw new Error('活动不存在')

  const tickets = readTickets().filter((t) => t.eventId === eventId)

  const tierBreakdown = event.tiers.map((t) => ({
    name: t.name,
    price: t.price,
    total: t.total,
    sold: t.sold,
    revenue: t.sold * t.price,
  }))

  const totalSold = tickets.length
  const totalRevenue = tierBreakdown.reduce((sum, t) => sum + t.revenue, 0)

  const now = new Date()
  const dailyTrend: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const count = tickets.filter((t) => t.createdAt.slice(0, 10) === dateStr).length
    dailyTrend.push({ date: dateStr, count })
  }

  return { totalSold, totalRevenue, tierBreakdown, dailyTrend }
}
