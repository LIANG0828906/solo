import React, { useState } from 'react'
import { useTimelineStore, ShapeType } from '../../store/timelineStore'

export const SceneEditor: React.FC = () => {
  const { scenes, addScene, removeScene, reorderScenes, selectedSceneId, selectScene } = useTimelineStore()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderScenes(draggedIndex, toIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const shapeNames: Record<ShapeType, string> = {
    circle: '圆形',
    rect: '矩形',
    star: '五角星',
  }

  const shapeIcons: Record<ShapeType, string> = {
    circle: '●',
    rect: '■',
    star: '★',
  }

  return (
    <div
      style={{
        width: 300,
        minWidth: 300,
        backgroundColor: '#16213e',
        borderRight: '1px solid #0f3460',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid #0f3460',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            color: '#e5e5e5',
            fontWeight: 600,
          }}
        >
          场景编辑器
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#888' }}>
          共 {scenes.length} 个场景
        </p>
      </div>

      {/* Add Scene Buttons */}
      <div
        style={{
          padding: 12,
          borderBottom: '1px solid #0f3460',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>添加场景</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['circle', 'rect', 'star'] as ShapeType[]).map((shape) => (
            <button
              key={shape}
              onClick={() => addScene(shape)}
              style={{
                flex: 1,
                padding: '10px 8px',
                backgroundColor: '#0f3460',
                color: '#e5e5e5',
                border: '1px solid transparent',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#e94560'
                e.currentTarget.style.backgroundColor = '#1a4a7a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.backgroundColor = '#0f3460'
              }}
            >
              <span style={{ fontSize: 18 }}>{shapeIcons[shape]}</span>
              <span>{shapeNames[shape]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scene List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
        }}
      >
        {scenes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#666',
              fontSize: 13,
              padding: '40px 20px',
            }}
          >
            暂无场景
            <br />
            点击上方按钮添加
          </div>
        ) : (
          scenes.map((scene, index) => (
            <div
              key={scene.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => selectScene(scene.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                marginBottom: 6,
                backgroundColor: selectedSceneId === scene.id ? 'rgba(233, 69, 96, 0.15)' : '#0f3460',
                border: selectedSceneId === scene.id ? '1px solid #e94560' : '1px solid transparent',
                borderRadius: 6,
                cursor: 'grab',
                transition: 'all 0.2s',
                boxShadow: draggedIndex === index ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                opacity: draggedIndex === index ? 0.5 : 1,
                transform: dragOverIndex === index && draggedIndex !== index ? 'translateY(2px)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (selectedSceneId !== scene.id) {
                  e.currentTarget.style.backgroundColor = '#1a4a7a'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSceneId !== scene.id) {
                  e.currentTarget.style.backgroundColor = '#0f3460'
                }
              }}
            >
              {/* Drag Handle */}
              <div
                style={{
                  color: '#666',
                  marginRight: 8,
                  fontSize: 14,
                  cursor: 'grab',
                }}
              >
                ⋮⋮
              </div>

              {/* Shape Icon */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  backgroundColor: scene.keyframes[0]?.color || '#e94560',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  fontSize: 14,
                  color: '#fff',
                }}
              >
                {shapeIcons[scene.shapeType]}
              </div>

              {/* Scene Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: '#e5e5e5',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {scene.name}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {shapeNames[scene.shapeType]} · {scene.keyframes.length} 关键帧
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeScene(scene.id)
                }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#888',
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.2)'
                  e.currentTarget.style.color = '#e74c3c'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#888'
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Tips */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid #0f3460',
          fontSize: 11,
          color: '#666',
          lineHeight: 1.5,
        }}
      >
        💡 提示：拖拽场景可调整顺序，双击时间轴轨道添加关键帧
      </div>
    </div>
  )
}
