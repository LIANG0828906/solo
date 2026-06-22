import React, { useState, useMemo } from 'react'
import { useStore, Inspiration, InspirationType } from '../store/InspirationStore'

const typeColors: Record<InspirationType, string> = {
  text: '#6B7280',
  image: '#3B82F6',
  voice: '#F59E0B',
}

const typeLabels: Record<InspirationType, string> = {
  text: '文字',
  image: '图片',
  voice: '语音',
}

type ZoomLevel = 'year' | 'month' | 'day'

interface TimelineItemProps {
  inspiration: Inspiration
  isSelected: boolean
  onClick: () => void
}

const TimelineItem: React.FC<TimelineItemProps> = ({ inspiration, isSelected, onClick }) => {
  const color = typeColors[inspiration.type]
  const isImage = inspiration.type === 'image' && inspiration.content.startsWith('http')

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: '20px',
        cursor: 'pointer',
        padding: '8px 0',
      }}
    >
      <div style={{ position: 'relative', width: '40px', flexShrink: 0 }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: isSelected ? '2px' : '6px',
            width: isSelected ? '20px' : '12px',
            height: isSelected ? '20px' : '12px',
            borderRadius: '50%',
            backgroundColor: color,
            border: '3px solid #FFFFFF',
            boxShadow: `0 0 0 2px ${color}${isSelected ? '' : '33'}`,
            transition: 'all 0.2s ease',
            zIndex: 1,
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: isSelected ? '#F9FAFB' : 'transparent',
          border: isSelected ? '1px solid #E5E7EB' : '1px solid transparent',
          transition: 'all 0.2s ease',
          animation: 'fadeInUp 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: color,
              color: '#fff',
              fontWeight: 500,
            }}
          >
            {typeLabels[inspiration.type]}
          </span>
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
            {new Date(inspiration.createdAt).toLocaleString('zh-CN', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        {isImage ? (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <img
              src={inspiration.content}
              alt=""
              style={{
                width: '80px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '6px',
              }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', color: '#374151' }}>{inspiration.content.substring(0, 60)}...</p>
            </div>
          </div>
        ) : (
          <p
            style={{
              fontSize: '13px',
              color: '#374151',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: isSelected ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {inspiration.content}
          </p>
        )}
      </div>
    </div>
  )
}

const TimelineView: React.FC = () => {
  const { state } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month')

  const activeTheme = state.themes.find((t) => t.id === state.activeThemeId)

  const themeInspirations = useMemo(() => {
    if (!state.activeThemeId) return []
    return state.inspirations
      .filter((i) => i.themeId === state.activeThemeId)
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [state.inspirations, state.activeThemeId])

  const groupedInspirations = useMemo(() => {
    const groups: Record<string, Inspiration[]> = {}
    themeInspirations.forEach((inspiration) => {
      const date = new Date(inspiration.createdAt)
      let key: string
      if (zoomLevel === 'year') {
        key = `${date.getFullYear()}年`
      } else if (zoomLevel === 'month') {
        key = `${date.getFullYear()}年${date.getMonth() + 1}月`
      } else {
        key = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      }
      if (!groups[key]) groups[key] = []
      groups[key].push(inspiration)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [themeInspirations, zoomLevel])

  const selectedInspiration = themeInspirations.find((i) => i.id === selectedId)

  if (!activeTheme) {
    return (
      <div
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>尚未选择主题</p>
        <p style={{ fontSize: '13px' }}>请先在画布视图中创建主题</p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 40px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: activeTheme.color,
              }}
            />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
              {activeTheme.name}
            </h3>
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
              共 {themeInspirations.length} 条灵感
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['year', 'month', 'day'] as ZoomLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setZoomLevel(level)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: zoomLevel === level ? '#3B82F6' : '#F3F4F6',
                  color: zoomLevel === level ? '#fff' : '#6B7280',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
              >
                {level === 'year' ? '按年' : level === 'month' ? '按月' : '按日'}
              </button>
            ))}
          </div>
        </div>

        {groupedInspirations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <p style={{ fontSize: '14px' }}>该主题下暂无灵感记录</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>请在画布视图中添加节点</p>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '20px' }}>
            <div
              style={{
                position: 'absolute',
                left: '30px',
                top: '10px',
                bottom: '10px',
                width: '2px',
                background: 'linear-gradient(to bottom, #E5E7EB, #D1D5DB, #E5E7EB)',
                borderRadius: '1px',
              }}
            />
            {groupedInspirations.map(([groupLabel, inspirations]) => (
              <div key={groupLabel} style={{ marginBottom: '32px' }}>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#6B7280',
                    marginBottom: '16px',
                    paddingLeft: '44px',
                  }}
                >
                  {groupLabel}
                </h4>
                {inspirations.map((inspiration) => (
                  <TimelineItem
                    key={inspiration.id}
                    inspiration={inspiration}
                    isSelected={selectedId === inspiration.id}
                    onClick={() => setSelectedId(inspiration.id === selectedId ? null : inspiration.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedInspiration && (
        <div
          style={{
            width: '360px',
            borderLeft: '1px solid #E5E7EB',
            backgroundColor: '#FAFAFA',
            padding: '24px',
            overflowY: 'auto',
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: typeColors[selectedInspiration.type],
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
                marginBottom: '12px',
              }}
            >
              {typeLabels[selectedInspiration.type]}
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>
              灵感详情
            </h4>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
              创建于 {new Date(selectedInspiration.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>

          {selectedInspiration.type === 'image' && selectedInspiration.content.startsWith('http') ? (
            <img
              src={selectedInspiration.content}
              alt="灵感图片"
              style={{
                width: '100%',
                maxHeight: '240px',
                objectFit: 'cover',
                borderRadius: '10px',
                marginBottom: '16px',
              }}
            />
          ) : null}

          <div
            style={{
              padding: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
            }}
          >
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {selectedInspiration.content}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimelineView
