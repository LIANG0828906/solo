import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const eventsPath = path.join(__dirname, '..', 'data', 'events.json')

interface Tier {
  name: string
  price: number
  total: number
  sold: number
}

interface Event {
  id: string
  name: string
  posterUrl: string
  date: string
  venue: string
  status: string
  artistId: string
  artistBio: string
  tiers: Tier[]
  tracks: string[]
  createdAt: string
}

interface EventFilters {
  keyword?: string
  dateFrom?: string
  dateTo?: string
}

function readEvents(): Event[] {
  const raw = fs.readFileSync(eventsPath, 'utf-8')
  return JSON.parse(raw)
}

function writeEvents(events: Event[]): void {
  fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf-8')
}

export function getAllEvents(filters?: EventFilters): Event[] {
  let events = readEvents().filter((e) => e.status === 'approved')

  if (filters?.keyword) {
    const kw = filters.keyword.toLowerCase()
    events = events.filter((e) => e.name.toLowerCase().includes(kw))
  }

  if (filters?.dateFrom) {
    const from = new Date(filters.dateFrom).getTime()
    events = events.filter((e) => new Date(e.date).getTime() >= from)
  }

  if (filters?.dateTo) {
    const to = new Date(filters.dateTo).getTime()
    events = events.filter((e) => new Date(e.date).getTime() <= to)
  }

  return events
}

export function getEventById(id: string): Event | undefined {
  return readEvents().find((e) => e.id === id)
}

export function createEvent(data: Omit<Event, 'id' | 'status' | 'createdAt'>): Event {
  const events = readEvents()
  const newEvent: Event = {
    ...data,
    id: uuidv4(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  events.push(newEvent)
  writeEvents(events)
  return newEvent
}

export function updateEventStatus(id: string, action: 'approve' | 'reject', reason?: string): Event | null {
  const events = readEvents()
  const idx = events.findIndex((e) => e.id === id)
  if (idx === -1) return null

  events[idx].status = action === 'approve' ? 'approved' : 'rejected'
  if (reason) {
    ;(events[idx] as Event & { rejectReason?: string }).rejectReason = reason
  }
  writeEvents(events)
  return events[idx]
}

export function getEventsByArtist(artistId: string): Event[] {
  return readEvents().filter((e) => e.artistId === artistId)
}

export function getPendingEvents(status?: string): Event[] {
  const events = readEvents()
  if (status) {
    return events.filter((e) => e.status === status)
  }
  return events.filter((e) => e.status === 'pending')
}
