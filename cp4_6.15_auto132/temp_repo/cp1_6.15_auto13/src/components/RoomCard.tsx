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
  const progress = room.totalBudget > 0 ? room.spent / room.totalBudget : 0
  const isOverBudget = progress > 1
  const displayProgress = Math.min(Math.max(progress, 0), 1) * 100
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
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', room.id)
        onDragStart(room.id)
      }}
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
        boxShadow: isDragOver
          ? '0 0 0 2px dashed #8B6914, 0 4px 12px rgba(139, 105, 20, 0.08)'
          : '0 4px 12px rgba(139, 105, 20, 0.08)',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging
          ? 'none'
          : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative',
        transform: isDragging ? 'scale(1.03) rotate(1deg)' : undefined,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 100 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(-6px) scale(1.015)'
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(139, 105, 20, 0.18)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = ''
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 105, 20, 0.08)'
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          borderRadius: '999px',
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: 500,
          background: status.bg,
          color: status.text,
          zIndex: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {status.label}
      </div>
      <div
        style={{
          aspectRatio: '4 / 3',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <img
          src={room.thumbnail}
          alt={room.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.5s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(to top, rgba(90, 69, 36, 0.4), transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ padding: '18px' }}>
        <h3
          className="serif"
          style={{
            fontSize: '20px',
            color: '#5A4524',
            marginBottom: '4px',
            fontWeight: 600,
          }}
        >
          {room.name}
        </h3>
        <p
          style={{
            fontSize: '12px',
            color: '#9C8B70',
            marginBottom: '14px',
          }}
        >
          更新于 {formatDate(room.updatedAt)}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            marginBottom: '8px',
          }}
        >
          <span style={{ color: '#8B7355' }}>预算使用</span>
          <span style={{ color: isOverBudget ? '#FF8C00' : '#8B6914', fontWeight: 600 }}>
            ¥{Math.round(room.spent).toLocaleString()}
            <span style={{ color: '#9C8B70', fontWeight: 400, fontSize: '12px' }}>
              {' '}/ ¥{Math.round(room.totalBudget).toLocaleString()}
            </span>
          </span>
        </div>
        <div
          style={{
            height: '8px',
            background: '#F5EDE0',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${displayProgress}%`,
              background: progressGradient,
              borderRadius: '999px',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isOverBudget
                ? '0 0 8px rgba(255, 140, 0, 0.5)'
                : '0 0 8px rgba(124, 179, 66, 0.3)',
            }}
          />
        </div>
        {isOverBudget && (
          <div
            className="animate-fadeIn"
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#FF8C00',
              fontWeight: 500,
              textAlign: 'right',
            }}
          >
            ⚠ 已超出预算
          </div>
        )}
      </div>
    </div>
  )
}
