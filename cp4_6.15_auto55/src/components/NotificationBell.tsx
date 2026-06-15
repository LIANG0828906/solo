import { memo, useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useStore } from '@/store'

interface NotificationBellProps {
  count?: number
  onClick?: () => void
}

const NotificationBell = memo(function NotificationBell({ count, onClick }: NotificationBellProps) {
  const notifications = useStore((s) => s.notifications)
  const internalCount = count ?? notifications.filter((n) => !n.read).length

  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    if (internalCount > 0) {
      setIsNew(true)
      const timer = setTimeout(() => setIsNew(false), 600)
      return () => clearTimeout(timer)
    }
  }, [internalCount])

  return (
    <button className="btn-hover relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#2C5F3B]" onClick={onClick}>
      <Bell className="h-5 w-5" />
      {internalCount > 0 && (
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ${isNew ? 'animate-bell-bounce' : ''}`}
        >
          {internalCount > 99 ? '99+' : internalCount}
        </span>
      )}
    </button>
  )
})

export default NotificationBell
