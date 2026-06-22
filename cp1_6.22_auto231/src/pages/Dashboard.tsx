import { useState, useEffect, useRef } from 'react'
import { api, Stats } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)
  const hasAnimated = useRef(false)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const data = await api.getStats()
      setStats(data)
      setTimeout(() => {
        hasAnimated.current = true
        setAnimated(true)
      }, 100)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: '总动物数',
      value: stats?.totalAnimals || 0,
      bgColor: '#ECFDF5',
      textColor: '#065F46',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
          <circle cx="12" cy="12" r="2" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="16" cy="8" r="1.5" />
          <circle cx="7" cy="14" r="1.5" />
          <circle cx="17" cy="14" r="1.5" />
        </svg>
      )
    },
    {
      label: '待领养',
      value: stats?.availableAnimals || 0,
      bgColor: '#EFF6FF',
      textColor: '#1E40AF',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )
    },
    {
      label: '本月领养',
      value: stats?.thisMonthAdoptions || 0,
      bgColor: '#FEF3C7',
      textColor: '#92400E',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      )
    },
    {
      label: '本月回访',
      value: stats?.thisMonthFollowups || 0,
      bgColor: '#FEE2E2',
      textColor: '#991B1B',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    }
  ]

  return (
    <div style={containerStyle}>
      <h1 style={pageTitleStyle}>管理面板</h1>
      <p style={subtitleStyle}>欢迎使用 PawCare 动物收容所管理系统</p>

      <div style={statsGridStyle}>
        {statCards.map((card, index) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            bgColor={card.bgColor}
            textColor={card.textColor}
            icon={card.icon}
            animated={animated}
            delay={index * 100}
          />
        ))}
      </div>

      <div style={quickActionsStyle}>
        <h2 style={sectionTitleStyle}>快捷操作</h2>
        <div style={actionGridStyle}>
          <button style={actionBtnStyle}>
            <span style={{ fontSize: '24px' }}>🐾</span>
            <span>添加动物</span>
          </button>
          <button style={actionBtnStyle}>
            <span style={{ fontSize: '24px' }}>📝</span>
            <span>查看申请</span>
          </button>
          <button style={actionBtnStyle}>
            <span style={{ fontSize: '24px' }}>💬</span>
            <span>回访记录</span>
          </button>
          <button style={actionBtnStyle}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <span>数据报表</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, bgColor, textColor, icon, animated, delay
}: {
  label: string
  value: number
  bgColor: string
  textColor: string
  icon: React.ReactNode
  animated: boolean
  delay: number
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (animated) {
      const start = 0
      const end = value
      const duration = 500
      const startTime = performance.now() + delay

      function animate(currentTime: number) {
        if (currentTime < startTime) {
          requestAnimationFrame(animate)
          return
        }
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setDisplayValue(Math.floor(start + (end - start) * easeOut))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [animated, value, delay])

  return (
    <div style={{
      ...cardStyle,
      background: `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)`,
    }}>
      <div style={iconWrapStyle}>{icon}</div>
      <div style={cardContentStyle}>
        <span style={{ ...cardLabelStyle, color: textColor }}>{label}</span>
        <span style={{ ...cardValueStyle, color: textColor }}>
          {displayValue}
        </span>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  padding: '32px'
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#1E293B',
  margin: 0,
  marginBottom: '8px'
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748B',
  margin: 0,
  marginBottom: '32px'
}

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '20px',
  marginBottom: '40px'
}

const cardStyle: React.CSSProperties = {
  padding: '24px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  transition: 'all 0.3s ease',
  cursor: 'pointer'
}

const iconWrapStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  backgroundColor: 'rgba(255,255,255,0.7)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const cardContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
}

const cardLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: '4px'
}

const cardValueStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  lineHeight: 1
}

const quickActionsStyle: React.CSSProperties = {
  marginTop: '8px'
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#1E293B',
  margin: 0,
  marginBottom: '16px'
}

const actionGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '16px'
}

const actionBtnStyle: React.CSSProperties = {
  padding: '24px 16px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#475569',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
}
