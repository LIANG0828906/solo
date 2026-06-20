import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Host, Pet, BookingResponse } from '../types'
import ImageCarousel from '../components/ImageCarousel'
import BookingCalendar from '../components/BookingCalendar'
import ReviewsSection from '../components/ReviewsSection'
import PetCard from '../components/PetCard'
import StarRating from '../components/StarRating'

const petTypeLabels: Record<string, string> = {
  dog: '🐶 狗狗',
  cat: '🐱 猫咪',
  other: '🐹 其他'
}

export default function HostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [host, setHost] = useState<Host | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [booking, setBooking] = useState(false)
  const [conflictModal, setConflictModal] = useState<{
    show: boolean
    suggestedDates: string[]
  }>({ show: false, suggestedDates: [] })
  const [successModal, setSuccessModal] = useState<{
    show: boolean
    ownerMsg: string
    hostMsg: string
  }>({ show: false, ownerMsg: '', hostMsg: '' })
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    message: string
  }>>([])

  useEffect(() => {
    const loadHost = async () => {
      if (!id) return
      setLoading(true)
      try {
        const start = performance.now()
        const res = await fetch(`/api/hosts/${id}`)
        const data: Host = await res.json()
        setHost(data)
        const elapsed = performance.now() - start
        console.log(`页面加载耗时: ${elapsed.toFixed(0)}ms`)
      } catch (error) {
        console.error('加载寄养家庭失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadHost()
  }, [id])

  useEffect(() => {
    const loadPets = async () => {
      try {
        const res = await fetch('/api/pets')
        const data: Pet[] = await res.json()
        setPets(data)
      } catch (error) {
        console.error('加载宠物数据失败:', error)
      }
    }
    loadPets()
  }, [])

  const addNotification = (title: string, message: string) => {
    const notifId = Date.now().toString()
    setNotifications(prev => [...prev, { id: notifId, title, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notifId))
    }, 4000)
  }

  const handleBooking = async () => {
    if (!host || !selectedDate || !selectedPet) return

    setBooking(true)
    try {
      const checkRes = await fetch('/api/bookings/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: host.id,
          date: selectedDate
        })
      })
      const checkData = await checkRes.json()

      if (checkData.conflict) {
        setConflictModal({
          show: true,
          suggestedDates: checkData.suggestedDates || []
        })
        setBooking(false)
        return
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: host.id,
          petId: selectedPet.id,
          petName: selectedPet.name,
          userName: '宠物主人',
          date: selectedDate,
          notes: ''
        })
      })

      if (res.status === 409) {
        const errData = await res.json()
        setConflictModal({
          show: true,
          suggestedDates: errData.suggestedDates || []
        })
      } else if (res.ok) {
        const data: BookingResponse = await res.json()
        setSuccessModal({
          show: true,
          ownerMsg: data.notifications.owner.message,
          hostMsg: data.notifications.host.message
        })
        setTimeout(() => {
          addNotification('✅ ' + data.notifications.owner.title, data.notifications.owner.message)
        }, 500)
        setTimeout(() => {
          addNotification('📨 ' + data.notifications.host.title, data.notifications.host.message)
        }, 1500)

        setHost(prev => prev ? {
          ...prev,
          bookedDates: [...prev.bookedDates, selectedDate]
        } : null)
      }
    } catch (error) {
      console.error('预约失败:', error)
    } finally {
      setBooking(false)
    }
  }

  const handleSuggestedDate = (date: string) => {
    setSelectedDate(date)
    setConflictModal({ show: false, suggestedDates: [] })
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="skeleton" style={{ height: '40px', width: '120px', marginBottom: '24px', borderRadius: '12px' }} />
        <div className="skeleton-card" style={{ height: '400px', marginBottom: '32px' }} />
        <div className="host-detail">
          <div>
            <div className="skeleton skeleton-line short" style={{ height: '28px', marginBottom: '16px' }} />
            <div className="skeleton-card" style={{ padding: '24px', minHeight: '400px' }} />
          </div>
          <div className="skeleton-card" style={{ padding: '24px', minHeight: '300px' }} />
        </div>
      </div>
    )
  }

  if (!host) {
    return (
      <div className="container" style={{ paddingTop: '80px' }}>
        <div className="empty-state">
          <div className="empty-state-icon">😢</div>
          <div className="empty-state-text">未找到该寄养家庭</div>
          <button className="btn btn-primary" onClick={() => navigate('/matching')}>
            返回列表
          </button>
        </div>
      </div>
    )
  }

  const safeHost = {
    ...host,
    petTypes: host.petTypes || [],
    images: host.images || [],
    bookedDates: host.bookedDates || [],
    reviews: host.reviews || []
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      {notifications.map(notif => (
        <div key={notif.id} className="notification">
          <div className="notification-title">{notif.title}</div>
          <div className="notification-message">{notif.message}</div>
        </div>
      ))}

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 返回列表
      </button>

      <ImageCarousel images={host.images} alt={host.name} height={450} />

      <div className="host-detail">
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-dark-brown)', marginBottom: '8px' }}>
              {host.name}的温馨小窝
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <StarRating rating={host.rating} showValue />
              <span style={{ color: 'var(--color-text-light)' }}>({host.reviewCount}条评价)</span>
              <span style={{ color: 'var(--color-text-light)' }}>📍 {host.city}</span>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-card)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-dark-brown)' }}>
              🏠 关于寄养家庭
            </h3>
            <p style={{ color: 'var(--color-text)', lineHeight: 1.8, fontSize: '15px' }}>
              {host.description}
            </p>
            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {host.petTypes.map(pt => (
                <span key={pt} className={`pet-tag ${pt}`} style={{ padding: '8px 16px', fontSize: '14px' }}>
                  可接 {petTypeLabels[pt]}
                </span>
              ))}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-card)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--color-dark-brown)' }}>
              📅 选择寄养日期
            </h3>
            <BookingCalendar
              bookedDates={host.bookedDates}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-card)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--color-dark-brown)' }}>
              🐾 选择寄养的宠物
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {pets.map(pet => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  selected={selectedPet?.id === pet.id}
                  onSelect={setSelectedPet}
                />
              ))}
            </div>
          </div>

          <ReviewsSection hostId={host.id} />
        </div>

        <div>
          <div className="host-info-card">
            <div className="host-profile">
              <img src={host.avatar} alt={host.name} className="host-avatar" />
              <div>
                <div className="host-name">{host.name}</div>
                <StarRating rating={host.rating} size="small" />
              </div>
            </div>

            <div className="host-booking-info">
              <div className="booking-row">
                <span className="booking-label">寄养价格</span>
                <span className="total-price">¥{host.price}<span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-light)' }}>/天</span></span>
              </div>
              <div className="booking-row">
                <span className="booking-label">选择日期</span>
                <span className="booking-value">
                  {selectedDate || '请选择日期'}
                </span>
              </div>
              <div className="booking-row">
                <span className="booking-label">寄养宠物</span>
                <span className="booking-value">
                  {selectedPet ? selectedPet.name : '请选择宠物'}
                </span>
              </div>
              <div className="booking-row" style={{ borderBottom: 'none', paddingTop: '16px', marginTop: '8px', borderTop: '2px dashed var(--color-bg-warm)' }}>
                <span className="booking-label" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-dark-brown)' }}>
                  预估费用
                </span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-green-dark)' }}>
                  ¥{host.price}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-large"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={handleBooking}
              disabled={!selectedDate || !selectedPet || booking}
            >
              {booking ? '处理中...' : !selectedDate ? '请先选择日期' : !selectedPet ? '请选择宠物' : `✅ 确认预约 ¥${host.price}`}
            </button>

            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'var(--color-bg)',
              borderRadius: '12px',
              fontSize: '13px',
              color: 'var(--color-text-light)',
              lineHeight: 1.8
            }}>
              <div style={{ fontWeight: 600, color: 'var(--color-dark-brown)', marginBottom: '8px' }}>
                🔒 安全保障
              </div>
              ✓ 寄养家庭实名认证<br />
              ✓ 全程视频监控可选<br />
              ✓ 宠物保险全覆盖<br />
              ✓ 24小时客服支持
            </div>
          </div>
        </div>
      </div>

      {conflictModal.show && (
        <div className="modal-overlay" onClick={() => setConflictModal({ show: false, suggestedDates: [] })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">
              ⚠️ 日期冲突
            </h3>
            <p className="modal-message">
              抱歉，<strong>{selectedDate}</strong> 该日期已被预约。<br />
              为您推荐以下最近可预约的日期：
            </p>
            <div className="suggested-dates">
              {conflictModal.suggestedDates.map(date => (
                <div
                  key={date}
                  className="suggested-date"
                  onClick={() => handleSuggestedDate(date)}
                >
                  <span>📅 {date}</span>
                  <span style={{ color: 'var(--color-green-dark)', fontWeight: 600 }}>立即预约 →</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConflictModal({ show: false, suggestedDates: [] })}
              >
                选择其他日期
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal.show && (
        <div className="modal-overlay" onClick={() => setSuccessModal({ show: false, ownerMsg: '', hostMsg: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">
              🎉 预约成功！
            </h3>
            <div style={{
              background: 'linear-gradient(135deg, #E8F5E9 0%, #FFF3E0 100%)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-green-dark)', marginBottom: '6px' }}>
                  📩 给您的通知
                </div>
                <div style={{ color: 'var(--color-text)', fontSize: '14px' }}>{successModal.ownerMsg}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-brown)', marginBottom: '6px' }}>
                  🏠 给{host.name}的通知
                </div>
                <div style={{ color: 'var(--color-text)', fontSize: '14px' }}>{successModal.hostMsg}</div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setSuccessModal({ show: false, ownerMsg: '', hostMsg: '' })}
              >
                知道了
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSuccessModal({ show: false, ownerMsg: '', hostMsg: '' })
                  navigate('/')
                }}
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
