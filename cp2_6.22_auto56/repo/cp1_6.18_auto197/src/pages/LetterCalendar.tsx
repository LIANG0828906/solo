import { useState, useEffect, useMemo } from 'react'
import { useLetterStore } from '@/stores/letterStore'
import { ChevronLeft, ChevronRight, Edit, Trash2, X, Moon } from 'lucide-react'

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  calm: '🍃',
  sad: '🌧️',
  miss: '💫',
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function LetterCalendar() {
  const { letters, fetchLetters, updateLetter, recallLetter } = useLetterStore()
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [recallModalId, setRecallModalId] = useState<string | null>(null)
  const [editingLetter, setEditingLetter] = useState<{ id: string; subject: string; content: string } | null>(null)

  useEffect(() => { fetchLetters() }, [fetchLetters])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [year, month])

  const getLettersForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return letters.filter(l => l.sendDate === dateStr && l.status === 'pending')
  }

  const selectedLetters = selectedDate
    ? letters.filter(l => l.sendDate === selectedDate && l.status === 'pending')
    : []

  const pendingLetters = letters.filter(l => l.status === 'pending')

  const today = new Date()
  const isToday = (day: number) =>
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate()

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  const handleSaveEdit = async () => {
    if (!editingLetter) return
    await updateLetter(editingLetter.id, {
      subject: editingLetter.subject,
      content: editingLetter.content,
    })
    setEditingLetter(null)
  }

  const handleRecall = async () => {
    if (!recallModalId) return
    await recallLetter(recallModalId)
    setRecallModalId(null)
    setSelectedDate(null)
  }

  const monthLetters = pendingLetters.filter(l => {
    const d = new Date(l.sendDate)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const formatDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ease-smooth hover:scale-110"
          style={{ background: 'linear-gradient(to right, #6C5CE7, #A29BFE)' }}
        >
          <ChevronLeft size={16} className="text-white" />
        </button>
        <h2 className="text-lg font-bold text-[#E0E0E0] min-w-[140px] text-center">
          {year}年{month + 1}月
        </h2>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ease-smooth hover:scale-110"
          style={{ background: 'linear-gradient(to right, #6C5CE7, #A29BFE)' }}
        >
          <ChevronRight size={16} className="text-white" />
        </button>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs text-[#A29BFE] py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const dateStr = formatDateStr(day)
            const dayLetters = getLettersForDate(day)
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className="w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-all duration-300 ease-smooth hover:bg-[#2D2D44]"
                style={{
                  background: selectedDate === dateStr ? '#2D2D44' : 'transparent',
                  border: isToday(day) ? '1px solid #6C5CE7' : '1px solid transparent',
                }}
              >
                <span className="text-sm">{day}</span>
                {dayLetters.length > 0 && <div className="dot-glow mt-0.5" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="md:hidden">
        {monthLetters.length === 0 ? (
          <div className="text-center text-[#A29BFE] py-8">
            <Moon size={32} className="mx-auto mb-2 text-[#F0E68C]" />
            还没有待寄出的信件 🌙
          </div>
        ) : (
          <div className="space-y-2">
            {monthLetters.map(letter => (
              <div
                key={letter.id}
                className="rounded-xl p-3 transition-all duration-300 ease-smooth hover:-translate-y-1"
                style={{ background: '#2D2D44', border: '1px solid #3A3A5E', margin: '8px' }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm">{letter.sendDate}</span>
                  <span>{MOOD_EMOJIS[letter.mood]}</span>
                </div>
                <p className="text-sm mt-1">{letter.subject}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setEditingLetter({ id: letter.id, subject: letter.subject, content: letter.content })}
                    className="text-xs px-2 py-1 rounded text-white transition-all duration-300 ease-smooth"
                    style={{ background: 'linear-gradient(to right, #6C5CE7, #A29BFE)' }}
                  >
                    <Edit size={12} className="inline mr-1" />修改
                  </button>
                  <button
                    onClick={() => setRecallModalId(letter.id)}
                    className="text-xs px-2 py-1 rounded text-white transition-all duration-300 ease-smooth"
                    style={{ background: '#E53935' }}
                  >
                    <Trash2 size={12} className="inline mr-1" />撤回
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDate && selectedLetters.length > 0 && (
        <div className="mt-6 flex flex-col items-center">
          {selectedLetters.map(letter => (
            <div
              key={letter.id}
              className="w-[300px] rounded-xl p-4 mb-4 transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lg"
              style={{ background: '#2D2D44', border: '1px solid #3A3A5E', borderRadius: '12px' }}
            >
              {editingLetter?.id === letter.id ? (
                <>
                  <input
                    value={editingLetter.subject}
                    onChange={e => setEditingLetter({ ...editingLetter, subject: e.target.value })}
                    className="w-full bg-[#1A1A2E] border border-[#3A3A5E] rounded px-2 py-1 text-sm text-[#E0E0E0] outline-none mb-2"
                  />
                  <textarea
                    value={editingLetter.content}
                    onChange={e => setEditingLetter({ ...editingLetter, content: e.target.value })}
                    className="w-full bg-[#1A1A2E] border border-[#3A3A5E] rounded px-2 py-1 text-sm text-[#E0E0E0] outline-none min-h-[80px]"
                  />
                </>
              ) : (
                <>
                  <h3 className="font-bold text-[#E0E0E0]">{letter.subject}</h3>
                  <p className="text-xs text-[#A29BFE] mt-1">{letter.toEmail}</p>
                  <p className="text-xs text-[#A29BFE]">{letter.sendDate} {MOOD_EMOJIS[letter.mood]}</p>
                  <p className="text-sm text-[#E0E0E0] mt-2 line-clamp-3">{letter.content.slice(0, 100)}</p>
                </>
              )}
              <div className="flex gap-2 mt-3">
                {editingLetter?.id === letter.id ? (
                  <button
                    onClick={handleSaveEdit}
                    className="text-xs px-3 py-1.5 rounded-lg text-white transition-all duration-300 ease-smooth"
                    style={{ background: 'linear-gradient(to right, #6C5CE7, #A29BFE)' }}
                  >
                    保存
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingLetter({ id: letter.id, subject: letter.subject, content: letter.content })}
                    className="text-xs px-3 py-1.5 rounded-lg text-white transition-all duration-300 ease-smooth"
                    style={{ background: 'linear-gradient(to right, #6C5CE7, #A29BFE)' }}
                  >
                    <Edit size={12} className="inline mr-1" />修改
                  </button>
                )}
                <button
                  onClick={() => setRecallModalId(letter.id)}
                  className="text-xs px-3 py-1.5 rounded-lg text-white transition-all duration-300 ease-smooth"
                  style={{ background: '#E53935' }}
                >
                  <Trash2 size={12} className="inline mr-1" />撤回
                </button>
                <button
                  onClick={() => { setSelectedDate(null); setEditingLetter(null) }}
                  className="text-xs px-2 py-1.5 text-[#A29BFE] hover:text-white transition-colors duration-300 ease-smooth ml-auto"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingLetters.length === 0 && (
        <div className="hidden md:block text-center text-[#A29BFE] py-12">
          <Moon size={40} className="mx-auto mb-3 text-[#F0E68C]" />
          还没有待寄出的信件 🌙
        </div>
      )}

      {recallModalId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={() => setRecallModalId(null)}
        >
          <div
            className="rounded-xl p-6 max-w-sm w-full mx-4"
            style={{ background: '#2D2D44', border: '1px solid #3A3A5E', animation: 'shake 0.4s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-center text-[#E0E0E0] mb-4">确定要撤回这封信吗？</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRecall}
                className="px-4 py-2 rounded-lg text-white text-sm transition-all duration-300 ease-smooth"
                style={{ background: '#E53935' }}
              >
                确认撤回
              </button>
              <button
                onClick={() => setRecallModalId(null)}
                className="px-4 py-2 rounded-lg text-[#E0E0E0] text-sm bg-[#3A3A5E] transition-all duration-300 ease-smooth"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
