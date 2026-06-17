import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaUsers } from 'react-icons/fa'
import { useStore } from '../../data/store'
import { v4 as uuidv4 } from 'uuid'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

function ActivityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const activity = useStore((state) =>
    state.activities.find((a) => a.id === id)
  )
  const registrations = useStore((state) => state.registrations)
  const addRegistration = useStore((state) => state.addRegistration)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{ name?: boolean; email?: boolean; phone?: boolean }>({})
  const [showFullModal, setShowFullModal] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const activityRegistrations = registrations.filter((r) => r.activityId === id)
  const isFull = activity ? activityRegistrations.length >= activity.maxParticipants : false

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toasts])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast: Toast = { id: uuidv4(), message, type }
    setToasts((prev) => [...prev, toast])
  }

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    return /^\d{11}$/.test(phone)
  }

  const validateName = (name: string): boolean => {
    return name.length >= 2 && name.length <= 20
  }

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    const circle = document.createElement('span')
    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2

    circle.style.position = 'absolute'
    circle.style.width = circle.style.height = `${diameter}px`
    circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`
    circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`
    circle.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
    circle.style.borderRadius = '50%'
    circle.style.pointerEvents = 'none'
    circle.style.transform = 'scale(0)'
    circle.style.animation = 'ripple 0.4s ease-out forwards'

    button.appendChild(circle)

    setTimeout(() => {
      circle.remove()
    }, 400)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { name?: boolean; email?: boolean; phone?: boolean } = {}
    if (!validateName(name)) newErrors.name = true
    if (!validateEmail(email)) newErrors.email = true
    if (!validatePhone(phone)) newErrors.phone = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    if (isFull) {
      setShowFullModal(true)
      return
    }

    await addRegistration({
      id: uuidv4(),
      activityId: id!,
      name,
      email,
      phone,
      createdAt: Date.now(),
    })

    setName('')
    setEmail('')
    setPhone('')
    showToast('报名成功！', 'success')
  }

  if (!activity) {
    return (
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#B0B0C3', fontSize: 16, marginBottom: 16 }}>活动不存在</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#6C63FF',
              color: '#ffffff',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.min((activityRegistrations.length / activity.maxParticipants) * 100, 100)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#16162A' }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast"
          style={{
            borderLeft: `4px solid ${toast.type === 'success' ? '#6C63FF' : '#E94560'}`,
          }}
        >
          {toast.message}
        </div>
      ))}

      {showFullModal && (
        <div className="modal-overlay" onClick={() => setShowFullModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">活动已满员</div>
            <div className="modal-text">该活动的报名名额已达到上限，请关注其他精彩活动。</div>
            <button className="modal-button" onClick={() => setShowFullModal(false)}>
              我知道了
            </button>
          </div>
        </div>
      )}

      <header
        style={{
          padding: '24px 48px',
          backgroundColor: '#1E1E2E',
          borderBottom: '0.5px solid #3A3A5C',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            backgroundColor: '#2A2A4E',
            borderRadius: 8,
            color: '#B0B0C3',
            transition: 'all 0.3s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3A3A5C'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2A2A4E'
            e.currentTarget.style.color = '#B0B0C3'
          }}
        >
          <FaArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ color: '#ffffff', fontSize: 20, fontWeight: 600 }}>
            活动详情
          </h1>
        </div>
      </header>

      <main style={{ padding: 48, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div>
            {activity.poster ? (
              <img
                src={activity.poster}
                alt={activity.title}
                style={{
                  width: '100%',
                  height: 320,
                  objectFit: 'cover',
                  borderRadius: 16,
                  marginBottom: 24,
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 320,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #6C63FF 0%, #E94560 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <span style={{ color: '#ffffff', fontSize: 96, fontWeight: 700, opacity: 0.3 }}>
                  {activity.title.charAt(0)}
                </span>
              </div>
            )}

            <h2 style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
              {activity.title}
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaCalendarAlt size={16} color="#6C63FF" />
                <span style={{ color: '#B0B0C3', fontSize: 14 }}>
                  {activity.date} {activity.time}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaMapMarkerAlt size={16} color="#E94560" />
                <span style={{ color: '#B0B0C3', fontSize: 14 }}>{activity.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUsers size={16} color="#6C63FF" />
                <span style={{ color: '#B0B0C3', fontSize: 14 }}>
                  {activityRegistrations.length}/{activity.maxParticipants} 人
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: '#B0B0C3', fontSize: 13 }}>报名进度</span>
                <span
                  style={{
                    color: isFull ? '#E94560' : '#6C63FF',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {isFull ? '已满员' : `${Math.round(progress)}%`}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  backgroundColor: '#3A3A5C',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #6C63FF 0%, #E94560 100%)',
                    borderRadius: 4,
                    transition: 'width 0.5s ease-out',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#ffffff', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                活动介绍
              </h3>
              <p style={{ color: '#B0B0C3', fontSize: 14, lineHeight: 1.8 }}>
                {activity.description}
              </p>
            </div>

            {activityRegistrations.length > 0 && (
              <div>
                <h3 style={{ color: '#ffffff', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                  已报名名单 ({activityRegistrations.length})
                </h3>
                <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                  {activityRegistrations.map((reg, idx) => (
                    <div
                      key={reg.id}
                      style={{
                        height: 48,
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: idx % 2 === 0 ? '#28283A' : '#2A2A3E',
                        color: '#B0B0C3',
                        fontSize: 14,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6C63FF 0%, #E94560 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {reg.name.charAt(0)}
                        </div>
                        <span style={{ color: '#ffffff' }}>{reg.name}</span>
                      </div>
                      <span style={{ color: '#808095', fontSize: 13 }}>{reg.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                backgroundColor: '#1E1E2E',
                borderRadius: 16,
                border: '0.5px solid #3A3A5C',
                padding: 32,
                position: 'sticky',
                top: 100,
              }}
            >
              <h3 style={{ color: '#ffffff', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                立即报名
              </h3>
              <p style={{ color: '#808095', fontSize: 13, marginBottom: 24 }}>
                填写以下信息完成活动报名
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="input-label">姓名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                    }}
                    placeholder="请输入您的姓名（2-20字）"
                    className={`input-field ${errors.name ? 'error' : ''}`}
                    style={{ animation: errors.name ? 'shake 0.3s' : undefined }}
                  />
                  {errors.name && (
                    <p style={{ color: '#FF3366', fontSize: 12, marginTop: 6 }}>
                      姓名长度需在2-20字之间
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="input-label">邮箱</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                    }}
                    placeholder="请输入您的邮箱"
                    className={`input-field ${errors.email ? 'error' : ''}`}
                    style={{ animation: errors.email ? 'shake 0.3s' : undefined }}
                  />
                  {errors.email && (
                    <p style={{ color: '#FF3366', fontSize: 12, marginTop: 6 }}>
                      请输入正确的邮箱格式
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="input-label">手机号</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
                    }}
                    placeholder="请输入11位手机号"
                    className={`input-field ${errors.phone ? 'error' : ''}`}
                    style={{ animation: errors.phone ? 'shake 0.3s' : undefined }}
                  />
                  {errors.phone && (
                    <p style={{ color: '#FF3366', fontSize: 12, marginTop: 6 }}>
                      请输入11位数字手机号
                    </p>
                  )}
                </div>

                <button
                  ref={buttonRef}
                  type="submit"
                  onClick={createRipple}
                  disabled={isFull}
                  style={{
                    width: 240,
                    height: 48,
                    backgroundColor: isFull ? '#3A3A5C' : '#E94560',
                    color: '#ffffff',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    transition: 'all 0.3s ease-out',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isFull ? 'not-allowed' : 'pointer',
                    opacity: isFull ? 0.6 : 1,
                    display: 'block',
                    margin: '0 auto',
                    marginTop: 8,
                  }}
                  onMouseDown={(e) => {
                    if (!isFull) {
                      e.currentTarget.style.transform = 'scale(0.95)'
                    }
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {isFull ? '活动已满员' : '立即报名'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ActivityDetail
