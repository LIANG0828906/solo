import { useState, useEffect } from 'react'
import { createBottle } from './api/bottle'

interface PageWriteProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  userId: string
}

function PageWrite({ isOpen, onClose, onSubmit, userId }: PageWriteProps) {
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setText('')
      setImageUrl('')
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  const handleSubmit = async () => {
    if (!text.trim()) return

    try {
      await createBottle({
        text: text.trim(),
        imageUrl: imageUrl.trim() || undefined,
        createdBy: userId
      })
      handleClose()
      onSubmit()
    } catch (error) {
      console.error('Failed to create bottle:', error)
    }
  }

  if (!isOpen && !isClosing) return null

  const inputStyle = (field: string) => ({
    width: '100%',
    padding: '16px',
    border: '2px solid rgba(162, 210, 255, 0.5)',
    borderRadius: '12px',
    fontSize: '16px',
    fontFamily: 'inherit',
    background: 'rgba(255, 255, 255, 0.9)',
    outline: 'none',
    transition: 'all 300ms ease-out',
    boxShadow: focusedField === field ? '0 0 20px rgba(162, 210, 255, 0.8)' : 'none',
    borderColor: focusedField === field ? '#a2d2ff' : 'rgba(162, 210, 255, 0.5)',
    resize: 'none' as const
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 58, 92, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: isClosing ? 'fadeOut 0.3s ease-out forwards' : 'fadeIn 0.3s ease-out forwards'
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className={isClosing ? 'modal-exit' : 'modal-enter'}
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 -10px 40px rgba(26, 58, 92, 0.2)'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            background: 'rgba(26, 58, 92, 0.2)',
            borderRadius: '2px',
            margin: '0 auto 24px'
          }}
        />
        
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#1a3a5c',
            marginBottom: '24px',
            textAlign: 'center'
          }}
        >
          ✉️ 写下你的灵感
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              color: '#1a3a5c',
              marginBottom: '8px',
              fontWeight: 500
            }}
          >
            文字内容
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocusedField('text')}
            onBlur={() => setFocusedField(null)}
            placeholder="写下你想分享的灵感、心情或故事..."
            rows={4}
            style={inputStyle('text')}
            maxLength={500}
          />
          <div
            style={{
              textAlign: 'right',
              fontSize: '12px',
              color: text.length > 450 ? '#ff6b6b' : 'rgba(26, 58, 92, 0.5)',
              marginTop: '4px'
            }}
          >
            {text.length}/500
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              color: '#1a3a5c',
              marginBottom: '8px',
              fontWeight: 500
            }}
          >
            图片URL（可选）
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onFocus={() => setFocusedField('image')}
            onBlur={() => setFocusedField(null)}
            placeholder="https://example.com/image.jpg"
            style={inputStyle('image')}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '16px',
              border: '2px solid #a2d2ff',
              borderRadius: '12px',
              background: 'transparent',
              color: '#1a3a5c',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 300ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(162, 210, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            style={{
              flex: 2,
              padding: '16px',
              border: 'none',
              borderRadius: '12px',
              background: !text.trim() ? 'rgba(255, 209, 102, 0.5)' : '#ffd166',
              color: '#1a3a5c',
              fontSize: '16px',
              fontWeight: 600,
              cursor: !text.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 300ms ease-out',
              boxShadow: !text.trim() ? 'none' : '0 4px 15px rgba(255, 209, 102, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (text.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 209, 102, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = text.trim() ? '0 4px 15px rgba(255, 209, 102, 0.4)' : 'none'
            }}
          >
            🌊 投放漂流瓶
          </button>
        </div>
      </div>
    </div>
  )
}

export default PageWrite
