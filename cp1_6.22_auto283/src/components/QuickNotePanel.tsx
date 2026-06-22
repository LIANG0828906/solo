import React, { useState } from 'react'
import { useStore, InspirationType, Inspiration } from '../store/InspirationStore'

const typeStyles: Record<InspirationType, { bg: string; label: string; color: string }> = {
  text: { bg: '#F9F9FB', label: '文字', color: '#6B7280' },
  image: { bg: '#E8F0FE', label: '图片', color: '#3B82F6' },
  voice: { bg: '#FFF3E0', label: '语音', color: '#F59E0B' },
}

const InspirationCard: React.FC<{
  inspiration: Inspiration
  index: number
  onDragStart: (e: React.DragEvent, id: string) => void
  onDelete: (id: string) => void
}> = ({ inspiration, index, onDragStart, onDelete }) => {
  const style = typeStyles[inspiration.type]

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const isImageUrl = inspiration.type === 'image' && inspiration.content.startsWith('http')

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, inspiration.id)}
      style={{
        width: '200px',
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: style.bg,
        cursor: 'grab',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        animation: 'fadeInUp 0.3s ease forwards',
        animationDelay: `${index * 0.05}s`,
        opacity: 0,
        position: 'relative',
        wordBreak: 'break-word',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
          onDelete(inspiration.id)
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '11px',
          color: '#6B7280',
          opacity: 0,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
      >
        ×
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: style.color,
            color: '#fff',
            fontWeight: 500,
          }}
        >
          {style.label}
        </span>
        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
          {formatTime(inspiration.createdAt)}
        </span>
      </div>
      {isImageUrl ? (
        <img
          src={inspiration.content}
          alt="灵感图片"
          style={{
            width: '100%',
            height: '100px',
            objectFit: 'cover',
            borderRadius: '8px',
          }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect fill="%23CBD5E1" width="200" height="100"/><text fill="%2364748B" x="100" y="50" text-anchor="middle" font-size="14">图片加载失败</text></svg>'
          }}
        />
      ) : (
        <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
          {inspiration.content}
        </p>
      )}
    </div>
  )
}

const QuickNotePanel: React.FC = () => {
  const { state, dispatch } = useStore()
  const [content, setContent] = useState('')
  const [type, setType] = useState<InspirationType>('text')
  const [filterType, setFilterType] = useState<InspirationType | 'all'>('all')

  const handleAdd = () => {
    if (!content.trim()) return
    dispatch({ type: 'ADD_INSPIRATION', payload: { content: content.trim(), type, themeId: null } })
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAdd()
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const filteredInspirations =
    filterType === 'all'
      ? state.inspirations
      : state.inspirations.filter((i) => i.type === filterType)

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: '#F3F4F6',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        borderRight: '1px solid #E5E7EB',
      }}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
          灵感速记
        </h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {(['text', 'image', 'voice'] as InspirationType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1,
                padding: '6px 0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: type === t ? typeStyles[t].color : '#E5E7EB',
                color: type === t ? '#fff' : '#6B7280',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              {typeStyles[t].label}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            type === 'text'
              ? '输入文字灵感...'
              : type === 'image'
                ? '粘贴图片URL...'
                : '输入语音转文字内容...'
          }
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '13px',
            resize: 'none',
            minHeight: '80px',
            outline: 'none',
            fontFamily: 'inherit',
            backgroundColor: '#fff',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
          onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
        />
        <button
          onClick={handleAdd}
          disabled={!content.trim()}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '8px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: content.trim() ? '#3B82F6' : '#9CA3AF',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: content.trim() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s ease',
          }}
        >
          添加灵感
        </button>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: '6px' }}>
        {(['all', 'text', 'image', 'voice'] as (InspirationType | 'all')[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              padding: '4px 10px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '11px',
              cursor: 'pointer',
              backgroundColor: filterType === t ? '#3B82F6' : 'transparent',
              color: filterType === t ? '#fff' : '#6B7280',
              fontWeight: 500,
            }}
          >
            {t === 'all' ? '全部' : typeStyles[t].label}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            columns: '200px',
            columnGap: '12px',
          }}
        >
          {filteredInspirations.map((inspiration, index) => (
            <div key={inspiration.id} style={{ marginBottom: '12px', breakInside: 'avoid' }}>
              <InspirationCard
                inspiration={inspiration}
                index={index}
                onDragStart={handleDragStart}
                onDelete={(id) => dispatch({ type: 'DELETE_INSPIRATION', payload: id })}
              />
            </div>
          ))}
        </div>
        {filteredInspirations.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 20px' }}>
            <p>暂无灵感记录</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>在上方输入并添加</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuickNotePanel
