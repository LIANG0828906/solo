import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { boardApi, extractApi } from './api'
import type { Board, ImageItem, ColorItem } from './types'
import ColorPalette from './ColorPalette'
import EditImageModal from './components/EditImageModal'
import ConfirmModal from './components/ConfirmModal'

function BoardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchBoard = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await boardApi.getBoard(id)
      setBoard(data)
      setTitleValue(data.title)
    } catch (error) {
      console.error('Failed to load board:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  const handleFileUpload = async (file: File) => {
    if (!id || !file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('只支持 JPG、PNG、WebP 格式的图片')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const result = await extractApi.uploadImage(id, file, (progress) => {
        setUploadProgress(progress)
      })

      setBoard(prev => prev ? {
        ...prev,
        images: [result.image, ...prev.images],
      } : prev)

      setUploadProgress(100)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleTitleBlur = async () => {
    setEditingTitle(false)
    if (!id || !board || titleValue === board.title) return

    if (titleValue.trim()) {
      try {
        await boardApi.updateBoard(id, { title: titleValue.trim() })
        setBoard(prev => prev ? { ...prev, title: titleValue.trim() } : prev)
      } catch (error) {
        console.error('Failed to update title:', error)
        setTitleValue(board.title)
      }
    } else {
      setTitleValue(board.title)
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur()
    } else if (e.key === 'Escape') {
      if (board) setTitleValue(board.title)
      setEditingTitle(false)
    }
  }

  const addColorToPalette = (color: ColorItem) => {
    if (!board || !id) return

    const exists = board.palette.some(c => c.hex.toLowerCase() === color.hex.toLowerCase())
    if (exists) return

    const newPalette = [...board.palette, color]
    setBoard(prev => prev ? { ...prev, palette: newPalette } : prev)
    boardApi.updatePalette(id, newPalette).catch(console.error)
  }

  const handlePaletteReorder = (newPalette: ColorItem[]) => {
    if (!board || !id) return
    setBoard(prev => prev ? { ...prev, palette: newPalette } : prev)
    boardApi.updatePalette(id, newPalette).catch(console.error)
  }

  const handlePaletteRemove = (hex: string) => {
    if (!board || !id) return
    const newPalette = board.palette.filter(c => c.hex.toLowerCase() !== hex.toLowerCase())
    setBoard(prev => prev ? { ...prev, palette: newPalette } : prev)
    boardApi.updatePalette(id, newPalette).catch(console.error)
  }

  const handleEditImage = (image: ImageItem) => {
    setEditingImage(image)
    setShowEditModal(true)
  }

  const handleSaveImageEdit = async (imageId: string, composition: string, colors: ColorItem[]) => {
    if (!id) return
    try {
      const updatedImage = await boardApi.updateImage(id, imageId, { composition, colors })
      setBoard(prev => {
        if (!prev) return prev
        return {
          ...prev,
          images: prev.images.map(img => img.id === imageId ? updatedImage : img),
        }
      })
      setShowEditModal(false)
      setEditingImage(null)
    } catch (error) {
      console.error('Failed to update image:', error)
    }
  }

  const handleDeleteImage = (imageId: string) => {
    setDeleteImageId(imageId)
  }

  const confirmDeleteImage = async () => {
    if (!id || !deleteImageId) return

    setDeletingImageId(deleteImageId)

    setTimeout(async () => {
      try {
        await boardApi.deleteImage(id, deleteImageId)
        setBoard(prev => {
          if (!prev) return prev
          return {
            ...prev,
            images: prev.images.filter(img => img.id !== deleteImageId),
          }
        })
      } catch (error) {
        console.error('Failed to delete image:', error)
      } finally {
        setDeleteImageId(null)
        setDeletingImageId(null)
      }
    }, 300)
  }

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      // can add toast later
    })
  }

  if (loading) {
    return (
      <div className="board-detail-page">
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="empty-state-text">加载中...</p>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="board-detail-page">
        <div className="empty-state">
          <p className="empty-state-text">灵感板不存在</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="board-detail-page">
      <div className="board-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        {editingTitle ? (
          <input
            className="board-title-input"
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
          />
        ) : (
          <h2
            className="board-title"
            onClick={() => setEditingTitle(true)}
            title="点击编辑标题"
          >
            {board.title}
          </h2>
        )}
      </div>

      <div className="board-content">
        <div className="images-section">
          <div
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {uploading ? (
              <div className="upload-progress">
                <div className="spinner" />
                <p style={{ marginTop: 12, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  正在分析图片... {Math.round(uploadProgress)}%
                </p>
              </div>
            ) : (
              <>
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 16V4m0 0L6 10m6-6l6 6" />
                    <path d="M4 20h16" />
                  </svg>
                </div>
                <p className="upload-text">点击或拖拽上传图片</p>
                <p className="upload-hint">支持 JPG、PNG、WebP，单张不超过 5MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>

          {board.images.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🖼️</div>
              <p className="empty-state-text">还没有图片，上传第一张开始创作吧</p>
            </div>
          ) : (
            <div className="images-masonry">
              {board.images.map(image => (
                <div
                  key={image.id}
                  className="image-item"
                  style={{
                    animation: deletingImageId === image.id ? 'scaleOut 0.3s ease-out forwards' : undefined,
                  }}
                >
                  <img src={image.url} alt={image.originalName} loading="lazy" />
                  <div className="image-item-overlay">
                    <div className="image-item-actions">
                      <button
                        className="icon-btn"
                        title="编辑"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditImage(image)
                        }}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-btn"
                        title="删除"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteImage(image.id)
                        }}
                      >
                        🗑
                      </button>
                    </div>
                    <div className="image-item-colors">
                      {image.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="color-chip"
                          style={{ backgroundColor: color.hex }}
                          onClick={(e) => {
                            e.stopPropagation()
                            addColorToPalette(color)
                          }}
                          title={`点击添加到色卡: ${color.hex}`}
                        >
                          <span className="color-tooltip">{color.hex.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {board.images.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {board.images.slice(0, 4).map(image => (
                <div key={image.id} className="image-composition" style={{ display: 'none' }}>
                  {image.composition}
                </div>
              ))}
            </div>
          )}
        </div>

        <ColorPalette
          colors={board.palette}
          onReorder={handlePaletteReorder}
          onRemove={handlePaletteRemove}
        />
      </div>

      <EditImageModal
        open={showEditModal}
        image={editingImage}
        onClose={() => {
          setShowEditModal(false)
          setEditingImage(null)
        }}
        onSave={handleSaveImageEdit}
      />

      <ConfirmModal
        open={!!deleteImageId}
        title="删除图片"
        message="确定要删除这张图片吗？"
        hint="删除后无法恢复"
        danger
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteImage}
        onCancel={() => setDeleteImageId(null)}
      />
    </div>
  )
}

export default BoardDetailPage
