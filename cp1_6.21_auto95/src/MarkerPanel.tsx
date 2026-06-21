import React, { useState, useRef } from 'react'
import type { Marker, Selection } from './BeatMarkerManager'
import { MARKER_COLORS } from './BeatMarkerManager'

interface MarkerPanelProps {
  markers: Marker[]
  selection: Selection | null
  currentTime: number
  onAddMarker: (marker: Omit<Marker, 'id'>) => void
  onRemoveMarker: (id: string) => void
  onReorderMarkers: (newOrder: string[]) => void
  onSelectMarker: (time: number) => void
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

export const MarkerPanel: React.FC<MarkerPanelProps> = ({
  markers,
  selection,
  currentTime,
  onAddMarker,
  onRemoveMarker,
  onReorderMarkers,
  onSelectMarker,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [markerText, setMarkerText] = useState('')
  const [selectedColor, setSelectedColor] = useState<string>(MARKER_COLORS[0])
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddClick = () => {
    setMarkerText('')
    setSelectedColor(MARKER_COLORS[0])
    setShowModal(true)
  }

  const handleConfirm = () => {
    if (!markerText.trim()) return

    const time = selection ? (selection.start + selection.end) / 2 : currentTime

    onAddMarker({
      time,
      text: markerText.trim(),
      color: selectedColor,
    })

    setShowModal(false)
    setMarkerText('')
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== draggedId) {
      setDragOverId(id)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const newOrder = markers.map((m) => m.id)
    const draggedIndex = newOrder.indexOf(draggedId)
    const targetIndex = newOrder.indexOf(targetId)

    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedId)

    onReorderMarkers(newOrder)
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#F5F5F5',
        borderLeft: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: 600,
            color: '#333',
          }}
        >
          标记管理
        </h2>

        <button
          onClick={handleAddClick}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#1E88E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1976D2'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1E88E5'
          }}
        >
          + 添加标记
        </button>

        {selection && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              backgroundColor: '#E3F2FD',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#1565C0',
            }}
          >
            已选中区域: {formatTime(selection.start)} - {formatTime(selection.end)}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {markers.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999',
              fontSize: '14px',
            }}
          >
            暂无标记
            <br />
            <span style={{ fontSize: '12px' }}>点击上方按钮添加第一个标记</span>
          </div>
        ) : (
          markers.map((marker) => (
            <div
              key={marker.id}
              draggable
              onDragStart={(e) => handleDragStart(e, marker.id)}
              onDragOver={(e) => handleDragOver(e, marker.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, marker.id)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                setSelectedMarkerId(marker.id)
                onSelectMarker(marker.time)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '56px',
                marginBottom: '6px',
                backgroundColor: selectedMarkerId === marker.id ? '#E3F2FD' : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transform: draggedId === marker.id ? 'scale(0.98)' : dragOverId === marker.id ? 'scale(1.02)' : 'scale(1)',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
                animation: selectedMarkerId === marker.id ? 'pulse 0.15s ease' : 'none',
                opacity: draggedId === marker.id ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  width: '5px',
                  height: '100%',
                  backgroundColor: marker.color,
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  flex: 1,
                  padding: '0 12px',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#333',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {marker.text}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#888',
                    marginTop: '2px',
                  }}
                >
                  {formatTime(marker.time)}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0 8px',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    color: '#999',
                    cursor: 'grab',
                    opacity: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveMarker(marker.id)
                    if (selectedMarkerId === marker.id) {
                      setSelectedMarkerId(null)
                    }
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#E53935',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(229, 57, 53, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,.mp3"
        style={{ display: 'none' }}
      />

      {showModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowModal(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw',
              zIndex: 101,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: '20px',
                fontSize: '18px',
                fontWeight: 600,
                color: '#333',
              }}
            >
              添加标记
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#555',
                }}
              >
                标记文本
              </label>
              <input
                type="text"
                value={markerText}
                onChange={(e) => setMarkerText(e.target.value)}
                placeholder="如：主歌开始、副歌高潮"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1E88E5'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E0E0E0'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirm()
                  }
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#555',
                }}
              >
                标记颜色
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {MARKER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: color,
                      border: selectedColor === color ? '3px solid #333' : '2px solid transparent',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = selectedColor === color ? 'scale(1.15)' : 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = selectedColor === color ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F5F5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!markerText.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: markerText.trim() ? '#1E88E5' : '#BDBDBD',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: markerText.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (markerText.trim()) {
                    e.currentTarget.style.backgroundColor = '#1976D2'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = markerText.trim() ? '#1E88E5' : '#BDBDBD'
                }}
              >
                确认
              </button>
            </div>
          </div>

          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.02); }
              100% { transform: scale(1); }
            }
          `}</style>
        </>
      )}
    </div>
  )
}
