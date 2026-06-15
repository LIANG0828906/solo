import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationProps {
  id: string
  type?: NotificationType
  title?: string
  message: string
  duration?: number
  onClose: (id: string) => void
}

const iconMap: Record<NotificationType, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
}

export default function Notification({
  id,
  type = 'info',
  title,
  message,
  duration = 3000,
  onClose,
}: NotificationProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
    }, duration - 400)

    const closeTimer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(closeTimer)
    }
  }, [id, duration, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 400)
  }

  return (
    <div
      className={cn(
        'notification',
        `notification-${type}`,
        isExiting ? 'animate-notification-out' : 'animate-notification-in'
      )}
    >
      <div className="notification-icon">
        {iconMap[type]}
      </div>
      <div className="notification-content">
        {title && <div className="notification-title">{title}</div>}
        <div className="notification-message">{message}</div>
      </div>
      <button
        type="button"
        className="notification-close"
        onClick={handleClose}
        aria-label="关闭通知"
      >
        ×
      </button>
      <div className="notification-progress">
        <div
          className="notification-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  )
}

interface NotificationItem {
  id: string
  type?: NotificationType
  title?: string
  message: string
  duration?: number
}

interface NotificationContainerProps {
  notifications: NotificationItem[]
  onClose: (id: string) => void
}

export function NotificationContainer({
  notifications,
  onClose,
}: NotificationContainerProps) {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

let notificationId = 0

// eslint-disable-next-line react-refresh/only-export-components
export function createNotification(
  message: string,
  type: NotificationType = 'info',
  title?: string
): NotificationItem {
  return {
    id: `notification-${++notificationId}`,
    type,
    title,
    message,
    duration: 3000,
  }
}
