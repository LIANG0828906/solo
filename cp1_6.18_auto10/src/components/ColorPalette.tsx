import React, { useState, useRef, useEffect } from 'react'
import { useColorStore, SemanticColor } from '../store'
import ColorPicker from './ColorPicker'

const ColorPalette: React.FC = () => {
  const { colors, updateColor, undo, historyIndex } = useColorStore()
  const [paletteColors, setPaletteColors] = useState<SemanticColor[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPosition, setEditingPosition] = useState({ x: 0, y: 0 })
  const workspaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updatedPalette = paletteColors.map(pc => {
      const storeColor = colors.find(c => c.id === pc.id)
      return storeColor || pc
    })
    if (JSON.stringify(updatedPalette) !== JSON.stringify(paletteColors)) {
      setPaletteColors(updatedPalette)
    }
  }, [colors])

  const handleDragStart = (e: React.DragEvent, color: SemanticColor) => {
    setDraggingId(color.id)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', JSON.stringify(color))
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (workspaceRef.current && !workspaceRef.current.contains(e.relatedTarget as Node)) {
      setDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    try {
      const colorData: SemanticColor = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (colorData && !paletteColors.find(c => c.id === colorData.id)) {
        setPaletteColors([...paletteColors, colorData])
      }
    } catch {}
    setDraggingId(null)
  }

  const handleDoubleClick = (e: React.MouseEvent, id: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setEditingId(id)
    setEditingPosition({ x: rect.right + 12, y: rect.top })
  }

  const handleColorUpdate = (id: string, updates: Partial<SemanticColor>) => {
    updateColor(id, updates)
  }

  const activeColors = paletteColors.length > 0 ? paletteColors : []
  const editingColor = colors.find(c => c.id === editingId) || paletteColors.find(c => c.id === editingId)

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', minWidth: 0 }}>
      <div style={{
        width: '240px',
        background: '#1E1E2E',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <h2 style={{
          color: '#fff',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '16px',
          letterSpacing: '0.5px',
        }}>
          语义颜色
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          {colors.map(color => (
            <div
              key={color.id}
              draggable
              onDragStart={(e) => handleDragStart(e, color)}
              onDragEnd={handleDragEnd}
              onDoubleClick={(e) => handleDoubleClick(e, color.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'grab',
                transition: 'background 0.2s ease',
                background: draggingId === color.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (draggingId !== color.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = draggingId === color.id ? 'rgba(255,255,255,0.08)' : 'transparent'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: color.hex,
                border: '2px solid #fff',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
                  {color.name}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '2px' }}>
                  {color.hex}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: historyIndex === 0 ? '#374151' : '#E2E8F0',
              border: 'none',
              cursor: historyIndex === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: historyIndex === 0 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (historyIndex > 0) e.currentTarget.style.background = '#CBD5E1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = historyIndex === 0 ? '#374151' : '#E2E8F0'
            }}
            title="撤销上一步"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4" />
              <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={workspaceRef}
        className="palette-workspace"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          flex: 1,
          background: '#F5F5F7',
          padding: '40px',
          position: 'relative',
          overflow: 'auto',
          margin: '16px',
          marginLeft: '0',
          transition: 'border-color 0.2s ease',
          borderRadius: '8px',
          border: dragOver ? '2px dashed #3B82F6' : '2px dashed transparent',
        }}
      >
        {activeColors.length === 0 ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#94A3B8',
            fontSize: '14px',
            textAlign: 'center',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>🎨</div>
            将左侧色块拖拽到此处
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '16px',
          }}>
            {activeColors.map(color => (
              <div
                key={color.id}
                onDoubleClick={(e) => handleDoubleClick(e, color.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: color.hex,
                  border: '3px solid #fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#333333' }}>{color.hex}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingId && editingColor && (
        <ColorPicker
          color={editingColor}
          position={editingPosition}
          onClose={() => setEditingId(null)}
          onChange={(updates) => handleColorUpdate(editingId, updates)}
        />
      )}
    </div>
  )
}

export default ColorPalette
