import { useMemo, useState, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { differenceInDays, format, parseISO } from 'date-fns'
import { useStore, getMonthlyAmount } from '../store'
import ServiceModal from './ServiceModal'
import type { Subscription } from '../types'

const getUrgencyClass = (daysLeft: number): string => {
  if (daysLeft <= 3) return 'urgent-high'
  if (daysLeft <= 5) return 'urgent-mid'
  return 'urgent-low'
}

const cycleLabel = (cycle: string): string => {
  switch (cycle) {
    case 'monthly': return '¥/月'
    case 'quarterly': return '¥/季'
    case 'yearly': return '¥/年'
    default: return ''
  }
}

interface RenewalCardProps {
  subscription: Subscription
  onClick: () => void
  isActive: boolean
  index: number
}

const RenewalCard = memo(function RenewalCard({ subscription, onClick, isActive, index }: RenewalCardProps) {
  const daysLeft = differenceInDays(parseISO(subscription.nextBillingDate), new Date())
  const urgencyClass = getUrgencyClass(daysLeft)

  return (
    <div
      className={`renewal-card ${urgencyClass} ${isActive ? 'renewal-card-active' : ''}`}
      onClick={onClick}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="renewal-card-header">
        <div className="renewal-card-name">{subscription.name}</div>
        <div className="renewal-card-days">
          {daysLeft === 0 ? '今天' : `${daysLeft}天后`}
        </div>
      </div>
      <div className="renewal-card-date">
        <i className="fas fa-calendar" style={{ marginRight: 6, opacity: 0.8 }}></i>
        {format(parseISO(subscription.nextBillingDate), 'yyyy年MM月dd日')}
      </div>
      <div className="renewal-card-amount">
        ¥{subscription.amount.toFixed(2)}
        <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 400 }}>
          {' '}{cycleLabel(subscription.billingCycle)}
        </span>
      </div>
    </div>
  )
})

const Dashboard = () => {
  const navigate = useNavigate()
  const { subscriptions, getUpcomingRenewals, getMonthlyCost } = useStore()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  const upcomingRenewals = useMemo(() => getUpcomingRenewals(7), [getUpcomingRenewals])
  const monthlyCost = useMemo(() => getMonthlyCost(), [getMonthlyCost])
  const activeCount = useMemo(() => subscriptions.filter(s => s.status === 'active').length, [subscriptions])
  const upcomingCount = upcomingRenewals.length

  useEffect(() => {
    if (upcomingRenewals.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % upcomingRenewals.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [upcomingRenewals.length])

  const handleRenewalClick = useCallback((sub: Subscription) => {
    setEditingSub(sub)
    setEditModalOpen(true)
  }, [])

  const handleDotClick = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  const topServices = useMemo(() => {
    return [...subscriptions]
      .filter(s => s.status !== 'cancelled')
      .sort((a, b) => getMonthlyAmount(b.amount, b.billingCycle) - getMonthlyAmount(a.amount, a.billingCycle))
      .slice(0, 5)
  }, [subscriptions])

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-gauge-high"></i>
          仪表板概览
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/services')}
        >
          <i className="fas fa-list-check"></i>
          管理服务
        </button>
      </div>

      <div className="renewal-carousel">
        <div className="carousel-title">
          <i className="fas fa-bell"></i>
          7天内即将扣款
          {upcomingCount > 0 && (
            <span style={{
              background: 'var(--accent-secondary)',
              color: 'white',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600
            }}>
              {upcomingCount}
            </span>
          )}
        </div>

        {upcomingRenewals.length > 0 ? (
          <>
            <div className="carousel-viewport">
              <div
                className="carousel-track"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                  transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {upcomingRenewals.map((sub, idx) => (
                  <div key={sub.id} className="carousel-slide">
                    <RenewalCard
                      subscription={sub}
                      onClick={() => handleRenewalClick(sub)}
                      isActive={idx === currentSlide}
                      index={idx}
                    />
                  </div>
                ))}
              </div>
            </div>

            {upcomingRenewals.length > 1 && (
              <div className="carousel-dots">
                {upcomingRenewals.map((_, idx) => (
                  <button
                    key={idx}
                    className={`carousel-dot ${idx === currentSlide ? 'active' : ''}`}
                    onClick={() => handleDotClick(idx)}
                    aria-label={`切换到第 ${idx + 1} 个卡片`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-carousel">
            <i className="fas fa-calendar-check"></i>
            <div>未来7天内没有待扣款的订阅</div>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">活跃订阅</span>
            <div className="stat-card-icon blue">
              <i className="fas fa-layer-group"></i>
            </div>
          </div>
          <div className="stat-card-value">{activeCount}</div>
          <div className="stat-card-sub">
            共 {subscriptions.length} 条订阅记录
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">月均费用</span>
            <div className="stat-card-icon green">
              <i className="fas fa-wallet"></i>
            </div>
          </div>
          <div className="stat-card-value">¥{monthlyCost.toFixed(2)}</div>
          <div className="stat-card-sub">
            约 ¥{(monthlyCost * 12).toFixed(2)} / 年
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">即将到期</span>
            <div className="stat-card-icon orange">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
          </div>
          <div className="stat-card-value">{upcomingCount}</div>
          <div className="stat-card-sub">
            7天内需关注的服务
          </div>
        </div>
      </div>

      <div className="section-title">
        <i className="fas fa-star"></i>
        高费用订阅 Top 5
      </div>

      {topServices.length > 0 ? (
        <div className="services-grid">
          {topServices.map((sub, idx) => (
            <div
              key={sub.id}
              className="service-card"
              style={{ animationDelay: `${idx * 80}ms` }}
              onClick={() => {
                setEditingSub(sub)
                setEditModalOpen(true)
              }}
            >
              <div className="service-card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: `linear-gradient(135deg, hsl(${(idx * 60) % 360}, 70%, 60%), hsl(${((idx * 60) + 40) % 360}, 70%, 50%))`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 700
                    }}>
                      {idx + 1}
                    </div>
                    <div className="service-card-name">{sub.name}</div>
                  </div>
                  <span className={`status-badge ${sub.status}`} style={{ marginTop: 8, display: 'inline-block' }}>
                    {sub.status === 'active' ? '活跃' : sub.status === 'paused' ? '暂停' : '已取消'}
                  </span>
                </div>
              </div>
              <div className="service-card-amount">
                ¥{getMonthlyAmount(sub.amount, sub.billingCycle).toFixed(2)}
              </div>
              <div className="service-card-cycle">月均 · 实际 ¥{sub.amount}{cycleLabel(sub.billingCycle)}</div>
              <div className="service-card-meta">
                <div className="service-card-meta-item">
                  <i className="fas fa-calendar-day"></i>
                  下次扣款：{format(parseISO(sub.nextBillingDate), 'MM-dd')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <h3>还没有订阅数据</h3>
          <p>点击"管理服务"添加您的第一个SaaS订阅</p>
          <button className="btn btn-primary" onClick={() => navigate('/services')}>
            <i className="fas fa-plus"></i>
            立即添加
          </button>
        </div>
      )}

      {editModalOpen && (
        <ServiceModal
          subscription={editingSub}
          onClose={() => {
            setEditModalOpen(false)
            setEditingSub(null)
          }}
        />
      )}
    </>
  )
}

export default Dashboard
