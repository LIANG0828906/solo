import api from '../auth/AuthService'

export interface Booking {
  id: number
  teacherId: number
  teacherName: string
  studentId: number
  studentName: string
  subject: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: string
}

export interface CreateBookingData {
  teacherId: number
  subject: string
  date: string
  startTime: string
  endTime: string
}

export interface ReviewData {
  rating: number
  comment: string
}

export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  const response = await api.post('/bookings', data)
  return response.data
}

export const getBookings = async (): Promise<Booking[]> => {
  const response = await api.get('/bookings')
  return response.data
}

export const cancelBooking = async (id: number): Promise<Booking> => {
  const response = await api.put(`/bookings/${id}/cancel`)
  return response.data
}

export const confirmBooking = async (id: number): Promise<Booking> => {
  const response = await api.put(`/bookings/${id}/confirm`)
  return response.data
}

export const addReview = async (id: number, data: ReviewData): Promise<any> => {
  const response = await api.post(`/bookings/${id}/review`, data)
  return response.data
}

export const getBookingDetail = async (id: number): Promise<Booking> => {
  const response = await api.get(`/bookings/${id}`)
  return response.data
}
