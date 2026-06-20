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
    params: search ? { search } : {},
  })
  return response.data
}

export const getTeacherDetail = async (id: number): Promise<Teacher> => {
  const response = await api.get(`/teachers/${id}`)
  return response.data
}

export const getTeacherTimeSlots = async (id: number): Promise<TimeSlot[]> => {
  const response = await api.get(`/teachers/${id}/time-slots`)
  return response.data
}

export const getTeacherReviews = async (id: number): Promise<Review[]> => {
  const response = await api.get(`/teachers/${id}/reviews`)
  return response.data
}

export const setTeacherTimeSlots = async (data: {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}): Promise<TimeSlot[]> => {
  const response = await api.post('/teacher/time-slots', data)
  return response.data
}
