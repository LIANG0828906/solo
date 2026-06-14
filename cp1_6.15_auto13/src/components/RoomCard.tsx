import { cn } from '@/lib/utils'
import type { Room } from '@/store/useStore'

interface RoomCardProps {
  room: Room
  onDragStart: (id: string) => void
  onDragOver: (e: React.DragEvent, id: string) => void
  onDrop: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  isDragging: boolean
  isDragOver: boolean
  onClick: () => void
}

export default function RoomCard({
  room,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
  onClick,
}: RoomCardProps) {
  const statusConfig = {
    not_started: { bg: '#F5EDE0', text: '#8B6914', label: '未开始' },
    in_progress: { bg: '#FFF3E0', text: '#FF8C00', label: '进行中' },
    completed: { bg: '#E8F5E9', text: '#7CB342', label: '已完成' },
  }

  const status = statusConfig[room.status]
  const progress = Math.min(room.spent / room.totalBudget, 1)
  const isOverBudget = room.spent > room.totalBudget
  const progressGradient = isOverBudget
    ? 'linear-gradient(90deg, #FF8C00 0%, #E65100 100%)'
    : 'linear-gradient(90deg, #8BC34A 0%, #7CB342 100%)'

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(room.id)}
      onDragOver={(e) => onDragOver(e, room.id)}
      onDrop={(e) => onDrop(e, room.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'animate-springIn',
        isDragging && 'dragging',
        isDragOver && 'drag-over'
      )}
      style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(139, 105, 20, 0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.015)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 105, 20, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 105, 20, 0.08)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          borderRadius: '999px',
          padding: '2px 12px',
          fontSize: '12px',
          fontWeight: 500,
          background: status.bg,
          color: status.text,
          zIndex: 1,
        }}
      >
        {status.label}
      </div>
      <div
        style={{
          aspectRatio: '4 / 3',
          overflow: 'hidden',
        }}
      >
        <img
          src={room.thumbnail}
          alt={room.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
      <div style={{ padding: '16px' }}>
        <h3
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '20px',
            color: '#5A4524',
            marginBottom: '4px',
          }}
        >
          {room.name}
        </h3>
        <p
          style={{
            fontSize: '12px',
            color: '#9C8B70',
            marginBottom: '12px',
          }}
        >
          更新于 {formatDate(room.updatedAt)}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            marginBottom: '8px',
          }}
        >
          <span style={{ color: '#3D2F1F' }}>预算</span>
          <span style={{ color: '#8B6914', fontWeight: 600 }}>
            ¥{room.spent.toLocaleString()} / ¥{room.totalBudget.toLocaleString()}
          </span>
        </div>
        <div className="progress-bar-track" style={{ height: '8px' }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${Math.max(progress * 100, isOverBudget ? 100 : 0)}%`,
              background: progressGradient,
            }}
          />
        </div>
      </div>
    </div>
  )
}
