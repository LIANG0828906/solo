import React, { useState, useEffect } from 'react'

const EMOJI_OPTIONS = ['🦊', '🔷', '⚛️', '🐙', '🎨', '✨', '⚡', '🐻', '💨', '🏀', '🚀', '🖊️', '🌟', '🎯', '💡', '🔮']

interface ThrowFormProps {
  onSubmit: (data: { url: string; comment: string; emoji: string; tag: string }) => void
  onClose: () => void
}

const ThrowForm: React.FC<ThrowFormProps> = ({ onSubmit, onClose }) => {
  const [visible, setVisible] = useState(false)
  const [url, setUrl] = useState('')
  const [comment, setComment] = useState('')
  const [emoji, setEmoji] = useState('🌟')
  const [tag, setTag] = useState('')
  const [urlError, setUrlError] = useState('')

  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true)
    })
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const isValidUrl = (str: string): boolean => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidUrl(url)) {
      setUrlError('请输入有效的URL地址')
      return
    }
    if (!comment.trim()) return
    onSubmit({ url, comment: comment.trim(), emoji, tag: tag.trim() || '其他' })
    handleClose()
  }

  return (
    <div
      className={`modal-overlay ${visible ? 'modal-overlay-visible' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`throw-form-card ${visible ? 'modal-card-visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="throw-form-title">扔回一个漂流瓶</h2>
        <form onSubmit={handleSubmit}>
          <div className="throw-form-field">
            <label className="throw-form-label">网页链接</label>
            <input
              className="throw-form-input"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setUrlError('')
              }}
            />
            {urlError && <span className="throw-form-error">{urlError}</span>}
          </div>
          <div className="throw-form-field">
            <label className="throw-form-label">短评（最多100字）</label>
            <textarea
              className="throw-form-textarea"
              placeholder="分享你对这个链接的感受..."
              maxLength={100}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <span className="throw-form-count">{comment.length}/100</span>
          </div>
          <div className="throw-form-field">
            <label className="throw-form-label">来源标签</label>
            <input
              className="throw-form-input"
              type="text"
              placeholder="例如：工具、学习、灵感"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </div>
          <div className="throw-form-field">
            <label className="throw-form-label">匿名标识</label>
            <div className="throw-form-emoji-grid">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`throw-form-emoji-btn ${emoji === e ? 'throw-form-emoji-active' : ''}`}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="throw-form-actions">
            <button type="button" className="btn-throw throw-form-cancel" onClick={handleClose}>
              取消
            </button>
            <button
              type="submit"
              className="btn-pick throw-form-submit"
              disabled={!url.trim() || !comment.trim()}
            >
              投入大海
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ThrowForm
