import api from '../auth/AuthService'
import moment from 'moment'

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

const mapBooking = (b: any): Booking => ({
  id: b.id,
  teacherId: b.teacher_id,
  teacherName: b.teacher_name,
  studentId: b.student_id,
  studentName: b.student_name,
  subject: b.subject,
  date: b.start_time.slice(0, 10),
  startTime: b.start_time.slice(11, 16),
  endTime: b.end_time.slice(11, 16),
  status: b.status,
  createdAt: b.start_time,
})

export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  const startDateTime = moment(`${data.date} ${data.startTime}`, 'YYYY-MM-DD HH:mm').toISOString()
  const endDateTime = moment(`${data.date} ${data.endTime}`, 'YYYY-MM-DD HH:mm').toISOString()

  const payload = {
    teacher_id: data.teacherId,
    start_time: startDateTime,
    end_time: endDateTime,
    subject: data.subject,
  }
  const response = await api.post('/bookings', payload)
  return mapBooking(response.data)
}

export const getBookings = async (): Promise<Booking[]> => {
  const response = await api.get('/bookings')
  return response.data.map(mapBooking)
}

export const cancelBooking = async (id: number): Promise<Booking> => {
  const response = await api.put(`/bookings/${id}/cancel`)
  return mapBooking(response.data)
}

export const confirmBooking = async (id: number): Promise<Booking> => {
  const response = await api.put(`/bookings/${id}/confirm`)
  return mapBooking(response.data)
}

export const addReview = async (id: number, data: ReviewData): Promise<any> => {
  const payload = {
    booking_id: id,
    rating: data.rating,
    comment: data.comment,
  }
  const response = await api.post('/reviews', payload)
  return response.data
}

export const getBookingDetail = async (id: number): Promise<Booking> => {
  const response = await api.get(`/bookings/${id}`)
  return mapBooking(response.data)
}
