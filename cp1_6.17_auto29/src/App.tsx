import React, { useRef, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppStore } from './store'
import CanvasPreview from './CanvasPreview'
import FilterControls from './FilterControls'
import LayerPanel from './LayerPanel'
import TextControls from './TextControls'
import { CANVAS_SIZES, DEFAULT_FILTER } from './types'
import type { Layer } from './types'

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    canvasSize,
    setCanvasSize,
    addLayer,
    uploadProgress,
    setUploadProgress,
    isUploading,
    setIsUploading,
    isDownloading,
    setIsDownloading,
    showSuccessToast,
    setShowSuccessToast,
    layers,
  } = useAppStore()

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setIsUploading(true)
      setUploadProgress(0)

      const totalFiles = files.length
      let processedFiles = 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
          console.warn('ZIP files require server-side extraction, skipping:', file.name)
          processedFiles++
          setUploadProgress(Math.round((processedFiles / totalFiles) * 100))
          continue
        }

        if (file.type.startsWith('image/')) {
          const reader = new FileReader()

          await new Promise<void>((resolve) => {
            reader.onload = (event) => {
              const img = new Image()
              img.onload = () => {
                const { canvasSize: currentSize } = useAppStore.getState()

                const maxSize = Math.max(currentSize.width, currentSize.height) * 0.7
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)

                const width = img.width * scale
                const height = img.height * scale

                const layer: Layer = {
                  id: uuidv4(),
                  name: file.name.replace(/\.[^/.]+$/, ''),
                  type: 'image',
                  x: (currentSize.width - width) / 2,
                  y: (currentSize.height - height) / 2,
                  width,
                  height,
                  imageSrc: event.target?.result as string,
                  filter: { ...DEFAULT_FILTER },
                  rotation: 0,
                  scale: 1,
                  visible: true,
                }

                addLayer(layer)
                processedFiles++
                setUploadProgress(Math.round((processedFiles / totalFiles) * 100))
                resolve()
              }
              img.src = event.target?.result as string
            }
            reader.readAsDataURL(file)
          })
        }
      }

      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 300)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [addLayer, setUploadProgress, setIsUploading]
  )

  const handleDownload = useCallback(async () => {
    if (layers.length === 0) return

    setIsDownloading(true)

    try {
      const { canvasSize: currentSize, layers: currentLayers } = useAppStore.getState()

      const canvas = document.createElement('canvas')
      canvas.width = currentSize.width
      canvas.height = currentSize.height
      const ctx = canvas.getContext('2d')

      if (!ctx) return

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })
      }

      const getFilterString = (filter: any): string => {
        return `brightness(${filter.brightness}) contrast(${filter.contrast}) hue-rotate(${filter.hue}deg) saturate(${filter.saturation}) blur(${filter.blur}px) sepia(${filter.sepia}) grayscale(${filter.grayscale})`
      }

      for (const layer of currentLayers) {
        if (!layer.visible) continue

        ctx.save()

        const centerX = layer.x + layer.width / 2
        const centerY = layer.y + layer.height / 2

        ctx.translate(centerX, centerY)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)

        if (layer.type === 'image' && layer.imageSrc) {
          try {
            const img = await loadImage(layer.imageSrc)
            ctx.filter = getFilterString(layer.filter)
            ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height)
          } catch (e) {
            console.error('Failed to load image for download:', e)
          }
        } else if (layer.type === 'text' && layer.text) {
          const t = layer.text
          ctx.font = `${t.fontWeight} ${t.fontSize}px ${t.fontFamily}`
          ctx.fillStyle = t.color
          ctx.globalAlpha = t.opacity
          ctx.textAlign = t.textAlign
          ctx.textBaseline = 'top'

          const textX = layer.x + layer.width / 2
          const textY = layer.y

          const lines = t.text.split('\n')
          const lineHeight = t.fontSize * 1.2
          const totalHeight = lines.length * lineHeight

          let startY = textY
          if (t.textAlign === 'center') {
            startY = textY + (layer.height - totalHeight) / 2
          }

          lines.forEach((line, index) => {
            let x = textX
            if (t.textAlign === 'left') {
              x = layer.x
            } else if (t.textAlign === 'right') {
              x = layer.x + layer.width
            }
            ctx.fillText(line, x, startY + index * lineHeight)
          })
        }

        ctx.restore()
      }

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `product-image-${Date.now()}.png`
      link.href = dataUrl
      link.click()

      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }, [layers, setIsDownloading, setShowSuccessToast])

  const handleCanvasSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sizeName = e.target.value
    const size = CANVAS_SIZES.find((s) => s.name === sizeName)
    if (size) {
      setCanvasSize(size)
    }
  }

  const progressRadius = 10
  const progressCircumference = 2 * Math.PI * progressRadius
  const progressOffset = useMemo(
    () => progressCircumference - (uploadProgress / 100) * progressCircumference,
    [uploadProgress, progressCircumference]
  )

  return (
    <div className="app-container">
      <div className="top-bar">
        <div className="logo">
          <div className="logo-icon">🎨</div>
          <span>商品主图生成器</span>
        </div>

        <select
          className="size-selector"
          value={canvasSize.name}
          onChange={handleCanvasSizeChange}
        >
          {CANVAS_SIZES.map((size) => (
            <option key={size.platform} value={size.name}>
              {size.name} ({size.width}x{size.height})
            </option>
          ))}
        </select>

        <div className="top-bar-right">
          <button
            className={`btn btn-primary ${isDownloading ? 'btn-loading' : ''}`}
            onClick={handleDownload}
            disabled={isDownloading || layers.length === 0}
          >
            {isDownloading ? (
              <>
                <div className="spinner" />
                生成中...
              </>
            ) : (
              <>⬇ 下载合成图片</>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.zip"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="btn btn-upload"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <svg className="upload-progress-ring" viewBox="0 0 24 24">
                <circle
                  className="progress-ring-circle"
                  cx="12"
                  cy="12"
                  r={progressRadius}
                  strokeDasharray={progressCircumference}
                  strokeDashoffset={progressOffset}
                />
              </svg>
            ) : (
              '📁 上传图片'
            )}
          </button>
        </div>
      </div>

      <div className="main-content">
        <FilterControls />
        <CanvasPreview />
        <div className="right-panel">
          <LayerPanel />
          <TextControls />
        </div>
      </div>

      {showSuccessToast && (
        <div className="toast">
          ✅ 图片下载成功！
        </div>
      )}
    </div>
  )
}

export default App
