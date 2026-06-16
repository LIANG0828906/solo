import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '../stores/tripStore'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    
    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { getUpcomingTrips, getCompletedTrips, trips } = useTripStore()

  const upcomingTrips = useMemo(() => getUpcomingTrips(), [getUpcomingTrips])
  const completedTrips = useMemo(() => getCompletedTrips().slice(0, 3), [getCompletedTrips])

  const statistics = useMemo(() => {
    const totalTrips = trips.length
    const totalPackedItems = trips.reduce((sum, trip) => {
      return sum + trip.luggageItems.filter(item => item.packed).length
    }, 0)
    const totalWeight = trips.reduce((sum, trip) => {
      return sum + (trip.totalWeight || 0)
    }, 0)
    return { totalTrips, totalPackedItems, totalWeight }
  }, [trips])

  const calculateProgress = useCallback((luggageItems: { packed: boolean }[]) => {
    if (luggageItems.length === 0) return 0
    const packed = luggageItems.filter(item => item.packed).length
    return Math.round((packed / luggageItems.length) * 100)
  }, [])

  const handleCreateTrip = useCallback(() => {
    navigate('/trips/new')
  }, [navigate])

  const handleTripClick = useCallback((tripId: string) => {
    navigate(`/trips/${tripId}`)
  }, [navigate])

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  return (
    <div className="page-wrapper fade-in-slide-up">
      <div className="page-header">
        <h1 className="page-title">我的仪表盘</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '14px' : '16px', marginTop: '8px' }}>
          欢迎回来，开始规划你的下一次精彩旅程吧！
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">快速操作</h2>
        </div>
        <button className="btn btn-primary" onClick={handleCreateTrip}>
          <span style={{ fontSize: '18px' }}>✈️</span>
          新建旅行
        </button>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
          gap: '16px', 
          marginBottom: '24px' 
        }}
      >
        <div className="card">
          <div style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            总旅行次数
          </div>
          <div style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 800, color: 'var(--accent-dark)' }}>
            {statistics.totalTrips}
          </div>
          <div style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--accent-blue)', marginTop: '4px' }}>
            次旅行
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            已打包物品
          </div>
          <div style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 800, color: 'var(--accent-dark)' }}>
            {statistics.totalPackedItems}
          </div>
          <div style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--accent-blue)', marginTop: '4px' }}>
            件物品
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            累计重量
          </div>
          <div style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 800, color: 'var(--accent-dark)' }}>
            {statistics.totalWeight.toFixed(1)}
          </div>
          <div style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--accent-blue)', marginTop: '4px' }}>
            公斤
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">即将开始的旅行</h2>
        </div>
        {upcomingTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? '32px 16px' : '48px 24px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: isMobile ? '40px' : '48px', marginBottom: '12px' }}>🗓️</div>
            <div style={{ fontSize: isMobile ? '14px' : '16px' }}>暂无即将开始的旅行</div>
            <div style={{ fontSize: isMobile ? '12px' : '14px', marginTop: '4px' }}>点击"新建旅行"开始规划吧</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingTrips.map((trip, index) => (
              <div
                key={trip.id}
                className="card"
                style={{ 
                  cursor: 'pointer', 
                  opacity: 0,
                  animation: 'fadeInSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => handleTripClick(trip.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {trip.destination}
                    </div>
                    <div style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--text-secondary)' }}>
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </div>
                    <div style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--accent-blue)', marginTop: '4px' }}>
                      {trip.templateName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--accent-dark)' }}>
                      {calculateProgress(trip.luggageItems)}%
                    </div>
                    <div style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-secondary)' }}>
                      打包进度
                    </div>
                  </div>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-light))',
                      borderRadius: '3px',
                      width: `${calculateProgress(trip.luggageItems)}%`,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">最近完成的旅行</h2>
        </div>
        {completedTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? '32px 16px' : '48px 24px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: isMobile ? '40px' : '48px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontSize: isMobile ? '14px' : '16px' }}>暂无已完成的旅行</div>
            <div style={{ fontSize: isMobile ? '12px' : '14px', marginTop: '4px' }}>完成旅行后会在这里显示</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completedTrips.map((trip, index) => (
              <div
                key={trip.id}
                className="card"
                style={{ 
                  cursor: 'pointer', 
                  opacity: 0,
                  animation: 'fadeInSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => handleTripClick(trip.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {trip.destination}
                    </div>
                    <div style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--text-secondary)' }}>
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </div>
                    <div style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--accent-blue)', marginTop: '4px' }}>
                      {trip.templateName}
                    </div>
                  </div>
                  <div style={{ 
                    background: '#E8F5E9', 
                    color: '#2E7D32', 
                    padding: isMobile ? '4px 10px' : '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: isMobile ? '11px' : '12px', 
                    fontWeight: 600 
                  }}>
                    已完成
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
