import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { generateCSSString } from '../utils/filterEngine'
import type { FilterState } from '../utils/filterEngine'

interface ImagePreviewProps {
  filterStyle: string
  filters: FilterState
}

export interface ImagePreviewRef {
  downloadImage: () => void
}

const SAMPLE_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop'

const ImagePreview = forwardRef<ImagePreviewRef, ImagePreviewProps>(({ filterStyle, filters }, ref) => {
  const [isHovered, setIsHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const cssString = generateCSSString(filters)

  useImperativeHandle(ref, () => ({
    downloadImage: handleDownloadImage,
  }))

  const handleCopyCSS = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssString)
      setCopied(true)
      setTimeout(() => setCopied(false), 500)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }, [cssString])

  const handleDownloadImage = useCallback(() => {
    if (!imgRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imgRef.current
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    ctx.filter = filterStyle || 'none'
    ctx.drawImage(img, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'filter-preview.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('下载完成', { body: 'filter-preview.png 已保存' })
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification('下载完成', { body: 'filter-preview.png 已保存' })
            }
          })
        }
      }
    }, 'image/png')
  }, [filterStyle])

  return (
    <div className="preview-container">
      <div
        className="image-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          ref={imgRef}
          src={SAMPLE_IMAGE}
          alt="预览图片"
          className="preview-image"
          style={{ filter: filterStyle || 'none' }}
          crossOrigin="anonymous"
        />
        <div className={`overlay ${isHovered ? 'visible' : ''}`}>
          <div
            className={`code-display ${copied ? 'copied' : ''}`}
            onClick={handleCopyCSS}
          >
            {cssString}
          </div>
        </div>
      </div>

      <style>{`
        .preview-container {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .image-wrapper {
          position: relative;
          width: 800px;
          height: 500px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: filter 0.3s ease;
        }

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          cursor: pointer;
        }

        .overlay.visible {
          opacity: 1;
        }

        .code-display {
          font-size: 14px;
          color: #F8FAFC;
          background: rgba(15, 23, 42, 0.85);
          padding: 12px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
          max-width: 90%;
          word-break: break-all;
          text-align: center;
          transition: background-color 0.3s ease;
          user-select: none;
        }

        .code-display.copied {
          background: rgba(16, 185, 129, 0.85);
        }
      `}</style>
    </div>
  )
})

ImagePreview.displayName = 'ImagePreview'

export default ImagePreview
