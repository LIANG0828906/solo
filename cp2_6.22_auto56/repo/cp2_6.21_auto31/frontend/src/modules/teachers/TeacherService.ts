import api from '../auth/AuthService'

export interface Teacher {
  id: number
  name: string
  subjects: string[]
  rating: number
  reviewCount: number
  bio: string
  education: string
  experience: number
  avatar?: string
  userId: number
  hourlyRate: number
}

export interface TimeSlot {
  id: number
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface Review {
  id: number
  userId: number
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export const getTeachers = async (search?: string): Promise<Teacher[]> => {
  const response = await api.get('/teachers', {
    params: search ? { q: search } : {},
  })
  return response.data.map((t: any) => ({
    id: t.id,
    name: t.full_name || '',
    subjects: t.subjects ? t.subjects.split(',').map((s: string) => s.trim()) : [],
    rating: t.rating || 0,
    reviewCount: t.review_count || 0,
    bio: t.bio || '',
    education: t.education || '',
    experience: t.experience_years || 0,
    avatar: t.avatar || undefined,
    userId: t.user_id,
    hourlyRate: t.hourly_rate || 0,
  }))
}

export const getTeacherDetail = async (id: number): Promise<Teacher> => {
  const response = await api.get(`/teachers/${id}`)
  const t = response.data
  return {
    id: t.id,
    name: t.full_name || '',
    subjects: t.subjects ? t.subjects.split(',').map((s: string) => s.trim()) : [],
    rating: t.rating || 0,
    reviewCount: t.review_count || 0,
    bio: t.bio || '',
    education: t.education || '',
    experience: t.experience_years || 0,
    avatar: t.avatar || undefined,
    userId: t.user_id,
    hourlyRate: t.hourly_rate || 0,
  }
}

export const getTeacherTimeSlots = async (id: number): Promise<TimeSlot[]> => {
  const response = await api.get(`/teachers/${id}/timeslots`)
  return response.data.map((s: any) => ({
    id: s.id,
    date: s.start_time.slice(0, 10),
    startTime: s.start_time.slice(11, 16),
    endTime: s.end_time.slice(11, 16),
    isAvailable: s.is_available,
  }))
}

export const getTeacherReviews = async (id: number): Promise<Review[]> => {
  const response = await api.get(`/teachers/${id}/reviews`)
  return response.data.map((r: any) => ({
    id: r.id,
    userId: r.student_id,
    userName: r.student_name || '匿名用户',
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }))
}

export const setTeacherTimeSlots = async (data: {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}): Promise<TimeSlot[]> => {
  const dates: string[] = []
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }

  const payload = {
    dates,
    start_hour: parseInt(data.startTime.split(':')[0], 10),
    end_hour: parseInt(data.endTime.split(':')[0], 10),
  }
  const response = await api.post('/teachers/timeslots', payload)
  return response.data.map((s: any) => ({
    id: s.id,
    date: s.start_time.slice(0, 10),
    startTime: s.start_time.slice(11, 16),
    endTime: s.end_time.slice(11, 16),
    isAvailable: s.is_available,
  }))
}

export const getMyReviews = async (): Promise<Review[]> => {
  const response = await api.get('/reviews/my-teacher')
  return response.data.map((r: any) => ({
    id: r.id,
    userId: r.student_id,
    userName: r.student_name || '匿名用户',
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }))
}
