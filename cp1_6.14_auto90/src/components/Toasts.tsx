import { useAppStore } from '@/store/app'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'

export default function Toasts() {
  const { toasts, removeToast } = useAppStore()
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-40 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-enter pointer-events-auto flex items-center gap-3 rounded-btn px-4 py-3 text-sm text-white shadow-lg ${
            t.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-2 opacity-80 hover:opacity-100"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
