import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useColorState } from '@ColorModule/ColorStateContext'
import type { ImageItem } from '@ColorModule/types'
import './UploadPanel.css'

interface ThumbnailCardProps {
  image: ImageItem
  onRemove: () => void
  isTransitioning: boolean
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ image, onRemove, isTransitioning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bitmap = image.processedBitmap || image.originalBitmap
    if (!bitmap) return

    canvas.width = bitmap.width
    canvas.height = bitmap.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0)
  }, [image.processedBitmap, image.originalBitmap])

  const pieData = image.histogram.reduce((acc, val, idx) => {
    const bucket = Math.floor(idx / 16)
    acc[bucket] = (acc[bucket] || 0) + val
    return acc
  }, [] as number[])

  const total = pieData.reduce((a, b) => a + b, 0) || 1
  const pieColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3']

  let startAngle = -Math.PI / 2
  const pieSegments = pieData.map((value, idx) => {
    const angle = (value / total) * Math.PI * 2
    const endAngle = startAngle + angle
    const segment = { startAngle, endAngle, color: pieColors[idx % pieColors.length] }
    startAngle = endAngle
    return segment
  })

  return (
    <div
      className={`thumbnail-card ${isTransitioning ? 'transitioning' : ''} ${image.isProcessing ? 'processing' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="thumbnail-wrapper">
        <canvas ref={canvasRef} className="thumbnail-canvas" />
        {image.isProcessing && (
          <div className="processing-overlay">
            <div className="processing-spinner" />
          </div>
        )}
        {isHovered && (
          <div className="thumbnail-tooltip">
            <div className="tooltip-row">
              <span className="tooltip-label">R:</span>
              <span className="tooltip-value">{image.rgbAverage.r}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">G:</span>
              <span className="tooltip-value">{image.rgbAverage.g}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">B:</span>
              <span className="tooltip-value">{image.rgbAverage.b}</span>
            </div>
          </div>
        )}
        <button className="remove-btn" onClick={onRemove}>
          ×
        </button>
      </div>

      <div className="thumbnail-info">
        <div className="dominant-colors">
          {image.dominantColors.map((color, idx) => (
            <div
              key={idx}
              className="color-swatch"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <div className="histogram-row">
          <svg className="pie-chart" viewBox="0 0 40 40">
            {pieSegments.map((seg, idx) => {
              const x1 = 20 + 15 * Math.cos(seg.startAngle)
              const y1 = 20 + 15 * Math.sin(seg.startAngle)
              const x2 = 20 + 15 * Math.cos(seg.endAngle)
              const y2 = 20 + 15 * Math.sin(seg.endAngle)
              const largeArc = seg.endAngle - seg.startAngle > Math.PI ? 1 : 0

              return (
                <path
                  key={idx}
                  d={`M20,20 L${x1},${y1} A15,15 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill={seg.color}
                />
              )
            })}
            <circle cx="20" cy="20" r="8" fill="#1a1a2e" />
          </svg>

          <div className="mini-histogram">
            {image.histogram.slice(0, 32).map((val, idx) => {
              const maxVal = Math.max(...image.histogram) || 1
              const height = (val / maxVal) * 24
              return (
                <div
                  key={idx}
                  className="histogram-bar"
                  style={{
                    height: `${height}px`,
                    background: `linear-gradient(to top, ${idx % 2 === 0 ? 'var(--color-neon-blue)' : 'var(--color-neon-purple)'}, transparent)`,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const UploadPanel: React.FC = () => {
  const { images, addImage, removeImage, clearImages, playClickSound, isTransitioning, cssFilter } = useColorState()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
      playClickSound()

      for (const file of validFiles) {
        try {
          await addImage(file)
          const event = new CustomEvent('imageUploaded', { detail: { fileName: file.name } })
          window.dispatchEvent(event)
        } catch (err) {
          console.error('Failed to add image:', err)
        }
      }
    },
    [addImage, playClickSound]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
    playClickSound()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="upload-panel">
      <div className="upload-header">
        <h2 className="upload-title">图片预览</h2>
        <div className="upload-actions">
          <span className="image-count">
            {images.length} 张图片
          </span>
          {images.length > 0 && (
            <button
              className="clear-btn"
              onClick={() => {
                clearImages()
                playClickSound()
              }}
            >
              清空
            </button>
          )}
        </div>
      </div>

      {images.length === 0 ? (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="upload-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <path
                d="M32 8L32 40M32 8L24 16M32 8L40 16M8 48V56H56V48"
                stroke="url(#uploadGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="upload-text">拖拽图片到此处或点击上传</p>
          <p className="upload-hint">支持 JPG、PNG、WebP 格式，至少上传 5 张</p>
          {isDragging && <div className="upload-ripple" />}
        </div>
      ) : (
        <div
          className={`thumbnails-grid ${isTransitioning ? 'transitioning' : ''}`}
          style={{
            filter: cssFilter !== 'none' ? cssFilter : undefined,
          }}
        >
          {images.map((image) => (
            <ThumbnailCard
              key={image.id}
              image={image}
              onRemove={() => {
                removeImage(image.id)
                playClickSound()
              }}
              isTransitioning={isTransitioning}
            />
          ))}

          <div
            className={`add-more-card ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            <span className="add-more-icon">+</span>
            <span className="add-more-text">添加图片</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden-input"
        onChange={handleInputChange}
      />
    </div>
  )
}

export default UploadPanel
