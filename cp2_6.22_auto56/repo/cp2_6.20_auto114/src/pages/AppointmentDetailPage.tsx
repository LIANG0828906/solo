import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Scissors, Clock, Star, CheckCircle2 } from 'lucide-react'
import { useAppStore, type Groomer, type ServiceItem, type GroomingStyle } from '@/store'
import { mockGroomers, mockServices, mockStyles } from '@/services/api'
import { wsService } from '@/services/websocket'
import dayjs from 'dayjs'

function StyleSketchSVG({ style }: { style: GroomingStyle | undefined }) {
  const bodyColor = style?.color || '#f5cba7'
  return (
    <svg
      viewBox="0 0 300 280"
      width="100%"
      height="100%"
      style={{
        background: 'linear-gradient(135deg, #fffbf0 0%, #fff7e6 100%)',
        borderRadius: 16,
      }}
    >
      <defs>
        <filter id="sketchy" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </defs>

      <g filter="url(#sketchy)" fill="none" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="150" cy="180" rx="75" ry="45" fill={`${bodyColor}40`} />
        <circle cx="150" cy="110" r="42" fill={`${bodyColor}50`} />
        <ellipse cx="118" cy="85" rx="18" ry="22" fill={`${bodyColor}50`} />
        <ellipse cx="182" cy="85" rx="18" ry="22" fill={`${bodyColor}50`} />
        <ellipse cx="95" cy="210" rx="12" ry="28" fill={`${bodyColor}40`} />
        <ellipse cx="205" cy="210" rx="12" ry="28" fill={`${bodyColor}40`} />
        <ellipse cx="115" cy="210" rx="12" ry="28" fill={`${bodyColor}40`} />
        <ellipse cx="185" cy="210" rx="12" ry="28" fill={`${bodyColor}40`} />
        <path d="M 220 170 Q 255 160 260 130 Q 265 100 240 95" strokeWidth="4" fill={`${bodyColor}40`} />
        <circle cx="135" cy="115" r="6" fill="#1a1a2e" stroke="none" />
        <circle cx="165" cy="115" r="6" fill="#1a1a2e" stroke="none" />
        <circle cx="150" cy="132" r="5" fill="#3d2b1f" stroke="none" />
        <path d="M 142 140 Q 150 148 158 140" stroke="#3d2b1f" strokeWidth="2" fill="none" />
        <ellipse cx="120" cy="72" rx="8" ry="10" fill={`${bodyColor}30`} />
        <ellipse cx="180" cy="72" rx="8" ry="10" fill={`${bodyColor}30`} />
      </g>

      <g stroke="#d4a574" strokeWidth="1.5" strokeDasharray="4 3" fill="none" opacity="0.5">
        <path d="M 120 90 Q 150 75 180 90" />
        <path d="M 110 110 Q 150 95 190 110" />
        <path d="M 100 130 Q 150 115 200 130" />
      </g>

      <text x="150" y="260" textAnchor="middle" fill="#8b6914" fontSize="11" fontFamily="'Noto Sans SC', sans-serif" opacity="0.7">
        {style?.name || '造型草图'}
      </text>
    </svg>
  )
}

const progressSteps = [
  { id: 0, name: '已确认', icon: '✅' },
  { id: 1, name: '准备中', icon: '🧴' },
  { id: 2, name: '洗护进行', icon: '🛁' },
  { id: 3, name: '造型修剪', icon: '✂️' },
  { id: 4, name: '吹干整理', icon: '💨' },
  { id: 5, name: '完成', icon: '🎉' },
]

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { appointment, selectedStyle, setAppointment, addNotification } = useAppStore()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const groomer: Groomer | undefined = appointment
    ? mockGroomers.find((g) => g.id === appointment.groomerId)
    : undefined
  const services: ServiceItem[] = appointment
    ? mockServices.filter((s) => appointment.serviceIds.includes(s.id))
    : []
  const style: GroomingStyle | undefined = selectedStyle
    ? selectedStyle
    : appointment
    ? mockStyles.find((s) => s.id === appointment?.styleId)
    : undefined

  useEffect(() => {
    if (appointment) {
      setProgress(appointment.progress)
      const stepIdx = Math.min(
        Math.floor((appointment.progress / 100) * progressSteps.length),
        progressSteps.length - 1
      )
      setCurrentStep(stepIdx)
    }
  }, [appointment])

  useEffect(() => {
    const unsub = wsService.onMessage((msg) => {
      addNotification(msg)
      if (msg.type === 'progress_update' && msg.payload.progress !== undefined) {
        const newProgress = msg.payload.progress
        setProgress(newProgress)
        const stepIdx = Math.min(
          Math.floor((newProgress / 100) * progressSteps.length),
          progressSteps.length - 1
        )
        setCurrentStep(stepIdx)
        if (appointment) {
          setAppointment({ ...appointment, progress: newProgress })
        }
      }
    })
    return unsub
  }, [addNotification, appointment, setAppointment])

  useEffect(() => {
    if (appointment && progress < 100) {
      const intervals = [1500, 2000, 1800, 2200, 2500]
      let idx = 0
      const tick = () => {
        if (progress >= 100) return
        const increment = Math.floor(Math.random() * 8) + 5
        const newProgress = Math.min(progress + increment, 100)
        setTimeout(() => {
          wsService.simulateProgress(appointment.id, newProgress)
          if (newProgress < 100 && idx < intervals.length) {
            idx++
          }
        }, intervals[idx % intervals.length])
      }
      tick()
    }
  }, [])

  if (!appointment) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff7e6',
          gap: 20,
        }}
      >
        <p style={{ fontSize: 16, color: '#666' }}>未找到预约信息</p>
        <button className="btn-capsule" onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    )
  }

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#fff7e6',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        fontFamily: "'Noto Sans SC', sans-serif",
      }}
    >
      <nav
        className="glass-nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: '#e67e22',
            }}
          >
            <ArrowLeft size={18} />
            返回
          </button>
          <h1
            className="font-display"
            style={{ fontSize: 22, fontWeight: 700, color: '#2c3e50' }}
          >
            预约详情
          </h1>
        </div>
        <span
          style={{
            fontSize: 12,
            padding: '4px 12px',
            borderRadius: 20,
            background: progress >= 100 ? '#d5f5e3' : '#fdebd0',
            color: progress >= 100 ? '#27ae60' : '#e67e22',
            fontWeight: 500,
          }}
        >
          {progress >= 100 ? '已完成' : '进行中'}
        </span>
      </nav>

      <div
        style={{
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          padding: 32,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          animation: 'fadeIn 0.4s ease-out',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #f5e6cc',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2c3e50', marginBottom: 20 }}>
            预约信息
          </h2>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div
              style={{
                flex: 1,
                padding: 14,
                background: '#fff7e6',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Calendar size={18} color="#e67e22" />
              <div>
                <div style={{ fontSize: 11, color: '#999' }}>预约日期</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                  {dayjs(appointment.date).format('YYYY年MM月DD日')}
                </div>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                padding: 14,
                background: '#fff7e6',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Clock size={18} color="#e67e22" />
              <div>
                <div style={{ fontSize: 11, color: '#999' }}>预计时长</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                  {totalDuration}分钟
                </div>
              </div>
            </div>
          </div>

          {groomer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                background: '#fef9f0',
                borderRadius: 14,
                marginBottom: 20,
                border: '1px solid #f5e6cc',
              }}
            >
              <img
                src={groomer.avatar}
                alt={groomer.name}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #d4a574',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>
                    {groomer.name}
                  </span>
                  <span style={{ color: '#f39c12', fontSize: 13 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < Math.round(groomer.rating) ? '#f39c12' : 'none'}
                        color={i < Math.round(groomer.rating) ? '#f39c12' : '#ddd'}
                      />
                    ))}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  擅长：{groomer.specialties.join('、')}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12 }}>
              服务项目
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {services.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#fffdf8',
                    borderRadius: 10,
                    border: '1px solid #f5e6cc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>{s.duration}分钟</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#e67e22' }}>
                    ¥{s.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 16,
              background: 'linear-gradient(135deg, #fff7e6, #fff)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #d4a57433',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#888' }}>订单总价</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#e67e22' }}>
                ¥{totalPrice}
              </div>
            </div>
            <div
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #e67e22, #f39c12)',
                color: '#fff',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckCircle2 size={14} />
              预约编号：{id}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 28,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              border: '1px solid #f5e6cc',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2c3e50', marginBottom: 16 }}>
              造型草图
            </h2>
            <div style={{ height: 280 }}>
              <StyleSketchSVG style={style} />
            </div>
            {style && (
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #e67e22, #f39c12)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  {style.styleTag}
                </span>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: '#fff7e6',
                    color: '#8b6914',
                    fontSize: 11,
                  }}
                >
                  {style.breed}
                </span>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: '#fdebd0',
                    color: '#e67e22',
                    fontSize: 11,
                  }}
                >
                  毛发 {style.hairLength}cm
                </span>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: '#fff7e6',
                    color: '#8b6914',
                    fontSize: 11,
                  }}
                >
                  {style.trimShape}
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 28,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              border: '1px solid #f5e6cc',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2c3e50', marginBottom: 20 }}>
              <Scissors size={18} style={{ marginRight: 6 }} />
              造型进度
            </h2>

            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, color: '#666' }}>当前进度</span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#e67e22',
                  }}
                >
                  {progress}%
                </span>
              </div>
              <div
                style={{
                  height: 12,
                  background: '#f5f5f5',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #e67e22, #f39c12)',
                    borderRadius: 6,
                    transition: 'width 0.6s ease',
                    boxShadow: '0 0 10px rgba(230, 126, 34, 0.4)',
                  }}
                />
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: '#e8ddd0',
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 0,
                  width: `${(currentStep / (progressSteps.length - 1)) * 100}%`,
                  height: 2,
                  background: 'linear-gradient(90deg, #e67e22, #f39c12)',
                  zIndex: 1,
                  transition: 'width 0.5s ease',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {progressSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStep
                  const isActive = idx === currentStep
                  return (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: isCompleted
                            ? 'linear-gradient(135deg, #e67e22, #f39c12)'
                            : '#fff',
                          border: isCompleted ? 'none' : '2px solid #e8ddd0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          boxShadow: isCompleted
                            ? '0 2px 8px rgba(230, 126, 34, 0.3)'
                            : 'none',
                          animation: isActive ? 'pulse 1.5s ease-in-out infinite' : 'none',
                        }}
                      >
                        {isCompleted ? step.icon : idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: isCompleted ? '#e67e22' : '#aaa',
                          fontWeight: isCompleted ? 600 : 400,
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                        }}
                      >
                        {step.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {progress >= 100 && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: 'linear-gradient(135deg, #d5f5e3, #eafaef)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  animation: 'fadeIn 0.5s ease',
                }}
              >
                <CheckCircle2 size={28} color="#27ae60" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#27ae60' }}>
                    造型完成！
                  </div>
                  <div style={{ fontSize: 12, color: '#5d6d7e' }}>
                    您的爱宠已经焕然一新，快来接它回家吧～
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
