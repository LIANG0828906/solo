import { Router, type Request, type Response } from 'express'
import { getAllSchedules, addSchedule, deleteSchedule, getSchedule, getUser } from '../data/store.js'
import type { User } from '../data/store.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const schedules = getAllSchedules()
  res.json({ success: true, data: schedules })
})

router.post('/', (req: Request, res: Response): void => {
  const { title, date, startTime, endTime, participantIds } = req.body

  if (!title || !date || !startTime || !endTime || !participantIds) {
    res.status(400).json({ success: false, error: 'Missing required fields: title, date, startTime, endTime, participantIds' })
    return
  }

  const schedule = addSchedule({ title, date, startTime, endTime, participantIds })
  res.status(201).json({ success: true, data: schedule })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const existing = getSchedule(id)
  if (!existing) {
    res.status(404).json({ success: false, error: 'Schedule not found' })
    return
  }

  deleteSchedule(id)
  res.json({ success: true, data: { id } })
})

router.post('/recommend', (req: Request, res: Response): void => {
  const { participantIds, duration, users } = req.body as {
    participantIds: string[]
    duration: number
    users: User[]
  }

  if (!participantIds || !duration || !users) {
    res.status(400).json({ success: false, error: 'Missing required fields: participantIds, duration, users' })
    return
  }

  const participants = users.filter((u) => participantIds.includes(u.id))

  if (participants.length === 0) {
    res.status(400).json({ success: false, error: 'No valid participants found' })
    return
  }

  const SLOT_MINUTES = 15
  const slotsPerDay = (24 * 60) / SLOT_MINUTES

  const overlapCounts = new Map<number, number>()

  for (const participant of participants) {
    const workStartMinutes = parseTimeToMinutes(participant.workStart)
    const workEndMinutes = parseTimeToMinutes(participant.workEnd)

    const workStartUTC = workStartMinutes - participant.utcOffset * 60
    const workEndUTC = workEndMinutes - participant.utcOffset * 60

    for (let slot = 0; slot < slotsPerDay; slot++) {
      const slotStartUTC = slot * SLOT_MINUTES
      const slotEndUTC = slotStartUTC + SLOT_MINUTES

      const adjustedStart = normalizeMinutes(workStartUTC)
      const adjustedEnd = normalizeMinutes(workEndUTC)

      if (adjustedStart <= adjustedEnd) {
        if (slotStartUTC >= adjustedStart && slotEndUTC <= adjustedEnd) {
          overlapCounts.set(slot, (overlapCounts.get(slot) || 0) + 1)
        }
      } else {
        if (slotStartUTC >= adjustedStart || slotEndUTC <= adjustedEnd) {
          overlapCounts.set(slot, (overlapCounts.get(slot) || 0) + 1)
        }
      }
    }
  }

  const scoredSlots: Array<{
    slotIndex: number
    startTimeUTC: string
    endTimeUTC: string
    overlapCount: number
    localTimes: Array<{ userId: string; name: string; city: string; localTime: string }>
  }> = []

  for (const [slot, count] of overlapCounts) {
    const startMinutesUTC = slot * SLOT_MINUTES
    const endMinutesUTC = startMinutesUTC + duration

    const fitsInSlot = endMinutesUTC <= 24 * 60

    if (!fitsInSlot) continue

    let allAvailable = true
    for (const participant of participants) {
      const workStartMinutes = parseTimeToMinutes(participant.workStart)
      const workEndMinutes = parseTimeToMinutes(participant.workEnd)
      const workStartUTC = normalizeMinutes(workStartMinutes - participant.utcOffset * 60)
      const workEndUTC = normalizeMinutes(workEndMinutes - participant.utcOffset * 60)

      const slotStart = startMinutesUTC
      const slotEnd = endMinutesUTC

      if (workStartUTC <= workEndUTC) {
        if (slotStart < workStartUTC || slotEnd > workEndUTC) {
          allAvailable = false
          break
        }
      } else {
        if (slotStart >= workStartUTC || slotEnd <= workEndUTC) {
          // ok, spans midnight
        } else {
          allAvailable = false
          break
        }
      }
    }

    if (!allAvailable) continue

    const localTimes = participants.map((p) => {
      const localMinutes = normalizeMinutes(startMinutesUTC + p.utcOffset * 60)
      return {
        userId: p.id,
        name: p.name,
        city: p.city,
        localTime: minutesToTime(localMinutes),
      }
    })

    scoredSlots.push({
      slotIndex: slot,
      startTimeUTC: minutesToTime(startMinutesUTC),
      endTimeUTC: minutesToTime(endMinutesUTC),
      overlapCount: count,
      localTimes,
    })
  }

  scoredSlots.sort((a, b) => b.overlapCount - a.overlapCount)

  const recommendations = scoredSlots.slice(0, 3)

  res.json({ success: true, data: recommendations })
})

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

function normalizeMinutes(minutes: number): number {
  const dayMinutes = 24 * 60
  return ((minutes % dayMinutes) + dayMinutes) % dayMinutes
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default router
