import { useState } from 'react'

interface ConfirmModalProps {
  open: boolean
  title?: string
  message: string
  hint?: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

function ConfirmModal({
  open,
  title = '确认操作',
  message,
  hint,
  onConfirm,
  onCancel,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
}: ConfirmModalProps) {
  const [shake, setShake] = useState(false)

  if (!open) return null

  const handleConfirm = () => {
    setShake(true)
    setTimeout(() => {
      setShake(false)
      onConfirm()
    }, 300)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h3 className="modal-title">{title}</h3>
        <p className="confirm-modal-text">{message}</p>
        {hint && <p className="confirm-modal-hint">{hint}</p>}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`${danger ? 'btn-danger' : 'btn-primary'} ${shake ? 'shake' : ''}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
