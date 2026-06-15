import React, { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { exchangesAPI } from '../api'
import './ExchangeModal.css'

interface ExchangeModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string
  onSuccess?: () => void
}

const ExchangeModal: React.FC<ExchangeModalProps> = ({
  isOpen,
  onClose,
  itemId,
  onSuccess,
}) => {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || sent) return

    setLoading(true)
    try {
      await exchangesAPI.createExchange({ itemId, message })
      setSent(true)
      showToast('交换请求已发送', 'success')
      onSuccess?.()
      setTimeout(() => {
        onClose()
        setSent(false)
        setMessage('')
      }, 1500)
    } catch (error: any) {
      showToast(error.response?.data?.message || '发送失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !sent) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content scale-in">
        <div className="modal-header">
          <h3>发起交换请求</h3>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label className="form-label">给发布者留言</label>
            <textarea
              className="form-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              placeholder="可以介绍一下你想用什么交换，或者说一下你的想法..."
              rows={5}
              maxLength={200}
              disabled={loading || sent}
            />
            <div className="char-count">{message.length}/200</div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading || sent}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || sent}
            >
              {loading && <span className="spinner" />}
              {sent ? '已发送' : loading ? '发送中...' : '发送请求'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExchangeModal
