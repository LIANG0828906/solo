import { useCanvasStore } from '@/store/canvasStore'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Notification() {
  const { notifications } = useCanvasStore()

  const getIcon = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Info className="w-5 h-5 text-sky-400" />
    }
  }

  const getBgColor = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30'
      case 'error':
        return 'border-red-500/30'
      default:
        return 'border-sky-500/30'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={cn(
            'flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl border',
            'bg-slate-900/95 backdrop-blur-sm',
            getBgColor(notif.type),
            'animate-[fadeIn_0.2s_ease-out]'
          )}
          style={{
            animation: 'notificationIn 0.2s ease-out',
          }}
        >
          {getIcon(notif.type)}
          <span className="text-white text-sm font-medium">{notif.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes notificationIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
