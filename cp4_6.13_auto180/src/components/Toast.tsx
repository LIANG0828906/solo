import { useStore } from '@/store'

export default function Toast() {
  const toast = useStore((s) => s.toast)
  const hideToast = useStore((s) => s.hideToast)

  if (!toast.message && !toast.visible) return null

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 ${
        toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{ backgroundColor: '#4caf50' }}
      onClick={hideToast}
    >
      {toast.message}
    </div>
  )
}
