import { create } from 'zustand'

interface ToastState {
  message: string | null
  show: (message: string) => void
  hide: () => void
}

const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message: string) => {
    set({ message })
    setTimeout(() => set({ message: null }), 3000)
  },
  hide: () => set({ message: null }),
}))

export function showToast(message: string) {
  useToastStore.getState().show(message)
}

function Toast() {
  const message = useToastStore((state) => state.message)

  if (!message) return null

  return (
    <div className="toast-container">
      <div className="toast">
        <svg
          className="toast-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span className="toast-message">{message}</span>
      </div>
    </div>
  )
}

export default Toast
