import { v4 } from 'uuid'

export interface Member {
  id: string
  name: string
  membershipType: '月卡' | '季卡' | '年卡'
  expiryDate: string
}

export interface Booking {
  id: string
  courseId: string
  memberName: string
  memberId: string
}

export interface Course {
  id: string
  name: string
  coach: string
  date: string
  timeSlot: string
  capacity: number
  bookings: Booking[]
}

export const MEMBERSHIP_DAYS: Record<string, number> = {
  '月卡': 30,
  '季卡': 90,
  '年卡': 365,
}

export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

export function getTodayStr(): string {
  return formatDate(new Date())
}

export function getSevenDaysLaterStr(): string {
  return formatDate(addDays(new Date(), 7))
}

export function computeStatus(expiryDate: string): '已过期' | '即将到期' | '有效' {
  const today = getTodayStr()
  const sevenDaysLater = getSevenDaysLaterStr()
  if (expiryDate < today) return '已过期'
  if (expiryDate <= sevenDaysLater) return '即将到期'
  return '有效'
}

function createSeedMembers(): Member[] {
  return [
    { id: v4(), name: '张伟', membershipType: '月卡', expiryDate: '2026-05-15' },
    { id: v4(), name: '李娜', membershipType: '季卡', expiryDate: '2026-06-01' },
    { id: v4(), name: '王芳', membershipType: '年卡', expiryDate: '2026-06-10' },
    { id: v4(), name: '赵磊', membershipType: '月卡', expiryDate: '2026-06-16' },
    { id: v4(), name: '孙丽', membershipType: '季卡', expiryDate: '2026-06-18' },
    { id: v4(), name: '周洋', membershipType: '年卡', expiryDate: '2026-06-20' },
    { id: v4(), name: '吴强', membershipType: '月卡', expiryDate: '2026-07-14' },
    { id: v4(), name: '郑雪', membershipType: '季卡', expiryDate: '2026-09-14' },
    { id: v4(), name: '刘明远', membershipType: '年卡', expiryDate: '2026-12-31' },
    { id: v4(), name: '陈静怡', membershipType: '年卡', expiryDate: '2027-06-14' },
  ]
}

function createSeedCourses(): Course[] {
  const courseNames = ['瑜伽', '动感单车', '搏击操', '普拉提', 'CrossFit', 'BodyPump', '拉伸放松']
  const coaches = ['王教练', '李教练', '张教练', '刘教练', '陈教练', '赵教练', '杨教练']
  const timeSlots = ['09:00', '14:00', '19:00']
  const courses: Course[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let day = 0; day < 7; day++) {
    const date = addDays(today, day)
    const dateStr = formatDate(date)
    for (let slot = 0; slot < 3; slot++) {
      const idx = (day * 3 + slot) % courseNames.length
      const coachIdx = (day * 3 + slot) % coaches.length
      courses.push({
        id: v4(),
        name: courseNames[idx],
        coach: coaches[coachIdx],
        date: dateStr,
        timeSlot: timeSlots[slot],
        capacity: 20,
        bookings: [],
      })
    }
  }
  return courses
}

let members: Member[] = createSeedMembers()
let courses: Course[] = createSeedCourses()

export function getMembers(): Member[] {
  return members
}

export function setMembers(m: Member[]): void {
  members = m
}

export function getMemberById(id: string): Member | undefined {
  return members.find(m => m.id === id)
}

export function getCourses(): Course[] {
  return courses
}

export function setCourses(c: Course[]): void {
  courses = c
}

export function getCourseById(id: string): Course | undefined {
  return courses.find(c => c.id === id)
}
