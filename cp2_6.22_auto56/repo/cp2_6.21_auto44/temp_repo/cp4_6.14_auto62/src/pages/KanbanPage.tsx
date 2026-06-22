import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '@/store'
import type { Resume } from '@shared/types'
import { User, Briefcase, Star, GripVertical } from 'lucide-react'

const lanes = [
  { key: 'pending' as const, label: '待筛选', bg: '#f1f5f9', accent: '#94a3b8', badge: 'bg-slate-400' },
  { key: 'interviewed' as const, label: '已面试', bg: '#eff6ff', accent: '#60a5fa', badge: 'bg-blue-400' },
  { key: 'hired' as const, label: '已录用', bg: '#f0fdf4', accent: '#4ade80', badge: 'bg-green-400' },
  { key: 'rejected' as const, label: '已淘汰', bg: '#fef2f2', accent: '#f87171', badge: 'bg-red-400' },
]

export default function KanbanPage() {
  const resumes = useAppStore((s) => s.resumes)
  const fetchResumes = useAppStore((s) => s.fetchResumes)
  const updateResumeStatus = useAppStore((s) => s.updateResumeStatus)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [clonePos, setClonePos] = useState<{ x: number; y: number; resume: Resume } | null>(null)
  const [droppedIds, setDroppedIds] = useState<Set<string>>(new Set())
  const dropTargetRef = useRef<string | null>(null)

  useEffect(() => { fetchResumes() }, [fetchResumes])

  const handleDragStart = useCallback((e: React.DragEvent, resume: Resume) => {
    setDraggedId(resume.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', resume.id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, status: Resume['status']) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dropTargetRef.current = status
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, status: Resume['status']) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      updateResumeStatus(id, status)
      setDroppedIds((prev) => new Set(prev).add(id))
      setTimeout(() => {
        setDroppedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 500)
    }
    dropTargetRef.current = null
  }, [updateResumeStatus])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setClonePos(null)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, resume: Resume) => {
    if (e.button !== 0) return
    const startX = e.clientX
    const startY = e.clientY
    let moved = false

    const onMouseMove = (ev: MouseEvent) => {
      if (!moved && (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4)) {
        moved = true
        setClonePos({ x: ev.clientX, y: ev.clientY, resume })
        setDraggedId(resume.id)
      }
      if (moved) {
        setClonePos((prev) => prev ? { ...prev, x: ev.clientX, y: ev.clientY } : null)
      }
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      if (moved) {
        setDraggedId(null)
        setClonePos(null)
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  const handleMouseUpOnLane = useCallback((status: Resume['status']) => {
    if (draggedId && clonePos) {
      updateResumeStatus(draggedId, status)
      setDroppedIds((prev) => new Set(prev).add(draggedId))
      setTimeout(() => {
        setDroppedIds((prev) => {
          const next = new Set(prev)
          next.delete(draggedId!)
          return next
        })
      }, 500)
      setDraggedId(null)
      setClonePos(null)
    }
  }, [draggedId, clonePos, updateResumeStatus])

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
              className="flex-1 min-w-[240px] rounded-xl p-3 flex flex-col"
              style={{ backgroundColor: lane.bg, borderBottom: `3px solid ${lane.accent}` }}
              onDragOver={(e) => handleDragOver(e, lane.key)}
              onDrop={(e) => handleDrop(e, lane.key)}
              onMouseUp={() => handleMouseUpOnLane(lane.key)}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-medium text-sm text-gray-700">{lane.label}</span>
                <span className={`${lane.badge} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center`}>
                  {laneResumes.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {laneResumes.map((resume) => (
                  <div
                    key={resume.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, resume)}
                    onDragEnd={handleDragEnd}
                    onMouseDown={(e) => handleMouseDown(e, resume)}
                    className={`
                      bg-white rounded-lg shadow-sm p-3 mb-3 cursor-grab active:cursor-grabbing
                      transition-all duration-400 ease-in-out
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

      {clonePos && (
        <div
          className="fixed pointer-events-none z-50 opacity-75"
          style={{ left: clonePos.x + 12, top: clonePos.y + 12 }}
        >
          <div className="bg-white rounded-lg shadow-lg p-3 w-56 border border-gray-200">
            <div className="flex items-start gap-2">
              <GripVertical size={16} className="text-gray-300 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <User size={14} className="text-gray-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-800 truncate">{clonePos.resume.name}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Briefcase size={13} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{clonePos.resume.jobTitle}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star
                    size={13}
                    className="shrink-0"
                    style={{ color: clonePos.resume.averageScore > 0 ? '#f59e0b' : '#d1d5db' }}
                    fill={clonePos.resume.averageScore > 0 ? '#f59e0b' : 'none'}
                  />
                  <span className="text-xs text-gray-500">
                    {clonePos.resume.averageScore.toFixed(1)}分 · {clonePos.resume.scores.length}条评价
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
