import { Router, type Request, type Response } from 'express'
import { v4 } from 'uuid'
import {
  getCourses,
  getCourseById,
  getMemberById,
  computeStatus,
  addDays,
  formatDate,
  type Booking,
} from '../store.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const courses = getCourses()
  const todayStr = formatDate(new Date())
  const sevenDaysLater = formatDate(addDays(new Date(), 6))

  const result = courses
    .filter(c => c.date >= todayStr && c.date <= sevenDaysLater)
    .map(c => ({
      ...c,
      remainingCapacity: c.capacity - c.bookings.length,
    }))

  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const { courseId, memberName, memberId } = req.body as { courseId: string; memberName: string; memberId: string }

  if (!courseId || !memberName || !memberId) {
    res.status(400).json({ success: false, error: '缺少必要参数：courseId, memberName, memberId' })
    return
  }

  const member = getMemberById(memberId)
  if (!member) {
    res.status(404).json({ success: false, error: '会员不存在' })
    return
  }

  const status = computeStatus(member.expiryDate)
  if (status === '已过期') {
    res.status(400).json({ success: false, error: '会员已过期，无法预约课程' })
    return
  }

  const course = getCourseById(courseId)
  if (!course) {
    res.status(404).json({ success: false, error: '课程不存在' })
    return
  }

  if (course.bookings.length >= course.capacity) {
    res.status(400).json({ success: false, error: '课程已满，无法预约' })
    return
  }

  const booking: Booking = {
    id: v4(),
    courseId,
    memberName,
    memberId,
  }

  course.bookings.push(booking)

  res.status(201).json({ success: true, data: booking })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const courses = getCourses()

  for (const course of courses) {
    const idx = course.bookings.findIndex(b => b.id === id)
    if (idx !== -1) {
      course.bookings.splice(idx, 1)
      res.json({ success: true, message: '取消预约成功' })
      return
    }
  }

  res.status(404).json({ success: false, error: '预约记录不存在' })
})

export default router
