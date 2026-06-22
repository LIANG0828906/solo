import React, { useEffect, useState } from 'react'
import type { Message } from '../api'

interface MessageModalProps {
  message: Message
  onClose: () => void
}

const MessageModal: React.FC<MessageModalProps> = ({ message, onClose }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true)
    })
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`modal-overlay ${visible ? 'modal-overlay-visible' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`modal-card ${visible ? 'modal-card-visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-emoji">{message.emoji}</div>
        <a
          className="modal-link"
          href={message.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {message.url}
        </a>
        <p className="modal-comment">{message.comment}</p>
        <div className="modal-pass-count">已传递 {message.passCount} 次</div>
        <button className="modal-close-btn" onClick={handleClose}>
          关闭
        </button>
      </div>
    </div>
  )
}

export default MessageModal
