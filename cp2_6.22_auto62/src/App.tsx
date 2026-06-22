import { useCallback, useRef, useEffect } from 'react'
import { GripVertical } from 'lucide-react'
import SubmissionPanel from '@/assessment/SubmissionPanel'
import ReportView from '@/assessment/ReportView'
import { useEvaluationStore } from '@/assessment/store'

export default function App() {
  const { leftWidth, setLeftWidth } = useEvaluationStore()
  const dragging = useRef(false)

  const onMouseDown = useCallback(() => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const mainEl = document.getElementById('main-content')
      if (!mainEl) return
      const rect = mainEl.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftWidth(Math.max(20, Math.min(80, pct)))
    }
    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [setLeftWidth])

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f0f4f8', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <header className="shrink-0 h-12 flex items-center px-6 shadow-md" style={{ background: '#1a3a5c' }}>
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff7f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <h1 className="text-white text-lg font-semibold tracking-wide">编程作业评测系统</h1>
        </div>
      </header>

      <main id="main-content" className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div
          className="overflow-hidden flex-shrink-0 h-[45vh] lg:h-auto"
          style={{ width: `${leftWidth}%` }}
        >
          <SubmissionPanel />
        </div>

        <div
          className="hidden lg:flex items-center justify-center cursor-col-resize shrink-0 hover:brightness-125 transition-all"
          style={{ width: '6px', background: 'linear-gradient(180deg, #1a3a5c 0%, #2d5a8e 100%)' }}
          onMouseDown={onMouseDown}
        >
          <GripVertical className="text-white/40 h-4 w-4" />
        </div>

        <div className="overflow-hidden flex-1 min-w-0">
          <ReportView />
        </div>
      </main>
    </div>
  )
}
