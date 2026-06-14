import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReminders, completeReminder, type Reminder } from '../api/plantApi'

const ReminderBell = () => {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [completingId, setCompletingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchReminders = async () => {
    try {
      const data = await getReminders()
      setReminders(data.filter(r => !r.completed && r.daysLeft <= 7))
    } catch (error) {
      console.error('获取提醒失败:', error)
    }
  }

  useEffect(() => {
    fetchReminders()
    const interval = setInterval(fetchReminders, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleComplete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setCompletingId(id)
    setTimeout(async () => {
      try {
        await completeReminder(id)
        setReminders(prev => prev.filter(r => r.id !== id))
      } catch (error) {
        console.error('完成提醒失败:', error)
      }
      setCompletingId(null)
    }, 400)
  }

  const handleItemClick = (plantId: string) => {
    navigate(`/plant/${plantId}`)
    setShowDropdown(false)
  }

  const getDaysText = (days: number) => {
    if (days < 0) return `已逾期${Math.abs(days)}天`
    if (days === 0) return '今天到期'
    return `${days}天后到期`
  }

  return (
    <div className="reminder-container" ref={dropdownRef}>
      <button 
        className="reminder-bell"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {reminders.length > 0 && <span className="reminder-dot" />}
      </button>
      
      {showDropdown && (
        <div className="reminder-dropdown">
          <div className="reminder-dropdown-header">养护提醒</div>
          {reminders.length === 0 ? (
            <div className="reminder-empty">
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🌿</div>
              <div>暂无待办提醒</div>
            </div>
          ) : (
            reminders.map(reminder => (
              <div 
                key={reminder.id}
                className={`reminder-item ${completingId === reminder.id ? 'completing' : ''}`}
                onClick={() => handleItemClick(reminder.plantId)}
              >
                <span className={`reminder-item-type ${reminder.type}`}>
                  {reminder.type === 'water' ? '浇水' : '施肥'}
                </span>
                <div className="reminder-item-content">
                  <div className="reminder-item-title">{reminder.plantName}</div>
                  <div className="reminder-item-desc">{getDaysText(reminder.daysLeft)}</div>
                </div>
                <button 
                  className="reminder-item-complete"
                  onClick={(e) => handleComplete(e, reminder.id)}
                  title="标记完成"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 24, animation: 'checkmark 0.4s ease forwards' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ReminderBell
