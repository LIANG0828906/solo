import { useMemo, useCallback, useState, useEffect } from 'react'
import { useTimerStore, InterruptEvent } from '../store/timerStore'
import { format } from 'date-fns'
import '../styles.css'

interface InputModalProps {
  onConfirm: (reason: string) => void
  onCancel: () => void
}

const InputModal = ({ onConfirm, onCancel }: InputModalProps) => {
  const [value, setValue] = useState('')
  const [visible, setVisible] = useState(true)

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onCancel, 300)
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    const trimmed = value.trim()
    if (trimmed) {
      setVisible(false)
      setTimeout(() => onConfirm(trimmed), 300)
    }
  }, [value, onConfirm])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'Enter') handleConfirm()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [handleClose, handleConfirm])

  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
      >
        <button className="modal-close" onClick={handleClose}>
          ✕
        </button>
        <h2 className="modal-title">记录干扰</h2>
        <p className="modal-message">是什么干扰了您的专注？</p>
        <input
          className="modal-input"
          type="text"
          placeholder="发生了什么干扰了您？"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          maxLength={200}
        />
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={handleClose}>
            取消
          </button>
          <button
            className="modal-btn confirm"
            onClick={handleConfirm}
            disabled={!value.trim()}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

export const InterruptLog = () => {
  const interrupts = useTimerStore((state) => state.interrupts)
  const addInterrupt = useTimerStore((state) => state.addInterrupt)
  const removeInterrupt = useTimerStore((state) => state.removeInterrupt)

  const [showInput, setShowInput] = useState(false)

  const sortedInterrupts = useMemo(() => {
    return [...interrupts].sort((a, b) => b.timestamp - a.timestamp)
  }, [interrupts])

  const handleAdd = useCallback(() => {
    setShowInput(true)
  }, [])

  const handleConfirm = useCallback(
    (reason: string) => {
      addInterrupt(reason)
      setShowInput(false)
    },
    [addInterrupt]
  )

  const handleCancel = useCallback(() => {
    setShowInput(false)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      removeInterrupt(id)
    },
    [removeInterrupt]
  )

  const formatTime = useCallback((ts: number): string => {
    return format(ts, 'HH:mm')
  }, [])

  return (
    <div className="panel interrupt-panel">
      <h2 className="panel-title">📝 干扰日志</h2>

      <button className="add-interrupt-btn" onClick={handleAdd}>
        + 记录干扰
      </button>

      {sortedInterrupts.length === 0 ? (
        <div className="empty-state">
          暂无干扰记录
          <br />
          <span style={{ fontSize: 12 }}>保持专注，干得漂亮！</span>
        </div>
      ) : (
        <div className="interrupt-list">
          {sortedInterrupts.map((item: InterruptEvent) => (
            <div key={item.id} className="interrupt-item">
              <span className="interrupt-time">{formatTime(item.timestamp)}</span>
              <span className="interrupt-reason">{item.reason}</span>
              <button
                className="interrupt-delete"
                onClick={() => handleDelete(item.id)}
                title="删除记录"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showInput && (
        <InputModal onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
