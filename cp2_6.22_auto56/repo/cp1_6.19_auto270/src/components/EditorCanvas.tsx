import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  RotateCcw,
  RotateCw,
  Sparkles,
  RotateCcwSquare,
  Undo2,
  Redo2,
  Crop,
  Download,
  X,
} from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { CropRect, TemplateId } from '@/store/editorStore'

const PAPER_COLOR = { r: 245, g: 230, b: 200 }
const BRIGHTNESS_THRESHOLD = 0.3

interface TemplateConfig {
  id: TemplateId
  name: string
  bgColor: string
  borderColor: string | null
  borderWidth: number
  accentColor: string
}

const TEMPLATES: TemplateConfig[] = [
  { id: 'kraft', name: '牛皮纸信封', bgColor: '#C19A6B', borderColor: null, borderWidth: 0, accentColor: '#8B6914' },
  { id: 'parchment', name: '复古羊皮纸', bgColor: '#EFE4C6', borderColor: null, borderWidth: 0, accentColor: '#8B7355' },
  { id: 'modern', name: '现代简约白', bgColor: '#FFFFFF', borderColor: '#CCCCCC', borderWidth: 2, accentColor: '#666666' },
  { id: 'business', name: '极黑商务', bgColor: '#1A1A1A', borderColor: '#C9A96E', borderWidth: 2, accentColor: '#C9A96E' },
]

function removeBackground(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): boolean {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const totalPixels = canvas.width * canvas.height

  let sumBrightness = 0
  for (let i = 0; i < data.length; i += 4) {
    sumBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
  }
  const avgBrightness = sumBrightness / totalPixels

  let paperPixelCount = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    const brightnessDiff = Math.abs(brightness - avgBrightness)
    const colorDistR = Math.abs(r - PAPER_COLOR.r)
    const colorDistG = Math.abs(g - PAPER_COLOR.g)
    const colorDistB = Math.abs(b - PAPER_COLOR.b)
    const colorDist = (colorDistR + colorDistG + colorDistB) / 3
    if (brightnessDiff > BRIGHTNESS_THRESHOLD && colorDist < 80 && brightness > avgBrightness) {
      paperPixelCount++
    }
  }

  const paperRatio = paperPixelCount / totalPixels
  if (paperRatio < 0.1) return false

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    const brightnessDiff = Math.abs(brightness - avgBrightness)
    const colorDistR = Math.abs(r - PAPER_COLOR.r)
    const colorDistG = Math.abs(g - PAPER_COLOR.g)
    const colorDistB = Math.abs(b - PAPER_COLOR.b)
    const colorDist = (colorDistR + colorDistG + colorDistB) / 3
    const isPaper = brightnessDiff > BRIGHTNESS_THRESHOLD && colorDist < 80 && brightness > avgBrightness
    if (!isPaper) {
      data[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return true
}

function enhanceText(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    let newR = r
    let newG = g
    let newB = b
    if (brightness < 0.5) {
      const factor = 0.8
      newR = Math.max(0, Math.round(128 + (r - 128) * (1 + factor * 2)))
      newG = Math.max(0, Math.round(128 + (g - 128) * (1 + factor * 2)))
      newB = Math.max(0, Math.round(128 + (b - 128) * (1 + factor * 2)))
    }
    data[i] = newR
    data[i + 1] = newG
    data[i + 2] = newB
  }

  const width = canvas.width
  const height = canvas.height
  const copy = new Uint8ClampedArray(data)

  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      if (copy[idx + 3] === 0) continue
      for (let c = 0; c < 3; c++) {
        let sum = 0
        let ki = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ni = ((y + ky) * width + (x + kx)) * 4 + c
            sum += copy[ni] * kernel[ki]
            ki++
          }
        }
        data[idx + c] = Math.min(255, Math.max(0, Math.round(sum * 0.3 + copy[idx + c] * 0.7)))
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export default function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    originalImage,
    processedImageDataUrl,
    imageWidth,
    imageHeight,
    brightness,
    contrast,
    rotation,
    fineRotation,
    isEnhanced,
    currentTemplateId,
    isCropping,
    cropRect,
    historyIndex,
    history,
    isExporting,
    setImage,
    setProcessedImage,
    setBrightness,
    setContrast,
    setFineRotation,
    setEnhanced,
    setCropping,
    setCropRect,
    setExporting,
    pushHistory,
    undo,
    redo,
    reset,
    rotateLeft,
    rotateRight,
  } = useEditorStore()

  const [dragState, setDragState] = useState<{
    isDragging: boolean
    startX: number
    startY: number
    currentX: number
    currentY: number
  }>({ isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0 })

  const [showExportModal, setShowExportModal] = useState(false)
  const [autoDetectFailed, setAutoDetectFailed] = useState(false)

  const template = TEMPLATES.find((t) => t.id === currentTemplateId) || TEMPLATES[0]

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !processedImageDataUrl) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      const isRotated90 = rotation === 90 || rotation === 270
      const srcW = isRotated90 ? img.height : img.width
      const srcH = isRotated90 ? img.width : img.height

      const displayWidth = 800
      const scale = displayWidth / srcW
      const displayHeight = srcH * scale

      canvas.width = displayWidth
      canvas.height = displayHeight

      ctx.clearRect(0, 0, displayWidth, displayHeight)
      ctx.save()

      const brightnessVal = 1 + brightness / 100
      const contrastVal = 1 + contrast / 100
      ctx.filter = `brightness(${brightnessVal}) contrast(${contrastVal})`

      ctx.translate(displayWidth / 2, displayHeight / 2)
      ctx.rotate(((rotation + fineRotation) * Math.PI) / 180)
      ctx.translate(-displayWidth / 2, -displayHeight / 2)

      if (rotation === 90) {
        ctx.translate(displayWidth, 0)
        ctx.rotate(Math.PI / 2)
        ctx.scale(scale, scale)
      } else if (rotation === 180) {
        ctx.translate(displayWidth, displayHeight)
        ctx.rotate(Math.PI)
        ctx.scale(scale, scale)
      } else if (rotation === 270) {
        ctx.translate(0, displayHeight)
        ctx.rotate((3 * Math.PI) / 2)
        ctx.scale(scale, scale)
      } else {
        ctx.scale(scale, scale)
      }

      ctx.drawImage(img, 0, 0)
      ctx.restore()
    }
    img.src = processedImageDataUrl
  }, [processedImageDataUrl, brightness, contrast, rotation, fineRotation])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleFileUpload = useCallback(
    (file: File) => {
      if (file.size > 12 * 1024 * 1024) {
        alert('文件大小不能超过12MB')
        return
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('仅支持JPG和PNG格式')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const img = new Image()
        img.onload = () => {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = img.width
          tempCanvas.height = img.height
          const tempCtx = tempCanvas.getContext('2d')!
          tempCtx.drawImage(img, 0, 0)

          const success = removeBackground(tempCanvas, tempCtx)
          if (!success) {
            setAutoDetectFailed(true)
            setCropping(true)
            setImage(dataUrl, img.width, img.height)
          } else {
            setAutoDetectFailed(false)
            const processedUrl = tempCanvas.toDataURL('image/png')
            setImage(processedUrl, img.width, img.height)
          }
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    [setImage, setCropping]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const handleEnhanceText = useCallback(() => {
    if (!processedImageDataUrl) return
    const img = new Image()
    img.onload = () => {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = img.width
      tempCanvas.height = img.height
      const tempCtx = tempCanvas.getContext('2d')!
      tempCtx.drawImage(img, 0, 0)
      enhanceText(tempCanvas, tempCtx)
      const enhancedUrl = tempCanvas.toDataURL('image/png')
      setProcessedImage(enhancedUrl)
      setEnhanced(true)
      pushHistory()
    }
    img.src = processedImageDataUrl
  }, [processedImageDataUrl, setProcessedImage, setEnhanced, pushHistory])

  const handleApplyCrop = useCallback(() => {
    if (!cropRect || !originalImage) return

    const img = new Image()
    img.onload = () => {
      const scaleX = img.width / 800
      const scaleY = img.height / (img.height * (800 / img.width))

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = Math.round(cropRect.w * scaleX)
      tempCanvas.height = Math.round(cropRect.h * scaleY)
      const tempCtx = tempCanvas.getContext('2d')!
      tempCtx.drawImage(img, cropRect.x * scaleX, cropRect.y * scaleY, cropRect.w * scaleX, cropRect.h * scaleY, 0, 0, tempCanvas.width, tempCanvas.height)

      const tempCanvas2 = document.createElement('canvas')
      tempCanvas2.width = tempCanvas.width
      tempCanvas2.height = tempCanvas.height
      const tempCtx2 = tempCanvas2.getContext('2d')!
      tempCtx2.drawImage(tempCanvas, 0, 0)
      removeBackground(tempCanvas2, tempCtx2)

      const processedUrl = tempCanvas2.toDataURL('image/png')
      setImage(processedUrl, tempCanvas2.width, tempCanvas2.height)
      setCropping(false)
      setCropRect(null)
      setAutoDetectFailed(false)
    }
    img.src = originalImage
  }, [cropRect, originalImage, setImage, setCropping, setCropRect])

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isCropping) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setDragState({ isDragging: true, startX: x, startY: y, currentX: x, currentY: y })
    },
    [isCropping]
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.isDragging) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setDragState((prev) => ({ ...prev, currentX: x, currentY: y }))
    },
    [dragState.isDragging]
  )

  const handleCanvasMouseUp = useCallback(() => {
    if (!dragState.isDragging) return
    const x = Math.min(dragState.startX, dragState.currentX)
    const y = Math.min(dragState.startY, dragState.currentY)
    const w = Math.abs(dragState.currentX - dragState.startX)
    const h = Math.abs(dragState.currentY - dragState.startY)
    if (w > 10 && h > 10) {
      setCropRect({ x, y, w, h })
    }
    setDragState((prev) => ({ ...prev, isDragging: false }))
  }, [dragState, setCropRect])

  const handleExport = useCallback(
    (format: 'png' | 'jpg') => {
      if (!processedImageDataUrl) return
      setExporting(true)

      setTimeout(() => {
        const img = new Image()
        img.onload = () => {
          const isRotated90 = rotation === 90 || rotation === 270
          const srcW = isRotated90 ? img.height : img.width
          const srcH = isRotated90 ? img.width : img.height
          const exportWidth = 1200
          const scale = exportWidth / srcW
          const exportHeight = Math.round(srcH * scale)

          const padding = 6
          const signatureHeight = 50
          const totalW = exportWidth + padding * 2
          const totalH = exportHeight + padding * 2 + signatureHeight

          const exportCanvas = document.createElement('canvas')
          exportCanvas.width = totalW
          exportCanvas.height = totalH
          const ctx = exportCanvas.getContext('2d')!

          if (format === 'jpg') {
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, totalW, totalH)
          }

          ctx.fillStyle = template.bgColor
          ctx.fillRect(0, 0, totalW, totalH)

          if (template.id === 'kraft') {
            for (let i = 0; i < 8000; i++) {
              const tx = Math.random() * totalW
              const ty = Math.random() * totalH
              ctx.fillStyle = `rgba(139,105,20,${Math.random() * 0.08})`
              ctx.fillRect(tx, ty, Math.random() * 3, Math.random() * 1)
            }
          }

          if (template.id === 'parchment') {
            const cornerSize = 40
            ctx.strokeStyle = '#8B7355'
            ctx.lineWidth = 2
            const drawCorner = (cx: number, cy: number, sx: number, sy: number) => {
              ctx.beginPath()
              ctx.moveTo(cx, cy + cornerSize * sy)
              ctx.quadraticCurveTo(cx, cy, cx + cornerSize * sx, cy)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(cx + 5 * sx, cy + cornerSize * sy * 0.7)
              ctx.quadraticCurveTo(cx + 5 * sx, cy + 5 * sy, cx + cornerSize * sx * 0.7, cy + 5 * sy)
              ctx.stroke()
            }
            drawCorner(4, 4, 1, 1)
            drawCorner(totalW - 4, 4, -1, 1)
            drawCorner(4, totalH - 4, 1, -1)
            drawCorner(totalW - 4, totalH - 4, -1, -1)
          }

          if (template.borderColor) {
            ctx.strokeStyle = template.borderColor
            ctx.lineWidth = template.borderWidth
            ctx.strokeRect(template.borderWidth / 2, template.borderWidth / 2, totalW - template.borderWidth, totalH - template.borderWidth)
          }

          ctx.save()
          const brightnessVal = 1 + brightness / 100
          const contrastVal = 1 + contrast / 100
          ctx.filter = `brightness(${brightnessVal}) contrast(${contrastVal})`

          ctx.translate(padding + exportWidth / 2, padding + exportHeight / 2)
          ctx.rotate(((rotation + fineRotation) * Math.PI) / 180)
          ctx.translate(-(padding + exportWidth / 2), -(padding + exportHeight / 2))

          if (rotation === 90) {
            ctx.save()
            ctx.translate(padding, padding)
            ctx.translate(exportWidth, 0)
            ctx.rotate(Math.PI / 2)
            ctx.scale(scale, scale)
            ctx.drawImage(img, 0, 0)
            ctx.restore()
          } else if (rotation === 180) {
            ctx.save()
            ctx.translate(padding, padding)
            ctx.translate(exportWidth, exportHeight)
            ctx.rotate(Math.PI)
            ctx.scale(scale, scale)
            ctx.drawImage(img, 0, 0)
            ctx.restore()
          } else if (rotation === 270) {
            ctx.save()
            ctx.translate(padding, padding)
            ctx.translate(0, exportHeight)
            ctx.rotate((3 * Math.PI) / 2)
            ctx.scale(scale, scale)
            ctx.drawImage(img, 0, 0)
            ctx.restore()
          } else {
            ctx.save()
            ctx.translate(padding, padding)
            ctx.scale(scale, scale)
            ctx.drawImage(img, 0, 0)
            ctx.restore()
          }
          ctx.restore()

          const store = useEditorStore.getState()
          const fontMap: Record<string, string> = {
            kaiti: 'KaiTi, STKaiti, serif',
            songti: 'SimSun, STSong, serif',
            handwriting: 'cursive, KaiTi, serif',
          }
          ctx.fillStyle = template.id === 'business' ? '#C9A96E' : template.id === 'modern' ? '#333333' : '#5C4033'
          ctx.font = `${store.signatureSize}px ${fontMap[store.signatureFont]}`
          ctx.textAlign = 'center'
          ctx.fillText(store.signatureText, totalW / 2, totalH - 15)

          if (format === 'png') {
            exportCanvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'letter-preserver-300dpi.png'
                  a.click()
                  URL.revokeObjectURL(url)
                }
                setExporting(false)
                setShowExportModal(false)
              },
              'image/png',
              1.0
            )
          } else {
            exportCanvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'letter-preserver.jpg'
                  a.click()
                  URL.revokeObjectURL(url)
                }
                setExporting(false)
                setShowExportModal(false)
              },
              'image/jpeg',
              0.92
            )
          }
        }
        img.src = processedImageDataUrl
      }, 300)
    },
    [processedImageDataUrl, rotation, fineRotation, brightness, contrast, template, setExporting]
  )

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const cropOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    border: '2px dashed #E67E22',
    pointerEvents: 'none',
    zIndex: 10,
  }

  if (cropRect) {
    cropOverlayStyle.left = cropRect.x
    cropOverlayStyle.top = cropRect.y
    cropOverlayStyle.width = cropRect.w
    cropOverlayStyle.height = cropRect.h
  } else if (dragState.isDragging) {
    const x = Math.min(dragState.startX, dragState.currentX)
    const y = Math.min(dragState.startY, dragState.currentY)
    const w = Math.abs(dragState.currentX - dragState.startX)
    const h = Math.abs(dragState.currentY - dragState.startY)
    cropOverlayStyle.left = x
    cropOverlayStyle.top = y
    cropOverlayStyle.width = w
    cropOverlayStyle.height = h
  }

  return (
    <div className="editor-canvas-container" style={{ width: '70%', paddingRight: '20px' }}>
      <div
        ref={containerRef}
        className="canvas-wrapper"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {!processedImageDataUrl ? (
          <div
            className="upload-placeholder"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={48} color="#E67E22" strokeWidth={1.5} />
            <p style={{ marginTop: '16px', color: '#8B7355', fontSize: '16px' }}>
              点击或拖拽上传信件照片
            </p>
            <p style={{ color: '#B8A88A', fontSize: '13px', marginTop: '8px' }}>
              支持 JPG / PNG，最大 12MB
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <canvas
              ref={canvasRef}
              className="letter-canvas"
              style={{
                maxWidth: '100%',
                boxShadow: '5px 5px 15px rgba(0,0,0,0.15)',
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {(isCropping && (dragState.isDragging || cropRect)) && (
              <div style={cropOverlayStyle} />
            )}
          </div>
        )}
      </div>

      {isCropping && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <ActionButton onClick={handleApplyCrop} icon={<Crop size={16} />} label="确认裁剪" />
          <ActionButton
            onClick={() => {
              setCropping(false)
              setCropRect(null)
              setAutoDetectFailed(false)
            }}
            icon={<X size={16} />}
            label="取消"
          />
        </div>
      )}

      {autoDetectFailed && !isCropping && processedImageDataUrl && (
        <div style={{ marginTop: '8px', color: '#E67E22', fontSize: '13px' }}>
          自动识别失败，请点击裁剪按钮手动框选信件区域
        </div>
      )}

      {processedImageDataUrl && (
        <div className="controls-section">
          <div className="button-row">
            <ActionButton onClick={() => fileInputRef.current?.click()} icon={<Upload size={16} />} label="上传" />
            <ActionButton onClick={rotateLeft} icon={<RotateCcw size={16} />} label="旋转左" />
            <ActionButton onClick={rotateRight} icon={<RotateCw size={16} />} label="旋转右" />
            <ActionButton onClick={handleEnhanceText} icon={<Sparkles size={16} />} label="增强文字" />
            <ActionButton onClick={() => setCropping(true)} icon={<Crop size={16} />} label="裁剪" />
            <ActionButton onClick={reset} icon={<RotateCcwSquare size={16} />} label="重置" />
            <ActionButton onClick={undo} icon={<Undo2 size={16} />} label="撤销" disabled={!canUndo} />
            <ActionButton onClick={redo} icon={<Redo2 size={16} />} label="重做" disabled={!canRedo} />
            <ActionButton onClick={() => setShowExportModal(true)} icon={<Download size={16} />} label="导出" />
          </div>

          <div className="slider-group">
            <SliderControl
              label="亮度"
              value={brightness}
              min={-50}
              max={50}
              step={1}
              onChange={(v) => {
                setBrightness(v)
              }}
              onCommit={() => pushHistory()}
            />
            <SliderControl
              label="对比度"
              value={contrast}
              min={-50}
              max={50}
              step={1}
              onChange={(v) => {
                setContrast(v)
              }}
              onCommit={() => pushHistory()}
            />
            <SliderControl
              label="微调角度"
              value={fineRotation}
              min={-15}
              max={15}
              step={0.5}
              onChange={(v) => setFineRotation(v)}
              onCommit={() => pushHistory()}
              unit="°"
            />
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileUpload(file)
          e.target.value = ''
        }}
      />

      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      <AnimatePresence>
        {showExportModal && (
          <motion.div
            className="export-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isExporting && setShowExportModal(false)}
          >
            <motion.div
              className="export-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: '20px', color: '#5C4033', fontSize: '18px' }}>导出信件</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="export-option-btn"
                  onClick={() => handleExport('png')}
                  disabled={isExporting}
                >
                  <div style={{ fontWeight: 600 }}>PNG 格式</div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>透明背景 · 300dpi · 1200px宽</div>
                </button>
                <button
                  className="export-option-btn"
                  onClick={() => handleExport('jpg')}
                  disabled={isExporting}
                >
                  <div style={{ fontWeight: 600 }}>JPG 格式</div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>白色背景 · 92%质量 · 1200px宽</div>
                </button>
              </div>

              <button
                className="export-cancel-btn"
                onClick={() => !isExporting && setShowExportModal(false)}
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExporting && (
          <motion.div
            className="export-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-spinner" style={{ borderTopColor: template.accentColor }} />
            <p style={{ marginTop: '16px', color: template.accentColor }}>正在导出...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ActionButton({
  onClick,
  icon,
  label,
  disabled = false,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  disabled?: boolean
}) {
  return (
    <motion.button
      className="action-btn"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, duration: 0.2 }}
      style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  )
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
  unit = '',
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  onCommit: () => void
  unit?: string
}) {
  return (
    <div className="slider-control">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="custom-range"
      />
    </div>
  )
}
