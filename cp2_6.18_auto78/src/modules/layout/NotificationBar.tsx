import React from 'react'
import { useProjectStore } from '../../store/projectStore'

export const NotificationBar: React.FC = () => {
  const notifications = useProjectStore((s) => s.notifications)
  const removeNotification = useProjectStore((s) => s.removeNotification)

  if (notifications.length === 0) return null

  return (
    <>
      {notifications.map((n) => (
        <div key={n.id} className="notification-bar" onClick={() => removeNotification(n.id)}>
          {n.message}
        </div>
      ))}
    </>
  )
}
