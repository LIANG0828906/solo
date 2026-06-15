import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, Star, User, Check, X } from 'lucide-react'
import { useAppStore } from '@/store'
import RippleButton from '@/components/RippleButton'
import Modal from '@/components/Modal'
import type { Interview } from '@shared/types'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const MORNING_SLOTS = ['9:00', '9:30', '10:00', '10:30', '11:00', '11:30']
const AFTERNOON_SLOTS = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1)
  let start = firstDay.getDay() - 1
  if (start < 0) start = 6
  const total = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = Array(start).fill(null)
  for (let i = 1; i <= total; i++) days.push(i)
  while (days.length < 42) days.push(null)
  return days
}

function MonthCalendar({ year, month, selectedDate, interviewDates, onSelect }: {
  year: number; month: number; selectedDate: string
  interviewDates: Set<string>; onSelect: (d: string) => void
}) {
  const days = getCalendarDays(year, month)
  const todayStr = formatDate(new Date())

  return (
    <div className="grid grid-cols-7">
      {WEEKDAYS.map(w => (
        <div key={w} className="flex h-10 items-center justify-center text-sm text-gray-500">{w}</div>
      ))}
      {days.map((day, i) => {
        if (day === null) return <div key={i} className="h-10" />
        const ds = formatDate(new Date(year, month, day))
        const isToday = ds === todayStr
        const isSel = ds === selectedDate
        const hasIv = interviewDates.has(ds)
        return (
          <button key={i} onClick={() => onSelect(ds)} className={cn(
            'relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-all duration-200',
            isToday && 'bg-[#3b82f6] text-white',
            !isToday && isSel && 'ring-2 ring-[#3b82f6] ring-offset-1',
            !isToday && !isSel && 'hover:bg-gray-100'
          )}>
            {day}
            {hasIv && <span className={cn(
              'absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
              isToday ? 'bg-white' : 'bg-[#3b82f6]'
            )} />}
          </button>
        )
      })}
    </div>
  )
}

const statusCfg: Record<Interview['status'], { label: string; cls: string }> = {
  scheduled: { label: '已安排', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', cls: 'bg-gray-100 text-gray-500' },
}

function SlotPicker({ slots, occupied, selected, onSelect }: {
  slots: string[]; occupied: string[]; selected: string; onSelect: (s: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map(s => {
        const occ = occupied.includes(s)
        return (
          <button key={s} disabled={occ} onClick={() => onSelect(s)} className={cn(
            'px-3 py-1.5 rounded-lg border text-sm transition-colors duration-200',
            occ && 'bg-gray-100 border-gray-200 text-[#94a3b8] cursor-not-allowed',
            !occ && selected === s && 'bg-[#3b82f6] text-white border-[#3b82f6]',
            !occ && selected !== s && 'hover:border-blue-300'
          )}>{s}</button>
        )
      })}
    </div>
  )
}

export default function InterviewsPage() {
  const { interviews, resumes, fetchInterviews, fetchResumes, createInterview, getOccupiedSlots, createScore } = useAppStore()

  const [curMonth, setCurMonth] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [showSchedule, setShowSchedule] = useState(false)
  const [schResumeId, setSchResumeId] = useState('')
  const [schTime, setSchTime] = useState('')
  const [occupied, setOccupied] = useState<string[]>([])
  const [selIv, setSelIv] = useState<Interview | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverR, setHoverR] = useState(0)
  const [comment, setComment] = useState('')
  const [interviewer, setInterviewer] = useState('')

  useEffect(() => { fetchInterviews(); fetchResumes() }, [])

  useEffect(() => {
    if (showSchedule) {
      getOccupiedSlots(selectedDate).then(setOccupied)
      setSchTime('')
    }
  }, [showSchedule, selectedDate])

  const ivDates = new Set(interviews.map(i => i.date))
  const dayIvs = interviews.filter(i => i.date === selectedDate)
  const pending = resumes.filter(r => r.status === 'pending')

  const prev = () => setCurMonth(p => {
    const m = p.month === 0 ? 11 : p.month - 1
    return { year: p.month === 0 ? p.year - 1 : p.year, month: m }
  })
  const next = () => setCurMonth(p => {
    const m = p.month === 11 ? 0 : p.month + 1
    return { year: p.month === 11 ? p.year + 1 : p.year, month: m }
  })

  const handleSchedule = async () => {
    const r = pending.find(x => x.id === schResumeId)
    if (!r || !schTime) return
    await createInterview({ resumeId: r.id, candidateName: r.name, jobTitle: r.jobTitle, date: selectedDate, timeSlot: schTime })
    setShowSchedule(false)
    setSchResumeId('')
    setSchTime('')
  }

  const handleRate = async () => {
    if (!selIv || !rating || !interviewer) return
    await createScore({ resumeId: selIv.resumeId, interviewer, rating: rating * 20, comment })
    setRating(0); setComment(''); setInterviewer(''); setSelIv(null)
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-800">
        <Calendar size={28} />面试安排
      </h1>

      <div className="flex gap-6">
        <div className="w-[340px] shrink-0 rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={prev} className="rounded p-1 hover:bg-gray-100"><ChevronLeft size={20} /></button>
            <span className="text-sm font-semibold">{curMonth.year}年{curMonth.month + 1}月</span>
            <button onClick={next} className="rounded p-1 hover:bg-gray-100"><ChevronRight size={20} /></button>
          </div>
          <MonthCalendar year={curMonth.year} month={curMonth.month} selectedDate={selectedDate} interviewDates={ivDates} onSelect={setSelectedDate} />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">{selectedDate} 面试</h2>
            <RippleButton size="sm" onClick={() => setShowSchedule(true)}>安排面试</RippleButton>
          </div>

          {dayIvs.length === 0 ? (
            <p className="py-8 text-center text-gray-400">当日暂无面试安排</p>
          ) : (
            <div className="space-y-3">
              {dayIvs.map(iv => {
                const cfg = statusCfg[iv.status]
                return (
                  <div key={iv.id} onClick={() => iv.status === 'completed' && setSelIv(iv)} className={cn(
                    'flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md',
                    iv.status === 'completed' && 'cursor-pointer'
                  )}>
                    <User size={20} className="text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{iv.candidateName}</p>
                      <p className="text-sm text-gray-500">{iv.jobTitle}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500"><Clock size={14} />{iv.timeSlot}</div>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.cls)}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {selIv && (
            <div className="rounded-lg border bg-white p-5">
              <h3 className="mb-4 text-base font-semibold text-gray-700">评价 - {selIv.candidateName}</h3>
              <div className="mb-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={28} className={cn(
                    'cursor-pointer transition-colors duration-200',
                    (hoverR || rating) >= n ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-gray-300'
                  )} onClick={() => setRating(n)} onMouseEnter={() => setHoverR(n)} onMouseLeave={() => setHoverR(0)} />
                ))}
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value.slice(0, 500))} placeholder="评价内容..." rows={3}
                className="mb-2 w-full resize-none rounded-md border p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <p className="mb-3 text-right text-xs text-gray-400">{comment.length}/500</p>
              <input value={interviewer} onChange={e => setInterviewer(e.target.value)} placeholder="面试官姓名"
                className="mb-4 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <div className="flex gap-2">
                <RippleButton size="sm" onClick={handleRate} disabled={!rating || !interviewer}>
                  <Check size={16} className="mr-1 inline" />提交评价
                </RippleButton>
                <RippleButton variant="secondary" size="sm" onClick={() => setSelIv(null)}>
                  <X size={16} className="mr-1 inline" />取消
                </RippleButton>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showSchedule} onClose={() => setShowSchedule(false)} title="安排面试">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">选择候选人</label>
            <select value={schResumeId} onChange={e => setSchResumeId(e.target.value)}
              className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="">请选择</option>
              {pending.map(r => <option key={r.id} value={r.id}>{r.name} - {r.jobTitle}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">面试日期</label>
            <p className="text-sm text-gray-600">{selectedDate}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">上午</label>
            <SlotPicker slots={MORNING_SLOTS} occupied={occupied} selected={schTime} onSelect={setSchTime} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">下午</label>
            <SlotPicker slots={AFTERNOON_SLOTS} occupied={occupied} selected={schTime} onSelect={setSchTime} />
          </div>
          <RippleButton className="w-full" onClick={handleSchedule} disabled={!schResumeId || !schTime}>确认安排</RippleButton>
        </div>
      </Modal>
    </div>
  )
}
