import { useRef, useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import type { Resume } from '@shared/types'
import { User, Briefcase, Star, GripVertical } from 'lucide-react'

const lanes = [
  { key: 'pending' as const, label: '待筛选', bg: 'bg-[#f1f5f9]' },
  { key: 'interviewed' as const, label: '已面试', bg: 'bg-[#eff6ff]' },
  { key: 'hired' as const, label: '已录用', bg: 'bg-[#f0fdf4]' },
  { key: 'rejected' as const, label: '已淘汰', bg: 'bg-[#fef2f2]' },
]

const statusKeyMap: Record<string, Resume['status']> = {
  pending: 'pending',
  interviewed: 'interviewed',
  hired: 'hired',
  rejected: 'rejected',
}

export default function KanbanPageV2() {
  const resumes = useAppStore((s) => s.resumes)
  const fetchResumes = useAppStore((s) => s.fetchResumes)
  const updateResumeStatus = useAppStore((s) => s.updateResumeStatus)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [droppedIds, setDroppedIds] = useState<Set<string>>(new Set())
  const cloneRef = useRef<HTMLDivElement | null>(null)
  const laneRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const posRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const dragDataRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)

  useEffect(() => { fetchResumes() }, [fetchResumes])

  const updateClonePos = () => {
    rafRef.current = null
    if (!cloneRef.current || !dragDataRef.current) return
    const { x, y } = posRef.current
    const { offsetX, offsetY } = dragDataRef.current
    cloneRef.current.style.transform = `translate3d(${x - offsetX}px, ${y - offsetY}px, 0)`
  }

  const scheduleUpdate = () => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(updateClonePos)
  }

  const handlePointerDown = (e: React.PointerEvent, resume: Resume) => {
    if (e.button !== 0) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dragDataRef.current = {
      id: resume.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }
    posRef.current = { x: e.clientX, y: e.clientY }
    setDraggedId(resume.id)

    if (cloneRef.current) {
      cloneRef.current.style.display = 'block'
      const nameEl = cloneRef.current.querySelector('[data-clone-name]') as HTMLElement
      const jobEl = cloneRef.current.querySelector('[data-clone-job]') as HTMLElement
      const scoreEl = cloneRef.current.querySelector('[data-clone-score]') as HTMLElement
      const starEl = cloneRef.current.querySelector('[data-clone-star]') as HTMLElement
      if (nameEl) nameEl.textContent = resume.name
      if (jobEl) jobEl.textContent = resume.jobTitle
      if (scoreEl) scoreEl.textContent = `${resume.averageScore.toFixed(1)}分 · ${resume.scores.length}条评价`
      if (starEl) {
        starEl.style.color = resume.averageScore > 0 ? '#f59e0b' : '#d1d5db'
        starEl.setAttribute('fill', resume.averageScore > 0 ? '#f59e0b' : 'none')
      }
    }

    const onPointerMove = (ev: PointerEvent) => {
      posRef.current = { x: ev.clientX, y: ev.clientY }
      scheduleUpdate()
    }

    const onPointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      if (cloneRef.current) {
        cloneRef.current.style.display = 'none'
      }

      const data = dragDataRef.current
      dragDataRef.current = null
      setDraggedId(null)

      if (!data) return

      let targetStatus: Resume['status'] | null = null
      for (const [key, el] of laneRefs.current.entries()) {
        const r = el.getBoundingClientRect()
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
          targetStatus = statusKeyMap[key] ?? null
          break
        }
      }

      if (targetStatus) {
        updateResumeStatus(data.id, targetStatus)
        setDroppedIds((prev) => {
          const next = new Set(prev)
          next.add(data.id)
          return next
        })
        setTimeout(() => {
          setDroppedIds((prev) => {
            const next = new Set(prev)
            next.delete(data.id)
            return next
          })
        }, 500)
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-800">候选人看板</h1>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-4 p-4 overflow-x-auto">
        {lanes.map((lane) => {
          const laneResumes = resumes.filter((r) => r.status === lane.key)
          return (
            <div
              key={lane.key}
              ref={(el) => { if (el) laneRefs.current.set(lane.key, el) }}
              className={`flex-1 min-w-[240px] rounded-xl p-3 flex flex-col ${lane.bg}`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-medium text-sm text-gray-700">{lane.label}</span>
                <span className="bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {laneResumes.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {laneResumes.map((resume) => (
                  <div
                    key={resume.id}
                    onPointerDown={(e) => handlePointerDown(e, resume)}
                    className={`
                      bg-white rounded-lg shadow-sm p-3 mb-3 cursor-grab active:cursor-grabbing
                      transition-all duration-400 ease-in-out select-none touch-none
                      ${draggedId === resume.id ? 'opacity-50 scale-95' : 'opacity-100'}
                      ${droppedIds.has(resume.id) ? 'animate-slideIn' : ''}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={16} className="text-gray-300 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <User size={14} className="text-gray-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-800 truncate">{resume.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Briefcase size={13} className="text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-500 truncate">{resume.jobTitle}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star
                            size={13}
                            className="shrink-0"
                            style={{ color: resume.averageScore > 0 ? '#f59e0b' : '#d1d5db' }}
                            fill={resume.averageScore > 0 ? '#f59e0b' : 'none'}
                          />
                          <span className="text-xs text-gray-500">
                            {resume.averageScore.toFixed(1)}分 · {resume.scores.length}条评价
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div
        ref={cloneRef}
        className="fixed pointer-events-none z-50 opacity-75 hidden"
        style={{ left: 0, top: 0, willChange: 'transform' }}
      >
        <div className="bg-white rounded-lg shadow-lg p-3 w-56 border border-gray-200">
          <div className="flex items-start gap-2">
            <GripVertical size={16} className="text-gray-300 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <User size={14} className="text-gray-500 shrink-0" />
                <span data-clone-name className="text-sm font-medium text-gray-800 truncate"></span>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Briefcase size={13} className="text-gray-400 shrink-0" />
                <span data-clone-job className="text-xs text-gray-500 truncate"></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star data-clone-star size={13} className="shrink-0 text-amber-500" fill="#f59e0b" />
                <span data-clone-score className="text-xs text-gray-500"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
