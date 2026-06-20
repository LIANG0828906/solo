import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { generateHandwriting, type GeneratedResult } from '../modules/handwritingGenerator'
import {
  renderCanvas,
  drawMagnifier,
  getCanvasTransform,
  findCharacterAtPoint,
  getCharacterScreenRect,
  drawCharacterHighlight,
  type CanvasTransform,
} from '../modules/canvasRenderer'

interface PreviewCanvasProps {}

export default function PreviewCanvas({}: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const [isDragging, setIsDragging] = useState(false)

  const {
    text,
    style,
    styleParams,
    background,
    comparisonSample,
    dividerPosition,
    magnifier,
    selectedCharacter,
    setDividerPosition,
    setMagnifier,
    setSelectedCharacter,
    clearSelection,
  } = useAppStore()

  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null)
  const [comparisonResult, setComparisonResult] = useState<GeneratedResult | null>(null)

  useEffect(() => {
    const result = generateHandwriting(text, style, styleParams)
    setGeneratedResult(result)
  }, [text, style, styleParams.strokeWidth, styleParams.skewAngle])

  useEffect(() => {
    if (comparisonSample?.enabled && comparisonSample.type === 'saved' && comparisonSample.savedStyle && comparisonSample.savedParams) {
      const result = generateHandwriting(text, comparisonSample.savedStyle, comparisonSample.savedParams)
      setComparisonResult(result)
    } else {
      setComparisonResult(null)
    }
  }, [text, comparisonSample])

  const resizeCanvases = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    const canvases = [leftCanvasRef.current, rightCanvasRef.current, overlayCanvasRef.current]
    canvases.forEach((canvas) => {
      if (canvas) {
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.scale(dpr, dpr)
      }
    })
  }, [])

  useEffect(() => {
    resizeCanvases()
    window.addEventListener('resize', resizeCanvases)
    return () => window.removeEventListener('resize', resizeCanvases)
  }, [resizeCanvases])

  useEffect(() => {
    const render = () => {
      const container = containerRef.current
      if (!container || !generatedResult) return

      const rect = container.getBoundingClientRect()
      const leftWidth = (rect.width * dividerPosition) / 100 - 3
      const rightWidth = rect.width - leftWidth - 6

      const leftCanvas = leftCanvasRef.current
      const rightCanvas = rightCanvasRef.current

      if (leftCanvas) {
        const ctx = leftCanvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          const dpr = window.devicePixelRatio || 1
          ctx.scale(dpr, dpr)
          ctx.clearRect(0, 0, rect.width, rect.height)

          ctx.save()
          ctx.beginPath()
          ctx.rect(0, 0, leftWidth, rect.height)
          ctx.clip()

          renderCanvas({
            canvas: leftCanvas,
            result: generatedResult,
            styleParams,
            background,
            animationProgress: 1,
          })
          ctx.restore()
        }
      }

      if (rightCanvas && comparisonSample?.enabled) {
        const ctx = rightCanvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          const dpr = window.devicePixelRatio || 1
          ctx.scale(dpr, dpr)
          ctx.clearRect(0, 0, rect.width, rect.height)

          ctx.save()
          ctx.beginPath()
          ctx.rect(leftWidth + 6, 0, rightWidth, rect.height)
          ctx.clip()
          ctx.translate(leftWidth + 6, 0)

          if (comparisonSample.type === 'system' && comparisonSample.font) {
            renderCanvas({
              canvas: rightCanvas,
              result: generatedResult,
              styleParams,
              background,
              animationProgress: 1,
              isComparison: true,
              systemFont: comparisonSample.font,
              text,
            })
          } else if (comparisonResult) {
            renderCanvas({
              canvas: rightCanvas,
              result: comparisonResult,
              styleParams: comparisonSample.savedParams || styleParams,
              background,
              animationProgress: 1,
            })
          }
          ctx.restore()
        }
      }

      const overlay = overlayCanvasRef.current
      if (overlay) {
        const ctx = overlay.getContext('2d')
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          const dpr = window.devicePixelRatio || 1
          ctx.scale(dpr, dpr)
          ctx.clearRect(0, 0, rect.width, rect.height)

          if (selectedCharacter) {
            let highlightRect = { ...selectedCharacter.screenRect }
            if (selectedCharacter.canvasSide === 'right') {
              highlightRect = {
                ...highlightRect,
                x: highlightRect.x + leftWidth + 6,
              }
            }
            drawCharacterHighlight(ctx, highlightRect)
          }

          if (magnifier.visible) {
            const sourceCanvas = magnifier.x < leftWidth + 3 ? leftCanvas : rightCanvas
            if (sourceCanvas) {
              drawMagnifier(sourceCanvas, ctx, magnifier.x, magnifier.y, 60, 2)
            }
          }
        }
      }
    }

    render()
  }, [
    generatedResult,
    comparisonResult,
    comparisonSample,
    styleParams,
    background,
    text,
    dividerPosition,
    magnifier,
  ])

  useEffect(() => {
    if (!generatedResult) return

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = (timestamp - startTimeRef.current) / 1000
      const progress = Math.min(1, elapsed / styleParams.animationDuration)

      const container = containerRef.current
      const leftCanvas = leftCanvasRef.current
      if (container && leftCanvas) {
        const rect = container.getBoundingClientRect()
        const leftWidth = (rect.width * dividerPosition) / 100 - 3
        const ctx = leftCanvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          const dpr = window.devicePixelRatio || 1
          ctx.scale(dpr, dpr)
          ctx.clearRect(0, 0, rect.width, rect.height)
          ctx.save()
          ctx.beginPath()
          ctx.rect(0, 0, leftWidth, rect.height)
          ctx.clip()
          renderCanvas({
            canvas: leftCanvas,
            result: generatedResult,
            styleParams,
            background,
            animationProgress: progress,
          })
          ctx.restore()
        }
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    startTimeRef.current = 0
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [text, style, styleParams.strokeWidth, styleParams.skewAngle, styleParams.inkDensity, styleParams.animationDuration, background])

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const position = (x / rect.width) * 100
      setDividerPosition(position)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, setDividerPosition])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const x = e.clientX - containerRect.left
    const y = e.clientY - containerRect.top
    const rect = container.getBoundingClientRect()

    const comparisonEnabled = comparisonSample?.enabled
    const leftWidth = comparisonEnabled
      ? (rect.width * dividerPosition) / 100 - 3
      : rect.width

    const isLeftSide = !comparisonEnabled || x < leftWidth + 3
    const canvasSide: 'left' | 'right' = isLeftSide ? 'left' : 'right'
    const result = isLeftSide ? generatedResult : comparisonResult || generatedResult
    const canvasElement = isLeftSide ? leftCanvasRef.current : rightCanvasRef.current

    if (!result || !canvasElement) {
      clearSelection()
      return
    }

    const adjustedX = isLeftSide ? x : x - (leftWidth + 6)
    const canvasRect = canvasElement.getBoundingClientRect()
    const transform = getCanvasTransform(canvasRect.width, canvasRect.height, result)

    const currentStyleParams = isLeftSide
      ? styleParams
      : comparisonSample?.savedParams || styleParams

    const hit = findCharacterAtPoint(
      adjustedX,
      y,
      result,
      transform,
      currentStyleParams.strokeWidth,
      currentStyleParams.skewAngle
    )

    if (hit) {
      const screenRect = getCharacterScreenRect(hit.character, transform)
      setSelectedCharacter({
        index: hit.index,
        canvasSide,
        screenRect: {
          x: isLeftSide ? screenRect.x : screenRect.x,
          y: screenRect.y,
          width: screenRect.width,
          height: screenRect.height,
        },
        char: hit.character.char,
      })
      setMagnifier({ visible: true, x, y })
    } else {
      clearSelection()
    }
  }

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (magnifier.visible && selectedCharacter) {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const x = e.clientX - containerRect.left
      const y = e.clientY - containerRect.top
      setMagnifier({ visible: true, x, y })
    }
  }

  return (
    <div ref={containerRef} className="preview-canvas-container">
      <canvas
        ref={leftCanvasRef}
        className="preview-canvas left-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
      />
      {comparisonSample?.enabled && (
        <canvas
          ref={rightCanvasRef}
          className="preview-canvas right-canvas"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
        />
      )}
      {comparisonSample?.enabled && (
        <div
          ref={dividerRef}
          className={`divider ${isDragging ? 'dragging' : ''}`}
          style={{ left: `calc(${dividerPosition}% - 3px)` }}
          onMouseDown={handleDividerMouseDown}
        >
          <div className="divider-handle" />
        </div>
      )}
      <canvas ref={overlayCanvasRef} className="overlay-canvas" />
      <div className="canvas-label left-label">当前编辑</div>
      {comparisonSample?.enabled && <div className="canvas-label right-label">对比样本</div>}
    </div>
  )
}
