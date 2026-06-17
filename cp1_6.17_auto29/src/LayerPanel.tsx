import React, { useRef, useState, useCallback } from 'react'
import { useAppStore } from './store'
import type { Layer } from './types'
import LayerThumbnail from './LayerThumbnail'

interface DragItem {
  index: number
  layerId: string
}

const LayerPanel: React.FC = () => {
  const {
    layers,
    selectedLayerId,
    selectLayer,
    removeLayer,
    duplicateLayer,
    reorderLayer,
  } = useAppStore()

  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragItemRef = useRef<HTMLDivElement | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, index: number, layer: Layer) => {
    setDraggedItem({ index, layerId: layer.id })
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault()
      if (draggedItem && draggedItem.index !== toIndex) {
        reorderLayer(draggedItem.index, toIndex)
      }
      setDraggedItem(null)
      setDragOverIndex(null)
    },
    [draggedItem, reorderLayer]
  )

  const reversedLayers = [...layers].reverse()

  return (
    <div className="layer-panel">
      <h3 className="panel-title">图层</h3>
      <div className="layer-list">
        {reversedLayers.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <div className="empty-icon">🖼️</div>
            <div>暂无图层</div>
            <div style={{ fontSize: '12px', color: '#bbb' }}>
              上传图片或添加文字
            </div>
          </div>
        ) : (
          reversedLayers.map((layer, displayIndex) => {
            const originalIndex = layers.length - 1 - displayIndex
            return (
              <div
                key={layer.id}
                ref={displayIndex === 0 ? dragItemRef : undefined}
                className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''} ${draggedItem?.layerId === layer.id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, originalIndex, layer)}
                onDragOver={(e) => handleDragOver(e, originalIndex)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, originalIndex)}
                onClick={() => selectLayer(layer.id)}
                style={{
                  borderTop: dragOverIndex === originalIndex && draggedItem?.index !== originalIndex
                    ? '2px solid #1976D2'
                    : undefined,
                }}
              >
                <LayerThumbnail layer={layer} />
                <div className="layer-info">
                  <div className="layer-name">{layer.name}</div>
                  <div className="layer-type">
                    {layer.type === 'image' ? '图片' : '文字'}
                  </div>
                </div>
                <div className="layer-actions">
                  <button
                    className="layer-action-btn"
                    title="复制"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateLayer(layer.id)
                    }}
                  >
                    ⎘
                  </button>
                  <button
                    className="layer-action-btn"
                    title="删除"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeLayer(layer.id)
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default LayerPanel
