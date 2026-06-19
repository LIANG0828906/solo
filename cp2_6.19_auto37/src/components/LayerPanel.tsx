import React, { useState, useRef } from 'react'
import { useEditorStore, Layer } from '../store/editorStore'
import '../styles/layerpanel.css'

const LayerPanel: React.FC = () => {
  const {
    layers,
    selectedLayerId,
    highlightLayerId,
    selectLayer,
    deleteLayer,
    reorderLayers,
    setHighlightLayerId,
    updateLayer,
  } = useEditorStore()

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragItemRef = useRef<HTMLDivElement | null>(null)

  const reversedLayers = [...layers].reverse()

  const getLayerIcon = (layer: Layer) => {
    switch (layer.type) {
      case 'background':
        return '🖼️'
      case 'text':
        return '📝'
      case 'brush':
        return '🖌️'
      case 'sticker':
        return layer.type === 'sticker' ? (layer as any).emoji : '🏷️'
      default:
        return '📄'
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    dragItemRef.current = e.currentTarget as HTMLDivElement
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const actualFromIndex = layers.length - 1 - draggedIndex
      const actualToIndex = layers.length - 1 - dragOverIndex
      reorderLayers(actualFromIndex, actualToIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
    dragItemRef.current = null
  }

  const handleLayerClick = (layerId: string) => {
    selectLayer(layerId)
    setHighlightLayerId(layerId)
    setTimeout(() => setHighlightLayerId(null), 1000)
  }

  const handleDeleteClick = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation()
    deleteLayer(layerId)
  }

  const handleVisibilityToggle = (e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation()
    updateLayer(layer.id, { visible: !layer.visible })
  }

  return (
    <div className="layer-panel glass-panel">
      <div className="panel-header">
        <h3 className="panel-title">图层</h3>
        <span className="layer-count">{layers.length} 个元素</span>
      </div>
      <div className="layer-list">
        {reversedLayers.length === 0 ? (
          <div className="empty-layers">
            <span className="empty-icon">📋</span>
            <span className="empty-text">暂无图层</span>
          </div>
        ) : (
          reversedLayers.map((layer, index) => (
            <div
              key={layer.id}
              className={`layer-item ${
                selectedLayerId === layer.id ? 'selected' : ''
              } ${draggedIndex === index ? 'dragging' : ''} ${
                dragOverIndex === index && draggedIndex !== index ? 'drag-over' : ''
              } ${highlightLayerId === layer.id ? 'highlight' : ''}`}
              draggable={layer.type !== 'background'}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handleLayerClick(layer.id)}
            >
              <div className="layer-thumbnail">
                <span className="layer-icon">{getLayerIcon(layer)}</span>
              </div>
              <div className="layer-info">
                <span className="layer-name">{layer.name}</span>
                <span className="layer-type">{getTypeName(layer.type)}</span>
              </div>
              <div className="layer-actions">
                <button
                  className={`layer-btn visibility-btn ${!layer.visible ? 'off' : ''}`}
                  onClick={(e) => handleVisibilityToggle(e, layer)}
                  title={layer.visible ? '隐藏' : '显示'}
                >
                  {layer.visible ? '👁️' : '👁️‍🗨️'}
                </button>
                {layer.type !== 'background' && (
                  <button
                    className="layer-btn delete-btn"
                    onClick={(e) => handleDeleteClick(e, layer.id)}
                    title="删除"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <div className="drag-handle">⋮⋮</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const getTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    background: '底图',
    text: '文字',
    brush: '涂鸦',
    sticker: '贴纸',
  }
  return typeMap[type] || type
}

export default LayerPanel
