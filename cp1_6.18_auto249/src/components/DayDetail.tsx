import { useState, useEffect, useCallback } from 'react'
import { useColorStore, DailyRecord } from '../store/colorStore'

const MAX_TEXT_LENGTH = 200

export default function DayDetail() {
  const {
    isModalOpen,
    closeModal,
    selectedDate,
    selectedColor,
    setSelectedColor,
    getRecordByDate,
    addOrUpdateRecord,
    deleteRecord,
  } = useColorStore()

  const [text, setText] = useState('')
  const [colorKey, setColorKey] = useState(0)

  const existingRecord = isModalOpen ? getRecordByDate(selectedDate) : undefined

  useEffect(() => {
    if (isModalOpen) {
      setText(existingRecord?.text || '')
      if (existingRecord?.color) {
        setSelectedColor(existingRecord.color)
      }
      setColorKey(prev => prev + 1)
    }
  }, [isModalOpen, existingRecord, setSelectedColor])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, closeModal])

  const handleSave = useCallback(() => {
    const record: DailyRecord = {
      date: selectedDate,
      color: selectedColor,
      text: text.trim(),
      createdAt: Date.now(),
    }
    addOrUpdateRecord(record)
    closeModal()
  }, [selectedDate, selectedColor, text, addOrUpdateRecord, closeModal])

  const handleDelete = useCallback(() => {
    if (existingRecord) {
      deleteRecord(selectedDate)
      closeModal()
    }
  }, [existingRecord, selectedDate, deleteRecord, closeModal])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal()
    }
  }

  const formatDisplayDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${year}年${parseInt(month)}月${parseInt(day)}日 ${weekdays[date.getDay()]}`
  }

  if (!isModalOpen) return null

  const textLength = text.length
  const isOverLimit = textLength > MAX_TEXT_LENGTH

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-date">
            {formatDisplayDate(selectedDate)}
          </h3>
          <button
            className="modal-close-btn"
            onClick={closeModal}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="modal-color-preview">
          <div
            key={colorKey}
            className="modal-color-block"
            style={{ backgroundColor: selectedColor }}
          />
          <div className="modal-color-hex">{selectedColor}</div>
        </div>

        <div className="text-area-wrapper">
          <label className="text-label" htmlFor="diary-text">
            💭 今日心情描述（可选）
          </label>
          <textarea
            id="diary-text"
            className="text-area"
            placeholder="今天发生了什么让你印象深刻的事？写下此刻的感受..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_TEXT_LENGTH + 50}
          />
          <div className={`text-counter ${textLength > MAX_TEXT_LENGTH * 0.9 ? 'warning' : ''}`}>
            {textLength}/{MAX_TEXT_LENGTH}
            {isOverLimit && ' (超出限制)'}
          </div>
        </div>

        <div className="modal-actions">
          {existingRecord && (
            <button className="btn btn-danger" onClick={handleDelete}>
              🗑️ 删除
            </button>
          )}
          <button className="btn btn-secondary" onClick={closeModal}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isOverLimit}
            style={isOverLimit ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            {existingRecord ? '💾 更新' : '✅ 保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
