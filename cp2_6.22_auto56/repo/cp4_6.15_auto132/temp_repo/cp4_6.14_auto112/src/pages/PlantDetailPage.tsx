import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import EventList from '@/components/EventList'
import type { PlantStatus, EventType } from '@/types'
import { ArrowLeft, Heart, Droplets, Sun, Bug, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'

const statusConfig: Record<PlantStatus, { icon: typeof Heart; color: string; label: string }> = {
  healthy: { icon: Heart, color: '#22c55e', label: '健康' },
  thirsty: { icon: Droplets, color: '#f97316', label: '缺水' },
  low_light: { icon: Sun, color: '#eab308', label: '缺光' },
  pest: { icon: Bug, color: '#ef4444', label: '虫害' },
}

const eventTypes: { value: EventType; label: string; color: string }[] = [
  { value: 'water', label: '浇水', color: '#3b82f6' },
  { value: 'fertilize', label: '施肥', color: '#a855f7' },
  { value: 'repot', label: '换盆', color: '#22c55e' },
  { value: 'prune', label: '修剪', color: '#f97316' },
]

function InlineDatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(value)
    return isNaN(d.getTime()) ? new Date() : d
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const handleSelect = useCallback((day: number) => {
    const d = new Date(year, month, day)
    const dateStr = d.toISOString().split('T')[0]
    onChange(dateStr)
    setOpen(false)
  }, [year, month, onChange])

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <input
        type="text"
        readOnly
        value={value}
        onClick={() => setOpen(!open)}
        placeholder="选择日期"
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          fontSize: 14,
          cursor: 'pointer',
          width: 140,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {open && (
        <div
          className="absolute z-50 shadow-lg"
          style={{
            top: '100%',
            left: 0,
            marginTop: 4,
            background: '#ffffff',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #e2e8f0',
            minWidth: 260,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
              {year}年 {monthNames[month]}
            </span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b' }}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center" style={{ marginBottom: 4 }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} style={{ fontSize: 12, color: '#94a3b8', padding: 4, fontWeight: 500 }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />
              const dateStr = new Date(year, month, day).toISOString().split('T')[0]
              const isSelected = dateStr === value
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              return (
                <button
                  key={day}
                  onClick={() => handleSelect(day)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    background: isSelected ? '#3b82f6' : isToday ? '#eff6ff' : 'transparent',
                    color: isSelected ? '#ffffff' : isToday ? '#3b82f6' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedPlant, events, loading, fetchPlant, fetchEvents, createEvent, deleteEvent, updatePlant } = useStore()
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [eventForm, setEventForm] = useState({
    type: 'water' as EventType,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [editStatus, setEditStatus] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPlant(id)
      fetchEvents(id)
    }
  }, [id, fetchPlant, fetchEvents])

  const handleAddEvent = async () => {
    if (!id) return
    await createEvent(id, eventForm)
    setShowAddEvent(false)
    setEventForm({ type: 'water', date: new Date().toISOString().split('T')[0], notes: '' })
  }

  const handleStatusChange = async (status: PlantStatus) => {
    if (!id || !selectedPlant) return
    await updatePlant(id, { status })
    setEditStatus(false)
  }

  if (loading && !selectedPlant) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center" style={{ color: '#94a3b8' }}>
        加载中...
      </div>
    )
  }

  if (!selectedPlant) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center" style={{ color: '#94a3b8' }}>
        植物未找到
      </div>
    )
  }

  const config = statusConfig[selectedPlant.status]
  const StatusIcon = config.icon

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 mb-6 transition-colors"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: 14, fontWeight: 500, padding: 0 }}
      >
        <ArrowLeft size={16} />
        返回植物列表
      </button>

      <div
        className="animate-fade-in-up opacity-0 p-6 mb-6"
        style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0, marginBottom: 8 }}>
              {selectedPlant.name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#64748b',
                  background: '#f1f5f9',
                  borderRadius: 4,
                  padding: '2px 8px',
                }}
              >
                {selectedPlant.variety}
              </span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>
                种植于 {selectedPlant.plantedDate}
              </span>
            </div>
            {selectedPlant.notes && (
              <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, marginBottom: 0 }}>
                {selectedPlant.notes}
              </p>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setEditStatus(!editStatus)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: `${config.color}15`,
                border: `1px solid ${config.color}30`,
                cursor: 'pointer',
                color: config.color,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <StatusIcon size={14} />
              {config.label}
            </button>
            {editStatus && (
              <div
                className="absolute right-0 z-10 shadow-lg"
                style={{
                  top: '100%',
                  marginTop: 4,
                  background: '#ffffff',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  padding: 4,
                  minWidth: 120,
                }}
              >
                {Object.entries(statusConfig).map(([key, opt]) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key as PlantStatus)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-md transition-colors"
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: opt.color,
                        background: 'transparent',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Icon size={14} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', margin: 0 }}>
          养护记录
        </h2>
        <button
          onClick={() => setShowAddEvent(!showAddEvent)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: '#166534',
            border: 'none',
            cursor: 'pointer',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#15803d')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#166534')}
        >
          <Plus size={14} />
          记录养护
        </button>
      </div>

      {showAddEvent && (
        <div
          className="animate-fade-in-up p-5 mb-4"
          style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>添加养护事件</span>
            <button
              onClick={() => setShowAddEvent(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
                事件类型
              </label>
              <div className="flex gap-2">
                {eventTypes.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setEventForm({ ...eventForm, type: opt.value })}
                    className="px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      border: `2px solid ${eventForm.type === opt.value ? opt.color : '#e2e8f0'}`,
                      background: eventForm.type === opt.value ? `${opt.color}15` : '#ffffff',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      color: eventForm.type === opt.value ? opt.color : '#64748b',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
                日期
              </label>
              <InlineDatePicker
                value={eventForm.date}
                onChange={(d) => setEventForm({ ...eventForm, date: d })}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
                备注
              </label>
              <input
                type="text"
                value={eventForm.notes}
                onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                placeholder="选填"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleAddEvent}
              className="w-full py-2 rounded-lg text-white font-medium transition-colors"
              style={{ background: '#166534', border: 'none', cursor: 'pointer', fontSize: 14 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#15803d')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#166534')}
            >
              保存
            </button>
          </div>
        </div>
      )}

      <EventList events={events} onDelete={deleteEvent} />
    </div>
  )
}
