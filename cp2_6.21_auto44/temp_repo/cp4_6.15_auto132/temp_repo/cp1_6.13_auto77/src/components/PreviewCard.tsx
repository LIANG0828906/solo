import React, { useState } from 'react'

export interface CardData {
  id: string
  url: string
  domain: string
  title: string
  description: string
  favicon: string
  isNew?: boolean
}

interface PreviewCardProps {
  card: CardData
  index: number
  onDelete: (id: string) => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
  onDrop: (index: number) => void
  isDragging: boolean
  filtered: boolean
}

const PreviewCard: React.FC<PreviewCardProps> = ({
  card,
  index,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging,
  filtered,
}) => {
  const [hovered, setHovered] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDeleting(true)
    setTimeout(() => onDelete(card.id), 280)
  }

  const animationDelay = `${index * 0.1}s`
  const animationName = card.isNew ? 'slideInRight' : 'fadeInStagger'

  return (
    <div
      draggable={!deleting}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(index))
        onDragStart(index)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver(index)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(index)
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        window.open(card.url, '_blank', 'noopener,noreferrer')
      }}
      style={{
        position: 'relative',
        aspectRatio: '3 / 2',
        backgroundColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: 20,
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflow: 'hidden',
        opacity: deleting ? 0 : filtered ? 0 : isDragging ? 0.4 : 1,
        transform: deleting
          ? 'scale(0.5)'
          : filtered
          ? 'scale(0.8)'
          : hovered
          ? 'scale(1.08)'
          : 'scale(1)',
        transition: isDragging
          ? 'none'
          : `transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease`,
        animation: deleting
          ? 'shrinkFade 0.3s ease forwards'
          : filtered
          ? 'shrinkFade 0.2s ease forwards'
          : `${animationName} 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${animationDelay} both`,
        zIndex: hovered ? 10 : 'auto',
        boxShadow: hovered
          ? '0 20px 40px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 30,
          height: 30,
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          display: hovered ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'scale(1)' : 'scale(0.6)',
        }}
        onClick={handleDelete}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.15)'
          e.currentTarget.style.backgroundColor = '#dc2626'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.backgroundColor = '#ef4444'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 30 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <img
            src={card.favicon}
            alt=""
            width={24}
            height={24}
            style={{ objectFit: 'contain' }}
            onError={(e) => {
              const img = e.target as HTMLImageElement
              img.style.display = 'none'
              const parent = img.parentElement
              if (parent) {
                parent.innerHTML =
                  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
              }
            }}
          />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.title || '未知站点'}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 12,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.domain}
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          color: 'rgba(255,255,255,0.65)',
          fontSize: 13,
          lineHeight: 1.55,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {card.description || '暂无描述信息'}
      </div>

      <style>{`
        @keyframes fadeInStagger {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes shrinkFade {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.5);
          }
        }
      `}</style>
    </div>
  )
}

export default PreviewCard
