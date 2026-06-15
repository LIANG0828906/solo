import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import RippleButton from './RippleButton'

interface PendingCandidate {
  id: string
  name: string
  jobTitle: string
}

interface InterviewSchedulerProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    resumeId: string
    candidateName: string
    jobTitle: string
    date: string
    timeSlot: string
  }) => void
  pendingCandidates: PendingCandidate[]
  occupiedSlots: string[]
}

const MORNING_SLOTS = ['9:00', '9:30', '10:00', '10:30', '11:00', '11:30']
const AFTERNOON_SLOTS = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function formatDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function InterviewScheduler({
  isOpen,
  onClose,
  onConfirm,
  pendingCandidates,
  occupiedSlots,
}: InterviewSchedulerProps) {
  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date())
      setSelectedTime('')
      setSelectedCandidateId('')
    }
  }, [isOpen])

  const dateKey = formatDateKey(selectedDate)
  const occupiedToday = occupiedSlots
    .filter((s) => s.startsWith(dateKey))
    .map((s) => s.slice(11))

  const gridCells = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const firstWeekday = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()

    const cells: { date: Date; inMonth: boolean }[] = []
    for (let i = firstWeekday - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        inMonth: false,
      })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true })
    }
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date
      const next = new Date(last)
      next.setDate(last.getDate() + 1)
      cells.push({ date: next, inMonth: false })
    }
    return cells
  }, [currentMonth])

  function goPrevMonth() {
    setCurrentMonth((prev) => {
      const y = prev.getFullYear()
      const m = prev.getMonth()
      if (m === 0) return new Date(y - 1, 11, 1)
      return new Date(y, m - 1, 1)
    })
  }

  function goNextMonth() {
    setCurrentMonth((prev) => {
      const y = prev.getFullYear()
      const m = prev.getMonth()
      if (m === 11) return new Date(y + 1, 0, 1)
      return new Date(y, m + 1, 1)
    })
  }

  function handleConfirm() {
    const candidate = pendingCandidates.find((c) => c.id === selectedCandidateId)
    if (!candidate || !selectedTime) return
    onConfirm({
      resumeId: candidate.id,
      candidateName: candidate.name,
      jobTitle: candidate.jobTitle,
      date: dateKey,
      timeSlot: selectedTime,
    })
  }

  if (!isOpen) return null

  const canConfirm = !!selectedCandidateId && !!selectedTime
  const monthLabel = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl',
          'animate-[modalIn_0.3s_ease-out]'
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-[#3b82f6]" />
            安排面试
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <ChevronRight size={24} className="rotate-45" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <User size={16} />
              候选人
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
            >
              <option value="">请选择候选人</option>
              {pendingCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.jobTitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Calendar size={16} />
              选择日期
            </label>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={goPrevMonth}
                  className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
                <button
                  onClick={goNextMonth}
                  className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="py-1.5 text-center text-xs font-medium text-gray-500"
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {gridCells.map((cell, idx) => {
                  const isToday = isSameDay(cell.date, today)
                  const isSelected = isSameDay(cell.date, selectedDate)
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      className={cn(
                        'relative aspect-square rounded-md text-sm transition-colors',
                        !cell.inMonth && 'text-gray-300',
                        cell.inMonth && 'text-gray-700 hover:bg-gray-100',
                        isSelected && 'ring-2 ring-[#3b82f6]',
                        isToday && 'bg-[#3b82f6] text-white hover:bg-[#3b82f6]'
                      )}
                    >
                      {cell.date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Clock size={16} />
              选择时段
            </label>
            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              {[
                { label: '上午', slots: MORNING_SLOTS },
                { label: '下午', slots: AFTERNOON_SLOTS },
              ].map((section) => (
                <div key={section.label}>
                  <div className="mb-2 text-xs font-medium text-gray-500">{section.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {section.slots.map((slot) => {
                      const occupied = occupiedToday.includes(slot)
                      const selected = selectedTime === slot
                      return (
                        <button
                          key={slot}
                          disabled={occupied}
                          onClick={() => setSelectedTime(slot)}
                          className={cn(
                            'rounded-lg px-3 py-1.5 border text-sm transition-colors',
                            occupied && 'bg-gray-100 border-gray-200 text-[#94a3b8] cursor-not-allowed',
                            !occupied && !selected && 'border-gray-200 text-gray-700 hover:border-blue-300 bg-white',
                            selected && 'bg-[#3b82f6] text-white border-[#3b82f6]'
                          )}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <RippleButton variant="secondary" onClick={onClose}>
            取消
          </RippleButton>
          <RippleButton
            variant="primary"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={cn(!canConfirm && 'opacity-50 cursor-not-allowed')}
          >
            确认安排
          </RippleButton>
        </div>
      </div>
    </div>
  )
}
