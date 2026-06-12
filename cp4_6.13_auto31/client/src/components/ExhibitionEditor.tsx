import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { ExhibitionDetail, Exhibit } from '../types'
import './ExhibitionEditor.css'

const GRID_SIZE = 8
const CELL_SIZE = 70

function ExhibitionEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [exhibition, setExhibition] = useState<ExhibitionDetail | null>(null)
  const [exhibits, setExhibits] = useState<Exhibit[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null)
  const [newExhibit, setNewExhibit] = useState({ title: '', description: '', image_data: '' })
  const [draggingExhibit, setDraggingExhibit] = useState<Exhibit | null>(null)
  const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/exhibitions/${id}`)
      .then(res => res.json())
      .then(data => {
        setExhibition(data)
        setExhibits(data.exhibits || [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [id])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = GRID_SIZE * CELL_SIZE
    const height = GRID_SIZE * CELL_SIZE
    canvas.width = width
    canvas.height = height

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(width, i * CELL_SIZE)
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(2, 2, width - 4, height - 4)

    exhibits.forEach(exhibit => {
      const x = exhibit.grid_x * CELL_SIZE
      const y = exhibit.grid_y * CELL_SIZE
      const padding = 4

      if (exhibit.image_data) {
        const img = new Image()
        img.src = exhibit.image_data
        img.onload = () => {
          ctx.save()
          ctx.beginPath()
          ctx.roundRect(x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, 6)
          ctx.clip()
          ctx.drawImage(img, x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2)
          ctx.restore()
        }
      } else {
        ctx.fillStyle = 'rgba(212, 175, 55, 0.2)'
        ctx.fillRect(x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2)
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        exhibit.title.substring(0, 8),
        x + CELL_SIZE / 2,
        y + CELL_SIZE - 8
      )
    })

    if (dragOverCell) {
      const x = dragOverCell.x * CELL_SIZE
      const y = dragOverCell.y * CELL_SIZE
      ctx.fillStyle = 'rgba(212, 175, 55, 0.3)'
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
    }
  }, [exhibits, dragOverCell])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const getCellFromEvent = (e: React.MouseEvent<HTMLCanvasElement> | React.DragEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'clientX' in e ? e.clientX : (e as React.DragEvent).clientX
    const clientY = 'clientY' in e ? e.clientY : (e as React.DragEvent).clientY
    const x = Math.floor(((clientX - rect.left) * scaleX) / CELL_SIZE)
    const y = Math.floor(((clientY - rect.top) * scaleY) / CELL_SIZE)
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return { x, y }
    }
    return null
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e)
    if (!cell) return

    const existingExhibit = exhibits.find(ex => ex.grid_x === cell.x && ex.grid_y === cell.y)
    if (existingExhibit) {
      setSelectedCell(cell)
      setNewExhibit({
        title: existingExhibit.title,
        description: existingExhibit.description,
        image_data: existingExhibit.image_data,
      })
      setShowAddModal(true)
      return
    }

    setSelectedCell(cell)
    setNewExhibit({ title: '', description: '', image_data: '' })
    setShowAddModal(true)
  }

  const handleDragStart = (e: React.DragEvent, exhibit: Exhibit) => {
    setDraggingExhibit(exhibit)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', exhibit.id)
  }

  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const cell = getCellFromEvent(e)
    setDragOverCell(cell)
  }

  const handleDragLeave = () => {
    setDragOverCell(null)
  }

  const handleDrop = async (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const cell = getCellFromEvent(e)
    setDragOverCell(null)

    if (!cell || !draggingExhibit) return

    const occupied = exhibits.find(ex => ex.grid_x === cell.x && ex.grid_y === cell.y && ex.id !== draggingExhibit.id)
    if (occupied) {
      setDraggingExhibit(null)
      return
    }

    try {
      const res = await fetch(`/api/exhibits/${draggingExhibit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid_x: cell.x, grid_y: cell.y }),
      })
      if (res.ok) {
        setExhibits(prev => prev.map(ex =>
          ex.id === draggingExhibit.id ? { ...ex, grid_x: cell.x, grid_y: cell.y } : ex
        ))
      }
    } catch (error) {
      console.error('移动展品失败:', error)
    }

    setDraggingExhibit(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('只支持JPG和PNG格式')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setNewExhibit(prev => ({ ...prev, image_data: event.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveExhibit = async () => {
    if (!selectedCell || !newExhibit.title.trim()) return

    const existingExhibit = exhibits.find(ex => ex.grid_x === selectedCell.x && ex.grid_y === selectedCell.y)

    if (existingExhibit) {
      const res = await fetch(`/api/exhibits/${existingExhibit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExhibit),
      })
      if (res.ok) {
        const updated = await res.json()
        setExhibits(prev => prev.map(ex => ex.id === existingExhibit.id ? updated : ex))
      }
    } else {
      const res = await fetch('/api/exhibits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newExhibit,
          exhibition_id: id,
          grid_x: selectedCell.x,
          grid_y: selectedCell.y,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setExhibits(prev => [...prev, created])
      }
    }

    setShowAddModal(false)
    setSelectedCell(null)
    drawCanvas()
  }

  const handleDeleteExhibit = async () => {
    if (!selectedCell) return
    const existingExhibit = exhibits.find(ex => ex.grid_x === selectedCell.x && ex.grid_y === selectedCell.y)
    if (!existingExhibit) return

    if (confirm('确定要删除这个展品吗？')) {
      const res = await fetch(`/api/exhibits/${existingExhibit.id}`, { method: 'DELETE' })
      if (res.ok) {
        setExhibits(prev => prev.filter(ex => ex.id !== existingExhibit.id))
        setShowAddModal(false)
        setSelectedCell(null)
      }
    }
  }

  const handlePreview = () => {
    navigate(`/view/${id}`)
  }

  const handleAdmin = () => {
    navigate(`/admin/${id}`)
  }

  if (isLoading) {
    return <div className="editor-loading">加载中...</div>
  }

  if (!exhibition) {
    return <div className="editor-loading">展览不存在</div>
  }

  return (
    <div className="exhibition-editor fade-in">
      <div className="editor-header glass-panel">
        <div>
          <h1 className="editor-title">{exhibition.name}</h1>
          <p className="editor-theme">{exhibition.theme || '未设置主题'}</p>
        </div>
        <div className="editor-actions">
          <Link to={`/admin/${id}`} className="btn-secondary">
            管理弹幕
          </Link>
          <button className="btn-secondary" onClick={handleAdmin}>
            管理后台
          </button>
          <button className="btn-primary" onClick={handlePreview}>
            预览 3D
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="canvas-container glass-panel">
          <div className="canvas-header">
            <h2 className="canvas-title">展厅平面图</h2>
            <p className="canvas-tip">点击格子添加展品，拖拽调整位置</p>
          </div>
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              className="editor-canvas"
              onClick={handleCanvasClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
            {exhibits.map(exhibit => (
              <div
                key={exhibit.id}
                className="exhibit-drag-handle"
                draggable
                onDragStart={(e) => handleDragStart(e, exhibit)}
                style={{
                  left: exhibit.grid_x * (100 / GRID_SIZE) + '%',
                  top: exhibit.grid_y * (100 / GRID_SIZE) + '%',
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="exhibit-list glass-panel">
          <h2 className="list-title">展品列表 ({exhibits.length})</h2>
          {exhibits.length === 0 ? (
            <p className="empty-list">暂无展品，点击左侧格子添加</p>
          ) : (
            <div className="exhibit-items">
              {exhibits.map(exhibit => (
                <div key={exhibit.id} className="exhibit-item">
                  {exhibit.image_data ? (
                    <img src={exhibit.image_data} alt={exhibit.title} className="exhibit-thumb" />
                  ) : (
                    <div className="exhibit-thumb-placeholder">🖼️</div>
                  )}
                  <div className="exhibit-info">
                    <h4 className="exhibit-item-title">{exhibit.title}</h4>
                    <p className="exhibit-item-desc">{exhibit.description || '无描述'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">
              {exhibits.find(ex => ex.grid_x === selectedCell?.x && ex.grid_y === selectedCell?.y)
                ? '编辑展品'
                : '添加展品'}
            </h3>

            <div className="form-group">
              <label className="form-label">展品标题 *</label>
              <input
                type="text"
                value={newExhibit.title}
                onChange={e => setNewExhibit(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入展品标题"
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label className="form-label">展品描述 (50字以内)</label>
              <textarea
                value={newExhibit.description}
                onChange={e => setNewExhibit(prev => ({ ...prev, description: e.target.value }))}
                placeholder="用50字以内描述这个展品"
                rows={3}
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label className="form-label">展品图片</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                {newExhibit.image_data ? (
                  <img src={newExhibit.image_data} alt="预览" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <span>点击上传图片 (JPG/PNG，5MB以内)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              {exhibits.find(ex => ex.grid_x === selectedCell?.x && ex.grid_y === selectedCell?.y) && (
                <button className="btn-danger" onClick={handleDeleteExhibit}>
                  删除展品
                </button>
              )}
              <div className="modal-right-actions">
                <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button className="btn-primary" onClick={handleSaveExhibit}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExhibitionEditor
