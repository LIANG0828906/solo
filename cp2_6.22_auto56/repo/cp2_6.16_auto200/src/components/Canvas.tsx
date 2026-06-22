import React, { useRef, useEffect, useState, useCallback } from 'react'
import { saveAs } from 'file-saver'
import { v4 as uuidv4 } from 'uuid'
import { useBannerStore } from '../store'
import { getTemplateById, getSizeById } from '../templates'
import { renderBannerToCanvas, canvasToBlob } from '../renderer'

const CanvasPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    selectedTemplateId,
    selectedSizeId,
    userInput,
    isDownloading,
    setDownloading,
    addBanner,
  } = useBannerStore()

  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const template = getTemplateById(selectedTemplateId)
  const size = getSizeById(selectedSizeId)

  const render = useCallback(async () => {
    if (!canvasRef.current) return
    await renderBannerToCanvas(canvasRef.current, template, size, userInput)
  }, [template, size, userInput])

  useEffect(() => {
    let animationId: number
    const doRender = () => {
      animationId = requestAnimationFrame(() => {
        render()
      })
    }
    doRender()
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [render])

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 80)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const handleDownload = async () => {
    if (!canvasRef.current || isDownloading) return

    setDownloading(true)

    setTimeout(async () => {
      try {
        const blob = await canvasToBlob(canvasRef.current!, 'image/png')
        if (blob) {
          const dataUrl = canvasRef.current!.toDataURL('image/png')
          addBanner({
            id: uuidv4(),
            sizeId: selectedSizeId,
            dataUrl,
            createdAt: Date.now(),
          })
          const fileName = `banner_${size.name}_${Date.now()}.png`
          saveAs(blob, fileName)
        }
      } catch (error) {
        console.error('下载失败:', error)
      } finally {
        setDownloading(false)
      }
    }, 2000)
  }

  const scaleRatio = containerWidth > 0 ? Math.min(containerWidth / size.width, 1) : 1
  const scaledWidth = size.width * scaleRatio
  const scaledHeight = size.height * scaleRatio

  return (
    <div className="canvas-container" ref={containerRef}>
      <div className="canvas-header">
        <h2 className="canvas-title">实时预览</h2>
        <span className="canvas-size-info">
          {size.name} - {size.width} × {size.height}px
        </span>
      </div>

      <div className="canvas-wrapper">
        <div
          className="canvas-scale"
          style={{
            width: scaledWidth,
            height: scaledHeight,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: scaledWidth,
              height: scaledHeight,
            }}
          />
        </div>
      </div>

      <button
        className={`download-btn ${isDownloading ? 'loading' : ''}`}
        onClick={handleDownload}
        disabled={isDownloading}
        title="下载PNG"
      >
        {isDownloading ? (
          <svg className="spinner-icon" viewBox="0 0 24 24" fill="none">
            <circle
              className="spinner-circle"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default CanvasPreview
