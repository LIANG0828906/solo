import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, Event } from 'react-big-calendar'
import moment from 'moment'
import { Booking, getBookings, createBooking } from './BookingService'
import { Teacher, getTeachers } from '../teachers/TeacherService'
import { useAuth } from '../auth/AuthContext'
import './BookingCalendar.css'

const localizer = momentLocalizer(moment)

interface BookingCalendarProps {
  showCreateModal?: boolean
}

interface BookingEvent extends Event {
  booking: Booking
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ showCreateModal = true }) => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [events, setEvents] = useState<BookingEvent[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<number | ''>('')
  const [subject, setSubject] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const { user, isTeacher } = useAuth()

  useEffect(() => {
    fetchBookings()
    fetchTeachers()
  }, [])

  useEffect(() => {
    const bookingEvents: BookingEvent[] = bookings.map((booking) => {
      const start = moment(`${booking.date} ${booking.startTime}`).toDate()
      const end = moment(`${booking.date} ${booking.endTime}`).toDate()
      const title = isTeacher ? booking.studentName : booking.teacherName
      return {
        id: booking.id,
        title,
        start,
        end,
        booking,
      }
    })
    setEvents(bookingEvents)
  }, [bookings, isTeacher])

  const fetchBookings = async () => {
    try {
      const data = await getBookings()
      setBookings(data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const data = await getTeachers()
      setTeachers(data)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    if (showCreateModal && !isTeacher) {
      setSelectedSlot(slotInfo)
      setShowModal(true)
    }
  }

  const handleSelectEvent = (event: BookingEvent) => {
    setSelectedBooking(event.booking)
    setShowModal(true)
  }

  const handleCreateBooking = async () => {
    if (!selectedSlot || !selectedTeacher || !subject) {
      alert('请填写完整信息')
      return
    }

    try {
      const date = moment(selectedSlot.start).format('YYYY-MM-DD')
      const startTime = moment(selectedSlot.start).format('HH:mm')
      const endTime = moment(selectedSlot.end).format('HH:mm')

      await createBooking({
        teacherId: selectedTeacher as number,
        subject,
        date,
        startTime,
        endTime,
      })

      setShowModal(false)
      setSelectedSlot(null)
      setSelectedTeacher('')
      setSubject('')
      fetchBookings()
    } catch (error) {
      console.error('Failed to create booking:', error)
      alert('预约失败，请重试')
    }
  }

  const eventStyleGetter = (event: BookingEvent) => {
    let backgroundColor = '#4a90d9'
    switch (event.booking.status) {
      case 'pending':
        backgroundColor = '#f39c12'
        break
      case 'confirmed':
        backgroundColor = '#27ae60'
        break
      case 'cancelled':
        backgroundColor = '#e74c3c'
        break
      case 'completed':
        backgroundColor = '#95a5a6'
        break
    }
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    }
  }

  return (
    <div className="booking-calendar">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={['week', 'day']}
        style={{ height: 600 }}
        selectable={showCreateModal && !isTeacher}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {selectedBooking ? (
              <>
                <h3>预约详情</h3>
                <div className="booking-detail">
                  <p><strong>教师：</strong>{selectedBooking.teacherName}</p>
                  <p><strong>学生：</strong>{selectedBooking.studentName}</p>
                  <p><strong>科目：</strong>{selectedBooking.subject}</p>
                  <p><strong>日期：</strong>{selectedBooking.date}</p>
                  <p><strong>时间：</strong>{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                  <p><strong>状态：</strong>
                    <span className={`status status-${selectedBooking.status}`}>
                      {selectedBooking.status === 'pending' && '待确认'}
                      {selectedBooking.status === 'confirmed' && '已确认'}
                      {selectedBooking.status === 'cancelled' && '已取消'}
                      {selectedBooking.status === 'completed' && '已完成'}
                    </span>
                  </p>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    关闭
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>创建预约</h3>
                <p className="modal-subtitle">
                  {selectedSlot && moment(selectedSlot.start).format('YYYY-MM-DD HH:mm')} - {selectedSlot && moment(selectedSlot.end).format('HH:mm')}
                </p>
                <div className="form-group">
                  <label>选择教师</label>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(Number(e.target.value) || '')}
                    className="form-input"
                  >
                    <option value="">请选择教师</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>科目</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="请输入科目"
                    className="form-input"
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    取消
                  </button>
                  <button className="btn btn-primary" onClick={handleCreateBooking}>
                    确认预约
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingCalendar
