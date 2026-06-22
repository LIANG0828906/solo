import { useState, useEffect } from 'react'
import { useAppStore, WSMessage } from '@/store'

const NOTIFICATION_DURATION = 5000

function getIcon(type: WSMessage['type']): string {
  switch (type) {
    case 'appointment_confirmed':
      return '✅'
    case 'progress_update':
      return '🔄'
    case 'style_complete':
      return '🎉'
    default:
      return '✅'
  }
}

function NotificationItem({
  notification,
  onRemove,
}: {
  notification: WSMessage
  onRemove: () => void
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 100
        if (next >= NOTIFICATION_DURATION) {
          clearInterval(interval)
          onRemove()
          return NOTIFICATION_DURATION
        }
        return next
      })
    }, 100)
    return () => clearInterval(interval)
  }, [onRemove])

  const remaining = Math.max(0, Math.ceil((NOTIFICATION_DURATION - elapsed) / 1000))
  const progressPercent = Math.max(0, ((NOTIFICATION_DURATION - elapsed) / NOTIFICATION_DURATION) * 100)

  return (
    <div style={styles.card}>
      <div style={styles.accentBar} />
      <button onClick={onRemove} style={styles.closeBtn}>
        ×
      </button>
      <div style={styles.body}>
        <span style={styles.icon}>{getIcon(notification.type)}</span>
        <div style={styles.content}>
          <div style={styles.message}>{notification.payload.message || ''}</div>
          <div style={styles.timer}>{remaining}s</div>
        </div>
      </div>
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progressPercent}%`,
          }}
        />
      </div>
    </div>
  )
}

export default function ToastNotification() {
  const notifications = useAppStore((s) => s.notifications)
  const removeNotification = useAppStore((s) => s.removeNotification)

  const visible = notifications.slice(-3)

  return (
    <div style={styles.container}>
      {visible.map((n) => (
        <NotificationItem
          key={n.timestamp}
          notification={n}
          onRemove={() => removeNotification(n.timestamp)}
        />
      ))}
    </div>
  )
}

const keyframesStyle = `
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`

const styleEl = document.createElement('style')
styleEl.textContent = keyframesStyle
document.head.appendChild(styleEl)

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
    borderLeft: '4px solid #e67e22',
    padding: '14px 36px 14px 18px',
    minWidth: 300,
    maxWidth: 380,
    overflow: 'hidden',
    pointerEvents: 'auto',
    animation: 'slideInRight 0.3s ease-out',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    background: '#e67e22',
    borderRadius: '12px 0 0 12px',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 10,
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#999',
    lineHeight: 1,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 22,
    flexShrink: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 1.4,
  },
  timer: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: 600,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: '#f5f5f5',
    borderRadius: '0 0 12px 12px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #e67e22, #f39c12)',
    borderRadius: '0 0 12px 12px',
    transition: 'width 100ms linear',
  },
}
