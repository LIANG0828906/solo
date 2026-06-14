import { Router, type Request, type Response } from 'express'
import { getCourses, formatDate } from '../store.js'

const router = Router()

router.get('/schedule', (req: Request, res: Response): void => {
  const todayStr = formatDate(new Date())
  const courses = getCourses()

  const result = courses
    .filter(c => c.date === todayStr)
    .map(c => ({
      id: c.id,
      name: c.name,
      coach: c.coach,
      date: c.date,
      timeSlot: c.timeSlot,
      capacity: c.capacity,
      students: c.bookings.map(b => b.memberName),
    }))

  res.json({ success: true, data: result })
})

export default router
