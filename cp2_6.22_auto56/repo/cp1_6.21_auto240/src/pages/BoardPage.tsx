import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Search, Filter } from 'lucide-react'
import { useEmailStore } from '@/store/useEmailStore'
import EmailCard from '@/components/EmailCard'
import type { Email, EmailStatus, EmailCategory } from '@/types'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/types'

const COLUMNS: { status: EmailStatus; bg: string; dotColor: string; activeBg: string }[] = [
  { status: 'pending', bg: '#FFFFFF', dotColor: '#3B82F6', activeBg: '#E8E8F0' },
  { status: 'processing', bg: '#E0F2FE', dotColor: '#0EA5E9', activeBg: '#B9DFF6' },
  { status: 'done', bg: '#DCFCE7', dotColor: '#10B981', activeBg: '#BBF0CB' },
]

const CATEGORY_OPTIONS: { value: EmailCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'work', label: '工作' },
  { value: 'social', label: '社交' },
  { value: 'promo', label: '促销' },
  { value: 'spam', label: '垃圾' },
]

export default function BoardPage() {
  const { emails, loading, fetchEmails, updateEmailStatus } = useEmailStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<EmailCategory | 'all'>('all')
  const [showFilter, setShowFilter] = useState(false)
  const [activeColumn, setActiveColumn] = useState<EmailStatus | null>(null)

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const filteredEmails = useMemo(() => {
    return emails.filter(e => {
      const matchesSearch =
        !searchQuery ||
        e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [emails, searchQuery, categoryFilter])

  const columnEmails = useMemo(() => {
    const map: Record<EmailStatus, Email[]> = { pending: [], processing: [], done: [] }
    for (const e of filteredEmails) {
      map[e.status].push(e)
    }
    return map
  }, [filteredEmails])

  const totalEmails = emails.length
  const doneEmails = emails.filter(e => e.status === 'done').length
  const progressPercent = totalEmails > 0 ? Math.round((doneEmails / totalEmails) * 100) : 0

  const activeEmail = useMemo(
    () => emails.find(e => e.id === activeId) ?? null,
    [emails, activeId]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      setActiveColumn(null)

      if (!over) return

      const activeEmailId = String(active.id)
      const targetStatus = String(over.id) as EmailStatus

      if (['pending', 'processing', 'done'].includes(targetStatus)) {
        const currentEmail = emails.find(e => e.id === activeEmailId)
        if (currentEmail && currentEmail.status !== targetStatus) {
          updateEmailStatus(activeEmailId, targetStatus)
        }
      }
    },
    [emails, updateEmailStatus]
  )

  const handleDragOver = useCallback((event: { over: { id: string | number } | null }) => {
    if (event.over) {
      const overId = String(event.over.id)
      if (['pending', 'processing', 'done'].includes(overId)) {
        setActiveColumn(overId as EmailStatus)
      }
    } else {
      setActiveColumn(null)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">加载邮件中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索发件人或主题..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#F1F5F9] text-sm text-slate-700 placeholder:text-slate-400 border-2 border-transparent focus:border-[#3B82F6] focus:bg-white outline-none transition-all duration-200"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-sm text-slate-600 border border-slate-200 hover:border-slate-300 transition-colors duration-200"
          >
            <Filter className="w-4 h-4" />
            {categoryFilter === 'all' ? '分类筛选' : CATEGORY_LABELS[categoryFilter]}
          </button>
          {showFilter && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-20">
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setCategoryFilter(opt.value); setShowFilter(false) }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                    categoryFilter === opt.value ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            清理进度 {progressPercent}%
          </span>
          <div className="w-40 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#10B981] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col lg:flex-row items-start justify-center gap-5">
          {COLUMNS.map(col => (
            <div
              key={col.status}
              id={col.status}
              className="w-full lg:w-[320px] shrink-0 rounded-2xl p-4 transition-colors duration-200 column-droppable"
              style={{
                backgroundColor: activeColumn === col.status ? col.activeBg : col.bg,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.dotColor }}
                  />
                  <h2 className="text-sm font-semibold text-slate-700">
                    {STATUS_LABELS[col.status]}
                  </h2>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-lg"
                  style={{
                    backgroundColor: `${col.dotColor}18`,
                    color: col.dotColor,
                  }}
                >
                  {columnEmails[col.status].length}
                </span>
              </div>
              <SortableContext
                items={columnEmails[col.status].map(e => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3 min-h-[120px]">
                  {columnEmails[col.status].map(email => (
                    <EmailCard key={email.id} email={email} />
                  ))}
                  {columnEmails[col.status].length === 0 && (
                    <div className="flex items-center justify-center h-[120px] text-sm text-slate-400 rounded-xl border-2 border-dashed border-slate-200">
                      拖拽邮件到此处
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeEmail ? (
            <div className="w-[280px] opacity-80 scale-75 origin-top-left pointer-events-none">
              <div
                className="min-h-[140px] bg-[#F8FAFC] rounded-xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
              >
                <div
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                  style={{ backgroundColor: CATEGORY_LABELS[activeEmail.category] }}
                />
                <div className="pl-3">
                  <p className="font-bold text-sm text-slate-800">{activeEmail.from}</p>
                  <p className="text-base text-slate-700 mt-1 truncate">{activeEmail.subject}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
