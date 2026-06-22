import React, { useState, useEffect } from 'react'
import moment from 'moment'
import BookingCalendar from '../modules/booking/BookingCalendar'
import { Booking, getBookings, addReview, cancelBooking } from '../modules/booking/BookingService'
import { useAuth } from '../modules/auth/AuthContext'
import './MyBookingsPage.css'

const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const { isTeacher } = useAuth()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const data = await getBookings()
      setBookings(data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const canAddReview = (booking: Booking) => {
    if (booking.status !== 'completed') return false
    const endTime = moment(`${booking.date} ${booking.endTime}`)
    const now = moment()
    const hoursDiff = now.diff(endTime, 'hours')
    return hoursDiff <= 24 && hoursDiff >= 0
  }

  const handleAddReview = async () => {
    if (!selectedBooking) return

    try {
      await addReview(selectedBooking.id, { rating, comment })
      setShowReviewForm(false)
      setRating(5)
      setComment('')
      alert('评价成功！')
      fetchBookings()
    } catch (error) {
      console.error('Failed to add review:', error)
      alert('评价失败，请重试')
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    try {
      await cancelBooking(selectedBooking.id)
      setShowDetail(false)
      setSelectedBooking(null)
      alert('取消成功！')
      fetchBookings()
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      alert('取消失败，请重试')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待确认'
      case 'confirmed':
        return '已确认'
      case 'cancelled':
        return '已取消'
      case 'completed':
        return '已完成'
      default:
        return status
    }
  }

  return (
    <div className="my-bookings-page">
      <h1 className="page-title">我的预约</h1>
      
      <div className="bookings-calendar-section">
        <BookingCalendar showCreateModal={!isTeacher} />
      </div>

      <div className="bookings-list-section">
        <h2 className="section-title">预约列表</h2>
        {bookings.length > 0 ? (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="booking-item"
                onClick={() => {
                  setSelectedBooking(booking)
                  setShowDetail(true)
                }}
              >
                <div className="booking-item-info">
                  <div className="booking-item-header">
                    <span className="booking-item-name">
                      {isTeacher ? booking.studentName : booking.teacherName}
                    </span>
                    <span className={`booking-status status-${booking.status}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  <div className="booking-item-details">
                    <span className="booking-item-subject">{booking.subject}</span>
                    <span className="booking-item-time">
                      {booking.date} {booking.startTime} - {booking.endTime}
                    </span>
                  </div>
                </div>
                {canAddReview(booking) && (
                  <button
                    className="review-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedBooking(booking)
                      setShowReviewForm(true)
                    }}
                  >
                    评价
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-bookings">
            <p>暂无预约记录</p>
          </div>
        )}
      </div>

      {showDetail && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>预约详情</h3>
            <div className="booking-detail">
              <p>
                <strong>{isTeacher ? '学生' : '教师'}：</strong>
                {isTeacher ? selectedBooking.studentName : selectedBooking.teacherName}
              </p>
              <p><strong>科目：</strong>{selectedBooking.subject}</p>
              <p><strong>日期：</strong>{selectedBooking.date}</p>
              <p>
                <strong>时间：</strong>
                {selectedBooking.startTime} - {selectedBooking.endTime}
              </p>
              <p>
                <strong>状态：</strong>
                <span className={`status status-${selectedBooking.status}`}>
                  {getStatusText(selectedBooking.status)}
                </span>
              </p>
            </div>
            <div className="modal-actions">
              {selectedBooking.status === 'pending' && !isTeacher && (
                <button className="btn btn-danger" onClick={handleCancelBooking}>
                  取消预约
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewForm && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowReviewForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>添加评价</h3>
            <div className="review-form">
              <div className="form-group">
                <label>评分</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star-rating ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>评价内容</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="请输入您的评价..."
                  className="form-textarea"
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAddReview}>
                提交评价
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyBookingsPage
