import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import moment from 'moment'
import {
  Teacher,
  Review,
  getTeacherDetail,
  getTeacherTimeSlots,
  getTeacherReviews,
} from '../modules/teachers/TeacherService'
import { createBooking } from '../modules/booking/BookingService'
import { useAuth } from '../modules/auth/AuthContext'
import './TeacherDetailPage.css'

interface TimeSlot {
  id: number
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

const TeacherDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [subject, setSubject] = useState('')
  const { isAuthenticated } = useAuth()

  const days = Array.from({ length: 7 }, (_, i) => moment().add(i, 'days'))

  const hours = Array.from({ length: 9 }, (_, i) => i + 9)

  useEffect(() => {
    if (id) {
      fetchTeacherData()
    }
  }, [id])

  const fetchTeacherData = async () => {
    try {
      setLoading(true)
      const [teacherData, slotsData, reviewsData] = await Promise.all([
        getTeacherDetail(Number(id)),
        getTeacherTimeSlots(Number(id)),
        getTeacherReviews(Number(id)),
      ])
      setTeacher(teacherData)
      setTimeSlots(slotsData)
      setReviews(reviewsData)
    } catch (error) {
      console.error('Failed to fetch teacher data:', error)
    } finally {
      setLoading(false)
    }
  }

  const isSlotAvailable = (date: string, hour: number) => {
    const hourStr = String(hour).padStart(2, '0')
    const slot = timeSlots.find(
      (s) => s.date === date && s.startTime.split(':')[0] === hourStr
    )
    return slot?.isAvailable ?? false
  }

  const getSlot = (date: string, hour: number): TimeSlot | undefined => {
    const hourStr = String(hour).padStart(2, '0')
    return timeSlots.find(
      (s) => s.date === date && s.startTime.split(':')[0] === hourStr
    )
  }

  const handleSlotClick = (date: string, hour: number) => {
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    const slot = getSlot(date, hour)
    if (slot?.isAvailable) {
      setSelectedSlot(slot)
      setShowModal(true)
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !subject) {
      alert('请选择科目')
      return
    }

    try {
      await createBooking({
        teacherId: Number(id),
        subject,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      })
      setShowModal(false)
      setSelectedSlot(null)
      setSubject('')
      alert('预约成功！')
      fetchTeacherData()
    } catch (error) {
      console.error('Failed to create booking:', error)
      alert('预约失败，请重试')
    }
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    const emptyStars = 5 - Math.ceil(rating)
    return (
      <>
        <span style={{ color: '#f39c12' }}>{'★'.repeat(fullStars)}</span>
        {hasHalf && <span style={{ color: '#f39c12' }}>☆</span>}
        <span style={{ color: '#ddd' }}>{'☆'.repeat(emptyStars)}</span>
      </>
    )
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (!teacher) {
    return <div className="loading">教师不存在</div>
  }

  return (
    <div className="teacher-detail-page">
      <div className="detail-layout">
        <div className="teacher-info-section">
          <div className="teacher-header">
            <div className="teacher-avatar-large">
              <span>{teacher.name.charAt(0)}</span>
            </div>
            <div className="teacher-basic-info">
              <h1 className="teacher-name">{teacher.name}</h1>
              <div className="teacher-rating">
                <span className="stars">{renderStars(teacher.rating)}</span>
                <span className="rating-score">{teacher.rating.toFixed(1)}</span>
                <span className="review-count">({teacher.reviewCount}条评价)</span>
              </div>
            </div>
          </div>

          <div className="teacher-info-card">
            <h3 className="info-title">教师信息</h3>
            <div className="info-item">
              <span className="info-label">学历</span>
              <span className="info-value">{teacher.education}</span>
            </div>
            <div className="info-item">
              <span className="info-label">教学经验</span>
              <span className="info-value">{teacher.experience}年</span>
            </div>
            <div className="info-item">
              <span className="info-label">简介</span>
              <p className="info-bio">{teacher.bio}</p>
            </div>
          </div>

          <div className="reviews-section">
            <h3 className="info-title">学生评价</h3>
            {reviews.length > 0 ? (
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <span className="review-user">{review.userName}</span>
                      <span className="review-rating">{renderStars(review.rating)}</span>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    <span className="review-date">
                      {moment(review.createdAt).format('YYYY-MM-DD')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-reviews">暂无评价</p>
            )}
          </div>
        </div>

        <div className="time-slots-section">
          <h2 className="slots-title">可预约时间</h2>
          <div className="time-slot-table">
            <div className="table-header">
              <div className="time-label">时间</div>
              {days.map((day) => (
                <div key={day.format('YYYY-MM-DD')} className="day-header">
                  <div className="day-name">{day.format('ddd')}</div>
                  <div className="day-date">{day.format('MM/DD')}</div>
                </div>
              ))}
            </div>
            {hours.map((hour) => (
              <div key={hour} className="table-row">
                <div className="time-cell">{hour}:00</div>
                {days.map((day) => {
                  const dateStr = day.format('YYYY-MM-DD')
                  const available = isSlotAvailable(dateStr, hour)
                  return (
                    <button
                      key={`${dateStr}-${hour}`}
                      className={`slot-btn ${available ? 'available' : 'unavailable'}`}
                      onClick={() => handleSlotClick(dateStr, hour)}
                      disabled={!available}
                    >
                      {available ? '可预约' : '已满'}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>确认预约</h3>
            {selectedSlot && (
              <div className="booking-info">
                <p><strong>教师：</strong>{teacher.name}</p>
                <p><strong>日期：</strong>{selectedSlot.date}</p>
                <p><strong>时间：</strong>{selectedSlot.startTime} - {selectedSlot.endTime}</p>
              </div>
            )}
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
              <button className="btn btn-primary" onClick={handleConfirmBooking}>
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDetailPage
