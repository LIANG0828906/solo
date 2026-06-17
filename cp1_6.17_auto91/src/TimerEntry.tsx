import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from './store'

const TAGS = ['开发', '会议', '文档']

const TimerEntry: React.FC = () => {
  const { timer, startTimer, stopTimer, showEntryModal, closeEntryModal, saveEntry, pendingEntry } = useAppStore()
  const [description, setDescription] = useState('')
  const [selectedTag, setSelectedTag] = useState('开发')
  const [startTimeStr, setStartTimeStr] = useState('')
  const [endTimeStr, setEndTimeStr] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showEntryModal && pendingEntry) {
      const startDate = new Date(pendingEntry.startTime)
      const endDate = new Date(pendingEntry.endTime)
      setStartTimeStr(formatTimeInput(startDate))
      setEndTimeStr(formatTimeInput(endDate))
      setDescription('')
      setSelectedTag('开发')
    }
  }, [showEntryModal, pendingEntry])

  const formatTimeInput = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const parseTimeInput = (timeStr: string, baseDate: Date): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date(baseDate)
    date.setHours(hours, minutes, 0, 0)
    return date.getTime()
  }

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTimeStr(value)
    } else {
      setEndTimeStr(value)
    }
  }

  const handleSave = () => {
    if (!pendingEntry || !description.trim()) return

    const startDate = new Date(pendingEntry.startTime)
    const endDate = new Date(pendingEntry.endTime)

    const startTime = parseTimeInput(startTimeStr, startDate)
    const endTime = parseTimeInput(endTimeStr, endDate)

    if (endTime <= startTime) return

    saveEntry(description.trim(), selectedTag, startTime, endTime)
  }

  const handleTimerClick = () => {
    if (timer.isRunning) {
      stopTimer()
    } else {
      startTimer()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeEntryModal()
    }
  }

  const timerButtonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: timer.isRunning ? '#FF4757' : '#6C63FF',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(108, 99, 255, 0.4)',
    transition: 'background-color 0.2s ease-out, box-shadow 0.2s ease-out',
    zIndex: 50,
  }

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  }

  const modalStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    padding: '24px',
  }

  const modalTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: '20px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
    display: 'block',
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    height: '80px',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1E293B',
    resize: 'none',
    outline: 'none',
    marginBottom: '16px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease-out',
  }

  const timeInputContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  }

  const timeInputGroupStyle: React.CSSProperties = {
    flex: 1,
  }

  const timeInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1E293B',
    outline: 'none',
    transition: 'border-color 0.2s ease-out',
  }

  const tagContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  }

  const tagButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: isSelected ? '#4338CA' : '#E0E7FF',
    color: isSelected ? '#FFFFFF' : '#4338CA',
    transition: 'background-color 0.2s ease-out, color 0.2s ease-out',
  })

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
  }

  const cancelButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    transition: 'background-color 0.2s ease-out',
  }

  const saveButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: '#6C63FF',
    color: '#FFFFFF',
    transition: 'background-color 0.2s ease-out',
  }

  const clockIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  )

  return (
    <>
      <button
        style={timerButtonStyle}
        onClick={handleTimerClick}
        className={timer.isRunning ? 'timer-pulse' : ''}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = timer.isRunning ? '#E03847' : '#5B52E0'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = timer.isRunning ? '#FF4757' : '#6C63FF'
        }}
        aria-label={timer.isRunning ? '停止计时' : '开始计时'}
      >
        {clockIcon}
      </button>

      {showEntryModal && (
        <div style={modalOverlayStyle} onClick={handleOverlayClick}>
          <div style={modalStyle} className="modal-enter" ref={modalRef}>
            <h2 style={modalTitleStyle}>记录工时</h2>

            <label style={labelStyle}>任务描述</label>
            <textarea
              style={textareaStyle}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入任务描述..."
              onFocus={(e) => {
                e.target.style.borderColor = '#6C63FF'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#D1D5DB'
              }}
            />

            <div style={timeInputContainerStyle}>
              <div style={timeInputGroupStyle}>
                <label style={labelStyle}>开始时间</label>
                <input
                  type="time"
                  style={timeInputStyle}
                  value={startTimeStr}
                  onChange={(e) => handleTimeChange('start', e.target.value)}
                  step="300"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6C63FF'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D1D5DB'
                  }}
                />
              </div>
              <div style={timeInputGroupStyle}>
                <label style={labelStyle}>结束时间</label>
                <input
                  type="time"
                  style={timeInputStyle}
                  value={endTimeStr}
                  onChange={(e) => handleTimeChange('end', e.target.value)}
                  step="300"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6C63FF'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D1D5DB'
                  }}
                />
              </div>
            </div>

            <label style={labelStyle}>标签</label>
            <div style={tagContainerStyle}>
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  style={tagButtonStyle(selectedTag === tag)}
                  onClick={() => setSelectedTag(tag)}
                  onMouseEnter={(e) => {
                    if (selectedTag !== tag) {
                      e.currentTarget.style.backgroundColor = '#C7D2FE'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTag !== tag) {
                      e.currentTarget.style.backgroundColor = '#E0E7FF'
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div style={buttonContainerStyle}>
              <button
                style={cancelButtonStyle}
                onClick={closeEntryModal}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                }}
              >
                取消
              </button>
              <button
                style={saveButtonStyle}
                onClick={handleSave}
                disabled={!description.trim()}
                onMouseEnter={(e) => {
                  if (description.trim()) {
                    e.currentTarget.style.backgroundColor = '#5B52E0'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6C63FF'
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TimerEntry
