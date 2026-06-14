import { useState } from 'react'
import Countdown from './Countdown'

export interface CapsuleData {
  id: string
  type: 'text' | 'image'
  content: string
  imageUrl?: string
  openDate: string
  createdAt: string
  isOpened: boolean
  openedAt?: string
  isDrifted: boolean
  isOwner: boolean
  isOpenable: boolean
  driftId?: string
  reply?: string
  replyAt?: string
  replyVisibleAt?: string
  canViewReply?: boolean
}

interface CapsuleCardProps {
  capsule: CapsuleData
  onOpen?: (capsule: CapsuleData) => void
}

function CapsuleCard({ capsule, onOpen }: CapsuleCardProps) {
  const [isOpening, setIsOpening] = useState(false)
  const [showContent, setShowContent] = useState(false)

  const handleClick = () => {
    if (capsule.isOpenable && !capsule.isOpened) {
      setIsOpening(true)
      setTimeout(() => {
        setShowContent(true)
      }, 400)
      setTimeout(() => {
        onOpen?.(capsule)
        setIsOpening(false)
        setShowContent(false)
      }, 1200)
    } else if (capsule.isOpened) {
      onOpen?.(capsule)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={`glass-card capsule-card ${!capsule.isOpenable && !capsule.isOpened ? 'locked' : ''} ${isOpening ? 'opening' : ''}`}
      onClick={handleClick}
    >
      <span className="capsule-type-badge">
        {capsule.type === 'text' ? '📝 文字胶囊' : '🖼️ 图片胶囊'}
        {capsule.isOwner ? ' · 我的' : ' · 漂流瓶'}
      </span>

      {isOpening ? (
        <div className="capsule-open-animation">
          <div className="envelope-open">
            <div className="envelope-open-body" />
            <div className="envelope-open-flap-left" />
            <div className="envelope-open-flap-right" />
          </div>
          {showContent && (
            <div className="capsule-content-reveal">
              {capsule.type === 'image' && capsule.imageUrl ? (
                <img src={capsule.imageUrl} alt="胶囊内容" className="capsule-preview-small" />
              ) : (
                <p className="capsule-content-preview">{capsule.content.slice(0, 50)}...</p>
              )}
            </div>
          )}
        </div>
      ) : capsule.isOpened ? (
        <>
          {capsule.type === 'image' && capsule.imageUrl ? (
            <img src={capsule.imageUrl} alt="胶囊内容" className="capsule-preview" />
          ) : (
            <p className="capsule-content">{capsule.content}</p>
          )}
          <div className="capsule-meta">
            <span>开封于 {formatDate(capsule.openedAt || capsule.openDate)}</span>
          </div>
        </>
      ) : capsule.isOpenable ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div className="envelope-ready">
            <div className="envelope-ready-body" />
            <div className="envelope-ready-flap" />
          </div>
          <p style={{ color: 'var(--accent-color)', fontSize: '14px', marginBottom: '12px', marginTop: '12px' }}>
            可以开封啦！
          </p>
          <button className="btn btn-primary">点击开封</button>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' }}>
              距离开封还有
            </p>
            <Countdown targetDate={capsule.openDate} size="sm" />
          </div>
          <div className="capsule-meta">
            <span>创建于 {formatDate(capsule.createdAt)}</span>
          </div>
        </>
      )}

      {capsule.isDrifted && capsule.isOwner && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '12px', color: 'var(--success-color)' }}>🌊 已漂流</span>
        </div>
      )}
    </div>
  )
}

export default CapsuleCard
