import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import type { Sound } from '../../shared/types'

interface SoundDetailProps {
  sound: Sound
  onClose: () => void
  onLike: (id: string) => void
  onReport: (id: string) => void
}

function SoundDetail({ sound, onClose, onLike, onReport }: SoundDetailProps) {
  const [liked, setLiked] = useState(false)
  const [reported, setReported] = useState(sound.isReported)
  const [isClosing, setIsClosing] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleLike = async () => {
    if (liked) return
    try {
      await axios.post(`/api/sounds/${sound.id}/like`)
      setLiked(true)
      onLike(sound.id)
    } catch (error) {
      console.error('Like failed:', error)
    }
  }

  const handleReport = async () => {
    if (reported) return
    try {
      await axios.post(`/api/sounds/${sound.id}/report`)
      setReported(true)
      onReport(sound.id)
    } catch (error) {
      console.error('Report failed:', error)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryLabel = (category: string): string => {
    const map: Record<string, string> = {
      traffic: '交通',
      nature: '自然',
      crowd: '人群',
      machinery: '机械',
      other: '其他',
    }
    return map[category] || category
  }

  return (
    <div
      className="detail-modal-overlay"
      style={{ animation: isClosing ? 'fadeIn 0.3s ease reverse' : 'fadeIn 0.3s ease' }}
      onClick={handleClose}
    >
      <div
        className="detail-modal"
        style={{
          animation: isClosing ? 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) reverse' : 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-header">
          <div>
            <h3 className="detail-title">{sound.title}</h3>
            <span className={`detail-category category-${sound.category}`}>
              {getCategoryLabel(sound.category)}
            </span>
          </div>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="audio-player">
          <audio ref={audioRef} controls>
            <source src={`/uploads/${sound.fileName}`} type="audio/webm" />
            您的浏览器不支持音频播放
          </audio>
        </div>

        <div className="detail-info">
          <div className="detail-info-item">
            <div className="detail-info-label">录制时间</div>
            <div className="detail-info-value">{formatDate(sound.uploadTime)}</div>
          </div>
          <div className="detail-info-item">
            <div className="detail-info-label">录音时长</div>
            <div className="detail-info-value">{sound.duration}秒</div>
          </div>
          <div className="detail-info-item">
            <div className="detail-info-label">上传者</div>
            <div className="detail-info-value">{sound.uploader}</div>
          </div>
          <div className="detail-info-item">
            <div className="detail-info-label">地理位置</div>
            <div className="detail-info-value" style={{ fontSize: '0.85rem' }}>
              {sound.lat.toFixed(4)}, {sound.lng.toFixed(4)}
            </div>
          </div>
        </div>

        {sound.description && (
          <div className="detail-description">
            {sound.description}
          </div>
        )}

        {sound.tags.length > 0 && (
          <div className="detail-tags">
            {sound.tags.map((tag) => (
              <span key={tag} className="detail-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="detail-actions">
          <button
            className={`action-btn like ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={liked}
          >
            {liked ? '❤️' : '🤍'} {sound.likes + (liked ? 1 : 0)}
          </button>
          <button
            className={`action-btn report ${reported ? 'reported' : ''}`}
            onClick={handleReport}
            disabled={reported}
          >
            {reported ? '⚠️ 已举报' : '🚩 举报'}
          </button>
        </div>

        {reported && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent-orange)',
              marginTop: '12px',
              textAlign: 'center',
            }}
          >
            感谢您的反馈，我们会尽快审核该内容
          </p>
        )}
      </div>
    </div>
  )
}

export default SoundDetail
