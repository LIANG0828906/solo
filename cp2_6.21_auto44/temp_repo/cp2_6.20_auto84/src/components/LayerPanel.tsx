import { useState, useRef } from 'react'
import { Layers } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import type { CanvasElement } from '../store/editorStore'
import './LayerPanel.css'

function LayerPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragOverRef = useRef<HTMLDivElement>(null)

  const elements = useEditorStore((s) => s.elements)
  const selectedId = useEditorStore((s) => s.selectedId)
  const selectElement = useEditorStore((s) => s.selectElement)
  const reorderElements = useEditorStore((s) => s.reorderElements)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex)

  const getElementName = (el: CanvasElement) => {
    if (el.type === 'text') return '文字'
    if (el.type === 'sticker') return '贴纸'
    if (el.type === 'drawing') return '绘制'
    return '元素'
  }

  const getElementPreview = (el: CanvasElement): React.CSSProperties => {
    if (el.type === 'text') {
      return {
        background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
      }
    }
    if (el.type === 'sticker') {
      return {
        background: 'linear-gradient(135deg, #fd79a8 0%, #fab1a0 100%)',
      }
    }
    return {
      background: 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)',
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
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
    if (draggedId && draggedId !== targetId) {
      const rect = dragOverRef.current?.getBoundingClientRect()
      const isAbove = rect ? e.clientY < rect.top + rect.height / 2 : true
      reorderElements(draggedId, targetId, isAbove)
      pushHistory()
    }
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div
      className={`layer-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
      ref={dragOverRef}
    >
      {!isExpanded ? (
        <button
          className="layer-toggle layer-toggle-collapsed"
          onClick={() => setIsExpanded(true)}
          title="图层"
        >
          <Layers size={18} />
        </button>
      ) : (
        <>
          <div className="layer-panel-header">
            <span className="layer-panel-title">图层</span>
            <button
              className="layer-close-btn"
              onClick={() => setIsExpanded(false)}
            >
              ×
            </button>
          </div>
          <div className="layer-panel-list">
            {sortedElements.length === 0 && (
              <div className="layer-empty">暂无图层</div>
            )}
            {sortedElements.map((element) => (
              <div
                key={element.id}
                className={`layer-item ${selectedId === element.id ? 'selected' : ''} ${dragOverId === element.id ? 'drag-over' : ''} ${draggedId === element.id ? 'dragging' : ''}`}
                draggable
                onClick={() => selectElement(element.id)}
                onDragStart={(e) => handleDragStart(e, element.id)}
                onDragOver={(e) => handleDragOver(e, element.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, element.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="layer-thumb" style={getElementPreview(element)}>
                  {element.type === 'text' && <span className="thumb-icon">T</span>}
                  {element.type === 'sticker' && <span className="thumb-icon">★</span>}
                  {element.type === 'drawing' && <span className="thumb-icon">✎</span>}
                </div>
                <span className="layer-name">{getElementName(element)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default LayerPanel
