import React, { useState, useRef, useCallback, useEffect } from 'react'
import ColorPalette from './components/ColorPalette'
import SpacingRuler from './components/SpacingRuler'
import {
  extractDesignTokens,
  type DesignTokens,
  type ColorToken,
  hexToRgb,
  rgbToHsl,
} from './modules/tokenExtractor'
import { generateCSSVariables, copyToClipboard } from './modules/themePreview'

const DEFAULT_ACCENT = '#667eea'

const App: React.FC = () => {
  const [tokens, setTokens] = useState<DesignTokens | null>(null)
  const [progress, setProgress] = useState(0)
  const [isExtracting, setIsExtracting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [primaryColors, setPrimaryColors] = useState<ColorToken[]>([])
  const [secondaryColors, setSecondaryColors] = useState<ColorToken[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<number | null>(null)

  const accentColor =
    primaryColors.length > 0 ? primaryColors[0].hex : DEFAULT_ACCENT

  useEffect(() => {
    if (tokens) {
      setPrimaryColors(tokens.primaryColors)
      setSecondaryColors(tokens.secondaryColors)
    }
  }, [tokens])

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return
    }

    setIsExtracting(true)
    setProgress(0)
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 200)

    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current)
    }

    const startTime = Date.now()
    const duration = 1500
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const p = Math.min((elapsed / duration) * 100, 95)
      setProgress(p)
    }, 30)

    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })

      const img = new Image()
      img.src = dataUrl
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
      })

      const thumbCanvas = document.createElement('canvas')
      const thumbWidth = 300
      const thumbHeight = Math.round((img.height / img.width) * thumbWidth)
      thumbCanvas.width = thumbWidth
      thumbCanvas.height = thumbHeight
      const thumbCtx = thumbCanvas.getContext('2d')
      if (thumbCtx) {
        thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight)
      }
      const thumbnailUrl = thumbCanvas.toDataURL('image/png')

      const maxSize = 800
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')
      ctx.drawImage(img, 0, 0, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)

      const result = await extractDesignTokens(imageData, thumbnailUrl)

      setTokens(result)
      setSelectedColorIndex(null)

      setProgress(100)
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      setTimeout(() => {
        setIsExtracting(false)
      }, 300)
    } catch (err) {
      console.error('Image processing failed:', err)
      setProgress(100)
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      setIsExtracting(false)
    }
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processImage(file)
      e.target.value = ''
    },
    [processImage],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processImage(file)
    },
    [processImage],
  )

  const handleColorAdjust = useCallback(
    (index: number, newHex: string) => {
      setPrimaryColors((prev) => {
        const next = [...prev]
        if (next[index]) {
          const rgb = hexToRgb(newHex) as [number, number, number]
          const hsl = rgbToHsl(rgb)
          next[index] = { ...next[index], hex: newHex, rgb, hsl }
        }
        return next
      })
    },
    [],
  )

  const handleExport = useCallback(() => {
    if (!tokens) return
    setShowModal(true)
  }, [tokens])

  const handleCopy = useCallback(async () => {
    if (!tokens) return
    const mergedTokens: DesignTokens = {
      ...tokens,
      primaryColors,
      secondaryColors,
    }
    const css = generateCSSVariables(mergedTokens)
    const ok = await copyToClipboard(css)
    if (ok) {
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 1500)
    }
  }, [tokens, primaryColors, secondaryColors])

  const cssForExport = tokens
    ? generateCSSVariables({
        ...tokens,
        primaryColors,
        secondaryColors,
      })
    : ''

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">设计令牌提取器</h1>
        <button
          className="export-btn"
          disabled={!tokens}
          onClick={handleExport}
          style={tokens ? { boxShadow: `0 4px 20px ${accentColor}4d` } : undefined}
        >
          导出主题
        </button>
      </header>

      <div className="main-layout">
        <aside className="left-panel">
          <div
            className={`upload-area ${dragOver ? 'drag-over' : ''} ${uploadSuccess ? 'upload-success' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <svg
              className="upload-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--accent-default)' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="upload-text">点击上传图片</div>
            <div className="upload-hint">或将图片拖拽到此处 · PNG / JPG</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
            />
          </div>

          {tokens && (
            <div className="thumbnail-section">
              <img
                src={tokens.thumbnailUrl}
                alt="设计稿缩略图"
                className="thumbnail-img"
              />
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${accentColor}, #764ba2)`,
                  }}
                />
              </div>
              <div className="progress-text">
                {isExtracting ? `提取中... ${Math.round(progress)}%` : '提取完成 ✓'}
              </div>
            </div>
          )}

          <div className="fonts-section">
            <div className="section-title">字体大小 · Typography</div>
            {!tokens || tokens.fonts.length === 0 ? (
              <div className="empty-state">上传图片后将自动提取字体...</div>
            ) : (
              <div className="font-list">
                {tokens.fonts.map((font, index) => (
                  <div
                    key={`font-${index}-${font.size}`}
                    className="font-item"
                  >
                    <span
                      className="font-sample"
                      style={{ fontSize: `${font.size}px` }}
                    >
                      {font.sampleText}
                    </span>
                    <span className="font-label">{font.size}px</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="right-panel">
          <ColorPalette
            primaryColors={primaryColors}
            secondaryColors={secondaryColors}
            selectedIndex={selectedColorIndex}
            onColorSelect={setSelectedColorIndex}
            onColorAdjust={handleColorAdjust}
          />

          <SpacingRuler
            spacings={tokens?.spacings ?? []}
            accentColor={accentColor}
            vertical={false}
          />
        </main>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
        >
          <div className="modal-container">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">CSS 变量主题文件</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-code">
                <pre>{cssForExport}</pre>
              </div>

              <div className="modal-actions">
                <button className="copy-btn" onClick={handleCopy}>
                  复制到剪贴板
                </button>
                {showCopyToast && <div className="copy-toast">已复制 ✓</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
