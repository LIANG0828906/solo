import { useState, useMemo } from 'react'
import { User, UserStatus } from '../store/AppState'

interface UserCardProps {
  user: User
  rank: number
}

function FlameIcon({ days, size = 18 }: { days: number; size?: number }) {
  const color = useMemo(() => {
    if (days >= 7) return { main: '#FFD700', glow: '#FFA500' }
    const ratio = Math.max(0, Math.min(1, (days - 1) / 6))
    const r = Math.round(59 + ratio * (239 - 59))
    const g = Math.round(130 + ratio * (83 - 130))
    const b = Math.round(246 + ratio * (80 - 246))
    return {
      main: `rgb(${r}, ${g}, ${b})`,
      glow: `rgba(${r}, ${g}, ${b}, 0.5)`
    }
  }, [days])

  const particles = days >= 7 ? Array.from({ length: 6 }) : []

  return (
    <div className={days >= 7 ? 'flame-flicker' : ''} style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: `drop-shadow(0 0 3px ${color.glow})`
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M12 2C12 2 7 8 7 14C7 17.31 9.69 20 13 20C16.31 20 19 17.31 19 14C19 10 16 8 14 6C14 9 12 10 12 12C12 9 13 6 12 2Z"
          fill={color.main}
        />
        <path
          d="M12 10C12 10 10 12 10 14C10 15.66 11.34 17 13 17C14.66 17 16 15.66 16 14C16 12.5 14.5 11.5 14 10.5C14 12 13 12.5 12 14"
          fill="rgba(255,255,255,0.5)"
        />
      </svg>
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2
        const dist = size * 0.6
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist - size * 0.3
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              width: 3,
              height: 3,
              borderRadius: '50%',
              backgroundColor: '#FFD700',
              top: '50%',
              left: '50%',
              ['--dx' as any]: `${dx}px`,
              ['--dy' as any]: `${dy}px`,
              animation: `particle-float ${1.2 + i * 0.2}s ease-out ${i * 0.1}s infinite`
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}

function StatusTag({ status }: { status: UserStatus }) {
  const config = {
    focusing: {
      text: '专注中',
      bg: 'rgba(76, 175, 80, 0.15)',
      color: '#4CAF50',
      border: '1px solid rgba(76, 175, 80, 0.3)',
      className: 'focus-glow'
    },
    resting: {
      text: '休息中',
      bg: 'rgba(255, 152, 0, 0.15)',
      color: '#FF9800',
      border: '1px solid rgba(255, 152, 0, 0.3)',
      className: 'break-pulse'
    },
    offline: {
      text: '离线',
      bg: 'rgba(158, 158, 158, 0.12)',
      color: '#9E9E9E',
      border: '1px solid rgba(158, 158, 158, 0.2)',
      className: ''
    }
  }[status]

  return (
    <span
      className={config.className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        border: config.border,
        opacity: status === 'offline' ? 0.7 : 1
      }}
    >
      {config.text}
    </span>
  )
}

export default function UserCard({ user, rank }: UserCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '18px 16px',
        borderRadius: 16,
        backgroundColor: user.id.startsWith('current-user')
          ? 'rgba(91, 143, 185, 0.08)'
          : 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(12px)',
        border: user.id.startsWith('current-user')
          ? '1px solid rgba(91, 143, 185, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: hovered
          ? '0 12px 32px rgba(92, 107, 122, 0.15), 0 4px 12px rgba(92, 107, 122, 0.08)'
          : '0 4px 16px rgba(92, 107, 122, 0.08), 0 2px 6px rgba(92, 107, 122, 0.04)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.2s ease-out',
        cursor: 'pointer',
        opacity: user.status === 'offline' ? 0.85 : 1
      }}
    >
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: rank <= 3
          ? (rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32')
          : 'rgba(92, 107, 122, 0.1)',
        color: rank <= 3 ? '#fff' : '#5C6B7A',
        fontSize: rank <= 3 ? 12 : 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {rank}
      </div>

      <div style={{ marginBottom: 10, marginTop: 2 }}>
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#2D3748'
        }}>
          {user.nickname}
        </span>
        {user.id.startsWith('current-user') && (
          <span style={{
            marginLeft: 8,
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 600,
            backgroundColor: 'rgba(91, 143, 185, 0.2)',
            color: '#5B8FB9'
          }}>
            我
          </span>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <StatusTag status={user.status} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTop: '1px solid rgba(92, 107, 122, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FlameIcon days={user.consecutiveDays} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5C6B7A' }}>
            {user.consecutiveDays}天
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#8B95A5' }}>
          累计 {Math.floor(user.totalMinutes / 60)}h{user.totalMinutes % 60}m
        </div>
      </div>
    </div>
  )
}
