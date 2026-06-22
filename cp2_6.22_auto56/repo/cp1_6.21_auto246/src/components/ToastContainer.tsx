import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import type { ToastType } from '@/types'

const toastConfig: Record<ToastType, { bg: string; icon: typeof CheckCircle }> = {
  success: {
    bg: 'bg-emerald-500',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-500',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-amber-500',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-500',
    icon: Info,
  },
}

interface AnimatedToast {
  id: string
  type: ToastType
  message: string
  show: boolean
}

export default function ToastContainer() {
  const toasts = useStore(state => state.toasts)
  const [animatedToasts, setAnimatedToasts] = useState<AnimatedToast[]>([])

  useEffect(() => {
    const currentIds = new Set(animatedToasts.map(t => t.id))
    const newToasts: AnimatedToast[] = []

    for (const toast of toasts) {
      if (!currentIds.has(toast.id)) {
        newToasts.push({ ...toast, show: false })
      }
    }

    if (newToasts.length > 0) {
      setAnimatedToasts(prev => [...prev, ...newToasts])
      const ids = newToasts.map(t => t.id)
      requestAnimationFrame(() => {
        setAnimatedToasts(prev =>
          prev.map(t => (ids.includes(t.id) ? { ...t, show: true } : t))
        )
      })
    }

    const toastIds = new Set(toasts.map(t => t.id))
    const toRemove = animatedToasts.filter(t => !toastIds.has(t.id) && t.show)

    if (toRemove.length > 0) {
      const removeIds = toRemove.map(t => t.id)
      setAnimatedToasts(prev =>
        prev.map(t => (removeIds.includes(t.id) ? { ...t, show: false } : t))
      )
      setTimeout(() => {
        setAnimatedToasts(prev => prev.filter(t => !removeIds.includes(t.id)))
      }, 300)
    }
  }, [toasts, animatedToasts])

  if (animatedToasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {animatedToasts.map(toast => {
        const config = toastConfig[toast.type]
        const Icon = config.icon
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg',
              'transform transition-all duration-300 ease-out',
              'min-w-[240px] max-w-[400px]',
              config.bg,
              toast.show
                ? 'translate-x-0 opacity-100'
                : 'translate-x-full opacity-0'
            )}
            style={{
              transitionTimingFunction: toast.show
                ? 'cubic-bezier(0.16, 1, 0.3, 1)'
                : 'cubic-bezier(0.4, 0, 1, 1)',
            }}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            <span className="text-sm font-medium leading-snug break-words">
              {toast.message}
            </span>
          </div>
        )
      })}
    </div>
  )
}
